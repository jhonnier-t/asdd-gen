export { commitlintConfig, lintStagedConfig, vscodeSettings, vscodeExtensions }

// Tooling configuration files (commitlint, lint-staged, vscode)

function commitlintConfig() {
  return `/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'test', 'docs', 'refactor', 'chore', 'perf', 'ci', 'build', 'revert'],
    ],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 200],
  },
}
`
}

function lintStagedConfig() {
  return `/** @type {import('lint-staged').Configuration} */
export default {
  // TypeScript / JavaScript
  '*.{ts,tsx,mts,cts}': ['tsc --noEmit'],
  '*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}': ['eslint --fix', 'prettier --write'],

  // Styles
  '*.{css,scss,sass}': ['prettier --write'],

  // Markdown
  '*.{md,mdx}': ['prettier --write'],

  // JSON / YAML
  '*.{json,yaml,yml}': ['prettier --write'],
}
`
}

// ---------------------------------------------------------------------------
// VS Code configuration
// ---------------------------------------------------------------------------

function vscodeSettings() {
  return JSON.stringify({
    'github.copilot.chat.agent.enabled': true,
    'github.copilot.chat.codeGeneration.instructions': [
      { file: '.github/copilot-instructions.md' },
    ],
    'editor.formatOnSave': true,
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
    'editor.codeActionsOnSave': {
      'source.fixAll.eslint': 'explicit',
    },
    'editor.rulers': [100],
    'files.trimTrailingWhitespace': true,
    'files.insertFinalNewline': true,
    'files.associations': {
      '*.instructions.md': 'markdown',
      '*.agent.md': 'markdown',
      '*.prompt.md': 'markdown',
    },
    'markdown.validate.enabled': true,
  }, null, 2)
}

function vscodeExtensions() {
  return JSON.stringify({
    recommendations: [
      'GitHub.copilot',
      'GitHub.copilot-chat',
      'esbenp.prettier-vscode',
      'dbaeumer.vscode-eslint',
      'streetsidesoftware.code-spell-checker',
      'eamodio.gitlens',
      'usernamehw.errorlens',
      'bradlc.vscode-tailwindcss',
      'Prisma.prisma',
    ],
  }, null, 2)
}

// ---------------------------------------------------------------------------
// Root documentation
// ---------------------------------------------------------------------------
