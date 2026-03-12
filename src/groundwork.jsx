import { useState, useEffect, useRef } from "react";

// ─── Synthetic Data ───────────────────────────────────────────────────────────
const MEETING_TRANSCRIPT = `Sprint Planning — Project Meridian (Digital Patient Intake)
Date: February 18, 2026 | Duration: 47 min
Attendees: Sarah Chen (PM), Raj Patel (Tech Lead), Lisa Nguyen (UX), Marcus Webb (QA Lead)
Absent: David Kim (Data Engineering), Dr. Anita Flores (Clinical Ops)

[00:02:14] Sarah: Okay, let's get into it. We're at sprint 7, tablets are being shipped to the first four clinics next week. Raj, where are we on the intake form?

[00:02:31] Raj: Form engine is done. We're rendering the full 12-page intake dynamically. Performance is solid — sub-200ms load on the iPad Pros we tested with.

[00:03:05] Sarah: Great. And the signature capture?

[00:03:12] Raj: We're using DocuSign's embedded API for that. Works well. The legal team said digital signatures are fine.

[00:03:28] Lisa: Wait — did legal confirm that for all states? We have clinics in four states and I thought New York had different requirements for medical consent forms.

[00:03:41] Raj: I think Karen from legal said it was fine across the board. I don't have that in writing though.

[00:03:52] Sarah: Okay, let's flag that. But let's keep moving — we need to finalize the rollout order. I'm thinking Riverside, Downtown, Bayshore, then Northgate.

[00:04:15] Marcus: Makes sense. Those are the bigger clinics. Are we sure the network can handle it? I know Bayshore had some wifi issues during the EMR rollout last year.

[00:04:33] Raj: IT said they upgraded the access points at all locations. Should be fine now.

[00:04:41] Marcus: "Should be fine" — can we get confirmation? Because if the tablets can't sync in real-time, the whole offline-first question comes back.

[00:04:58] Sarah: Good point. Raj, can you ping IT and get written confirmation on network readiness for all four sites?

[00:05:10] Raj: Yeah, I'll send an email today.

[00:06:22] Sarah: Okay, moving on. Data migration — David's not here but last I heard, the HL7 FHIR integration with the legacy EHR is on track. We're mapping the intake fields to FHIR resources and pushing to MedCore's system.

[00:06:45] Raj: Yeah, that's the plan. David mentioned the FHIR endpoint is available for most of the system. I think there might be an issue with the older modules at Northgate and Cedar Hills — they're running an older version that might not support FHIR R4.

[00:07:12] Sarah: Might not? Do we know?

[00:07:18] Raj: I'll check with David when he's back.

[00:07:25] Lisa: This feels like something we should know before we commit to the rollout order. If Northgate can't receive data via FHIR, that changes everything for that site.

[00:07:40] Sarah: Agreed, but we can't block the whole rollout. Let's proceed with the four-site plan and handle Northgate as a contingency. We'll move Cedar Hills to phase 2 anyway.

[00:08:15] Sarah: Last thing — training. Where are we on the staff training plan?

[00:08:22] Lisa: I've been working with the clinic managers on a train-the-trainer model. Two-hour session per site, the week before go-live. We're assuming front desk staff are comfortable with iPads since the clinic already uses them for check-in.

[00:08:50] Marcus: Do they though? I visited Bayshore last month and the check-in iPads were just running a single kiosk app. The staff weren't really using them — patients were self-serving.

[00:09:05] Lisa: Hmm, that's a good point. The intake form is more complex than a kiosk app. Maybe we need a longer training window.

[00:09:18] Sarah: Let's stick with the two-hour plan for now and adjust if we get feedback from the pilot. We can always add a follow-up session.

[00:09:35] Marcus: I just want to flag — if the staff struggle with the tablets during go-live, it's going to look bad with the clinic directors. Dr. Flores was already skeptical about the timeline.

[00:09:50] Sarah: Noted. I'll talk to Dr. Flores before the pilot. Let's move on to the acceptance criteria review.

[00:15:22] Sarah: For the data sync — we're requiring real-time sync within 30 seconds of form submission. The intake data hits the EHR immediately so the clinician has it before the patient walks into the exam room.

[00:15:45] Raj: That's tight but doable, assuming stable connectivity. If we're offline, we queue and sync when connection resumes. But there's no guarantee on the 30-second SLA in that case.

[00:16:02] Sarah: Right. The assumption is that connectivity is stable. Marcus, your point about Bayshore is noted — that's why we need the IT confirmation.

[00:32:10] Sarah: Okay, I think we're in good shape. Raj, action items: confirm network readiness with IT, check FHIR compatibility for Northgate and Cedar Hills with David. Lisa, finalize training materials by Friday. Marcus, start writing test cases for the offline sync scenario.

[00:32:35] All: Sounds good.

[00:32:40] Sarah: Great. Ship week is March 2nd. Let's make it happen.`;

const SLACK_THREAD = `#project-meridian | Feb 19–21, 2026

Sarah Chen [Feb 19, 9:14 AM]
Hey @david.kim — missed you at planning yesterday. Quick q: can you confirm the FHIR R4 endpoint is available at Northgate and Cedar Hills? Raj mentioned the older EHR modules might not support it.

David Kim [Feb 19, 11:02 AM]
Hey — sorry I missed it, had a conflict with the data governance meeting. So here's the thing: Northgate and Cedar Hills are running HealthBridge 4.2, which only supports FHIR STU3. The R4 endpoints aren't available unless they upgrade, and that's a 6-8 week process that clinic ops would need to approve.

Sarah Chen [Feb 19, 11:15 AM]
6-8 weeks?? That puts us well past our phase 1 deadline. Is there a workaround?

David Kim [Feb 19, 11:23 AM]
We could build a translation layer — STU3 to R4 mapping — but that's probably 2-3 sprints of work and it introduces data integrity risk. I'd want to run it by the architecture review board first.

Raj Patel [Feb 19, 11:30 AM]
Translation layer feels risky. Can we just exclude those two sites from phase 1 and revisit after the upgrade?

Sarah Chen [Feb 19, 11:45 AM]
That's what I'm thinking. But we already told the steering committee phase 1 is four sites. Pulling two changes the narrative.

David Kim [Feb 19, 11:52 AM]
Up to you on the politics. From a technical standpoint, I wouldn't push data through a hastily built translation layer for a patient-facing system.

Sarah Chen [Feb 19, 12:01 PM]
Okay. Let me think about this. Will bring it up with Dr. Flores tomorrow.

---

Marcus Webb [Feb 20, 3:22 PM]
FYI — just got off a call with IT. Network situation: Riverside and Downtown are confirmed good. Bayshore has new access points but they haven't been load-tested with 15+ concurrent tablet connections. Northgate — IT says the network closet hasn't been touched since 2019.

Sarah Chen [Feb 20, 3:30 PM]
Northgate keeps coming up as a problem. Network AND FHIR compatibility issues.

Marcus Webb [Feb 20, 3:35 PM]
Yeah. My recommendation: drop Northgate from phase 1 entirely. Replace with Lakeview — they have modern infra and they've been asking to be included.

Sarah Chen [Feb 20, 3:42 PM]
Good call. I'll propose the swap to steering.

---

Lisa Nguyen [Feb 21, 10:05 AM]
Training update: finished the materials, but I talked to the Bayshore clinic manager and she flagged something — about 40% of their front desk staff are part-time and won't be at the training session. She asked if we can do a recorded version.

Sarah Chen [Feb 21, 10:12 AM]
Can we do an async training module? Video + quiz?

Lisa Nguyen [Feb 21, 10:18 AM]
I can put something together but not by March 2nd. Maybe mid-March?

Sarah Chen [Feb 21, 10:25 AM]
That's after go-live for Bayshore. Let's think about this.

Lisa Nguyen [Feb 21, 10:30 AM]
Could we push Bayshore go-live by a week? Give me time to build the async module?

Sarah Chen [Feb 21, 10:38 AM]
Let me check with Raj on whether that impacts the deployment pipeline.

[No follow-up found in channel]`;

const JIRA_NOTES = `MRDN-142: Implement real-time data sync engine
Status: In Progress | Sprint 7 | Assignee: Raj Patel
Priority: Critical

Description:
Build the sync engine that pushes completed intake form data to the EHR within 30 seconds of submission. Uses FHIR R4 API. Must handle offline queuing with retry logic.

Acceptance Criteria:
- Form data syncs to EHR within 30 seconds on stable connection
- Offline submissions queue locally and sync on reconnection
- Data integrity check: SHA-256 hash validation on both ends
- Supports concurrent submissions from up to 15 tablets per site

Linked: MRDN-98 (FHIR endpoint configuration) — Status: Blocked
Note on MRDN-98: "Waiting on confirmation of FHIR R4 availability at all phase 1 sites. See David Kim's Slack update."

---

MRDN-156: Staff training — pilot sites
Status: To Do | Sprint 8 | Assignee: Lisa Nguyen
Priority: High

Description:
Deliver 2-hour train-the-trainer sessions at each phase 1 clinic, one week before go-live. Materials include tablet handling, form navigation, signature capture, and error recovery.

Acceptance Criteria:
- Training delivered to 100% of front desk staff at each pilot site
- Staff can complete a mock intake form unassisted within 5 minutes post-training
- Clinic managers sign off on staff readiness

Note: No accommodation for part-time staff scheduling. No async training option referenced.

---

MRDN-88: Network readiness validation
Status: Open | Unassigned | Sprint: Backlog
Priority: Medium

Description:
Validate that all phase 1 clinic locations have sufficient network infrastructure to support real-time tablet sync. Criteria: stable WiFi, sufficient bandwidth for 15+ concurrent connections, <100ms latency to EHR endpoint.

Note: Created 6 weeks ago. No updates. No assignee. Referenced in sprint planning but not pulled into any sprint.`;

// ─── Pre-baked Analysis Output ────────────────────────────────────────────────
const ANALYSIS = {
  projectName: "Project Meridian",
  projectSummary: "Digital patient intake system replacing paper forms with iPad-based intake across MedCore Health's clinic network. Phase 1 targets 4 clinic sites with a March 2nd go-live. The project is in Sprint 7 of development with the core form engine complete and focus shifting to deployment readiness.",
  yourRole: "Business Analyst — joining mid-project to support phase 1 rollout and phase 2 planning",
  keyStakeholders: [
    { name: "Sarah Chen", role: "Project Manager", context: "Primary decision-maker. Balancing technical risks against steering committee commitments." },
    { name: "Raj Patel", role: "Tech Lead", context: "Owns sync engine and FHIR integration. Has several open action items on infrastructure confirmation." },
    { name: "David Kim", role: "Data Engineering", context: "Flagged FHIR compatibility issue. Not always present at sprint planning — key context often shared async." },
    { name: "Lisa Nguyen", role: "UX Lead", context: "Owns training plan. Surfaced staff readiness concerns that haven't been fully resolved." },
    { name: "Marcus Webb", role: "QA Lead", context: "Most vocal about risk. Flagged network and training concerns early." },
    { name: "Dr. Anita Flores", role: "Clinical Ops Sponsor", context: "Executive sponsor. Skeptical of timeline. Has not been present at recent sprint meetings." },
  ],
  decisions: [
    {
      id: "D1",
      decision: "Use DocuSign embedded API for digital signature capture on intake forms",
      madeBy: "Raj Patel",
      date: "~Sprint 5 (referenced Feb 18)",
      context: "Legal team verbally approved. No written confirmation found.",
      status: "active",
    },
    {
      id: "D2",
      decision: "Phase 1 rollout order: Riverside, Downtown, Bayshore, Northgate",
      madeBy: "Sarah Chen",
      date: "Feb 18, 2026",
      context: "Rollout order decided at sprint planning. Subsequently challenged — Northgate has both FHIR and network issues. Marcus suggested replacing with Lakeview.",
      status: "likely changing",
    },
    {
      id: "D3",
      decision: "Use train-the-trainer model with 2-hour sessions per site",
      madeBy: "Lisa Nguyen / Sarah Chen",
      date: "Feb 18, 2026",
      context: "Decided at sprint planning. 40% of Bayshore front desk staff are part-time and can't attend. Async alternative proposed but not ready by go-live.",
      status: "active but at risk",
    },
    {
      id: "D4",
      decision: "Exclude Northgate from phase 1, potentially replace with Lakeview",
      madeBy: "Sarah Chen (proposed)",
      date: "Feb 20, 2026",
      context: "Proposed in Slack after network and FHIR issues surfaced. Not yet confirmed with steering committee.",
      status: "proposed — pending approval",
    },
    {
      id: "D5",
      decision: "Real-time sync SLA: intake data in EHR within 30 seconds of submission",
      madeBy: "Sarah Chen",
      date: "Feb 18, 2026",
      context: "Defined as acceptance criteria on MRDN-142. Depends on stable connectivity — no offline SLA defined.",
      status: "active",
    },
  ],
  assumptions: [
    {
      id: "A1",
      assumption: "Digital signatures via DocuSign are legally valid for medical consent forms in all four states MedCore operates in",
      source: "Sprint planning (Feb 18) — Raj referenced verbal approval from legal",
      status: "unverified",
      risk: "high",
      confidence: "directly_stated",
      confidenceDetail: "Raj explicitly stated legal approved. Lisa explicitly questioned multi-state coverage. The assumption is clearly articulated in the transcript.",
      detail: "Lisa specifically questioned multi-state compliance. Raj acknowledged no written confirmation. New York medical consent requirements may differ.",
      owner: "Unassigned — should be Legal / Karen",
      action: "Get written confirmation from legal for each state before go-live",
      verifyPrompt: "Ask Sarah Chen: 'Has Karen from legal provided written confirmation that DocuSign signatures are compliant in all four states, specifically New York?' If no written confirmation exists, this needs to be escalated before March 2.",
    },
    {
      id: "A2",
      assumption: "All phase 1 clinic sites have stable WiFi capable of supporting 15+ concurrent tablet connections",
      source: "Sprint planning (Feb 18) — Raj said 'IT upgraded access points, should be fine'",
      status: "partially verified",
      risk: "high",
      confidence: "partially_verified",
      confidenceDetail: "Marcus confirmed Riverside and Downtown directly with IT. Bayshore APs exist but are untested under load. Northgate infrastructure is outdated. Mixed confidence across sites.",
      detail: "Marcus confirmed: Riverside and Downtown are good. Bayshore has new APs but not load-tested. Northgate network closet untouched since 2019. MRDN-88 (network validation) has been in backlog for 6 weeks with no assignee.",
      owner: "Raj Patel (action item from sprint planning) / IT",
      action: "Complete load testing at Bayshore. Resolve Northgate or confirm removal from phase 1.",
      verifyPrompt: "Ask Raj Patel: 'Did you hear back from IT on network readiness? Specifically, has Bayshore been load-tested for 15+ concurrent connections?' Also check: is MRDN-88 still unassigned? If yes, flag this to Sarah — a 6-week-old unassigned ticket on the critical path is a red flag.",
    },
    {
      id: "A3",
      assumption: "FHIR R4 endpoints are available at all phase 1 clinic EHR systems",
      source: "Sprint planning (Feb 18) — Sarah referenced David's prior update",
      status: "invalidated",
      risk: "critical",
      confidence: "directly_stated",
      confidenceDetail: "David Kim explicitly confirmed in Slack (Feb 19) that Northgate and Cedar Hills run HealthBridge 4.2 with only FHIR STU3 support. This assumption was directly disproven with specific technical detail.",
      detail: "David confirmed (Feb 19 Slack) that Northgate and Cedar Hills run HealthBridge 4.2 with only FHIR STU3 support. Upgrade is 6-8 weeks. Translation layer option dismissed as too risky for patient data.",
      owner: "David Kim / Sarah Chen",
      action: "Confirm Northgate removal from phase 1. Determine phase 2 plan for STU3 sites.",
      verifyPrompt: "This assumption has been disproven — no action needed to verify. Instead, ask Sarah: 'Has the steering committee been informed about the Northgate/Cedar Hills FHIR incompatibility? Has the Lakeview swap been approved?' This is a scope change that needs formal sign-off.",
    },
    {
      id: "A4",
      assumption: "Front desk staff are comfortable with iPads and can be trained in a 2-hour session",
      source: "Sprint planning (Feb 18) — Lisa: 'clinic already uses them for check-in'",
      status: "unverified",
      risk: "medium",
      confidence: "inferred",
      confidenceDetail: "Lisa stated clinics 'already use iPads for check-in,' implying staff comfort. But Marcus observed at Bayshore that patients use the kiosks, not staff. The comfort assumption was inferred from iPad presence, not from actual staff usage data.",
      detail: "Marcus visited Bayshore — staff don't actually use the kiosk iPads; patients self-serve. The intake form is significantly more complex than the kiosk app. Additionally, 40% of Bayshore front desk are part-time and won't attend training.",
      owner: "Lisa Nguyen",
      action: "Assess actual staff tablet proficiency. Build async training module. Consider extended go-live support.",
      verifyPrompt: "Ask Lisa Nguyen: 'Has anyone observed front desk staff actually using the iPads at any site, or is it patients only?' Also: 'What's the plan for the 40% part-time staff at Bayshore who'll miss training?' If there's no answer yet, this is a go-live risk that needs a mitigation plan now, not after launch.",
    },
    {
      id: "A5",
      assumption: "30-second real-time sync SLA is achievable under production conditions",
      source: "MRDN-142 acceptance criteria",
      status: "unverified",
      risk: "medium",
      confidence: "inferred",
      confidenceDetail: "The 30-second SLA is stated in Jira acceptance criteria, but no load testing or production-environment validation is referenced. The achievability under real clinic conditions (variable WiFi, concurrent tablets) is an inference based on lab testing only.",
      detail: "SLA assumes stable connectivity. No offline SLA defined. Bayshore network not load-tested. If connectivity is intermittent, the 30-second guarantee breaks and clinicians won't have intake data before seeing the patient.",
      owner: "Raj Patel",
      action: "Define offline SLA. Load-test sync engine under degraded network conditions.",
      verifyPrompt: "Ask Raj Patel: 'Has the sync engine been tested under conditions that mimic actual clinic WiFi, including intermittent connectivity and 15 simultaneous tablets? What happens when it exceeds 30 seconds — does the clinician get notified, or do they just see stale data?' If no production-condition testing exists, push for it before go-live.",
    },
    {
      id: "A6",
      assumption: "Steering committee will accept a reduced phase 1 scope (fewer sites)",
      source: "Slack thread (Feb 19-20) — Sarah considering dropping Northgate",
      status: "unverified",
      risk: "medium",
      confidence: "inferred",
      confidenceDetail: "Sarah proposed the scope change in Slack but explicitly noted it 'changes the narrative' with steering. No confirmation from steering or Dr. Flores was found in any source. This is an inference that the change will be accepted based on technical justification.",
      detail: "Sarah acknowledged 'pulling two changes the narrative' with steering committee. Lakeview swap proposed but not confirmed. Dr. Flores already skeptical of timeline.",
      owner: "Sarah Chen",
      action: "Prepare steering committee communication with rationale for site changes before March 2.",
      verifyPrompt: "Ask Sarah Chen: 'Has the steering committee been presented with the revised phase 1 site list? What was Dr. Flores' reaction?' If this conversation hasn't happened yet, it's urgent — March 2 is approaching and a surprise scope change at go-live is worse than communicating it early.",
    },
  ],
  openQuestions: [
    "Has legal provided written confirmation of digital signature validity across all four states?",
    "Has the Bayshore network been load-tested for 15+ concurrent tablet connections?",
    "Is Northgate officially removed from phase 1? Has Lakeview been confirmed as replacement?",
    "What is the plan for the 40% of Bayshore part-time staff who can't attend training?",
    "Has Dr. Flores been briefed on the FHIR compatibility issue and potential scope change?",
    "What is the offline sync SLA? How long can a patient's data sit unsynced before it's a clinical risk?",
    "Has Sarah followed up with Raj on whether pushing Bayshore go-live impacts the deployment pipeline?",
    "Who is assigned to MRDN-88 (network readiness)? It's been unassigned in backlog for 6 weeks.",
  ],
  glossary: [
    {
      term: "FHIR R4",
      definition: "Fast Healthcare Interoperability Resources, Release 4 — an industry standard API for exchanging electronic health records between systems. R4 is the current widely-adopted version.",
      source: "Referenced in sprint planning and Slack",
      needsValidation: false,
      relatedTerms: ["FHIR STU3", "HL7", "EHR"],
    },
    {
      term: "FHIR STU3",
      definition: "An older version of the FHIR standard (Standard for Trial Use 3). Less capable than R4 and not forward-compatible. Northgate and Cedar Hills are stuck on this version via HealthBridge 4.2.",
      source: "David Kim's Slack message (Feb 19)",
      needsValidation: false,
      relatedTerms: ["FHIR R4", "HealthBridge 4.2"],
    },
    {
      term: "HL7",
      definition: "Health Level Seven International — the organization that develops FHIR and other healthcare data standards. Often used as shorthand for the messaging standards themselves.",
      source: "Sprint planning transcript",
      needsValidation: false,
      relatedTerms: ["FHIR R4"],
    },
    {
      term: "EHR",
      definition: "Electronic Health Record — the digital system that stores patient medical data. MedCore's EHR is the target system that receives intake form data.",
      source: "Referenced across all sources",
      needsValidation: false,
      relatedTerms: ["HealthBridge 4.2", "FHIR R4"],
    },
    {
      term: "HealthBridge 4.2",
      definition: "The specific EHR software version running at Northgate and Cedar Hills clinics. Only supports FHIR STU3, not R4. Upgrade requires 6-8 weeks and clinic ops approval.",
      source: "David Kim's Slack message (Feb 19)",
      needsValidation: true,
      validationNote: "Confirm with David Kim: is 4.2 the exact version? Are there any other sites running older HealthBridge versions?",
      relatedTerms: ["FHIR STU3"],
    },
    {
      term: "Train-the-trainer",
      definition: "A training model where selected staff members (usually clinic managers) receive training first, then teach their own teams. Reduces the need for project team to train every individual.",
      source: "Lisa Nguyen, sprint planning",
      needsValidation: false,
      relatedTerms: [],
    },
    {
      term: "SLA (Service Level Agreement)",
      definition: "A commitment to a specific performance standard. In this project, the 30-second sync SLA means intake data must appear in the EHR within 30 seconds of form submission.",
      source: "MRDN-142 acceptance criteria",
      needsValidation: true,
      validationNote: "Confirm with Sarah: is the 30-second SLA a hard requirement from clinical ops, or was it set by the engineering team? This affects how much flexibility exists.",
      relatedTerms: [],
    },
    {
      term: "SHA-256",
      definition: "A cryptographic hash function used here to verify data integrity — ensuring the intake form data received by the EHR is identical to what was submitted on the tablet.",
      source: "MRDN-142 acceptance criteria",
      needsValidation: false,
      relatedTerms: [],
    },
    {
      term: "Offline-first",
      definition: "A design approach where the app works without internet and syncs data when connectivity is restored. Referenced as a fallback strategy if clinic WiFi is unreliable.",
      source: "Marcus Webb, sprint planning",
      needsValidation: true,
      validationNote: "Confirm with Raj: is the current architecture truly offline-first, or is offline support a secondary mode? This affects the user experience when WiFi drops.",
      relatedTerms: ["SLA"],
    },
    {
      term: "Steering committee",
      definition: "The senior leadership group overseeing Project Meridian. They approved the 4-site phase 1 plan and would need to approve scope changes like removing Northgate.",
      source: "Sarah Chen, Slack thread",
      needsValidation: true,
      validationNote: "Ask Sarah: who sits on the steering committee? Knowing the members helps you anticipate concerns when scope changes are proposed.",
      relatedTerms: [],
    },
  ],
  firstWeekPlan: [
    "Read this brief and the three source documents linked below",
    "Schedule 1:1s with Sarah Chen (PM) and Marcus Webb (QA) — they have the most context on open risks",
    "Review MRDN-142 (sync engine) and MRDN-88 (network readiness) in Jira — these are the critical path items",
    "Ask Sarah: what happened with the steering committee conversation about site changes?",
    "Ask David Kim: what's the current state of the FHIR STU3 to R4 decision for phase 2?",
    "Attend the next sprint planning — note which assumptions from this brief are still open",
  ],
};

// ─── Connected Sources Config ─────────────────────────────────────────────────
const CONNECTED_SOURCES = [
  { name: "Slack", channel: "#project-meridian", icon: "💬", status: "synced", detail: "47 messages · last sync 2 min ago", color: "#4A154B" },
  { name: "Jira", channel: "Project MRDN", icon: "🎫", status: "synced", detail: "12 tickets · 3 in current sprint", color: "#0052CC" },
  { name: "Confluence", channel: "MedCore Health Wiki", icon: "📄", status: "synced", detail: "3 pages linked to project", color: "#172B4D" },
  { name: "Teams Meeting", channel: "Sprint Planning — Feb 18", icon: "🎙", status: "transcript imported", detail: "47 min · auto-transcribed", color: "#6264A7" },
];

// ─── Confidence Config ────────────────────────────────────────────────────────
const confidenceConfig = {
  directly_stated: {
    label: "Directly stated",
    icon: "◉",
    color: "#1e40af",
    bg: "#eff6ff",
    description: "Someone explicitly said this in a meeting or message",
  },
  partially_verified: {
    label: "Partially verified",
    icon: "◐",
    color: "#854d0e",
    bg: "#fefce8",
    description: "Some evidence supports this, but gaps remain",
  },
  inferred: {
    label: "Inferred from context",
    icon: "○",
    color: "#9a3412",
    bg: "#fff7ed",
    description: "Groundwork pieced this together — not explicitly stated. Needs human verification.",
  },
};

// ─── Status Colors & Labels ───────────────────────────────────────────────────
const statusConfig = {
  verified: { bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", label: "VERIFIED" },
  "partially verified": { bg: "#fefce8", border: "#fcd34d", text: "#713f12", label: "PARTIALLY VERIFIED" },
  unverified: { bg: "#fff7ed", border: "#fdba74", text: "#7c2d12", label: "UNVERIFIED" },
  invalidated: { bg: "#fef2f2", border: "#fca5a5", text: "#7f1d1d", label: "INVALIDATED" },
};

const riskConfig = {
  critical: { bg: "#fef2f2", text: "#991b1b", label: "CRITICAL" },
  high: { bg: "#fff7ed", text: "#9a3412", label: "HIGH" },
  medium: { bg: "#fefce8", text: "#854d0e", label: "MEDIUM" },
  low: { bg: "#f0fdf4", text: "#166534", label: "LOW" },
};

const decisionStatusConfig = {
  active: { bg: "#ecfdf5", text: "#065f46" },
  "likely changing": { bg: "#fff7ed", text: "#9a3412" },
  "active but at risk": { bg: "#fefce8", text: "#854d0e" },
  "proposed — pending approval": { bg: "#eff6ff", text: "#1e40af" },
};

// ─── Components ───────────────────────────────────────────────────────────────

function StatusBadge({ status, config }) {
  const c = config[status] || { bg: "#f3f4f6", text: "#374151", label: status?.toUpperCase() };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "9999px",
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
      backgroundColor: c.bg, color: c.text,
      border: c.border ? `1.5px solid ${c.border}` : "none", whiteSpace: "nowrap",
    }}>
      {c.label || status?.toUpperCase()}
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const c = confidenceConfig[confidence] || confidenceConfig.inferred;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 10px", borderRadius: "9999px",
      fontSize: "11px", fontWeight: 600,
      backgroundColor: c.bg, color: c.color, whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: "10px" }}>{c.icon}</span> {c.label}
    </span>
  );
}

function ProcessingAnimation() {
  const [dots, setDots] = useState(0);
  const [step, setStep] = useState(0);
  const steps = [
    "Connecting to sources",
    "Ingesting project context",
    "Extracting decisions",
    "Mapping assumptions to evidence",
    "Assessing confidence levels",
    "Identifying open risks",
    "Building glossary",
    "Generating Project State Brief",
  ];

  useEffect(() => {
    const dotInterval = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    const stepInterval = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 900);
    return () => { clearInterval(dotInterval); clearInterval(stepInterval); };
  }, []);

  return (
    <div style={{ padding: "80px 40px", textAlign: "center" }}>
      <div style={{ display: "inline-block", marginBottom: "32px" }}>
        <div style={{
          width: "48px", height: "48px", border: "3px solid #e2e8f0",
          borderTop: "3px solid #1e293b", borderRadius: "50%",
          animation: "spin 0.8s linear infinite", margin: "0 auto",
        }} />
      </div>
      <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "24px" }}>
        {steps[step]}{".".repeat(dots)}
      </div>
      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            width: "28px", height: "4px", borderRadius: "2px",
            backgroundColor: i <= step ? "#1e293b" : "#e2e8f0",
            transition: "background-color 0.3s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

function SourceCard({ source, index }) {
  const [hovering, setHovering] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        display: "flex", alignItems: "center", gap: "14px",
        padding: "14px 18px", backgroundColor: hovering ? "#f8fafc" : "#ffffff",
        borderRadius: "10px", border: "1px solid #e2e8f0",
        transition: "all 0.15s ease",
      }}
    >
      <div style={{
        width: "40px", height: "40px", borderRadius: "10px",
        backgroundColor: source.color, display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0,
      }}>
        {source.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{source.name}</div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>{source.channel}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          fontSize: "11px", fontWeight: 600, color: "#16a34a",
          backgroundColor: "#f0fdf4", padding: "3px 10px", borderRadius: "9999px",
          border: "1px solid #bbf7d0",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16a34a" }} />
          {source.status}
        </div>
        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{source.detail}</div>
      </div>
    </div>
  );
}

function AssumptionCard({ a }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const sc = statusConfig[a.status] || statusConfig.unverified;

  const copyVerifyPrompt = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(a.verifyPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        border: `1.5px solid ${sc.border}`, borderRadius: "10px",
        backgroundColor: sc.bg, padding: "16px 20px", marginBottom: "12px",
        cursor: "pointer", transition: "all 0.15s ease",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
            <StatusBadge status={a.status} config={statusConfig} />
            <StatusBadge status={a.risk} config={riskConfig} />
            <ConfidenceBadge confidence={a.confidence} />
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", lineHeight: 1.5 }}>
            {a.assumption}
          </div>
        </div>
        <span style={{ color: "#94a3b8", fontSize: "18px", flexShrink: 0, marginTop: "4px" }}>
          {expanded ? "−" : "+"}
        </span>
      </div>
      {expanded && (
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${sc.border}` }}>
          <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7 }}>
            {/* Confidence explanation */}
            <div style={{
              padding: "10px 14px", backgroundColor: confidenceConfig[a.confidence]?.bg || "#f8fafc",
              borderRadius: "6px", marginBottom: "12px",
              border: `1px solid ${confidenceConfig[a.confidence]?.color || "#cbd5e1"}22`,
            }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: confidenceConfig[a.confidence]?.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                {confidenceConfig[a.confidence]?.icon} Confidence: {confidenceConfig[a.confidence]?.label}
              </div>
              <div style={{ fontSize: "12px", color: "#475569" }}>{a.confidenceDetail}</div>
            </div>

            <div style={{ marginBottom: "8px" }}><strong>Source:</strong> {a.source}</div>
            <div style={{ marginBottom: "8px" }}><strong>Detail:</strong> {a.detail}</div>
            <div style={{ marginBottom: "8px" }}><strong>Owner:</strong> {a.owner}</div>
            <div style={{
              marginTop: "10px", padding: "10px 14px",
              backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "6px",
              fontSize: "13px", fontWeight: 600, color: "#1e293b",
            }}>
              Recommended action: {a.action}
            </div>

            {/* Verification Prompt */}
            <div style={{
              marginTop: "12px", padding: "14px 16px",
              backgroundColor: "#ffffff", borderRadius: "8px",
              border: "1.5px dashed #94a3b8",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px" }}>💬</span> Conversation starter
                </div>
                <button
                  onClick={copyVerifyPrompt}
                  style={{
                    padding: "4px 12px", fontSize: "11px", fontWeight: 600,
                    color: copied ? "#16a34a" : "#64748b",
                    backgroundColor: copied ? "#f0fdf4" : "#f8fafc",
                    border: `1px solid ${copied ? "#bbf7d0" : "#e2e8f0"}`,
                    borderRadius: "6px", cursor: "pointer",
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, fontStyle: "italic" }}>
                {a.verifyPrompt}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GlossaryItem({ item }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        padding: "14px 18px", backgroundColor: "#ffffff",
        borderRadius: "8px", border: "1px solid #e2e8f0",
        marginBottom: "8px", cursor: "pointer", transition: "all 0.15s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", fontFamily: "'SF Mono', monospace" }}>
            {item.term}
          </span>
          {item.needsValidation && (
            <span style={{
              fontSize: "10px", fontWeight: 700, padding: "2px 8px",
              borderRadius: "9999px", backgroundColor: "#fefce8",
              color: "#854d0e", border: "1px solid #fcd34d",
            }}>
              NEEDS TEAM VALIDATION
            </span>
          )}
        </div>
        <span style={{ color: "#94a3b8", fontSize: "14px" }}>{expanded ? "−" : "+"}</span>
      </div>
      <div style={{ fontSize: "13px", color: "#475569", marginTop: "6px", lineHeight: 1.5 }}>
        {item.definition}
      </div>
      {expanded && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
            <strong>Source:</strong> {item.source}
          </div>
          {item.relatedTerms.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Related:</span>
              {item.relatedTerms.map((t, i) => (
                <span key={i} style={{
                  fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                  backgroundColor: "#f1f5f9", color: "#475569", fontFamily: "monospace",
                }}>{t}</span>
              ))}
            </div>
          )}
          {item.needsValidation && item.validationNote && (
            <div style={{
              marginTop: "8px", padding: "10px 14px", backgroundColor: "#fefce8",
              borderRadius: "6px", border: "1px solid #fcd34d",
              fontSize: "12px", color: "#854d0e", lineHeight: 1.5,
            }}>
              <strong>To validate:</strong> {item.validationNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── About Page Content ───────────────────────────────────────────────────────
function AboutPage({ onBack }) {
  const sections = [
    {
      title: "The Problem",
      content: "When someone joins a project mid-stream — a new BA, a replacement PM, a consultant brought in for phase 2 — they inherit months of context scattered across Slack threads, meeting recordings nobody watches, Confluence pages three versions out of date, and Jira tickets that reference decisions made in meetings they weren't in. Every onboarding tool on the market solves for information transfer: 'here's what happened.' But that's not what makes someone effective. What makes them effective is understanding what was decided, why, and — critically — what was assumed to be true when those decisions were made.",
    },
    {
      title: "The Insight",
      content: "The real risk for a new team member isn't missing information — it's inheriting unverified assumptions. A decision made in Sprint 3 based on an assumption nobody tested will surface as a crisis at UAT. I lived this firsthand: on a previous project, a critical assumption about workstation internet connectivity wasn't surfaced until right before acceptance testing — because it was buried in a meeting where the people who knew better weren't in the room. No tool caught it. No document flagged it. The assumption just... traveled silently through every subsequent decision until it couldn't anymore.",
    },
    {
      title: "The Competitive Gap",
      content: "I scanned the market across four categories: meeting AI tools (Otter, Fireflies, Grain, tl;dv), knowledge management platforms (Notion AI, Confluence, Guru, Tettra), decision tracking tools (RAID logs, ADRs), and multi-source aggregation tools (Atlassian Rovo, eesel AI). The finding: meeting tools capture what happened, meeting by meeting, but none extract the assumptions underneath decisions. Knowledge tools are passive repositories — they assume someone already documented everything. Decision tracking exists only as a manual spreadsheet practice, not a product. And no tool combines multi-source ingestion with assumption extraction and validation workflows for the specific use case of mid-project onboarding.",
    },
    {
      title: "What I Built",
      content: "Groundwork ingests project context from multiple sources — Slack, Jira, Confluence, meeting transcripts — and generates a structured Project State Brief. Not a summary. Not a timeline. A brief organized around decisions, the assumptions those decisions rest on (color-coded by verification status and AI confidence level), a project glossary with collaborative validation flags, open questions, and a prioritized first-week action plan with ready-to-use conversation starters.",
    },
    {
      title: "The Design Principle: Co-pilot, Not Autopilot",
      content: "The most important design decision wasn't what to include — it was how to calibrate trust. Drawing from the same principles behind Tesla's driver monitoring system, every AI-generated insight in Groundwork includes a confidence indicator: 'Directly stated' (someone said it), 'Partially verified' (some evidence), or 'Inferred from context' (AI pieced it together — needs human verification). Each assumption card includes a copyable conversation starter so the BA can verify it with the right person. The tool accelerates ramp-up, but it never lets you forget that you're the driver. The glossary includes 'Needs Team Validation' flags because even definitions can drift across teams.",
    },
    {
      title: "What I'd Build Next",
      content: "Real integrations (OAuth-based Slack, Jira, Confluence connectors). Collaborative assumption validation — team members can confirm, challenge, or update assumption status directly. Assumption lifecycle tracking over time (when was it verified? by whom? has it been re-evaluated since the architecture changed?). A 'brief diff' that shows what changed between weekly regenerations. And eventually, proactive alerts: 'A decision was just made in #project-meridian that rests on an assumption you flagged as unverified.'",
    },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: "760px", margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{
          background: "none", border: "none", fontSize: "14px",
          color: "#3b82f6", cursor: "pointer", padding: "0",
          marginBottom: "32px", fontWeight: 600,
        }}
      >
        ← Back to demo
      </button>

      <div style={{ marginBottom: "40px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", textTransform: "uppercase", marginBottom: "10px" }}>
          Portfolio Case Study
        </div>
        <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#1e293b", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          Groundwork: Assumption Auditing for Mid-Project Onboarding
        </h1>
        <p style={{ fontSize: "15px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
          A working prototype that identifies the gap between what teams decide and what they assume — built to help new team members ramp up without inheriting hidden risk.
        </p>
      </div>

      <div style={{
        display: "flex", gap: "24px", marginBottom: "40px", flexWrap: "wrap",
      }}>
        {[
          { label: "Role", value: "Product Manager" },
          { label: "Timeline", value: "Concept to prototype in one session" },
          { label: "Tools", value: "React, Claude" },
          { label: "Type", value: "0 → 1 product concept" },
        ].map((item, i) => (
          <div key={i} style={{ minWidth: "140px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{item.label}</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{item.value}</div>
          </div>
        ))}
      </div>

      {sections.map((section, i) => (
        <div key={i} style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
            {section.title}
          </h2>
          <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.8, margin: 0 }}>
            {section.content}
          </p>
        </div>
      ))}

      {/* Competitive Positioning Table */}
      <div style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", margin: "0 0 16px" }}>Competitive Positioning</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                {["Capability", "Meeting AI", "Knowledge Mgmt", "Decision Logs", "Groundwork"].map((h, i) => (
                  <th key={i} style={{
                    padding: "10px 14px", textAlign: "left", fontWeight: 700,
                    color: i === 4 ? "#1e293b" : "#64748b", fontSize: "12px",
                    backgroundColor: i === 4 ? "#f0fdf4" : "transparent",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Multi-source ingestion", "Single meetings", "Manual entry", "Manual entry", "Automated"],
                ["Decision extraction", "Action items only", "None", "Manual logging", "Automated"],
                ["Assumption tracking", "None", "None", "Spreadsheets", "Automated + validation"],
                ["Confidence calibration", "None", "None", "None", "Built-in"],
                ["Onboarding-specific", "No", "Generic", "No", "Purpose-built"],
                ["Conversation starters", "None", "None", "None", "Per assumption"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{
                      padding: "10px 14px", color: j === 0 ? "#1e293b" : "#475569",
                      fontWeight: j === 0 || j === 4 ? 600 : 400,
                      backgroundColor: j === 4 ? "#f0fdf4" : "transparent",
                    }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        padding: "24px", backgroundColor: "#f8fafc", borderRadius: "12px",
        border: "1px solid #e2e8f0", textAlign: "center",
      }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
          Try the working prototype
        </div>
        <button
          onClick={onBack}
          style={{
            padding: "12px 32px", fontSize: "14px", fontWeight: 700,
            color: "#ffffff", backgroundColor: "#1e293b", border: "none",
            borderRadius: "8px", cursor: "pointer",
          }}
        >
          Launch Demo →
        </button>
      </div>

      <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid #e2e8f0", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
        Built by Earl Balisi-Smith · 2026
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Groundwork() {
  const [phase, setPhase] = useState("input"); // input | processing | output
  const [activeSection, setActiveSection] = useState("overview");
  const [showPasteOption, setShowPasteOption] = useState(false);
  const [pasteTab, setPasteTab] = useState("transcript");
  const [exportOpen, setExportOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const sources = {
    transcript: { label: "Meeting Transcript", icon: "🎙", content: MEETING_TRANSCRIPT },
    slack: { label: "Slack Thread", icon: "💬", content: SLACK_THREAD },
    jira: { label: "Jira Tickets", icon: "🎫", content: JIRA_NOTES },
  };

  const handleGenerate = () => {
    setPhase("processing");
    setTimeout(() => setPhase("output"), 7500);
  };

  const handleReset = () => {
    setPhase("input");
    setActiveSection("overview");
    setShowPasteOption(false);
    setExportOpen(false);
  };

  const navItems = [
    { id: "overview", label: "Overview", count: null },
    { id: "decisions", label: "Decisions", count: 5 },
    { id: "assumptions", label: "Assumptions", count: 6, highlight: true },
    { id: "glossary", label: "Glossary", count: 10 },
    { id: "questions", label: "Open Questions", count: 8 },
    { id: "firstweek", label: "First Week", count: null },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{
        backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0",
        padding: "0 32px", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: "64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "linear-gradient(135deg, #1e293b, #475569)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: "16px", fontWeight: 800,
            }}>G</div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", letterSpacing: "-0.02em" }}>Groundwork</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => setShowAbout(!showAbout)}
              style={{
                background: "none", border: "none", fontSize: "13px",
                color: showAbout ? "#1e293b" : "#64748b", cursor: "pointer",
                fontWeight: showAbout ? 700 : 500, padding: "4px 0",
                borderBottom: showAbout ? "2px solid #1e293b" : "2px solid transparent",
              }}
            >
              About This Project
            </button>
            <span style={{ fontSize: "13px", color: "#e2e8f0" }}>|</span>
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>
              {phase === "output" ? "Brief generated" : "Demo"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px" }}>
        {showAbout ? (
          <AboutPage onBack={() => setShowAbout(false)} />
        ) : phase === "input" && (
          <div className="fade-in">
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1e293b", margin: "0 0 12px", letterSpacing: "-0.03em" }}>
                Get up to speed, not overwhelmed
              </h1>
              <p style={{ fontSize: "16px", color: "#64748b", maxWidth: "560px", margin: "0 auto", lineHeight: 1.6 }}>
                Connect your project sources — Slack, Jira, Confluence, meeting transcripts — and get a structured brief that surfaces decisions, assumptions, and open risks.
              </p>
            </div>

            {/* Connected Sources */}
            <div style={{
              backgroundColor: "#ffffff", borderRadius: "12px",
              border: "1px solid #e2e8f0", overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                padding: "18px 24px", borderBottom: "1px solid #e2e8f0",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Connected Sources</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>4 sources synced for Project Meridian</div>
                </div>
                <button
                  style={{
                    padding: "6px 14px", fontSize: "12px", fontWeight: 600,
                    color: "#3b82f6", backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe", borderRadius: "8px", cursor: "pointer",
                  }}
                >
                  + Add source
                </button>
              </div>

              <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "10px" }}>
                {CONNECTED_SOURCES.map((source, i) => (
                  <SourceCard key={i} source={source} index={i} />
                ))}
              </div>

              {/* Paste fallback */}
              <div style={{ padding: "12px 24px 16px", borderTop: "1px solid #f1f5f9" }}>
                <button
                  onClick={() => setShowPasteOption(!showPasteOption)}
                  style={{
                    background: "none", border: "none", fontSize: "12px",
                    color: "#94a3b8", cursor: "pointer", padding: 0,
                    textDecoration: "underline", textUnderlineOffset: "2px",
                  }}
                >
                  {showPasteOption ? "Hide manual paste" : "Or paste content manually"}
                </button>
                {showPasteOption && (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", gap: "0", marginBottom: "8px" }}>
                      {Object.entries(sources).map(([key, val]) => (
                        <button
                          key={key}
                          onClick={() => setPasteTab(key)}
                          style={{
                            padding: "6px 14px", border: "none", fontSize: "12px",
                            borderBottom: pasteTab === key ? "2px solid #1e293b" : "2px solid transparent",
                            background: "none", color: pasteTab === key ? "#1e293b" : "#94a3b8",
                            fontWeight: pasteTab === key ? 700 : 500, cursor: "pointer",
                          }}
                        >
                          {val.icon} {val.label}
                        </button>
                      ))}
                    </div>
                    <pre style={{
                      margin: 0, padding: "12px", backgroundColor: "#f8fafc",
                      borderRadius: "6px", border: "1px solid #e2e8f0",
                      fontFamily: "'SF Mono', monospace", fontSize: "11px",
                      lineHeight: 1.6, color: "#334155", whiteSpace: "pre-wrap",
                      maxHeight: "200px", overflow: "auto",
                    }}>
                      {sources[pasteTab].content}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <button
                onClick={handleGenerate}
                style={{
                  padding: "14px 40px", fontSize: "15px", fontWeight: 700,
                  color: "#ffffff", backgroundColor: "#1e293b", border: "none",
                  borderRadius: "10px", cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(30,41,59,0.2)", letterSpacing: "-0.01em",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = "#334155"; e.target.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = "#1e293b"; e.target.style.transform = "translateY(0)"; }}
              >
                Generate Project State Brief →
              </button>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "12px" }}>
                Analyzes all connected sources to extract decisions, map assumptions, and flag risks
              </p>
            </div>
          </div>
        )}

        {phase === "processing" && (
          <div className="fade-in">
            <div style={{
              backgroundColor: "#ffffff", borderRadius: "12px",
              border: "1px solid #e2e8f0", marginTop: "60px",
            }}>
              <ProcessingAnimation />
            </div>
          </div>
        )}

        {phase === "output" && (
          <div className="fade-in">
            {/* Co-pilot Trust Banner */}
            <div style={{
              padding: "12px 20px", backgroundColor: "#fffbeb",
              borderRadius: "10px", border: "1px solid #fcd34d",
              marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px",
            }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>🛡</span>
              <div style={{ fontSize: "13px", color: "#713f12", lineHeight: 1.5 }}>
                <strong>Co-pilot, not autopilot.</strong> This brief is a starting point for your conversations, not a source of truth.
                Items marked <em>Inferred</em> were pieced together by AI and need human verification.
                Each assumption includes a conversation starter you can copy and use directly.
              </div>
            </div>

            {/* Brief Header */}
            <div style={{
              backgroundColor: "#1e293b", borderRadius: "12px 12px 0 0",
              padding: "32px", color: "#ffffff",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", marginBottom: "8px", textTransform: "uppercase" }}>
                    Project State Brief
                  </div>
                  <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                    {ANALYSIS.projectName}
                  </h2>
                  <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
                    Generated from 4 connected sources · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setExportOpen(!exportOpen)}
                      style={{
                        padding: "8px 16px", fontSize: "13px", fontWeight: 600,
                        color: "#ffffff", backgroundColor: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                      }}
                    >
                      Export ↓
                    </button>
                    {exportOpen && (
                      <div style={{
                        position: "absolute", top: "100%", right: 0, marginTop: "6px",
                        backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "6px", minWidth: "180px",
                        zIndex: 10,
                      }}>
                        {["Share link", "Export as PDF", "Copy to Confluence", "Send via Slack"].map((opt, i) => (
                          <button key={i} style={{
                            display: "block", width: "100%", padding: "8px 12px",
                            fontSize: "13px", color: "#334155", backgroundColor: "transparent",
                            border: "none", borderRadius: "6px", cursor: "pointer", textAlign: "left",
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#f1f5f9"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleReset}
                    style={{
                      padding: "8px 16px", fontSize: "13px",
                      color: "#94a3b8", backgroundColor: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    ← New brief
                  </button>
                </div>
              </div>

              {/* Risk Summary Bar */}
              <div style={{ display: "flex", gap: "16px", marginTop: "24px", flexWrap: "wrap" }}>
                {[
                  { n: "1", label: "Invalidated", color: "#fca5a5" },
                  { n: "2", label: "Unverified (High)", color: "#fdba74" },
                  { n: "2", label: "Unverified (Med)", color: "#fcd34d" },
                  { n: "1", label: "Partially Verified", color: "#86efac" },
                  { n: "3", label: "Inferred by AI", color: "#93c5fd" },
                  { n: "8", label: "Open Questions", color: "#c4b5fd" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: item.color }} />
                    <span style={{ fontSize: "13px", color: "#cbd5e1" }}><strong style={{ color: "#fff" }}>{item.n}</strong> {item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div style={{
              backgroundColor: "#ffffff", borderLeft: "1px solid #e2e8f0",
              borderRight: "1px solid #e2e8f0", display: "flex", gap: "0",
              padding: "0 24px", borderBottom: "1px solid #e2e8f0", overflowX: "auto",
            }}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    padding: "14px 20px", border: "none",
                    borderBottom: activeSection === item.id ? "2.5px solid #1e293b" : "2.5px solid transparent",
                    background: "none",
                    color: activeSection === item.id ? "#1e293b" : "#94a3b8",
                    fontWeight: activeSection === item.id ? 700 : 500,
                    fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: "6px",
                  }}
                >
                  {item.label}
                  {item.count && (
                    <span style={{
                      padding: "1px 7px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700,
                      backgroundColor: item.highlight ? "#fef2f2" : "#f1f5f9",
                      color: item.highlight ? "#991b1b" : "#64748b",
                    }}>{item.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Content Sections */}
            <div style={{
              backgroundColor: "#ffffff", borderRadius: "0 0 12px 12px",
              border: "1px solid #e2e8f0", borderTop: "none",
              padding: "32px", minHeight: "400px",
            }}>
              {activeSection === "overview" && (
                <div className="fade-in">
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 16px" }}>Project Overview</h3>
                  <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.8, margin: "0 0 28px" }}>
                    {ANALYSIS.projectSummary}
                  </p>
                  <div style={{
                    padding: "16px 20px", backgroundColor: "#eff6ff", borderRadius: "8px",
                    border: "1px solid #bfdbfe", marginBottom: "28px",
                  }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e40af", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Role</div>
                    <div style={{ fontSize: "14px", color: "#1e3a5f" }}>{ANALYSIS.yourRole}</div>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 16px" }}>Key Stakeholders</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                    {ANALYSIS.keyStakeholders.map((s, i) => (
                      <div key={i} style={{ padding: "14px 18px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{s.name}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>{s.role}</div>
                        <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>{s.context}</div>
                      </div>
                    ))}
                  </div>

                  {/* Confidence Legend */}
                  <div style={{ marginTop: "32px", padding: "20px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "14px" }}>How to read this brief — Confidence Levels</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "10px" }}>
                      {Object.entries(confidenceConfig).map(([key, val]) => (
                        <div key={key} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "16px", color: val.color, flexShrink: 0, marginTop: "1px" }}>{val.icon}</span>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: val.color }}>{val.label}</div>
                            <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>{val.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "decisions" && (
                <div className="fade-in">
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>Key Decisions</h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 24px" }}>
                    Decisions extracted from sprint planning, Slack, and Jira. Status reflects current state as of latest source.
                  </p>
                  {ANALYSIS.decisions.map((d, i) => {
                    const dsc = decisionStatusConfig[d.status] || { bg: "#f3f4f6", text: "#374151" };
                    return (
                      <div key={i} style={{
                        padding: "18px 20px", backgroundColor: "#ffffff",
                        borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "12px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "12px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>{d.id}</span>
                          <span style={{
                            fontSize: "11px", fontWeight: 700, padding: "3px 10px",
                            borderRadius: "9999px", backgroundColor: dsc.bg, color: dsc.text,
                            textTransform: "uppercase", letterSpacing: "0.05em",
                          }}>{d.status}</span>
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", lineHeight: 1.5, marginBottom: "10px" }}>
                          {d.decision}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6 }}>
                          <span style={{ fontWeight: 600 }}>{d.madeBy}</span> · {d.date}
                        </div>
                        <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, marginTop: "8px" }}>
                          {d.context}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeSection === "assumptions" && (
                <div className="fade-in">
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>Assumption Audit</h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
                    Assumptions underlying project decisions, extracted from all sources. Click any card to see full detail, confidence level, and a ready-to-use conversation starter.
                  </p>
                  {/* Confidence legend inline */}
                  <div style={{
                    display: "flex", gap: "16px", marginBottom: "20px", padding: "10px 16px",
                    backgroundColor: "#f8fafc", borderRadius: "8px", flexWrap: "wrap",
                  }}>
                    {Object.entries(confidenceConfig).map(([key, val]) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                        <span style={{ color: val.color }}>{val.icon}</span>
                        <span style={{ fontWeight: 600, color: val.color }}>{val.label}</span>
                      </div>
                    ))}
                  </div>
                  {ANALYSIS.assumptions.map((a, i) => (
                    <AssumptionCard key={i} a={a} />
                  ))}
                </div>
              )}

              {activeSection === "glossary" && (
                <div className="fade-in">
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>Project Glossary</h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 8px" }}>
                    Key terms extracted from project sources. Terms marked "Needs Team Validation" were defined by AI from context — ask your team to confirm the definition is accurate.
                  </p>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px",
                    padding: "10px 16px", backgroundColor: "#fffbeb", borderRadius: "8px",
                    border: "1px solid #fcd34d",
                  }}>
                    <span style={{ fontSize: "14px" }}>💡</span>
                    <span style={{ fontSize: "12px", color: "#854d0e" }}>
                      <strong>Tip:</strong> Share this glossary with your team in your first week. It helps calibrate whether everyone means the same thing when they use these terms — they often don't.
                    </span>
                  </div>
                  {ANALYSIS.glossary.map((item, i) => (
                    <GlossaryItem key={i} item={item} />
                  ))}
                </div>
              )}

              {activeSection === "questions" && (
                <div className="fade-in">
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>Open Questions</h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 24px" }}>
                    Unresolved questions identified across all sources. These should be your first conversations.
                  </p>
                  {ANALYSIS.openQuestions.map((q, i) => (
                    <div key={i} style={{
                      padding: "16px 20px", backgroundColor: i % 2 === 0 ? "#f8fafc" : "#ffffff",
                      borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "8px",
                      display: "flex", gap: "14px", alignItems: "flex-start",
                    }}>
                      <span style={{
                        flexShrink: 0, width: "24px", height: "24px", borderRadius: "50%",
                        backgroundColor: "#eff6ff", color: "#3b82f6",
                        fontSize: "12px", fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>?</span>
                      <span style={{ fontSize: "14px", color: "#334155", lineHeight: 1.6 }}>{q}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === "firstweek" && (
                <div className="fade-in">
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>Your First Week Plan</h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 24px" }}>
                    Recommended actions to get up to speed without stepping on landmines.
                  </p>
                  {ANALYSIS.firstWeekPlan.map((step, i) => (
                    <div key={i} style={{
                      padding: "16px 20px", backgroundColor: "#ffffff",
                      borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "8px",
                      display: "flex", gap: "14px", alignItems: "flex-start",
                    }}>
                      <span style={{
                        flexShrink: 0, width: "28px", height: "28px", borderRadius: "8px",
                        backgroundColor: "#f0fdf4", color: "#16a34a",
                        fontSize: "13px", fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1px solid #bbf7d0",
                      }}>{i + 1}</span>
                      <span style={{ fontSize: "14px", color: "#334155", lineHeight: 1.6 }}>{step}</span>
                    </div>
                  ))}

                  {/* Human-in-the-loop reminder */}
                  <div style={{
                    marginTop: "24px", padding: "20px",
                    backgroundColor: "#f8fafc", borderRadius: "10px",
                    border: "1.5px solid #e2e8f0",
                  }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "20px", flexShrink: 0 }}>🛡</span>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                          Remember: you're the driver, not the passenger
                        </div>
                        <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7 }}>
                          This brief accelerates your ramp-up, but it can't replace the judgment you'll build through real conversations.
                          AI extracted these patterns from text — it can't read tone, politics, or the thing someone chose <em>not</em> to say.
                          Use the conversation starters to verify what's here, and trust your instincts when something doesn't add up.
                          The best BAs don't just consume briefs — they challenge them.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "24px", fontSize: "12px", color: "#94a3b8" }}>
              Generated by Groundwork · 4 connected sources · Confidence model v1
            </div>
          </div>
        )}
      </div>
    </div>
  );
}