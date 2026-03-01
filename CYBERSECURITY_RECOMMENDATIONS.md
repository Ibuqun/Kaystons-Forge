# Cybersecurity Recommendations for Kayston's Forge

## 1) What is the "highest cybersecurity badge"?

There is no single universal cybersecurity badge for all products. The highest-recognized target depends on your market:

- **If you want U.S. federal adoption:** the highest practical bar is **FedRAMP High Authorization**.
- **If you want broad commercial trust:** the most recognized cert is **ISO/IEC 27001 certification** (often paired with SOC 2 Type II in practice).

For this product (static, browser-based tool suite), FedRAMP High is likely overkill unless federal customers are a core go-to-market target.

## 2) Official best-practice recommendations (highest authorities)

### A. NIST CSF 2.0 as governance backbone
- Use CSF 2.0 as your top-level risk and governance framework (Govern, Identify, Protect, Detect, Respond, Recover).
- Build a lightweight profile for this app and track maturity by function.

Why: NIST states CSF 2.0 is usable by any org size/sector and is designed for risk management outcomes.

### B. NIST SSDF (SP 800-218) for secure software lifecycle
- Implement SSDF practices for secure design, implementation, testing, release, and vulnerability response.
- Use it as your SDLC standard for code changes and releases.

Why: SSDF explicitly targets reducing vulnerabilities and root causes.

### C. NIST SP 800-53 (latest release line) for control depth
- Use SP 800-53 controls as a control catalog for policies/technical safeguards.
- Tailor controls to your app size and architecture (client-side static app, no backend processing).

### D. Incident response model: NIST SP 800-61r3
- Create an incident response plan even pre-revenue.
- Include disclosure workflow, triage SLA, communication templates, and recovery steps.

### E. Vulnerability disclosure policy + security.txt
- Publish a VDP and add `.well-known/security.txt` (RFC 9116).
- Provide clear scope, authorized testing behavior, and response timeline.

### F. Supply-chain transparency
- Generate and publish SBOM for releases.
- Track high-risk vulnerabilities with CISA KEV and prioritize patching.

### G. If pursuing federal "badge"
- FedRAMP defines Low/Moderate/High impact levels; High is for severe/catastrophic impact systems.
- FedRAMP requires independent assessment; Moderate/High include an announced penetration test by a recognized 3PAO.

## 3) What you can implement now (pre-revenue) and trade-offs

## Do now (high value, low cost)

1. **Security headers + strict CSP**
- Add CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`.
- Keep `iframe` sandbox tight for previews.
- **Trade-off:** stricter CSP can break current preview/tool behavior; needs iterative tuning.

2. **CI security gates**
- Add dependency scanning (`npm audit`, Dependabot), secret scanning, SAST (CodeQL/Semgrep), and license checks.
- Block merges on critical findings.
- **Trade-off:** more CI noise, occasional false positives, slower merges.

3. **Parser hardening + fuzz tests**
- Add fuzz/property tests for all transformation tools (JSON, YAML, CSV, XML, regex, JWT, cert decode, PHP serialize).
- Add resource ceilings (input size/timeouts) where feasible.
- **Trade-off:** additional test maintenance and occasional test flakiness.

4. **VDP + security.txt**
- Publish `/vulnerability-disclosure-policy` and `/.well-known/security.txt`.
- **Trade-off:** increases inbound reports you must triage responsibly.

5. **SBOM per release**
- Produce CycloneDX/SPDX SBOM in CI and attach to releases.
- **Trade-off:** minor pipeline complexity and artifact management overhead.

6. **Release hygiene**
- Signed commits/tags, reproducible builds where possible, lockfile discipline, branch protections.
- **Trade-off:** tighter process and slower "quick fixes."

7. **Minimal IR playbook**
- Triage severity matrix, owner rotation, hotfix process, and disclosure templates.
- **Trade-off:** process overhead for a small team.

## Probably later (costly for pre-revenue)

1. **Annual external penetration test**
- Strongly recommended before enterprise sales.
- **Trade-off:** direct cost and remediation workload.

2. **ISO/IEC 27001 certification**
- Valuable trust signal for enterprise procurement.
- **Trade-off:** audit and compliance costs; requires formal ISMS processes.

3. **FedRAMP High**
- Only if federal market is your primary target.
- **Trade-off:** very high compliance/assessment/documentation burden and long timelines.

## 4) Cybersecurity testing a security engineer should perform on this product

### A. Architecture and design assurance
1. Threat modeling (STRIDE) for all tool flows (input parsing, preview rendering, service worker, local storage/history).
2. Abuse-case modeling for malicious payloads and browser resource exhaustion.

### B. Static and composition analysis
1. SAST on TypeScript/React codebase.
2. SCA for npm dependencies and transitive risk.
3. Secret scanning for repository and CI logs.
4. License/compliance scanning.

### C. Dynamic and browser security testing
1. DAST against deployed static app.
2. DOM XSS and sanitizer bypass testing in preview/rendering tools.
3. CSP validation and bypass attempts.
4. Clickjacking and iframe isolation tests.
5. Service worker security review (scope, cache poisoning, stale asset handling).

### D. Tool-specific robustness testing
1. Fuzzing/parsing tests for JSON/YAML/CSV/XML/PHP/JWT/certificate tools.
2. Regex ReDoS and large-input stress tests.
3. Deterministic round-trip and mutation tests (encode/decode fidelity).
4. Unicode/encoding edge cases (UTF-8, surrogate pairs, normalization).

### E. Operational testing
1. Vulnerability management drill: detection-to-fix SLA exercise.
2. Incident response tabletop (public report, triage, disclosure, patch, postmortem).
3. Supply-chain compromise simulation (malicious dependency/update scenario).

## 5) Suggested implementation phases

### Phase 1 (0-30 days)
- Security headers/CSP hardening
- VDP + security.txt
- CI gates (SAST/SCA/secrets)
- Parser fuzz test harness for highest-risk tools

### Phase 2 (30-90 days)
- SBOM automation
- Deeper DAST + manual appsec testing
- Incident response runbook and drills

### Phase 3 (90+ days)
- External pentest
- ISO 27001 readiness work
- FedRAMP exploration only if federal market justifies it

## 6) References (official/primary)

- NIST CSF 2.0 (published Feb 26, 2024): https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20
- NIST SP 800-218 SSDF v1.1: https://csrc.nist.gov/pubs/sp/800/218/final
- NIST SP 800-53 updates (Release 5.2.0 announcement, Aug 27, 2025): https://csrc.nist.gov/News/2025/nist-releases-revision-to-sp-800-53-controls
- NIST SP 800-61r3 incident response update (Apr 3, 2025): https://csrc.nist.gov/news/2025/nist-revises-sp-800-61
- NIST SP 800-115 testing guide: https://csrc.nist.gov/pubs/sp/800/115/final
- CISA Secure by Design Pledge: https://www.cisa.gov/securebydesign/pledge
- CISA VDP template: https://www.cisa.gov/vulnerability-disclosure-policy-template
- RFC 9116 (security.txt): https://www.rfc-editor.org/rfc/rfc9116
- CISA SBOM page: https://www.cisa.gov/sbom
- CISA KEV catalog: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
- FedRAMP impact levels and baselines: https://www.fedramp.gov/docs/rev5/playbook/csp/authorization/considerations/
- FedRAMP pen test requirement (Moderate/High): https://help.fedramp.gov/hc/en-us/articles/27706529836315-Is-a-penetration-test-required-for-FedRAMP-authorization
- ISO/IEC 27001 overview: https://www.iso.org/standard/54534.html
- ISO certification guidance: https://www.iso.org/certification.html

