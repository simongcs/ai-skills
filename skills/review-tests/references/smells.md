# Test smells

Catalogs for pass 1 and pass 3. Each entry gives the signal to look for and the usual fix.

## Superficial and ceremonial

| Smell | Signal | Fix |
| --- | --- | --- |
| Existence check | `toBeDefined()`, `assert x is not None`, `assert result` as the only assertion | Assert the exact expected value |
| No-throw only | Test passes as long as nothing throws | Assert the outcome too |
| Range instead of value | `> 0`, `toBeTruthy()`, `len(x) > 0` where the value is known | Assert the exact value |
| Coverage tourism | Calls code with no meaningful assertion | Delete, or assert the behavior |
| Testing the framework | Checks that the ORM saves, the router routes, or the language works | Delete |
| Trivial code | Getters, setters, constants, type definitions, pass-through wrappers | Delete unless they hold logic |
| Tautology | Expected value computed with the same code under test | Hardcode the expected value |
| Mock echo | Asserts the value a stub was told to return | Assert what the code *does* with it |
| Rotten green | Assertion inside an empty loop, unfired callback, swallowed `catch`, or un-awaited promise | Make the assertion reachable, and assert assertion counts where the framework allows it |
| Duplicate | Same input class and path as another test | Delete one, or parametrize |
| Lazy test | Many tests checking one trivial thing each | Merge into one behavior test |
| Snapshot dump | Large snapshot updated by reflex | Assert the few fields that matter |

## Brittle

| Smell | Signal | Fix |
| --- | --- | --- |
| Implementation mirror | Test structure copies method structure; renaming a private function breaks tests | Test through the public interface |
| Over-mocking | Mocks internal classes the project owns; four or more mocks in one test | Use real collaborators; mock only at boundaries |
| Interaction obsession | Asserts call counts, call order, or exact arguments to internal calls | Assert the resulting state or output |
| Private access | Reads private fields, uses reflection, or monkeypatches internals | Assert through public behavior |
| Sensitive equality | Exact match on full error text, HTML, logs, `toString`, or serialized objects | Match the meaningful part (code, key field, pattern) |
| Mystery guest | Depends on a file, env var, DB row, or fixture defined far away | Make the input visible in the test |
| Overspecified setup | Huge arrange block, most of it irrelevant | Use a builder/factory with defaults; set only what matters |
| Eager test | Several act phases in one test | Split into one behavior per test |
| Conditional logic | `if`/loops in the test body | Parametrize, or split |

## Flaky

| Smell | Signal | Fix |
| --- | --- | --- |
| Real clock | `Date.now()`, `datetime.now()`, `time.Now()`, date math near midnight or month end | Inject or freeze the clock |
| Sleepy test | `sleep`, `setTimeout`, fixed waits | Wait on a condition or event; use fake timers |
| Unseeded random | `Math.random`, `random`, `uuid` in assertions | Seed it, or assert properties instead of values |
| Order dependence | Passes alone and fails in the suite, or the reverse; module-level mutable state | Isolate state; reset in setup/teardown |
| Shared resources | Same DB rows, temp file paths, ports, or global singletons across tests | Unique names per test, transactions, ephemeral ports |
| Real network | HTTP calls to real services, DNS, external APIs | Stub at the HTTP boundary, or use a local fake |
| Async leaks | Un-awaited promises, unclosed goroutines, timers or handles left open | Await everything; assert cleanup |
| Unordered compare | Set, dict, map, or DB rows without `ORDER BY` compared as a list | Sort first, or compare as a set |
| Float equality | `==` on computed floats | Use an approximate comparison with a tolerance |
| Environment | Depends on timezone, locale, OS path separator, CPU count, or env vars | Pin them in the test, or inject |
| Race | Concurrency with no synchronization in test or code | Synchronize deterministically; run with the race detector |
| Retry masking | `retry(3)` or `flaky` markers on tests | Find and fix the cause, then remove the retry |

## Readability (only when it hides intent)

- **Name describes the mechanism, not the behavior:** `test_process_2`, `calls_validate` → `rejects_expired_card`.
- **Assertion roulette:** many unlabelled assertions where a failure doesn't say which behavior broke.
- **Assertions hidden in helpers:** the test body doesn't show what is being checked.
- **Print or log statements** left in tests instead of assertions.
