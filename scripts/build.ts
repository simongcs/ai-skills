#!/usr/bin/env node
/**
 * Validates every skill in skills/ and regenerates:
 *   - the skill index in README.md (between the skills-index markers)
 *   - .claude-plugin/marketplace.json
 *
 * Usage:
 *   node scripts/build.ts           write generated files
 *   node scripts/build.ts --check   exit 1 if generated files are out of date
 *
 * Requires Node 22.18+ (runs TypeScript directly). No dependencies.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");
const README = join(ROOT, "README.md");
const MARKETPLACE = join(ROOT, ".claude-plugin", "marketplace.json");

const MARKETPLACE_NAME = "simon-skills";
const OWNER_NAME = "simongcs";
const MARKETPLACE_DESCRIPTION = "Simon's personal collection of agent skills.";
const INDEX_START = "<!-- skills-index:start -->";
const INDEX_END = "<!-- skills-index:end -->";
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_DESC_IN_INDEX = 200;

interface Skill {
  dir: string;
  name: string;
  description: string;
  category: string;
}

/** Minimal frontmatter parser: top-level scalars, folded/literal blocks, one level of nesting. */
function parseFrontmatter(text: string): Record<string, unknown> {
  const match = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---(\n|$)/);
  if (!match) throw new Error("missing frontmatter (--- block at top of file)");
  const lines = match[1].split("\n");
  const unquote = (v: string) => v.trim().replace(/^(["'])(.*)\1$/, "$2");

  const result: Record<string, unknown> = {};
  let i = 0;

  // Reads indented continuation lines starting at i; returns them de-indented.
  const readBlock = (): string[] => {
    const block: string[] = [];
    while (i < lines.length && (lines[i].trim() === "" || /^\s+/.test(lines[i]))) {
      block.push(lines[i]);
      i++;
    }
    return block;
  };

  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    i++;
    if (!m) continue;
    const [, key, rawValue] = m;
    const value = rawValue.trim();

    if (/^[>|][+-]?$/.test(value)) {
      const block = readBlock().map((l) => l.trim());
      result[key] = value.startsWith(">")
        ? block.join(" ").replace(/\s+/g, " ").trim()
        : block.join("\n").trim();
    } else if (value === "") {
      const block = readBlock();
      const nested: Record<string, string> = {};
      for (const l of block) {
        const nm = l.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
        if (nm) nested[nm[1]] = unquote(nm[2]);
      }
      result[key] = nested;
    } else {
      result[key] = unquote(value);
      // plain scalars may continue on indented lines
      const rest = readBlock().map((l) => l.trim()).filter(Boolean);
      if (rest.length) result[key] = [result[key], ...rest].join(" ");
    }
  }
  return result;
}

function loadSkills(): { skills: Skill[]; errors: string[] } {
  const skills: Skill[] = [];
  const errors: string[] = [];
  if (!existsSync(SKILLS_DIR)) return { skills, errors };

  const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();

  for (const dir of dirs) {
    const file = join(SKILLS_DIR, dir, "SKILL.md");
    const where = `skills/${dir}/SKILL.md`;
    if (!existsSync(file)) {
      errors.push(`${where}: file not found`);
      continue;
    }
    let fm: Record<string, unknown>;
    try {
      fm = parseFrontmatter(readFileSync(file, "utf8"));
    } catch (e) {
      errors.push(`${where}: ${(e as Error).message}`);
      continue;
    }
    const name = typeof fm.name === "string" ? fm.name : "";
    const description = typeof fm.description === "string" ? fm.description : "";
    const metadata = (fm.metadata ?? {}) as Record<string, string>;

    if (!name) errors.push(`${where}: missing "name"`);
    else if (!NAME_RE.test(name)) errors.push(`${where}: name "${name}" must be lowercase letters, digits and hyphens`);
    else if (name !== dir) errors.push(`${where}: name "${name}" must match folder name "${dir}"`);
    else if (name === MARKETPLACE_NAME) errors.push(`${where}: name "${name}" collides with the bundle plugin name`);
    if (!description) errors.push(`${where}: missing "description"`);

    if (name && description) {
      skills.push({ dir, name, description, category: metadata.category?.trim() || "" });
    }
  }
  return { skills, errors };
}

function shorten(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > MAX_DESC_IN_INDEX ? `${flat.slice(0, MAX_DESC_IN_INDEX - 1).trimEnd()}…` : flat;
}

const cell = (s: string) => s.replace(/\|/g, "\\|");

function renderIndex(skills: Skill[]): string {
  if (skills.length === 0) return "_No skills yet._";
  const rows = skills.map(
    (s) => `| [\`${s.name}\`](skills/${s.dir}) | ${cell(shorten(s.description))} | ${s.category || "—"} |`,
  );
  return ["| Skill | Description | Category |", "| --- | --- | --- |", ...rows].join("\n");
}

function renderMarketplace(skills: Skill[]): string {
  const marketplace = {
    name: MARKETPLACE_NAME,
    description: MARKETPLACE_DESCRIPTION,
    owner: { name: OWNER_NAME },
    plugins: [
      {
        name: MARKETPLACE_NAME,
        source: "./",
        description: "Bundle: every skill in this repo",
      },
      ...skills.map((s) => ({
        name: s.name,
        source: "./",
        description: shorten(s.description),
        skills: [`./skills/${s.dir}`],
      })),
    ],
  };
  return `${JSON.stringify(marketplace, null, 2)}\n`;
}

function renderReadme(current: string, skills: Skill[]): string {
  const start = current.indexOf(INDEX_START);
  const end = current.indexOf(INDEX_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`README.md must contain ${INDEX_START} and ${INDEX_END}`);
  }
  return `${current.slice(0, start + INDEX_START.length)}\n${renderIndex(skills)}\n${current.slice(end)}`;
}

function main() {
  const check = process.argv.includes("--check");
  const { skills, errors } = loadSkills();
  if (errors.length) {
    console.error("Skill validation failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
    process.exit(1);
  }

  const outputs: [string, string][] = [
    [README, renderReadme(readFileSync(README, "utf8"), skills)],
    [MARKETPLACE, renderMarketplace(skills)],
  ];

  const stale = outputs.filter(([path, next]) => !existsSync(path) || readFileSync(path, "utf8") !== next);
  const rel = (p: string) => p.slice(ROOT.length + 1);

  if (check) {
    if (stale.length) {
      console.error(`Out of date: ${stale.map(([p]) => rel(p)).join(", ")}\nRun: node scripts/build.ts`);
      process.exit(1);
    }
    console.log(`OK: ${skills.length} skill(s), generated files are up to date.`);
    return;
  }

  for (const [path, next] of stale) {
    writeFileSync(path, next);
    console.log(`updated ${rel(path)}`);
  }
  console.log(`${skills.length} skill(s) indexed${stale.length ? "" : " (nothing changed)"}.`);
}

main();
