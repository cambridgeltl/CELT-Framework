import { useCallback, useEffect, useRef } from 'react';
import { track } from './analytics';
import type { AnalyticsEvents, DeckMode } from './events';

type Result = AnalyticsEvents['card_answered']['result'];

/**
 * Tracks one visit to a deck (Study / Write / Numbers):
 * deck_opened on mount, card_answered per answer (with response time and attempt
 * number, so revisited cards are visible), and deck_completed or deck_abandoned
 * when the visit ends.
 */
export function useDeckTracking(deckId: string, mode: DeckMode, cardCount: number) {
  const openedAt = useRef(Date.now());
  const cardShownAt = useRef(Date.now());
  const attempts = useRef<Record<string, number>>({});
  const answered = useRef(0);
  const correct = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    openedAt.current = Date.now();
    cardShownAt.current = Date.now();
    attempts.current = {};
    answered.current = 0;
    correct.current = 0;
    done.current = false;
    track('deck_opened', { deck_id: deckId, mode, card_count: cardCount });
    return () => {
      if (!done.current) {
        track('deck_abandoned', {
          deck_id: deckId,
          mode,
          card_count: cardCount,
          cards_answered: answered.current,
          duration_ms: Date.now() - openedAt.current,
        });
      }
    };
  }, [deckId, mode, cardCount]);

  /** Call when a new card is shown, so response times are measured from that moment. */
  const cardShown = useCallback(() => {
    cardShownAt.current = Date.now();
  }, []);

  const cardAnswered = useCallback(
    (cardId: string, result: Result, extra?: { response?: string; expected?: string }) => {
      const attempt = (attempts.current[cardId] ?? 0) + 1;
      attempts.current[cardId] = attempt;
      answered.current += 1;
      if (result === 'got_it' || result === 'correct') correct.current += 1;
      track('card_answered', {
        deck_id: deckId,
        card_id: cardId,
        mode,
        result,
        response_ms: Date.now() - cardShownAt.current,
        attempt,
        ...extra,
      });
    },
    [deckId, mode]
  );

  const cardFlipped = useCallback(
    (cardId: string, side: 'front' | 'back') => track('card_flipped', { deck_id: deckId, card_id: cardId, side }),
    [deckId]
  );

  const deckCompleted = useCallback(() => {
    if (done.current) return;
    done.current = true;
    track('deck_completed', {
      deck_id: deckId,
      mode,
      card_count: cardCount,
      correct_count: correct.current,
      duration_ms: Date.now() - openedAt.current,
    });
  }, [deckId, mode, cardCount]);

  return { cardShown, cardAnswered, cardFlipped, deckCompleted };
}
