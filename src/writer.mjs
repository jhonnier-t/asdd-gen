import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'

const GITHUB_DIR = '.github'

/**
 * Key prefix used by agents to place files at the project root instead of .github/.
 * e.g. 'ROOT:AGENTS.md' → written to <outputDir>/AGENTS.md
 */
const ROOT_PREFIX = 'ROOT:'

/**
 * Writes all generated ASDD files.
 *
 * File key conventions:
 *   'copilot-instructions.md'        → .github/copilot-instructions.md
 *   'agents/spec.agent.md'           → .github/agents/spec.agent.md
 *   'ROOT:AGENTS.md'                 → AGENTS.md  (project root)
 *   'ROOT:CHANGELOG.md'              → CHANGELOG.md (project root)
 *
 * @param {string} outputDir - Project root directory
 * @param {Record<string, string>} files - Map of key → file content
 * @returns {string[]} List of written paths relative to outputDir
 */
export async function writeGithubFolder(outputDir, files) {
  const written = []

  for (const [key, content] of Object.entries(files)) {
    if (!content || typeof content !== 'string') continue

    let fullPath
    let displayPath

    if (key.startsWith(ROOT_PREFIX)) {
      // Root-level files (AGENTS.md, CHANGELOG.md, etc.)
      const relativePath = key.slice(ROOT_PREFIX.length)
      fullPath = join(outputDir, relativePath)
      displayPath = relativePath
    } else {
      // .github/ files (default)
      fullPath = join(outputDir, GITHUB_DIR, key)
      displayPath = join(GITHUB_DIR, key)
    }

    // Create parent directories if needed
    mkdirSync(dirname(fullPath), { recursive: true })

    // Write file (overwrite if exists — re-generation is intentional)
    writeFileSync(fullPath, ensureTrailingNewline(content), 'utf8')

    written.push(displayPath)
  }

  return written
}

/**
 * Ensures the content ends with a single newline (POSIX convention).
 * @param {string} content
 * @returns {string}
 */
function ensureTrailingNewline(content) {
  return content.endsWith('\n') ? content : content + '\n'
}
