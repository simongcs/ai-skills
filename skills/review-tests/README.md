# review-tests

Reviews test code for brittle, flaky, superficial, and coverage-only tests, using mutation reasoning (and optional real mutation runs) to check that each test would fail if the code broke.

## Install

With `npx skills`:

```bash
npx skills add simongcs/ai-skills --skill review-tests
```

As a Claude Code plugin:

```text
/plugin install review-tests --marketplace simongcs/ai-skills
```
