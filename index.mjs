#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { orchestrate } from './src/orchestrator.mjs'
import { log } from './src/logger.mjs'

const HELP = `
asdd-gen — Agentic Spec Driven Development generator

Generates a complete .github/ASDD structure with Copilot agents, instruction files,
prompts, git hooks, and VS Code config.

Two modes:
  Static mode  (no token)  — instant, generic, language-agnostic structure
  AI mode      (with token) — project-specific content generated via GitHub Models API

Usage:
  npx asdd-gen [options]

Options:
  --dry-run         Show what would be generated, without writing files
  --verbose-context Show per-file context scan logs (enabled by default)
  --quiet-context   Hide per-file context scan logs
  --model <name>    GitHub Models model to use (default: openai/gpt-4o)
                    Only relevant in AI mode
  --token <tok>     GitHub token — triggers AI mode
                    (also reads GITHUB_TOKEN / GH_TOKEN env vars)
  --output <dir>    Output directory (default: current working directory)
  -y, --yes         Skip confirmation prompts
  -h, --help        Show this help message

Auth for AI mode (in order of priority):
  1. --token flag
  2. GITHUB_TOKEN environment variable
  3. GH_TOKEN environment variable
  4. \`gh auth token\` (GitHub CLI)
  5. OAuth device flow (opens github.com/login/device)

Examples:
  # Static mode — no token, instant generic structure
  npx asdd-gen

  # AI mode — project-specific content generated via GitHub Models
  npx asdd-gen --token ghp_xxx
  GITHUB_TOKEN=ghp_xxx npx asdd-gen

  # AI mode with a different model
  npx asdd-gen --token ghp_xxx --model openai/gpt-4o-mini

  # Preview without writing files
  npx asdd-gen --dry-run
  npx asdd-gen --token ghp_xxx --dry-run --quiet-context
`

const { values } = parseArgs({
  options: {
    help:     { type: 'boolean', short: 'h', default: false },
    'dry-run':{ type: 'boolean', default: false },
    'verbose-context': { type: 'boolean', default: true },
    'quiet-context': { type: 'boolean', default: false },
    model:    { type: 'string',  default: 'openai/gpt-4o' },
    token:    { type: 'string' },
    output:   { type: 'string',  default: process.cwd() },
    yes:      { type: 'boolean', short: 'y', default: false },
  },
  strict: false,
  allowPositionals: false,
})

if (values.help) {
  console.log(HELP)
  process.exit(0)
}

try {
  await orchestrate(values)
} catch (err) {
  log.error(err.message)
  if (process.env.DEBUG) console.error(err)
  process.exit(1)
}
