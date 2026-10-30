import * as analytics from '../../app/analytics/analytics';
import { buildExport, EXPORT_FORMAT } from '../../app/analytics/exportResearchData';

jest.mock('../../lib/utils/secureStore', () => {
  const mem: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (k: string) => mem[k] ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => {
      mem[k] = v;
    }),
    deleteItemAsync: jest.fn(async (k: string) => {
      delete mem[k];
    }),
  };
});

const names = (events: { name: string }[]) => events.map((e) => e.name);

describe('research analytics', () => {
  beforeEach(() => analytics.__resetForTests());

  it('stamps every event with participant, session, language and platform', async () => {
    await analytics.setUser('alice');
    analytics.setLanguage('qu');
    analytics.startSession('launch');
    analytics.track('deck_opened', { deck_id: 'colors-basic', mode: 'study', card_count: 7 });

    const events = await analytics.getAllEvents();
    const opened = events.find((e) => e.name === 'deck_opened')!;
    expect(opened.participant).toMatch(/^anon-[a-z0-9]{6}$/);
    expect(opened.session).toBeTruthy();
    expect(opened.lang).toBe('qu');
    expect(opened.platform).toMatch(/^(ios|android|web)/);
    expect(opened.props).toEqual({ deck_id: 'colors-basic', mode: 'study', card_count: 7 });
    expect(new Date(opened.time).getTime()).toBe(opened.ts);
  });

  it('keeps one stable code per account and lets a facilitator replace it', async () => {
    await analytics.setUser('bob');
    const first = analytics.getParticipantCode();
    await analytics.setUser('carol');
    expect(analytics.getParticipantCode()).not.toBe(first);
    await analytics.setUser('bob');
    expect(analytics.getParticipantCode()).toBe(first);

    await analytics.setParticipantCode('  PUNO 07 ');
    expect(analytics.getParticipantCode()).toBe('PUNO-07');
    expect(await analytics.getParticipantAliases()).toMatchObject({ [first]: 'PUNO-07' });
    await analytics.setUser('carol');
    await analytics.setUser('bob');
    expect(analytics.getParticipantCode()).toBe('PUNO-07');
  });

  it('records screen paths with time on the previous screen and session boundaries', async () => {
    await analytics.setUser('dana');
    analytics.startSession('launch');
    analytics.trackScreen('Decks');
    analytics.trackScreen('Decks'); // duplicate ignored
    analytics.trackScreen('Study');
    analytics.endSession();
    analytics.startSession('foreground'); // re-logs the current screen as the session's first

    const me = analytics.getParticipantCode();
    const events = (await analytics.getAllEvents()).filter((e) => e.participant === me);
    const views = events.filter((e) => e.name === 'screen_view').map((e) => e.props);
    expect(views.map((v) => v.screen)).toEqual(['Decks', 'Study', 'Study']);
    expect(views[0]).toMatchObject({ prev_screen: null, first_in_session: true });
    expect(views[1]).toMatchObject({ prev_screen: 'Decks', first_in_session: false });
    expect(typeof views[1].prev_duration_ms).toBe('number');
    expect(views[2]).toMatchObject({ first_in_session: true });
    expect(names(events).filter((n) => n.startsWith('session_'))).toEqual(['session_start', 'session_end', 'session_start']);
  });

  it('logs errors without throwing', async () => {
    analytics.trackError(new Error('boom'), true, 'render');
    const [err] = await analytics.getAllEvents().then((ev) => ev.filter((e) => e.name === 'app_error'));
    expect(err.props).toEqual({ message: 'Error: boom', fatal: true, source: 'render' });
  });

  it('builds a self-describing export with all participants on the device', async () => {
    await analytics.setUser('erin');
    analytics.track('quiz_answered', {
      prompt: 'white',
      chosen: 'karu',
      expected: 'karu',
      correct: true,
      response_ms: 1200,
      option_count: 4,
      has_image: false,
    });
    const data = await buildExport();
    expect(data.format).toBe(EXPORT_FORMAT);
    expect(data.event_count).toBe(data.events.length);
    expect(data.participants).toContain(analytics.getParticipantCode());
  });
});
