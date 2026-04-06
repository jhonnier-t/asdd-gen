#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { orchestrate } from './src/orchestrator.mjs'
import { log } from './src/logger.mjs'

const HELP = `
asdd-gen — Agentic Spec Driven Development generator

Reads your project context and generates a .github/ASDD structure
with Copilot agents, instructions and prompts using GitHub Models API.

Usage:
  npx asdd-gen [options]

Options:
  --dry-run        Show what would be generated, without writing files
  --verbose-context Show real-time Phase 0 context scan logs (enabled by default)
  --quiet-context  Hide Phase 0 per-file scan logs
  --model <name>   GitHub Models model to use (default: openai/gpt-4o)
  --token <tok>    GitHub token (overrides GITHUB_TOKEN / GH_TOKEN env)
  --output <dir>   Output directory (default: current working directory)
  -y, --yes        Skip confirmation prompts
  -h, --help       Show this help message

Auth (in order of priority):
  1. --token flag
  2. GITHUB_TOKEN environment variable
  3. GH_TOKEN environment variable
  4. \`gh auth token\` (GitHub CLI)
  5. OAuth device flow (opens github.com/login/device)

Examples:
  npx asdd-gen
  npx asdd-gen --quiet-context
  npx asdd-gen --dry-run
  npx asdd-gen --model openai/gpt-4o-mini
  GITHUB_TOKEN=ghp_xxx npx asdd-gen
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
