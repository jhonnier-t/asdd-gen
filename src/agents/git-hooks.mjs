import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a senior DevOps engineer and TDD advocate.
Generate git hooks using Husky that enforce code quality and ASDD workflow conventions
at commit time. All hooks must be cross-platform (Windows + Unix) and fast (fail fast).

Output format: Raw shell script or config file content only. No markdown fences or prose.`

/**
 * Generates git hooks and commit convention config files.
 *
 * All files use ROOT: prefix (written to project root, not .github/).
 *
 * Produces:
 *   ROOT:.husky/pre-commit       — lint-staged (lint + type-check)
 *   ROOT:.husky/commit-msg       — commitlint (Conventional Commits)
 *   ROOT:.husky/pre-push         — full test suite before push
 *   ROOT:commitlint.config.mjs   — commitlint configuration
 *   ROOT:lint-staged.config.mjs  — lint-staged per-filetype rules
 *
 * @param {object} params
 * @returns {Promise<Record<string, string>>}
 */
export async function runGitHooksAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)
  const stack = ctx.techStack

  // Detect package manager
  const pkgManager = detectPackageManager(ctx)
  const testCmd = detectTestCommand(stack)
  const lintCmd = detectLintCommand(stack)
  const typeCheckCmd = detectTypeCheckCommand(stack)

  const [commitlintConfig, lintStagedConfig] = await Promise.all([
    // commitlint.config.mjs — LLM for project-specific scopes
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate \`commitlint.config.mjs\` — a commitlint configuration using Conventional Commits.

The file must use ES module syntax (export default {}).
Base: @commitlint/config-conventional

Customize the \`scope-enum\` rule to list the actual scopes for this project.
Infer scopes from the file tree and tech stack (${stack.join(', ') || 'generic'}).
Examples of scopes: auth, api, ui, db, core, config, docs, deps, ci, etc.

Rules to enforce:
- type-enum: feat | fix | docs | style | refactor | perf | test | chore | ci | build | revert
- subject-case: lower-case
- subject-max-length: 72
- body-max-line-length: 100
- footer-max-line-length: 100
- header-max-length: 72

Also enforce the ASDD TDD rule:
- If type is "feat", the commit message SHOULD reference a test file or prior test commit
  Add a custom plugin or note in comments (commitlint doesn't natively do this — note it as a comment)

Output ONLY the JS file content, no markdown fences.
`,
        },
      ],
    }),

    // lint-staged.config.mjs — LLM for stack-specific rules
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate \`lint-staged.config.mjs\` — lint-staged configuration for pre-commit checks.

The file must use ES module syntax (export default {}).
Tailor the rules to the detected tech stack: ${stack.join(', ') || 'generic'}

For each file pattern, run the appropriate tools:
- TypeScript/JavaScript files: run linter (${lintCmd}) + formatter check
- Python files (if any): run ruff or flake8 + black --check
- Markdown files: run markdownlint or prettier --check
- JSON/YAML files: run prettier --check
- Test files: do NOT run tests in lint-staged (tests go in pre-push, not pre-commit)
- SQL migration files: run a schema validation check if available

Keep the checks FAST (< 10 seconds on typical files):
- Use --cache flags where available
- Only check staged files, not the whole project
- Skip type-checking in lint-staged (too slow — put it in pre-push)

Output ONLY the JS file content, no markdown fences.
`,
        },
      ],
    }),
  ])

  // Hooks are deterministic based on detected tools — no LLM needed
  const preCommit = generatePreCommitHook(pkgManager)
  const commitMsg = generateCommitMsgHook(pkgManager)
  const prePush = generatePrePushHook(pkgManager, testCmd, typeCheckCmd)

  return {
    'ROOT:.husky/pre-commit': preCommit,
    'ROOT:.husky/commit-msg': commitMsg,
    'ROOT:.husky/pre-push': prePush,
    'ROOT:commitlint.config.mjs': commitlintConfig,
    'ROOT:lint-staged.config.mjs': lintStagedConfig,
  }
}

// ---------------------------------------------------------------------------
// Deterministic generators (no LLM cost)
// ---------------------------------------------------------------------------

function generatePreCommitHook(pkgManager) {
  const exec = pkgManagerExec(pkgManager)
  return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged: formats and lints only staged files
${exec} lint-staged
`
}

function generateCommitMsgHook(pkgManager) {
  const exec = pkgManagerExec(pkgManager)
  return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message follows Conventional Commits (ASDD requirement)
${exec} commitlint --edit "$1"
`
}

function generatePrePushHook(pkgManager, testCmd, typeCheckCmd) {
  const exec = pkgManagerExec(pkgManager)
  const lines = [
    '#!/usr/bin/env sh',
    '. "$(dirname -- "$0")/_/husky.sh"',
    '',
    '# ASDD pre-push gate: type-check + full test suite must pass before pushing',
    '',
  ]

  if (typeCheckCmd) {
    lines.push(`# Type checking`)
    lines.push(`${exec} ${typeCheckCmd}`)
    lines.push('')
  }

  if (testCmd) {
    lines.push(`# Full test suite`)
    lines.push(`${exec} ${testCmd}`)
    lines.push('')
  } else {
    lines.push('# Add your test command here')
    lines.push('# npm test')
    lines.push('')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Stack detection helpers
// ---------------------------------------------------------------------------

function detectPackageManager(ctx) {
  if (ctx.techStack.includes('bun')) return 'bun'
  const pkg = ctx.packageJson
  if (!pkg) return 'npm'
  // Check packageManager field
  if (pkg.packageManager?.startsWith('pnpm')) return 'pnpm'
  if (pkg.packageManager?.startsWith('yarn')) return 'yarn'
  if (pkg.packageManager?.startsWith('bun')) return 'bun'
  return 'npm'
}

function pkgManagerExec(pm) {
  return pm === 'npm' ? 'npx' : pm === 'bun' ? 'bunx' : pm
}

function detectTestCommand(stack) {
  if (stack.includes('vitest')) return 'vitest run'
  if (stack.includes('jest')) return 'jest --passWithNoTests'
  if (stack.includes('playwright')) return 'playwright test'
  if (stack.includes('python')) return 'pytest'
  return null
}

function detectLintCommand(stack) {
  if (stack.some((s) => s.includes('oxlint'))) return 'oxlint'
  if (stack.includes('typescript') || stack.includes('react') || stack.includes('vue'))
    return 'eslint'
  if (stack.includes('python')) return 'ruff check'
  return 'eslint'
}

function detectTypeCheckCommand(stack) {
  if (stack.includes('typescript')) return 'tsc --noEmit'
  return null
}
