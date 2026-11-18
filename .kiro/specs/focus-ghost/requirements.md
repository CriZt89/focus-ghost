# Requirements — Focus Ghost

## Introduction

Focus Ghost is a client-side focus app: a Pomodoro timer whose sessions feed a virtual
ghost pet. The ghost's state honestly reflects the user's focus behavior. Streaks and a
"graveyard" heatmap reward daily consistency. All data persists locally.

## Glossary

- **Focus session:** one completed Pomodoro focus interval (default 25 min).
- **Ghost:** the virtual pet. Has hunger (0–100), energy (0–100), XP, level, evolution
  stage, and mood.
- **Streak:** consecutive days with at least one completed focus session.
- **Graveyard:** a GitHub-style heatmap of focus minutes per day.

## Requirements

### Requirement 1 — Pomodoro timer

**User Story:** As a user, I want a Pomodoro timer with focus, short break, and long
break phases, so that I can work in focused intervals with real rest.

#### Acceptance Criteria

1. WHEN the user starts a focus phase THEN the system SHALL count down from the
   configured focus length (default 25 minutes) and display minutes:seconds.
2. WHEN a focus phase completes THEN the system SHALL record one completed focus
   session, award ghost XP, and advance to a break phase.
3. WHEN the user completes 4 focus sessions in a row THEN the system SHALL offer a long
   break (default 15 minutes) instead of a short break (default 5 minutes).
4. WHEN the user pauses the timer THEN the system SHALL freeze the countdown and allow
   resume without losing elapsed time.
5. WHEN the user resets the timer THEN the system SHALL return the current phase to its
   full configured length without recording a session.
6. WHEN a phase ends THEN the system SHALL show a desktop notification (if permitted)
   and play a sound (if sound is enabled).

### Requirement 2 — Ghost state

**User Story:** As a user, I want a ghost whose condition reflects my focus behavior,
so that staying focused feels rewarding and slacking off has visible consequences.

#### Acceptance Criteria

1. WHEN a focus session completes THEN the system SHALL increase ghost hunger by 15,
   energy by 10, and XP by 25 (all clamped to their valid ranges).
2. WHEN the tab becomes hidden or the user is idle for more than 60 seconds during a
   focus phase THEN the system SHALL show a warning first, then decay hunger by 1 per
   30 seconds and energy by 1 per 60 seconds while the condition persists.
3. WHEN XP reaches the threshold for the next level (100 × current level) THEN the
   system SHALL increase the level by 1 and show a level-up celebration.
4. WHEN the level crosses a stage boundary (3, 6, 10, 15) THEN the system SHALL change
   the ghost's evolution stage and announce it.
5. WHEN hunger is below 25 THEN the system SHALL show the ghost mood as "hungry" and
   dim its glow; WHEN energy is below 25 THEN the mood SHALL be "weak".
6. WHEN the ghost's name is changed in Settings THEN the system SHALL display the new
   name everywhere immediately and persist it.

### Requirement 3 — Streaks and the Graveyard

**User Story:** As a user, I want streaks and a daily heatmap, so that I can see my
consistency at a glance and stay motivated to show up every day.

#### Acceptance Criteria

1. WHEN a day has at least one completed focus session THEN the system SHALL count that
   day toward the streak.
2. WHEN the user completes a focus session on a day immediately after the previous
   streak day THEN the system SHALL increment the streak by 1; WHEN a calendar day
   passes with no session THEN the system SHALL reset the streak to 0.
3. WHEN the user opens the app THEN the system SHALL display the current streak and
   the best streak.
4. WHEN the Graveyard renders THEN the system SHALL show the last 26 weeks of days as
   a heatmap, with color intensity based on focus minutes that day (0, 1–14, 15–29,
   30–59, 60+).
5. WHEN the user hovers or focuses a Graveyard cell THEN the system SHALL show the
   date, focus minutes, and sessions for that day.

### Requirement 4 — Stats and settings

**User Story:** As a user, I want stats and settings, so that I can track progress and
tune the app to my habits.

#### Acceptance Criteria

1. WHEN the Stats panel renders THEN the system SHALL show focus minutes and sessions
   for today, this week, and all time.
2. WHEN the user changes a timer length in Settings THEN the system SHALL apply it to
   the next phase of that type and persist it.
3. WHEN the user toggles sound off THEN the system SHALL play no sounds until toggled on.
4. WHEN the user exports data THEN the system SHALL download a JSON file with the full
   state; WHEN the user imports a valid export file THEN the system SHALL replace the
   state with it.

### Requirement 5 — Persistence and offline use

**User Story:** As a user, I want my ghost and history to survive reloads, so that I
never lose progress.

#### Acceptance Criteria

1. WHEN any state changes THEN the system SHALL persist the full state to
   `localStorage` under the key `focus-ghost:v1`.
2. WHEN the app loads with existing saved state THEN the system SHALL restore ghost,
   streaks, days, and settings exactly.
3. WHEN the app loads with no saved state THEN the system SHALL start with defaults
   (level 1 Wisp, hunger 70, energy 80, empty history).
4. WHEN the app loads with an unknown schema version THEN the system SHALL fall back
   to defaults rather than crash.

### Requirement 6 — Spooky design and accessibility

**User Story:** As a user, I want a polished haunted interface that is still usable,
so that the theme delights without getting in the way.

#### Acceptance Criteria

1. WHEN the app renders THEN the system SHALL use a dark, foggy, glowing visual theme
   with the ghost as the visual center of the page.
2. WHEN the ghost's mood or stage changes THEN the system SHALL change its appearance
   (glow, expression, size) to match.
3. WHEN the user navigates by keyboard THEN the system SHALL make every control
   reachable and operable.
4. WHEN the timer status changes THEN the system SHALL announce it via an `aria-live`
   region.
5. WHEN the viewport is 360px wide THEN the system SHALL lay out all panels legibly
   without horizontal scrolling.
