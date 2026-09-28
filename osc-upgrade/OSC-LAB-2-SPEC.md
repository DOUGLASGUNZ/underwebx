# OSC Lab 2.0 — locked scope

## Core UX
- Current Screen: exact live VRChat output preview, previous/next screen, timer.
- Screen Queue stays client-side. VRChat receives one rendered screen at a time.
- Queue modules: Music, Status, Weather, Heart Rate, World, Custom, UWX.
- Reorder modules and enable/disable them individually.
- Modes: Rotate, Pin, Stealth.
- Stealth immediately clears UWX chatbox output and suppresses rotation/interrupts until restored.

## Status Pool
- Users may save multiple statuses.
- Favorite = eligible for rotation; unfavorite = retained but excluded.
- Status screen selects from favorites using shuffle-bag/no-repeat behavior.
- Mandatory non-disableable slur/hate-term safeguard.
- Validate on save/import AND again immediately before OSC transmission.
- Normalize case, spacing/punctuation, repeated characters, common substitutions, and Unicode lookalikes.
- Rejected text is not silently rewritten.

## Themes
Initial themes: UnderWeb, Minimal, Void, Cyber, Horror.
Themes format every compatible screen, not only music.
Theme renderer is separate from source data and OSC transport.

## Music 2.0
- Track title, artist, elapsed/total time.
- Moving text progress bar.
- Track-change smart interrupt.
- Theme-specific layouts.

## Smart Interrupts V1
- New track.
- Heart-rate spike.
- Interrupt temporarily replaces Current Screen, then resumes queue position.
- Individually disableable.

## Weather
- Temperature and condition only.
- Never expose city, state, ZIP/postcode, coordinates, timezone, station name, or location-derived text to OSC.
- Any configured weather location remains local.
- Final renderer receives only display-safe weather values.

## Privacy / Safety pipeline
source data -> module renderer -> theme renderer -> privacy/safety validator -> 144-character clamp -> OSC sender

Nothing may bypass final validation.

## Deferred
- Avatar presets.
- Avatar effect controller.
- General automation/rules builder.
- Arbitrary theme scripting.
- Transparent/floating display remains R&D and must not block OSC 2.0.
