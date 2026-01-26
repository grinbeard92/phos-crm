---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys']
inputDocuments:
  - '_bmad-output/analysis/brainstorming-session-2026-01-25.md'
  - 'CLAUDE.md'
  - 'README.md'
workflowType: 'prd'
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 2
classification:
  projectType: 'saas_b2b'
  domain: 'general'
  complexity: 'medium'
  projectContext: 'brownfield'
  specificDomain: 'CRM / Business Management Software'
  platformBase: 'Twenty CRM (open-source)'
---

# Product Requirements Document - phos-crm

**Author:** Ben
**Date:** 2026-01-25

## Success Criteria

### User Success

**Financial Success - Clear Target:**
- $10K/month in booked services/projects/commissions
- Consistent monthly booking (not feast/famine)
- Cash flow predictability for business planning

**Sales Effectiveness - Critical Questions:**
- Sales guidance prompts asking the "root problem" questions
- Cut through surface symptoms to real needs
- Discovery calls end with clear next steps, not "I'll think about it"
- Position solutions effectively because the right questions were asked

**Deal Preservation - Never Miss Again:**
- Stalled deals get flagged BEFORE they die
- Action taken on alerts despite daily crises and new responsibilities
- Zero deals lost because of forgotten follow-ups
- Visual "Days-in-Stage" counter creates urgency to act

**Emotional Outcomes:**
- Confidence: "I know I asked everything I needed to ask"
- Control: "I see problems before they become losses"
- Relief: "The CRM won't let important deals slip through"
- Breathing room: "I have predictable revenue, not panic"

### Business Success

**3-Month Horizon:**
- MVP features deployed and working (Email→Opportunity→Task, Days-in-Stage, Sales Guidance fields)
- System used daily (not built and abandoned)
- First month with $10K booked using the new workflow
- Zero "Adapt Laser" or "Best-Tec" pattern failures

**12-Month Horizon:**
- Consistent $10K+/month bookings for 6+ consecutive months
- System proven enough to deploy to first external client (LVN Laser or Beehive Birth)
- Template library built from proven sales processes
- Multi-currency working for Mexico (Peso) projects

### Technical Success

- Twenty-native implementation (survives Twenty upgrades)
- Feature-flagged for multi-tenant deployment
- GraphQL custom fields working reliably
- Email integration (ProtonMail) functioning
- All extensions documented for future developer handoff
- Atomic git commits for easy rollbacks
- Code follows Twenty's frontend/backend best practices
- Modular architecture allows feature-by-feature deployment

### Measurable Outcomes

**Revenue & Cash Flow:**
- $10K/month booked services/projects/commissions (primary success metric)
- Booking consistency: No more than 30% variance month-to-month
- Pipeline visibility: 3x pipeline coverage (minimum $30K in active opportunities)

**Sales Process Quality:**
- Deal velocity: Average days-in-stage reduced by 40% from baseline
- Lost deal rate: <10% of qualified opportunities lost to "spam & silence" or neglect
- Discovery effectiveness: 80%+ of discovery calls end with clear next action

**System Adoption:**
- Daily CRM usage: 5+ days/week logging activity
- Opportunity tracking: 100% of potential deals logged (no more "friend tax" losses)
- Follow-up compliance: 90%+ of automated tasks completed within 48 hours

**Technical Reliability:**
- Email integration uptime: 99%+ availability
- Data integrity: Zero lost opportunities due to system failures
- Upgrade compatibility: All custom features survive Twenty version updates

## Product Scope

### MVP - Minimum Viable Product (Months 1-2)

**Must work to prove concept and address cash flow crisis:**

**Priority 1: Sales Acceleration**
- Email → Opportunity → Task workflow (prevents "spam & silence")
- Days-in-Stage counter (visual stall detection)
- Sales Guidance rich-text fields on Opportunity object (embedded call scripts, objection handling)
- Lead Source attribution fields (track what's working)

**Priority 2: Financial Visibility**
- Mileage field on Expenses (tax write-off tracking)
- Multi-currency fields: USD + MXN (Peso jobs imminent)
- Receipt storage via Twenty Attachments (repurposed native feature)

**Priority 3: Foundation**
- ProtonMail SMTP fixed/working (email integration is foundational)
- Basic Project → Expense visibility

**Success Gate:** First deal closed using new workflow, zero deals lost to neglect, mileage tracking working for tax season.

### Growth Features (Months 3-4 - Post-MVP)

**Makes it competitive and reusable for multi-tenant deployment:**

**Templates & Reusability:**
- Email Template object (manual copy-paste, Phase 1)
- Sales Playbook using repurposed Notes (stage-specific guidance)
- Project Templates object (consulting vs. laser build workflows)

**Marketing & Attribution:**
- MarketResearch object (research repository with opportunity links)
- Lead Source dashboard (attribution reporting)
- Tags for deal quality (hot-lead, warm-lead, at-risk)

**Advanced Workflows:**
- Project → Expense aggregation view (total project costs)
- Opportunity Won → Auto-create Project workflow
- Email threading to Projects (sales context preserved)

**Success Gate:** System deployed to first external client, template library proven with 10+ reusable templates, attribution data showing clear ROI sources.

### Vision (Months 5-6+ - Future)

**Dream version with advanced automation and multi-tenant scale:**

**Advanced Features:**
- LLM-based Receipt OCR (Gemini/GPT-4 Vision with structured prompts)
- Gantt Chart module (Twenty App with custom frontend component)
- Advanced Template Engine with merge fields and automation
- Chat Integration (low priority)
- Inventory Management (future need)

**Integrations:**
- Stripe bidirectional integration (Won deal → invoice, payment → update status)
- LinkedIn Integration (Phos B2B research)
- Full Social Media Suite (feature-flagged per workspace for multi-tenant)

**Multi-Tenant Maturity:**
- Deployed to 3+ client workspaces (Phos, LVN Laser, Beehive Birth)
- Workspace-specific feature flags working
- Per-tenant workflow customization proven
- Platform contribution: Features released back to Twenty CRM community

**Success Gate:** Revenue diversification from CRM deployment services, platform maturity enabling rapid client onboarding, contribution to Twenty open-source ecosystem.

## User Journeys

### Journey 1: Ben - The Overwhelmed Consultant Fighting for Survival

**Opening Scene - Crisis Mode:**

It's Tuesday morning. Ben wakes up to an email from a potential client asking about a laser consulting project - could be worth $15K. He's excited but immediately stressed. He has three other active quotes out there, a Mexico project starting next week, and he can't remember if he followed up with Adapt Laser after sending that quote two weeks ago. He opens his inbox - 247 unread messages. His "system" is a mix of Gmail threads, sticky notes, and memory. Cash flow is getting tight.

**Rising Action - The Deal That Almost Died:**

Ben remembers the Adapt Laser quote. Opens Gmail, searches for it. The quote email is there from November - sent to `info@adaptlaser.com`. Did they get it? He has no idea. No response. Should he call? Or did he already call and forget? He feels the familiar knot in his stomach - another deal dying from neglect. This is exactly what happened with Best-Tec - that software project his friend mentioned once that he never formally tracked and it just... evaporated.

**The Old Way Breaks Down:**

Ben tries to mentally track everything:
- Adapt Laser: Quote sent, no response - SHOULD CALL
- New inquiry (Tuesday): Needs discovery call - SCHEDULE
- Mexico project: Starting soon, needs mileage tracking for tax write-off - ??
- LVN Laser: Quote sent last week - WHO KNOWS

He opens a spreadsheet. It's from 3 months ago. Half the data is wrong. He gives up. Goes back to inbox firefighting.

**Climax - The CRM Saves Him:**

Later that week, Ben has deployed the new Phos CRM extensions. Wednesday morning:

**9:00 AM:** Opens Twenty CRM. Dashboard shows:
- 🔴 **Adapt Laser** - "In Quote Sent for 14 days" - Big red warning
- 🟡 **LVN Laser** - "In Quote Sent for 7 days" - Yellow caution
- 🟢 **New Inquiry** - "In Discovery for 2 days" - Green, on track

Ben clicks Adapt Laser. The opportunity record shows:
- Quote sent: Nov 15
- **Auto-created task (from workflow):** "CALL if no response by Nov 16" - OVERDUE
- Sales Guidance field reminds him: "If quote in spam, call and offer to resend"

Ben calls. Guy answers: "Oh yeah! That went to spam. Can you resend?" Deal saved.

**10:30 AM:** Discovery call with new inquiry. Ben opens the opportunity, sees the Sales Guidance fields:
- **Discovery Questions:**
  - "What's the root technical problem you're trying to solve?"
  - "What have you tried that didn't work?"
  - "What does success look like 3 months after we solve this?"

Ben asks all three. Client gives him gold: "We tried fixing it ourselves, wasted $5K, now we're desperate." Ben positions his solution perfectly: "I solve exactly this type of failed DIY situation." Call ends with clear next step: "I'll send you a proposal by Friday."

CRM automatically creates task: "Send proposal by Friday" with 2-day reminder.

**Resolution - The New Reality:**

One month later:
- Ben closed $12K that month (Adapt Laser + new inquiry)
- Zero deals lost to "spam & silence"
- Every discovery call uses the guidance - he's getting better at asking root questions
- His mileage for Mexico trip is tracked - 347 miles logged, ready for tax write-off
- He feels in control for the first time in months

**Emotional Arc:**
- **Before:** Panic, overwhelm, guilt (deals dying), reactive
- **Turning Point:** Trust (CRM won't let deals die)
- **After:** Control, confidence, breathing room, proactive

### Journey 2: Ben - The Tax Season Survivor

**Opening Scene:**

It's February. Ben's accountant emails: "Need your 2025 expense report by March 1st." Ben's heart sinks. He has:
- A shoebox of crumpled receipts
- Probably $3K in mileage he didn't track
- No idea which expenses go with which projects
- That Mexico trip in December - how many miles was that again?

**The Old Way:**
- Spend 3 days sorting receipts
- Manually calculate mileage from Google Maps history (if he remembers the trips)
- Miss deductions because he can't find receipts or forgot trips entirely
- Overpay taxes because his records suck

**The CRM Way:**

Ben opens Twenty CRM, goes to Expenses view:
- **Receipts:** 47 uploaded (phone camera → CRM attachment)
- **Mileage:** 2,847 miles logged across 23 trips, all linked to projects
- **Multi-currency:** 3 Mexico expenses in MXN, automatically converted to USD for tax reporting
- **Project breakdown:** Clear view of expenses per project (some billable, some not)

Exports CSV. Sends to accountant. Takes 20 minutes instead of 3 days.

**Tax write-offs captured:** $4,200 more than last year because mileage was actually tracked.

### Journey 3: Future Sales Rep - The Trainee

**Opening Scene:**

Six months from now. Ben's revenue is consistent enough to hire a part-time sales assistant, Maria. She's smart but new to consulting sales. Ben needs to onboard her fast.

**The Old Way (Nightmare):**
- Shadow Ben for weeks
- Try to remember all his sales tips
- Wing it on discovery calls
- Learn by making expensive mistakes

**The CRM Way:**

**Day 1:** Ben sets up Maria in Twenty CRM with her own login.

**Day 2:** Maria gets her first lead. Opens the opportunity record, sees:
- **Lead Source:** LinkedIn (Ben connected with them last week)
- **Sales Guidance - Discovery Script:**
  - "Ask: What's the root technical problem?"
  - "Ask: What have you tried that didn't work?"
  - "Ask: What does success look like 3 months out?"
- **Sales Guidance - Positioning:**
  - "If they tried DIY and failed: Position as 'I solve failed DIY situations'"
  - "If they're researching: Position as 'I can shortcut your research'"

Maria follows the script. Call goes well. CRM creates follow-up tasks automatically.

**Week 2:** Maria asks Ben: "How do I handle the objection 'I need to think about it'?"

Ben creates a Note in CRM tagged "Objection Handling - Need to Think About It", links it to the "Quote Sent" stage. Now Maria (and future Ben) can reference it whenever that objection comes up.

**Emotional Arc:**
- **Before:** Overwhelmed, scared of messing up, no idea where to start
- **Turning Point:** CRM guides her through every call
- **After:** Confident, learning fast, closing deals within a month

### Journey 4: Ben - The Multi-Tenant Deployer (Future)

**Opening Scene:**

One year from now. Ben's friend who runs LVN Laser asks: "You built this CRM system - can I use it for my business?"

**The Old Way (Impossible):**
- Ben's CRM is hardcoded for Phos
- Would need to rebuild everything from scratch
- Not worth the effort

**The CRM Way (Designed for This):**

Ben creates a new Twenty workspace for LVN Laser:
- Enables feature flags: `IS_GANTT_ENABLED=false` (they don't need project Gantt yet)
- Enables: `IS_SOCIAL_INSTAGRAM_ENABLED=true` (they're B2C, need Instagram tracking)
- Clones Email Templates from Phos, customizes for LVN's laser aesthetics business
- Deploys in 2 days instead of 2 months

LVN pays Ben $500/month for CRM hosting + customization. New revenue stream unlocked.

### Journey Requirements Summary

These journeys reveal specific capabilities needed:

**From Journey 1 (Sales Survival):**
- Email → Opportunity → Task workflow automation
- Days-in-Stage visual counter with color-coded warnings
- Sales Guidance fields (rich text, stage-specific)
- Lead Source attribution
- Dashboard with stall detection

**From Journey 2 (Tax Season):**
- Mileage field on Expenses
- Receipt upload/storage via Attachments
- Multi-currency support (USD, MXN)
- Expense → Project linking
- CSV export for accountant

**From Journey 3 (Team Onboarding):**
- Sales Playbook (repurposed Notes with stage relations)
- Email Templates (reusable scripts)
- User roles/permissions
- Training materials embedded in CRM

**From Journey 4 (Multi-Tenant):**
- Feature flags per workspace
- Workspace cloning/templates
- Tenant-specific customization
- Module on/off switches
