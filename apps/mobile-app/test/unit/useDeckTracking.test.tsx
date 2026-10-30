import { renderHook, act } from '@testing-library/react-native';
import * as analytics from '../../app/analytics/analytics';
import { useDeckTracking } from '../../app/analytics/useDeckTracking';

describe('useDeckTracking', () => {
  beforeEach(() => analytics.__resetForTests());

  const deckEvents = async (deckId: string) =>
    (await analytics.getAllEvents()).filter(
      (e) => (e.name.startsWith('deck_') || e.name === 'card_answered') && e.props.deck_id === deckId
    );

  it('logs opened → answers (with attempt numbers) → completed', async () => {
    const { result, unmount } = renderHook(() => useDeckTracking('numbers-basic', 'write', 2));
    act(() => {
      result.current.cardAnswered('n1', 'incorrect', { response: 'cic', expected: 'cik' });
      result.current.cardAnswered('n1', 'correct', { response: 'cik', expected: 'cik' });
      result.current.cardAnswered('n2', 'correct');
      result.current.deckCompleted();
    });
    unmount();

    const events = await deckEvents('numbers-basic');
    expect(events.map((e) => e.name)).toEqual(['deck_opened', 'card_answered', 'card_answered', 'card_answered', 'deck_completed']);
    expect(events[1].props).toMatchObject({ card_id: 'n1', result: 'incorrect', response: 'cic', attempt: 1 });
    expect(events[2].props).toMatchObject({ card_id: 'n1', attempt: 2 });
    expect(events[4].props).toMatchObject({ card_count: 2, correct_count: 2 });
  });

  it('logs deck_abandoned when the learner leaves early', async () => {
    const { result, unmount } = renderHook(() => useDeckTracking('colors-basic', 'study', 7));
    act(() => result.current.cardAnswered('c1', 'repeat'));
    unmount();

    const events = await deckEvents('colors-basic');
    expect(events.map((e) => e.name)).toEqual(['deck_opened', 'card_answered', 'deck_abandoned']);
    expect(events[2].props).toMatchObject({ cards_answered: 1, card_count: 7 });
  });
});
