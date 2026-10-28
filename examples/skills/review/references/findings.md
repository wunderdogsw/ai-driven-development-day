# Findings format

Every subagent returns its findings in this format, and nothing else. No summary, no praise.

```
- id: L2
  where: src/Api/Profile/ProfileService.cs:57
  kind: bug | security | performance | maintainability | logic | missing | extra | test | docs
  severity: blocking | non-blocking | nitpick
  claim: One sentence on what is wrong.
  evidence: The code lines, or the command and its output, that show it.
  ac: AC3            # if it is about an AC, else leave out
  confidence: high | medium | low
```

Rules:

- `where` is one file and one line (or a range like `57-63`). A finding without a place is not a finding.
- `evidence` is something the lead can check: quoted code, a test name and its result, a command and its output. "Looks wrong" is not evidence.
- One problem per finding. Two problems on the same line are two findings.
- `blocking` only when it breaks an AC, a "must never" rule, security, data, or a check.
- If you found nothing in your area, return `findings: []` and one line on what you checked.

The id prefix shows the source: `V` ac-verifier, `F` flow-verifier, `C` review-code, `L` review-logic, `E` review-fresh-eyes, `M` mechanical checks, `P` other reviewers already on the PR (CodeRabbit, Greptile, SonarCloud).
