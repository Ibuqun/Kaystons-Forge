# Incident Response Playbook — Kayston's Forge

> This is a living document. Review after every incident and at least annually.

## Severity Matrix

| Level | Definition | Examples | Initial Response SLA | Fix SLA |
|-------|-----------|----------|---------------------|---------|
| **P0 — Critical** | Active exploitation in the wild; data breach risk | XSS serving malware, credential theft | 2 hours | 24 hours |
| **P1 — High** | High-impact vulnerability; no confirmed exploitation | ReDoS DoS, CSP bypass, auth bypass | 24 hours | 7 days |
| **P2 — Medium** | Moderate impact; exploitation requires specific conditions | CSRF on non-sensitive action, info disclosure | 5 business days | 30 days |
| **P3 — Low** | Low impact; defense-in-depth improvement | Missing header, verbose error, minor logic issue | 10 business days | Next release |

## Roles

| Role | Responsibility |
|------|---------------|
| **Incident Owner** | Triages, coordinates, owns resolution end-to-end |
| **Comms Lead** | Drafts user/public communications |
| **Engineer** | Implements and tests the fix |

For a solo/small team: one person may cover all roles.

## Process Flow

### 1. Detection
Sources: VDP report (security@kaystons.dev), GitHub security advisory, automated scan (CodeQL/TruffleHog), user report.

### 2. Triage (within SLA above)
- [ ] Reproduce the issue locally
- [ ] Assign severity (P0–P3)
- [ ] Create a **private** GitHub security advisory (do NOT create a public issue)
- [ ] Notify team via preferred channel

### 3. Containment (P0/P1 only)
- [ ] Assess whether the production deployment should be rolled back immediately
- [ ] If rollback needed: `vercel rollback` to the previous known-good deployment

### 4. Fix
- [ ] Branch off `main`: `git checkout -b fix/security-<cve-or-short-desc>`
- [ ] Write a regression test that fails before the fix
- [ ] Implement fix
- [ ] Run full test suite: `npm test -- --run`
- [ ] Run: `npm run audit`
- [ ] Code review by at least one other person (or self-review with checklist)

### 5. Deploy
- [ ] Merge fix PR to `main`
- [ ] Verify deployment on Vercel
- [ ] Smoke test the affected feature in production

### 6. Disclosure
- [ ] P0/P1: Disclose publicly within 90 days of fix (industry norm)
- [ ] Publish GitHub Security Advisory
- [ ] Credit the reporter (with their consent) in the advisory and `ACKNOWLEDGMENTS.md`
- [ ] If > 100 affected users: post a brief update on the project's communication channels

### 7. Post-Mortem (P0/P1 required, P2 recommended)
Within 5 business days of resolution, document:
- What happened
- Root cause
- Timeline
- What we're doing to prevent recurrence

## Hotfix Checklist

Quick reference for P0/P1 fixes:

```
[ ] Reproduce locally
[ ] Create private advisory on GitHub
[ ] Branch: git checkout -b fix/security-<desc>
[ ] Write failing test
[ ] Fix code
[ ] npm test -- --run  (all pass)
[ ] npm run audit      (no new HIGH+)
[ ] PR → merge to main
[ ] Verify on Vercel
[ ] Publish advisory
[ ] Credit reporter
```

## Communication Templates

### Initial acknowledgment to reporter
> Thank you for your report. We have received your submission and will respond within [SLA per severity]. We take security seriously and appreciate the responsible disclosure.

### Public disclosure post-fix
> We have resolved a [severity] security issue in [component]. The fix was deployed on [date]. We thank [researcher name/handle] for responsibly disclosing this issue.

### Internal escalation
> SECURITY INCIDENT — P[N]: [One-line description]. Discovered [date/time]. Owner: [name]. Status: [investigating/contained/resolved].

## References
- [CYBERSECURITY_RECOMMENDATIONS.md](../CYBERSECURITY_RECOMMENDATIONS.md) — full security posture plan
- [NIST SP 800-61r3](https://csrc.nist.gov/news/2025/nist-revises-sp-800-61) — incident response guide
- [CISA VDP template](https://www.cisa.gov/vulnerability-disclosure-policy-template)
- [GitHub security advisories docs](https://docs.github.com/en/code-security/security-advisories)
