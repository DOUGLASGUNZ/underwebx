# OSC Lab 2.0 — UI patch contract

Apply after rc6 premium + rc7 polish and osc2-engine.

## Replace the current Live Preview / Builder emphasis with this hierarchy

### 1. Current Screen
Large but compact panel at the top of OSC Lab.

- Header: CURRENT SCREEN
- Mode badge: ROTATE / PINNED / STEALTH
- Exact rendered output in a two-line preview area.
- Metadata row:
  - PREV: <module label>
  - NEXT: <module label>
  - <seconds>s until next
- Controls:
  - Previous
  - Pause/Pin
  - Next
  - Hide (Stealth)
- Hide is visually obvious but not oversized.
- In Stealth preview reads: "UWX output hidden" and no queue countdown runs.

### 2. Screen Queue
One compact vertical list.
Each row:
- drag handle
- icon + module name
- enabled switch
- duration shown only when applicable

Modules:
Music
Status
Weather
Heart Rate
World
Custom
UWX

Do not display the queue in OSC output.

### 3. Now Playing
Retain existing Windows media detection and real elapsed/total timeline.
Add themed rendered preview and text progress bar.
Track-change interrupt toggle lives here or Interrupts.

### 4. Status
Compact panel/drawer:
- input + Add Status
- saved rows with star favorite toggle
- favorite count / saved count
- delete action
- validation error is generic: "This status contains language blocked by UWX."
- no UI option exists to disable safety filtering

### 5. Themes
Cards/tabs:
UnderWeb
Minimal
Void
Cyber
Horror

Selecting a theme immediately updates Current Screen preview.
No arbitrary script/HTML editor in 2.0.

### 6. Weather
Toggle + temperature/condition preview.
Configuration UI must explicitly say:
"Only temperature and conditions can be sent to VRChat. Your weather location is never included in OSC output."
Never show a configured location in Current Screen or output history.

### 7. Smart Interrupts
V1 toggles:
- New Track
- Heart Rate Spike

Explain in one line: "Interrupts briefly replace the current screen, then resume your queue."

### Responsive
At narrow widths, Current Screen remains first, Queue second, secondary panels stack below.
Avoid dashboard bloat: advanced settings should be collapsed/drawer-based.
