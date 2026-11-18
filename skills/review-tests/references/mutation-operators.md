# Mutation operators

Use these in pass 2 (in your head) and pass 4 (for real). Pick the ones that apply to the line. A good test suite kills each of these on every line that matters.

| Operator | Original | Mutants | Catches tests that miss… |
| --- | --- | --- | --- |
| Relational boundary | `a > b` | `a >= b`, `a < b` | off-by-one, untested boundaries |
| Equality | `a == b` | `a != b` | one side of a branch never tested |
| Arithmetic | `a + b` | `a - b`, `a * b` | exact value never asserted |
| Logical | `a && b` | `a \|\| b`, `a`, `b` | conditions tested only all-true or all-false |
| Negation | `if (x)` | `if (!x)` | branch never taken |
| Boolean literal | `true` | `false` | flag behavior never checked |
| Constant | `limit = 10` | `9`, `11`, `0` | limits and defaults never checked |
| Return value | `return x` | `return null`, `return 0`, `return ""`, `return []` | return value never asserted |
| Remove call | `save(user)` | *(deleted)* | side effect never asserted |
| Remove branch | `if (c) { … }` | `{ … }` always, or never | branch outcome never asserted |
| Remove throw | `throw new Error(...)` | *(deleted)* | error path never tested |
| Argument | `f(a, b)` | `f(b, a)`, `f(a, default)` | arguments forwarded wrong |
| Collection | `items.filter(p)` | `items` | filtering/sorting never checked |
| Increment | `i++` | `i--`, *(deleted)* | loop counts never checked |
| String | `"admin"` | `""` | message or key content never checked |

**Equivalent mutants** change the code without changing behavior (for example, `>=` vs `>` where the equal case can't happen). Don't report them as findings.

## Tools

Use a tool only if the project already has it configured or the user agrees to add it. Scope runs to the changed files to keep them fast.

| Language | Tool | Scoped run (example) |
| --- | --- | --- |
| JavaScript / TypeScript | Stryker | `npx stryker run --mutate "src/rules/**/*.ts" --incremental` |
| Python | mutmut | `mutmut run --paths-to-mutate src/rules.py`, then `mutmut results` and `mutmut show <id>` |
| Python | cosmic-ray | `cosmic-ray init config.toml session.sqlite && cosmic-ray exec config.toml session.sqlite` |
| Java / Kotlin | PIT | `mvn org.pitest:pitest-maven:mutationCoverage -DtargetClasses=com.app.rules.*` |
| Rust | cargo-mutants | `cargo mutants --file src/rules.rs` |
| Go | gremlins | `gremlins unleash ./internal/rules` |
| C# | Stryker.NET | `dotnet stryker --mutate "**/Rules/*.cs"` |
| PHP | Infection | `infection --filter=src/Rules` |
| Ruby | mutant | `bundle exec mutant run --use rspec 'App::Rules*'` |

Check each tool's current docs for exact flags. Look at surviving mutants one by one. Each survivor is either a missing or weak assertion (a finding), or an equivalent mutant (ignore it).
