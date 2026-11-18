---
name: review-tests
description: Reviews test code to find brittle, flaky, and superficial tests, and tests that exist only to raise coverage. It checks each test by asking "would this fail if the code were broken?", first by reasoning about mutations and then, where it can, by actually mutating the code and running the test. Each test gets a verdict of keep, strengthen, rewrite, or delete. Use when the user asks to review, audit, or clean up tests, asks whether tests are any good, or mentions flaky or brittle tests, mutation testing, test smells, or coverage that doesn't catch bugs. Also use after a feature or fix lands with new tests.
metadata:
  category: testing
---

# Review Tests

A test is worth keeping only if it fails when the behavior it covers breaks, and stays green when that behavior holds. Everything in this skill comes back to that rule. A test that never fails is noise. A test that fails for reasons other than broken behavior costs money. A test that sometimes fails is worse than both.

This review hunts four kinds of bad test:

| Kind | What it does wrong | Main question |
| --- | --- | --- |
| **Superficial** | Passes even when the code is wrong | Would a plausible bug make this fail? |
| **Brittle** | Fails when the code is refactored but behavior hasn't changed | Is it pinned to *how* instead of *what*? |
| **Flaky** | Passes or fails with no code change | Does it depend on time, order, randomness, network, or shared state? |
| **Ceremonial** | Exists to raise coverage or tick a box, protects nothing | If we deleted it, what bug would slip through? |

Bias toward fewer, stronger tests. Recommending that a test be deleted is a normal outcome, not a failure of the review.

**Always ask before deleting a test.** Never remove a test, test file, or test case without the user's explicit confirmation, even when applying other fixes or when a deletion looks obvious. This includes indirect removal: merging tests, folding them into a parametrized test, or rewriting a test so the original case disappears. Show what will be removed and why, and wait for a yes.

## Scope

1. **Decide what to review.** Use what the user names (a file, folder, or PR). Otherwise review test files changed on the current branch against the base branch (`git diff --name-only <base>...HEAD`), plus existing tests for the same modules.
2. **Map each test to the production code it covers** through imports, calls, and naming. Note production code that changed on the branch but has no test touching it.
3. **Read the test first, then the code.** If you have to read the implementation to understand what a test checks, that's a finding in itself (the test doesn't state its intent).
4. **Learn the project's conventions** before judging: test framework, fixture style, how it mocks, whether a mutation tool is already configured. Recommend fixes that fit those conventions.

## Review passes

Run these in order. Passes 1 to 3 are reading only. Pass 4 changes code and runs tests, so follow its safety rules.

### Pass 1: Purpose (ceremonial tests)

For each test, write one sentence: "this protects against ___". If you can't fill the blank with a real bug a user or caller would notice, the test is ceremonial. Common shapes:

- Asserts only that something exists, is defined, is truthy, or didn't throw.
- Tests a constant, a type, a getter/setter with no logic, or the framework/library itself.
- Exercises code purely to light up coverage, with weak or no assertions.
- Duplicates another test with no new input class or branch.
- Snapshot of a large output nobody reads when it changes.

Verdict: **delete**, or **rewrite** if the code under it has real behavior worth protecting.

### Pass 2: Mental mutation (superficial tests)

This is mutation testing done by reasoning, and it's the core of the review. For each test, find the lines of production code it covers that matter (branches, comparisons, arithmetic, return values, side effects). For each one, apply the mutations in [references/mutation-operators.md](references/mutation-operators.md) in your head and ask whether any assertion would fail.

A mutant that would survive is a concrete finding: name the line, the mutation, and the assertion that would catch it. "Changing `>=` to `>` in `isEligible` (`src/rules.ts:42`) survives because no test uses the boundary age of 18" is useful. "Assertions could be stronger" is not.

Also check:

- **Assertion completeness.** Exact values instead of ranges or types. Side effects (what was written, sent, stored) and not just the return value. Error type *and* message, plus cleanup after the error.
- **Both sides of every decision.** List the conditionals, switches, early returns, and error handlers in the code under test. Each one needs a test that takes each path.
- **Edge cases.** Empty, null/None, zero, one, many, boundary values, unicode, very large inputs, where they apply.
- **Rotten green.** Assertions that never run: inside a loop over an empty list, in a callback that never fires, after an early return, in an un-awaited promise, or in a `try` whose `catch` swallows the failure.

### Pass 3: Coupling and determinism (brittle and flaky tests)

Use the catalogs in [references/smells.md](references/smells.md). The short version:

**Brittle:** mocks of internal collaborators the project owns; asserting call counts, call order, or private method calls; exact string or structural equality on output that has no contract (full error text, HTML, logs, serialized objects with incidental fields); large snapshots; reaching into private state; test names and structure that mirror the implementation's methods instead of behavior. Mock at architectural boundaries (network, clock, filesystem, third-party services), stub queries, and verify only commands with side effects that matter.

**Flaky:** real time and dates, sleeps and fixed waits, randomness without a seed, dependence on test order or shared mutable state, real network or external services, un-awaited async work and leaked timers, unordered collections compared as ordered, float equality, timezone/locale/environment assumptions, ports and temp paths that collide under parallel runs.

### Pass 4: Prove it (optional, run when possible)

Reasoning can be wrong. Prove the most important findings from pass 2 and pass 3 by running code. Do this for the highest-stakes code under review, not for everything.

**Ask before running this pass** if the suite is slow, needs external services, or the user only asked for a read-only review.

**Targeted manual mutation** (works in any language, no tooling needed):

1. Confirm the production file has no uncommitted changes (`git status --porcelain <file>` is empty). If it does, skip it. Never mutate a file the user is editing.
2. Make one small mutation from the operator list.
3. Run only the relevant test(s).
4. Restore the file right away with `git restore <file>`, before making any other change.
5. Record the result: **killed** (a test failed, good) or **survived** (all passed, which is a confirmed finding).

When you finish, run `git status` and confirm the tree is exactly as you found it.

**Mutation tool:** if the project already has one configured, or the user asks, run it scoped to the changed files and use survivors as findings. See [references/mutation-operators.md](references/mutation-operators.md#tools) for tools by language. Don't install a tool without asking. Treat the score as a signal, not a goal: aim for the important modules to kill nearly every non-equivalent mutant, and ignore equivalent mutants (changes that don't alter behavior).

**Flakiness check:** for tests flagged in pass 3, rerun them several times, in random order and in parallel if the framework supports it (for example `pytest -p randomly --count`, `vitest --sequence.shuffle`, `go test -count=N -shuffle=on`, `jest --randomize`). Any failure across reruns confirms the finding.

Mark each finding as **confirmed** (proven by a run) or **suspected** (reasoning only).

## Verdicts

Every test you looked at gets one of these:

- **Keep.** Protects real behavior, survives refactoring, deterministic.
- **Strengthen.** Right idea, weak assertions or missing cases. Add or tighten assertions.
- **Rewrite.** Protects something real but is brittle or flaky as written.
- **Delete.** Ceremonial, or fully duplicated by a better test. Say which test (if any) already covers it. This is a recommendation only. The test stays until the user confirms.

Also list **missing tests**: behavior in the code under review that no test protects, ordered by risk.

## Output

```markdown
## Test review: <scope>

**Summary:** <2–3 sentences: overall health, the biggest risk, how many tests to keep / strengthen / rewrite / delete>

### Blocking
Issues that let real bugs ship or make CI unreliable.

#### <short title> — <superficial | brittle | flaky | ceremonial> — <confirmed | suspected>
`path/to/test_file:line` → covers `path/to/source:line`
**Problem:** <what is wrong, stated as the bug that slips through or the false failure it causes>
**Evidence:** <the surviving mutant, the flaky rerun result, or the coupling that breaks on refactor>
**Fix:**
<before/after code, short>

### Should fix
<same format>

### Consider
<same format, shorter>

### Delete
| Test | Why | Covered elsewhere by |
| --- | --- | --- |

### Missing tests
| Behavior | Source | Risk |
| --- | --- | --- |

### Mutation results (if pass 4 ran)
| Location | Mutation | Result |
| --- | --- | --- |

**Verdict:** <Approve | Request changes | Needs discussion>
```

Every finding needs a `file:line`, the specific problem, and a concrete fix. Skip any section that has nothing in it. Don't pad the review with style nits. Naming and structure matter only when they hide what a test checks.

## Next steps

Unless you're running as a subagent (then return only the review), offer:

1. Walk through the findings one by one.
2. Apply the fixes, blocking first, running the tests after each change. Skip deletions and any fix that removes a test case; those go through step 3.
3. Delete the tests marked for deletion. List each test and its reason, and ask the user to confirm which ones to remove. Delete only the ones they approve.
4. Post the review as a PR comment.

If the user says "apply everything", still ask about deletions separately before removing anything.
