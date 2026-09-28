# UWX adoption features

## 1. Safety Intel — active RC8 focus

Safety Intel is a shared community-awareness layer keyed to VRChat user IDs.

### Product rule

**Awareness, not enforcement.**

UWX may surface reviewed safety information, but it must never automatically:
- ban
- block
- kick
- report
- remove
- mass-target

The user always decides what to do with the information.

### Reviewed categories

- Crashing
- Doxxing / privacy threat
- Harassment
- Scam / impersonation
- Malicious client behavior
- Ban evasion
- Other reviewed harmful behavior

Using a modified client by itself is not a safety category. The system records documented behavior.

### Review states

- Pending
- Reviewing
- Verified
- Rejected
- Expired

Pending reports and evidence are private to the reporter and authorized UnderWeb reviewers.
Normal UWX users only see active reviewed summaries.

### Public UWX summary

A reviewed result may expose:
- VRChat user ID
- last known display name
- standardized category flags
- Info / Caution / High Risk
- number of verified reports
- sanitized public summary
- latest verified date
- last reviewed date

It must never expose reporter identity, internal reviewer notes, raw evidence, addresses, phone numbers, IP addresses, passwords, or other private/doxxed information.

### RC8 UI

- dedicated Safety Intel tab
- current-instance scan
- VRChat user ID lookup
- reviewed category chips
- risk badge
- review metadata
- friend/profile warning after lookup or scan
- explicit “no record is not a guarantee of safety” copy
- explicit no-auto-enforcement copy

### Next Safety Intel work

1. Authenticated report-submission UI.
2. Staff review queue.
3. Evidence upload/storage with strict private access.
4. Appeal / correction workflow.
5. Automatic expiry maintenance for old verified records.
6. Optional user setting to hide Safety Intel warnings.
7. Safety badge integration into Radar+ and recent-user views.

---

## 2. Community Radar+ — next

Goal: make UWX useful to ordinary community members, not just staff or creators.

Planned capabilities:
- UnderWeb members online
- friends / supporters / staff / creators / partners filters
- event attendance markers
- current-world clusters where visibility permits
- Safety Intel badges on visible users
- quick profile actions
- supporter / network badges
- privacy-aware presence only; no bypassing VRChat visibility rules

Radar+ should answer: **“Where is everybody and what is happening?”**

---

## 3. Event Discovery + Join Flow — next

Goal: make UWX the easiest way to discover and join UnderWeb activity.

Planned capabilities:
- Live Now
- upcoming events
- countdowns
- host / DJ / performer cards
- world and instance information when available
- one-click join/copy-instance actions where VRChat permits
- reminders
- supporter-only event indicators
- Safety Intel summary for the visible event instance
- Event Mode integration for staff without making the normal-user UI complicated

Event Discovery should answer: **“What is happening right now, and how do I get there?”**

---

## Adoption target

UWX should serve two layers without splitting into two apps:

**Everyone**
- Community Radar+
- Event Discovery
- Safety Intel
- OSC / status
- social and session convenience

**Power users / staff / creators**
- Group Recruiter
- Instance Inviter
- Event Mode
- operations tools
- deeper network controls

The normal-user experience should remain useful even if the user never creates content, joins staff, or uses recruiting tools.
