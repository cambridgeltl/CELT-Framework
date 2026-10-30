# Research analytics

The mobile app keeps an **offline, on-device event log** for the evaluation study. Nothing is uploaded:
a facilitator exports the data from **Settings → Research → Export research data** (share sheet on
Android/iOS, file download on web). Code: `apps/mobile-app/app/analytics/`.

## Participant codes
- Each app account gets an anonymous code (`anon-xxxxxx`) — no names or usernames are logged.
- Facilitators replace it with the study code (e.g. `PUNO-07`) under Settings → Research → Change.
  This is the key that joins app data to the pre/post literacy tests and interviews.
- Earlier codes are listed in the export's `participant_aliases` so their events can be relabelled.

## Every event has
`id, ts, time (ISO), name, participant, session, lang, app_version, platform, online, props`

## Events
| Event | Props | Research use |
|---|---|---|
| `session_start` / `session_end` | trigger / duration_ms, screens_viewed | engagement, session length |
| `screen_view` | screen, prev_screen, prev_duration_ms, first_in_session | navigation path, time per screen, revisits, first screen |
| `language_selected` | language, previous | language communities |
| `deck_opened` | deck_id, mode (study/write/numbers), card_count | learning activity |
| `card_flipped` | deck_id, card_id, side | interaction with both sides |
| `card_answered` | deck_id, card_id, mode, result, response, expected, response_ms, attempt | progression, difficult/revisited cards, spelling (typed answers) |
| `deck_completed` / `deck_abandoned` | deck_id, mode, card counts, duration_ms | completion vs. abandonment |
| `quiz_answered` | prompt, chosen, expected, correct, response_ms, option_count, has_image | quiz accuracy, wrong answers, speed |
| `dictionary_search` | query, result_count (0 = failed search) | vocabulary support, missing words |
| `dictionary_audio_played` | word | reliance on audio |
| `word_saved` | word, prompt, saved, source | perceived difficult vocabulary |
| `conversation_opened` / `conversation_completed` | ids, line_count, duration_ms | contextual learning |
| `conversation_audio_played` | conversation_id, line_index | oral learning (user replays only) |
| `conversation_view_mode` | mode (both/english/target) | text vs. translation preference |
| `culture_step_viewed` / `culture_quiz_answered` | deck_id, step_index, step_type / correct | culture engagement |
| `app_error` | message, fatal, source | stability (crashes = fatal) |
| `network_changed` | online | offline use |
| `participant_code_set`, `research_data_exported` | | data provenance |

Derived in analysis rather than logged: quiz score per session, attempts per card, screen revisits,
feature abandonment, offline sessions (`online=false`), quiz/reading speed over time.

Not in the app: pre/post literacy tests (EGRA-lite), task-based usability tasks and feedback
questions are run by facilitators; record their results against the participant code.
RQ3 contribution events (`contribution_*`) are reserved in `events.ts` for when that feature exists.
