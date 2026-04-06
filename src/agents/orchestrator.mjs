import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a software engineering orchestrator that manages AI agents.
Produce a GitHub Copilot orchestrator agent definition file that coordinates
all ASDD sub-agents in the correct sequence and parallel phases.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

/**
 * Generates the meta-orchestrator agent file.
 * @param {object} params
 * @returns {Promise<{ 'agents/orchestrator.agent.md': string, 'prompts/00-orchestrate.prompt.md': string }>}
 */
export async function runOrchestratorAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/orchestrator.agent.md\` — the meta-orchestrator GitHub Copilot agent.

This agent is invoked with @orchestrator to coordinate the full ASDD pipeline.
The pipeline phases and parallelism rules are:

**Phase 1 — Specification** (sequential prerequisite):
  - @spec → generates feature spec; all other phases depend on its output

**Phase 2 — TDD & Implementation** (all in parallel, depends on Phase 1):
  - @tdd-backend  → backend tests
  - @tdd-frontend → frontend tests
  - @backend      → backend implementation (targets passing tdd-backend tests)
  - @frontend     → frontend implementation (targets passing tdd-frontend tests)

**Phase 3 — Quality & Documentation** (parallel, depends on Phase 2):
  - @documentation → updates docs, ADRs, changelog
  - @qa            → generates Gherkin scenarios and acceptance tests

The orchestrator agent must:
1. Always start with Phase 1 and wait for spec completion
2. Kick off all Phase 2 agents simultaneously
3. Kick off all Phase 3 agents simultaneously after Phase 2 completes
4. Provide a summary of all artifacts generated on completion
5. Handle partial failures: if one agent fails, report it without blocking others
6. Show progress with phase-by-phase status updates

Include a "how to invoke" section with usage examples.
Include YAML frontmatter with: description, tools (fileSystem, codebase, terminalLastCommand).
`,
      },
    ],
  })

  const promptContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`prompts/00-orchestrate.prompt.md\` — the main ASDD orchestration prompt.

This is the "master" prompt that kicks off the full ASDD pipeline for a new feature.
Structure it with:
- Variables: {{feature_request}}, {{scope}} 
- Step-by-step orchestration instructions referencing each phase
- Checklist of deliverables expected at each phase
- Rollback instructions if a phase fails
- Output: summary table of all generated artifacts

Use YAML frontmatter with mode: agent.
`,
      },
    ],
  })

  return {
    'agents/orchestrator.agent.md': agentContent,
    'prompts/00-orchestrate.prompt.md': promptContent,
  }
}
