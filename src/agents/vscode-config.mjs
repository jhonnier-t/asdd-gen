import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a VS Code and GitHub Copilot configuration expert.
Generate VS Code workspace settings and extension recommendations that optimize
the AI agent development experience — specifically for GitHub Copilot agent mode,
ASDD workflows, and the project's tech stack.

Output format: Valid JSON only. No markdown fences or prose.`

/**
 * Generates VS Code workspace configuration files that optimize
 * Copilot agent mode and the ASDD development experience.
 *
 * All files use ROOT: prefix (written to .vscode/ at project root).
 *
 * Produces:
 *   ROOT:.vscode/settings.json     — Copilot agent mode + editor settings
 *   ROOT:.vscode/extensions.json   — recommended extensions for this stack
 *
 * @param {object} params
 * @returns {Promise<Record<string, string>>}
 */
export async function runVscodeConfigAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)
  const stack = ctx.techStack

  const [settings, extensions] = await Promise.all([
    // settings.json
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate \`.vscode/settings.json\` — VS Code workspace settings that optimize the
GitHub Copilot agent mode + ASDD workflow experience for this project.

Required settings (must be included exactly):
- "github.copilot.chat.agent.enabled": true
- "github.copilot.chat.agent.runTasks": true
- "github.copilot.chat.experimental.agent.enabled": true
- "github.copilot.nextEditSuggestions.enabled": true
- "github.copilot.chat.generateTests.codeLens": true
- "github.copilot.chat.useProjectTemplates": true
- "chat.agent.maxRequests": 50

File-nesting rules (to keep the workspace clean):
Include "explorer.fileNesting.enabled": true and "explorer.fileNesting.patterns"
that nest related files together based on the detected stack (${stack.join(', ') || 'generic'}):
- e.g. *.ts nests *.js, *.d.ts, *.js.map
- e.g. package.json nests package-lock.json, pnpm-lock.yaml, yarn.lock, bun.lock, .nvmrc, .npmrc
- e.g. *.test.ts nests *.test.js
- e.g. tsconfig.json nests tsconfig.*.json
- e.g. .env nests .env.*, .env.example

Editor quality settings appropriate for this stack:
- formatOnSave: true
- codeActionsOnSave: fix ESLint/Ruff issues automatically
- defaultFormatter for each language detected in the stack
- trimTrailingWhitespace, insertFinalNewline: true
- rulers at 80 and 120

Search exclusions:
- exclude node_modules, dist, build, .next, .nuxt, coverage, .turbo from search

Output ONLY valid JSON, no markdown fences.
`,
        },
      ],
    }),

    // extensions.json
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate \`.vscode/extensions.json\` — VS Code extension recommendations for this project.

Output a valid JSON object with a single "recommendations" array of extension IDs.

Always include (required for ASDD agent workflow):
- "github.copilot"
- "github.copilot-chat"
- "eamodio.gitlens"
- "mhutchie.git-graph"

Include based on the detected tech stack (${stack.join(', ') || 'generic'}):

TypeScript/JavaScript:
- "dbaeumer.vscode-eslint"
- "esbenp.prettier-vscode"
- "bradlc.vscode-tailwindcss" (if tailwind detected)
- "prisma.prisma" (if prisma detected)

React/Next.js:
- "dsznajder.es7-react-js-snippets"

Vue:
- "vue.volar"

Testing:
- "vitest.explorer" (if vitest)
- "orta.vscode-jest" (if jest)
- "ms-playwright.playwright" (if playwright)

Python:
- "ms-python.python"
- "ms-python.vscode-pylance"
- "charliermarsh.ruff"

General developer experience:
- "usernamehw.errorlens"
- "gruntfuggly.todo-tree"
- "christian-kohler.path-intellisense"
- "wayou.vscode-todo-highlight"
- "streetsidesoftware.code-spell-checker"

Output ONLY valid JSON, no markdown fences.
`,
        },
      ],
    }),
  ])

  return {
    'ROOT:.vscode/settings.json': sanitizeJson(settings, defaultSettings()),
    'ROOT:.vscode/extensions.json': sanitizeJson(extensions, defaultExtensions()),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strips markdown fences if the LLM wrapped the JSON despite instructions.
 * Falls back to the default value if parsing fails.
 * @param {string} raw
 * @param {object} fallback
 * @returns {string}
 */
function sanitizeJson(raw, fallback) {
  const stripped = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  try {
    JSON.parse(stripped)
    return stripped
  } catch {
    return JSON.stringify(fallback, null, 2)
  }
}

function defaultSettings() {
  return {
    'github.copilot.chat.agent.enabled': true,
    'github.copilot.chat.agent.runTasks': true,
    'github.copilot.nextEditSuggestions.enabled': true,
    'github.copilot.chat.generateTests.codeLens': true,
    'github.copilot.chat.useProjectTemplates': true,
    'chat.agent.maxRequests': 50,
    'editor.formatOnSave': true,
    'editor.trimAutoWhitespace': true,
    'files.trimTrailingWhitespace': true,
    'files.insertFinalNewline': true,
    'explorer.fileNesting.enabled': true,
    'explorer.fileNesting.patterns': {
      'package.json': 'package-lock.json, pnpm-lock.yaml, yarn.lock, bun.lock, .npmrc, .nvmrc',
      'tsconfig.json': 'tsconfig.*.json, jsconfig.json',
      '.env': '.env.*, .env.example',
      '*.ts': '${capture}.js, ${capture}.d.ts, ${capture}.js.map',
      '*.test.ts': '${capture}.test.js',
    },
    'search.exclude': {
      '**/node_modules': true,
      '**/dist': true,
      '**/build': true,
      '**/.next': true,
      '**/.nuxt': true,
      '**/coverage': true,
      '**/.turbo': true,
    },
  }
}

function defaultExtensions() {
  return {
    recommendations: [
      'github.copilot',
      'github.copilot-chat',
      'eamodio.gitlens',
      'mhutchie.git-graph',
      'dbaeumer.vscode-eslint',
      'esbenp.prettier-vscode',
      'usernamehw.errorlens',
      'gruntfuggly.todo-tree',
      'christian-kohler.path-intellisense',
      'streetsidesoftware.code-spell-checker',
    ],
  }
}
