# simon-skills

My personal collection of [agent skills](https://docs.claude.com/en/docs/claude-code/skills): versioned in git, installable on any machine.

## Skills

<!-- skills-index:start -->
_No skills yet._
<!-- skills-index:end -->

## Install

Two ways, pick whichever fits the machine.

### A. With `npx skills` (works with Claude Code, Codex, Cursor and others)

Requires Node.js 22.20+.

```bash
# See what's available
npx skills add simongcs/ai-skills --list

# Install one skill, globally, for Claude Code
npx skills add simongcs/ai-skills --skill <skill-name> -g -a claude-code

# Install every skill, globally, for all detected agents
npx skills add simongcs/ai-skills --all -g

# Install into the current project only (omit -g)
npx skills add simongcs/ai-skills --skill <skill-name>
```

Manage them later:

```bash
npx skills list                 # what's installed
npx skills check                # report available updates
npx skills update               # update everything
npx skills update <skill-name>  # update one
npx skills remove <skill-name>  # uninstall
```

### B. As a Claude Code plugin

Add the marketplace once (inside Claude Code):

```text
/plugin marketplace add simongcs/ai-skills
```

Then install **either** the bundle **or** individual skills. Don't mix them, or you'll get duplicates.

```text
# Everything in this repo
/plugin install simon-skills@simon-skills

# Or just one skill
/plugin install <skill-name>@simon-skills

# Or add the marketplace and install in one step (Claude Code 2.1.275+)
/plugin install <skill-name> --marketplace simongcs/ai-skills
```

Skills show up namespaced, e.g. `/simon-skills:<skill-name>`; the bare `/<skill-name>` also works.

To update, run `/plugin marketplace update simon-skills`, or enable auto-update in `/plugin` → Marketplaces (it's off by default for third-party marketplaces).

## Versioning

Git history is the record. The marketplace deliberately has no `version` field, so Claude Code users receive every new commit. Tag a commit (`git tag v1.0.0`) if you want a point to pin to: `/plugin marketplace add simongcs/ai-skills#v1.0.0`.

## License

[MIT](LICENSE)
