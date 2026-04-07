import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a senior DevOps engineer and TDD advocate.
Generate commit convention config files that enforce code quality and ASDD workflow conventions.
All configs must be cross-platform (Windows + Unix) and fast (fail fast).

Output format: Raw JS config file content only. No markdown fences or prose.`

/**
 * Generates commit convention config files.
 *
 * All files use ROOT: prefix (written to project root, not .github/).
 *
 * Produces:
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
  const lintCmd = detectLintCommand(stack)

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

  return {
    'ROOT:commitlint.config.mjs': commitlintConfig,
    'ROOT:lint-staged.config.mjs': lintStagedConfig,
  }
}

// ---------------------------------------------------------------------------
// Stack detection helpers
// ---------------------------------------------------------------------------

function detectPackageManager(ctx) {
  if (ctx.techStack.includes('bun')) return 'bun'
  const pkg = ctx.packageJson
  if (!pkg) return 'npm'
  if (pkg.packageManager?.startsWith('pnpm')) return 'pnpm'
  if (pkg.packageManager?.startsWith('yarn')) return 'yarn'
  if (pkg.packageManager?.startsWith('bun')) return 'bun'
  return 'npm'
}

function pkgManagerExec(pm) {
  return pm === 'npm' ? 'npx' : pm === 'bun' ? 'bunx' : pm
}

function detectLintCommand(stack) {
  if (stack.some((s) => s.includes('oxlint'))) return 'oxlint'
  if (stack.includes('typescript') || stack.includes('react') || stack.includes('vue'))
    return 'eslint'
  if (stack.includes('python')) return 'ruff check'
  return 'eslint'
}
