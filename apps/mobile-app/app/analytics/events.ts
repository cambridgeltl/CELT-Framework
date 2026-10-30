/**
 * Research analytics event catalogue (see docs/ANALYTICS.md in the repo root).
 *
 * Every event is stored with the same envelope (participant, session, language,
 * app version, platform, online status, timestamp) plus the event-specific
 * properties typed below. Names map onto the rows of Analytics_Tracking.xlsx.
 */
export type AnalyticsEvents = {
  // ── Sessions & navigation (Global / RQ2) ──────────────────────────────
  session_start: { trigger: 'launch' | 'foreground' };
  session_end: { duration_ms: number; screens_viewed: number };
  screen_view: { screen: string; prev_screen: string | null; prev_duration_ms: number | null; first_in_session: boolean };
  language_selected: { language: string; previous: string | null };

  // ── Flashcards & writing (RQ1) ────────────────────────────────────────
  deck_opened: { deck_id: string; mode: DeckMode; card_count: number };
  card_flipped: { deck_id: string; card_id: string; side: 'front' | 'back' };
  card_answered: {
    deck_id: string;
    card_id: string;
    mode: DeckMode;
    result: 'got_it' | 'repeat' | 'correct' | 'incorrect';
    /** What the learner typed (write modes only) — for spelling analysis. */
    response?: string;
    expected?: string;
    /** Time since the card was shown. */
    response_ms: number;
    /** How many times this card was answered in this deck visit, including this one. */
    attempt: number;
  };
  deck_completed: { deck_id: string; mode: DeckMode; card_count: number; correct_count: number; duration_ms: number };
  deck_abandoned: { deck_id: string; mode: DeckMode; card_count: number; cards_answered: number; duration_ms: number };

  // ── Quiz (RQ1) ───────────────────────────────────────────────────────
  quiz_answered: {
    prompt: string;
    chosen: string;
    expected: string;
    correct: boolean;
    response_ms: number;
    option_count: number;
    has_image: boolean;
  };

  // ── Dictionary (RQ1 / RQ2) ───────────────────────────────────────────
  dictionary_search: { query: string; result_count: number };
  dictionary_audio_played: { word: string };
  word_saved: { word: string; prompt: string; saved: boolean; source: string };

  // ── Conversations & culture (RQ1) ────────────────────────────────────
  conversation_opened: { category_id: string; conversation_id: string };
  /** User pressed replay on a line (automatic playback of new lines is not counted). */
  conversation_audio_played: { conversation_id: string; line_index: number };
  conversation_completed: { conversation_id: string; line_count: number; duration_ms: number };
  /** Which text the learner chose to see: both languages, English only, or target language only. */
  conversation_view_mode: { conversation_id: string; mode: 'both' | 'english' | 'target' };
  culture_step_viewed: { deck_id: string; step_index: number; step_type: string };
  culture_quiz_answered: { deck_id: string; step_index: number; correct: boolean };

  // ── Technical (RQ2) ──────────────────────────────────────────────────
  app_error: { message: string; fatal: boolean; source: 'global' | 'render' | 'promise' };
  network_changed: { online: boolean };

  // ── Research administration ──────────────────────────────────────────
  participant_code_set: { participant: string; previous: string };
  research_data_exported: { event_count: number };

  // RQ3 (reserved — emitted once the in-app contribution feature exists):
  // contribution_screen_opened, contribution_started, contribution_submitted
  // { type: 'word' | 'audio' | 'example' | 'correction', edits_before_submit },
  // contribution_abandoned. Review outcomes (approved / rejected) are recorded
  // during expert review, not in the app.
};

export type DeckMode = 'study' | 'write' | 'numbers';

export type AnalyticsEventName = keyof AnalyticsEvents;

/** One stored row. */
export type AnalyticsRecord = {
  id: string;
  ts: number;
  time: string;
  name: AnalyticsEventName;
  participant: string;
  session: string | null;
  lang: string | null;
  app_version: string;
  platform: string;
  online: boolean | null;
  props: Record<string, unknown>;
};
