# Property Partner Outreach Tracking System

## Google Sheets Setup Instructions

### Sheet 1: Prospects

| Company Name | Contact Name | Title | Email | Phone | Location | # Properties | Source | Status | Last Contact | Next Action | Notes |
|-------------|--------------|-------|-------|-------|----------|-------------|--------|--------|-------------|-------------|-------|
| ABC Property Mgmt | John Smith | Owner | john@abc.com | 555-1234 | Austin, TX | 45 | Google | Cold Outreach Sent | 2025-01-15 | Follow-up #1 | Found via Google search |
| XYZ Realty | Sarah Johnson | VP Operations | sarah@xyz.com | 555-5678 | Denver, CO | 120 | Referral | Demo Scheduled | 2025-01-18 | Zoom Call 1/20 | Referred by Mike T |

**Status Options:**
- Research
- Cold Outreach Sent
- Follow-up #1 Sent
- Follow-up #2 Sent
- Final Follow-up Sent
- Demo Scheduled
- Demo Completed
- Proposal Sent
- Negotiating
- Agreement Signed
- Onboarding
- Active Partner
- Not Interested
- No Response

---

### Sheet 2: Communications Log

| Date | Company | Contact Type | Template Used | Response? | Notes | Next Step |
|------|---------|-------------|---------------|-----------|-------|-----------|
| 2025-01-15 | ABC Property Mgmt | Email | Cold Outreach | No | Sent initial email | Follow-up in 3 days |
| 2025-01-18 | ABC Property Mgmt | Email | Follow-up #1 | Yes | Interested, wants demo | Schedule Zoom |

---

### Sheet 3: Active Partners

| Company | Contact | Agreement Date | Tier | Properties Listed | Monthly Revenue | YTD Revenue | Platform Access | Notes |
|---------|---------|---------------|------|------------------|----------------|-------------|----------------|-------|
| XYZ Realty | Sarah Johnson | 2025-02-01 | Tier 3 | 22 | $4,200 | $4,200 | ✅ Active | Platinum partner |

---

### Sheet 4: Pipeline Metrics

**Weekly Tracking:**

| Week | Prospects Added | Emails Sent | Responses | Demos Scheduled | Demos Completed | Agreements Signed | Properties Listed |
|------|----------------|-------------|-----------|----------------|----------------|-------------------|------------------|
| Week 1 | 25 | 25 | 3 | 2 | 0 | 0 | 0 |
| Week 2 | 20 | 45 | 7 | 4 | 2 | 1 | 8 |

**Monthly Goals:**
- Prospects contacted: 100
- Response rate: 10% (10 responses)
- Demo rate: 50% (5 demos)
- Close rate: 40% (2 partners)
- Properties listed: 30+

---

### Sheet 5: Property Listings

| Property Address | Owner/Landlord | Property Value | Monthly Rent | Shares Available | Price/Share | Funding Status | Partner | Date Listed |
|-----------------|---------------|---------------|-------------|------------------|------------|---------------|---------|------------|
| 123 Main St, Austin | John Doe | $250,000 | $2,200 | 100 | 0.05 BNB | 45% Funded | XYZ Realty | 2025-02-15 |

---

## Automated Formulas

### Response Rate
```
=COUNTIF(Status,"*Response*")/COUNTA(Status)
```

### Demo Conversion
```
=COUNTIF(Status,"Demo Completed")/COUNTIF(Status,"Demo Scheduled")
```

### Average Time to Close
```
=AVERAGE(AgreementDate - FirstContactDate)
```

---

## Color Coding

- 🟢 Green: Active, progressing
- 🟡 Yellow: Needs follow-up
- 🔴 Red: Stalled, needs attention
- ⚪ Gray: Closed/Not interested
- 🔵 Blue: High priority

---

## Daily Workflow

**Morning (30 min):**
1. Review "Next Action" column
2. Send scheduled follow-ups
3. Update status for any responses
4. Add new prospects from research

**Afternoon (30 min):**
5. Conduct scheduled demos/calls
6. Log all communications
7. Send proposals to interested parties
8. Update pipeline metrics

**End of Week:**
9. Review metrics dashboard
10. Plan next week's outreach targets
11. Adjust templates based on response rates

---

## Success Metrics to Track

**Lead Generation:**
- Prospects added per week
- Source effectiveness (Google vs Referral vs LinkedIn)
- Email open rates
- Response rates

**Conversion:**
- Demo schedule rate
- Demo show rate
- Proposal acceptance rate
- Time to close (days)

**Partner Performance:**
- Properties listed per partner
- Average property value
- Funding completion rate
- Partner satisfaction score

---

## Email Tracking

Use a tool like:
- HubSpot (free tier)
- Mailtrack for Gmail
- Streak CRM
- Or track manually in "Communications Log" sheet

**Track:**
- Sent date/time
- Opened? (Y/N)
- Clicked links? (Y/N)
- Replied? (Y/N)
- Response time

---

## Weekly Report Template

**Week of [Date]:**

**Outreach Activity:**
- Prospects contacted: [X]
- Follow-ups sent: [X]
- Responses received: [X]
- Response rate: [X%]

**Pipeline Progress:**
- Demos scheduled: [X]
- Demos completed: [X]
- Proposals sent: [X]
- Agreements signed: [X]

**Properties:**
- New listings: [X]
- Total active: [X]
- Funding completed: [X]
- Total value: $[X]

**Revenue:**
- New partner revenue: $[X]
- Total MRR: $[X]
- YTD revenue: $[X]

**Next Week Goals:**
- Contact [X] new prospects
- Close [X] partnerships
- List [X] properties

---

## Sample Prospect Sources

**Online Research:**
- Google: "property management companies [city]"
- Yelp: Property management category
- BiggerPockets: Active members
- LinkedIn: Search "property manager" + location

**Referrals:**
- Current partners
- Real estate attorneys
- Mortgage brokers
- Real estate investors

**Events:**
- Local real estate meetups
- Property management conferences
- Chamber of Commerce events
- Rotary/Lions clubs

---

## Quick Scripts

**Phone Call Opening:**
> "Hi [Name], this is [Your Name] from Axiom Prime. I sent you an email last week about helping your renters buy homes while creating recurring revenue for your company. Did you have a chance to look at it? I can explain in 60 seconds if you have a moment."

**Voicemail:**
> "Hi [Name], [Your Name] from Axiom Prime. Quick question - are you currently offering any wealth-building programs for your renters? We help property managers turn renters into homeowners, and I'd love to show you how it works. My number is [XXX-XXX-XXXX]. Thanks!"

**LinkedIn Message:**
> "Hi [Name] - I see you manage properties in [Location]. I built a platform that helps renters buy homes through fractional ownership. Several PM companies are using it to improve retention and create new revenue. Worth a quick call?"

---

## Tools Needed

**Free:**
- Google Sheets (tracking)
- Gmail + Mailtrack (email)
- Calendly (scheduling)
- LinkedIn (prospecting)

**Paid (Optional):**
- HubSpot CRM ($45/mo)
- Hunter.io (email finder, $49/mo)
- Zoom (calls, $15/mo)
- Loom (video demos, $8/mo)

---

## Success Story Template

After first partnership, create case study:

**Title:** How [Partner] Listed $2M in Properties in 30 Days

**Format:**
1. Challenge (what problem they had)
2. Solution (how Axiom Prime helped)
3. Results (properties listed, revenue earned)
4. Quote from partner
5. Call-to-action for other PMs

Use in future outreach!
