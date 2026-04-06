import { readProjectContext } from './context.mjs'
import { resolveToken } from './auth.mjs'
import { log } from './logger.mjs'
import { writeGithubFolder } from './writer.mjs'
import { runSpecAgent } from './agents/spec.mjs'
import { runTddBackendAgent } from './agents/tdd-backend.mjs'
import { runTddFrontendAgent } from './agents/tdd-frontend.mjs'
import { runBackendAgent } from './agents/backend.mjs'
import { runFrontendAgent } from './agents/frontend.mjs'
import { runDocumentationAgent } from './agents/documentation.mjs'
import { runQaAgent } from './agents/qa.mjs'
import { runOrchestratorAgent } from './agents/orchestrator.mjs'
import { runSkillsAgent } from './agents/skills.mjs'
import { runGitHooksAgent } from './agents/git-hooks.mjs'
import { runVscodeConfigAgent } from './agents/vscode-config.mjs'

/**
 * Main orchestration function.
 * Generates ASDD infrastructure files.
 *
 * @param {object} opts - Parsed CLI flags from index.mjs
 */
export async function orchestrate(opts) {
  const outputDir = opts.output ?? process.cwd()
  const model = opts.model ?? 'openai/gpt-4o'
  const dryRun = opts['dry-run'] ?? false
  const verboseContext = (opts['verbose-context'] ?? true) && !opts['quiet-context']
  const maxAgentConcurrency = 2

  log.title('asdd-gen — Agentic Spec Driven Development Generator')

  log.info('Understanding project context...')
  const ctx = readProjectContext(outputDir, {
    onProgress: verboseContext
      ? (event) => {
          if (event.type === 'file-read') {
            log.dim(`  • reading: ${event.path}`)
            return
          }
          if (event.type === 'file-indexed') {
            log.dim(`  • indexed: ${event.path}`)
            return
          }
          if (event.message) {
            log.dim(`  • ${event.message}`)
          }
        }
      : undefined,
  })

  log.info(`Project  : ${ctx.projectName}`)
  log.info(`Tech     : ${ctx.techStack.length ? ctx.techStack.join(', ') : 'none detected'}`)
  log.info(`Model    : ${model}`)
  if (ctx.contextStats) {
    log.info(
      `Context : ${ctx.contextStats.totalVisitedDirs} dirs, ${ctx.contextStats.totalVisitedFiles} files scanned, ${ctx.contextStats.includedFiles} indexed`
    )
  }
  if (dryRun) log.warn('Dry-run mode — no files will be written')
  console.log('')

  if (dryRun) {
    log.success('Context read successfully. Files that would be generated:')
    printArtifactList()
    return
  }

  log.info('Resolving GitHub token...')
  let token
  try {
    token = await resolveToken(opts.token)
    log.success('✓ GitHub token resolved\n')
  } catch (err) {
    console.log('')
    log.error('Failed to resolve GitHub token')
    console.log('')
    console.log(err.message)
    console.log('')
    // Exit immediately with no cleanup to avoid hanging processes
    process.exit(1)
  }

  const agentArgs = { token, model, ctx }
  /** @type {Set<string>} written file paths */
  const writtenPathsSet = new Set()

  log.info('Generating ASDD structure files...')
  log.dim('  • files are written incrementally as each agent finishes')
  console.log('')

  log.info('Creating core specification files...')

  const specFiles = await runSpecAgent(agentArgs)
  await processAgentResult('spec', { status: 'fulfilled', value: specFiles }, outputDir, writtenPathsSet)
  console.log('')

  log.info('Creating implementation and test agent files...')

  const phase2Tasks = [
    { name: 'tdd-backend', run: () => runTddBackendAgent(agentArgs) },
    { name: 'backend', run: () => runBackendAgent(agentArgs) },
    { name: 'tdd-frontend', run: () => runTddFrontendAgent(agentArgs) },
    { name: 'frontend', run: () => runFrontendAgent(agentArgs) },
  ]

  await runTasksWithConcurrency(phase2Tasks, maxAgentConcurrency, async (index, result) => {
    await processAgentResult(phase2Tasks[index].name, result, outputDir, writtenPathsSet)
  })
  console.log('')

  log.info('Creating documentation, orchestration, and tooling files...')

  const phase3Tasks = [
    { name: 'documentation', run: () => runDocumentationAgent(agentArgs) },
    { name: 'qa', run: () => runQaAgent(agentArgs) },
    { name: 'orchestrator', run: () => runOrchestratorAgent(agentArgs) },
    { name: 'skills', run: () => runSkillsAgent(agentArgs) },
    { name: 'git-hooks', run: () => runGitHooksAgent(agentArgs) },
    { name: 'vscode-config', run: () => runVscodeConfigAgent(agentArgs) },
  ]

  await runTasksWithConcurrency(phase3Tasks, maxAgentConcurrency, async (index, result) => {
    await processAgentResult(phase3Tasks[index].name, result, outputDir, writtenPathsSet)
  })
  console.log('')

  const writtenPaths = [...writtenPathsSet]
  console.log('')
  log.success(`Generated ${writtenPaths.length} files:`)
  for (const p of writtenPaths) log.dim(`  ${p}`)
  console.log('')
  log.success('ASDD structure ready. Open GitHub Copilot and invoke @orchestrator to start!')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Processes a single agent result and writes files immediately when fulfilled.
 * @param {string} name
 * @param {PromiseSettledResult<Record<string,string>>} result
 * @param {string} outputDir
 * @param {Set<string>} writtenPathsSet
 */
async function processAgentResult(name, result, outputDir, writtenPathsSet) {
  if (result.status === 'fulfilled') {
    const written = await writeGithubFolder(outputDir, result.value)
    for (const p of written) writtenPathsSet.add(p)
    log.agent(name, `created ${Object.keys(result.value).length} files — ${Object.keys(result.value).join(', ')}`)
    for (const p of written) log.dim(`    wrote: ${p}`)
  } else {
    log.warn(`Agent "${name}" failed: ${result.reason?.message ?? result.reason}`)
  }
}

/**
 * Runs async tasks with bounded concurrency and returns Promise.allSettled-compatible results.
 * @param {{name: string, run: () => Promise<Record<string, string>>}[]} tasks
 * @param {number} concurrency
 * @param {(index: number, result: PromiseSettledResult<Record<string, string>>) => Promise<void>|void} [onSettled]
 * @returns {Promise<PromiseSettledResult<Record<string, string>>[]>}
 */
async function runTasksWithConcurrency(tasks, concurrency, onSettled) {
  const results = new Array(tasks.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const index = nextIndex
      nextIndex++
      if (index >= tasks.length) return

      try {
        const value = await tasks[index].run()
        results[index] = { status: 'fulfilled', value }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }

      if (onSettled) {
        try {
          await onSettled(index, results[index])
        } catch (callbackError) {
          log.warn(`Post-process for agent "${tasks[index].name}" failed: ${callbackError?.message ?? callbackError}`)
        }
      }
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, tasks.length))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return /** @type {PromiseSettledResult<Record<string, string>>[]} */ (results)
}

function printArtifactList() {
  const artifacts = [
    // Copilot main instructions
    '.github/copilot-instructions.md',
    // Spec agent + canonical template
    '.github/agents/spec.agent.md',
    '.github/specs/SPEC-TEMPLATE.md',
    // ASDD Agents (spec.agent.md is listed above under spec section)
    '.github/agents/orchestrator.agent.md',
    '.github/agents/tdd-backend.agent.md',
    '.github/agents/tdd-frontend.agent.md',
    '.github/agents/backend.agent.md',
    '.github/agents/frontend.agent.md',
    '.github/agents/documentation.agent.md',
    '.github/agents/qa.agent.md',
    // Prompts
    '.github/prompts/00-orchestrate.prompt.md',
    '.github/prompts/02-tdd-backend.prompt.md',
    '.github/prompts/03-tdd-frontend.prompt.md',
    '.github/prompts/04-backend.prompt.md',
    '.github/prompts/05-frontend.prompt.md',
    '.github/prompts/06-documentation.prompt.md',
    '.github/prompts/07-qa-scenarios.prompt.md',
    // Skills — Copilot instruction files (scoped by applyTo)
    '.github/instructions/general.instructions.md',
    '.github/instructions/spec.instructions.md',
    '.github/instructions/backend.instructions.md',
    '.github/instructions/frontend.instructions.md',
    '.github/instructions/testing.instructions.md',
    '.github/instructions/security.instructions.md',
    '.github/instructions/git.instructions.md',
    // Git hooks
    'ROOT:.husky/pre-commit',
    'ROOT:.husky/commit-msg',
    'ROOT:.husky/pre-push',
    'ROOT:commitlint.config.mjs',
    'ROOT:lint-staged.config.mjs',
    // VS Code / Copilot agent config
    'ROOT:.vscode/settings.json',
    'ROOT:.vscode/extensions.json',
    // Root-level files
    'AGENTS.md',
    'CHANGELOG.md',
  ]

  for (const a of artifacts) log.dim(`  ${a}`)
}
