/**
 * Agent Skills Loader
 *
 * Loads SKILL.md files from the skills/ directory and injects them into agent prompts.
 * Follows the Agent Skills specification (agentskills.io) with progressive disclosure:
 * 1. Discovery: Load name + description only
 * 2. Activation: Load full SKILL.md when task matches
 * 3. Execution: Follow instructions, execute bundled code
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface SkillMetadata {
  name: string;
  description: string;
  version: string;
  path: string;
}

export interface Skill extends SkillMetadata {
  content: string;
  instructions: string;
}

// ═══════════════════════════════════════════════════════════
// SKILL DISCOVERY
// ═══════════════════════════════════════════════════════════

const SKILLS_DIR = join(process.cwd(), "skills");

let discoveredSkills: SkillMetadata[] | null = null;

function parseSkillMetadata(content: string, skillPath: string): SkillMetadata | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  const versionMatch = frontmatter.match(/^version:\s*(.+)$/m);

  if (!nameMatch || !descMatch) return null;

  return {
    name: nameMatch[1].trim().replace(/^["']|["']$/g, ""),
    description: descMatch[1].trim().replace(/^["']|["']$/g, ""),
    version: versionMatch?.[1]?.trim().replace(/^["']|["']$/g, "") || "1.0.0",
    path: skillPath,
  };
}

function extractInstructions(content: string): string {
  // Remove frontmatter, keep instructions
  return content.replace(/^---\n[\s\S]*?\n---\n*/, "").trim();
}

export function discoverSkills(): SkillMetadata[] {
  if (discoveredSkills) return discoveredSkills;

  if (!existsSync(SKILLS_DIR)) {
    discoveredSkills = [];
    return discoveredSkills;
  }

  const skills: SkillMetadata[] = [];
  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillFile = join(SKILLS_DIR, entry.name, "SKILL.md");
    if (!existsSync(skillFile)) continue;

    try {
      const content = readFileSync(skillFile, "utf-8");
      const metadata = parseSkillMetadata(content, skillFile);
      if (metadata) skills.push(metadata);
    } catch {
      // Skip invalid skill files
    }
  }

  discoveredSkills = skills;
  return skills;
}

// ═══════════════════════════════════════════════════════════
// SKILL ACTIVATION
// ═══════════════════════════════════════════════════════════

export function loadSkill(skillName: string): Skill | null {
  const skills = discoverSkills();
  const metadata = skills.find((s) => s.name === skillName);
  if (!metadata) return null;

  try {
    const content = readFileSync(metadata.path, "utf-8");
    const instructions = extractInstructions(content);

    return {
      ...metadata,
      content,
      instructions,
    };
  } catch {
    return null;
  }
}

export function loadAllSkills(): Skill[] {
  const skills = discoverSkills();
  return skills
    .map((metadata) => {
      try {
        const content = readFileSync(metadata.path, "utf-8");
        const instructions = extractInstructions(content);
        return { ...metadata, content, instructions };
      } catch {
        return null;
      }
    })
    .filter((s): s is Skill => s !== null);
}

// ═══════════════════════════════════════════════════════════
// SKILL MATCHING
// ═══════════════════════════════════════════════════════════

export function findMatchingSkills(taskDescription: string): Skill[] {
  const allSkills = loadAllSkills();
  const lower = taskDescription.toLowerCase();

  return allSkills.filter((skill) => {
    const keywords = skill.name.split("-");
    return keywords.some((kw) => lower.includes(kw));
  });
}

// ═══════════════════════════════════════════════════════════
// PROMPT ENRICHMENT
// ═══════════════════════════════════════════════════════════

/**
 * Enriches an agent's system prompt with the relevant skill instructions.
 * This is the "activation" step — full instructions loaded into context.
 */
export function enrichPromptWithSkills(
  basePrompt: string,
  agentRole: string,
  domain?: string
): string {
  // Map agent roles to skill names
  const roleToSkill: Record<string, string> = {
    "Product Manager": "product-manager",
    "Frontend Engineer": "frontend-engineer",
    "QA Engineer": "qa-engineer",
    "SEO Specialist": "seo-specialist",
    "Design System": "design-system",
    "Security Agent": "security-agent",
    "Performance Agent": "performance-agent",
    "Conversion Optimizer": "conversion-optimizer",
  };

  const skillName = roleToSkill[agentRole];
  if (!skillName) return basePrompt;

  const skill = loadSkill(skillName);
  if (!skill) return basePrompt;

  return `${basePrompt}

---

## SKILL INSTRUCTIONS (${skill.name} v${skill.version})

${skill.instructions}

---

Follow the above skill instructions as your primary workflow. Use the base prompt as context, but the skill instructions define your exact process and output format.`;
}

/**
 * Get skill summary for discovery (lightweight, no full content loaded)
 */
export function getSkillSummaries(): Array<{ name: string; description: string }> {
  return discoverSkills().map((s) => ({
    name: s.name,
    description: s.description,
  }));
}
