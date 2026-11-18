# AGENTS.md

This repo is a personal collection of agent skills. It's published as a GitHub repo that `npx skills` can install from, and as a Claude Code plugin marketplace (`simon-skills`).

## Repository layout

```
├── skills/<skill-name>/SKILL.md     # one folder per skill (+ optional references/, scripts/, assets/)
├── templates/SKILL.template.md      # starting point for a new skill
├── scripts/build.ts                 # validates skills, regenerates the index and marketplace.json
├── .claude-plugin/marketplace.json  # generated, don't edit
└── .githooks/pre-commit             # runs the build on every commit
```

Generated files: the skill table in `README.md` (between the `skills-index` markers) and `.claude-plugin/marketplace.json`. They're built from each skill's `SKILL.md` frontmatter by `scripts/build.ts`. Never edit them by hand; change the skill and rerun the build.

## Adding a skill

1. One-time per clone, enable the commit hook:
   ```bash
   git config core.hooksPath .githooks
   ```
2. Create the skill from the template. The folder name must equal the `name` in the frontmatter:
   ```bash
   mkdir skills/my-skill
   cp templates/SKILL.template.md skills/my-skill/SKILL.md
   ```
3. Edit `skills/my-skill/SKILL.md`. Required frontmatter: `name` (lowercase letters, digits, hyphens) and `description`. Optional: `metadata.category`, used for the index.
4. Commit. The hook validates the skill and regenerates the README index and `marketplace.json`.

Run the build manually any time (needs Node 22.18+, no dependencies):

```bash
node scripts/build.ts          # regenerate
node scripts/build.ts --check  # verify nothing is stale
claude plugin validate .       # validate the marketplace (Claude Code CLI)
```


