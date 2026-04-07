import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a software engineering orchestrator that manages AI agents.
Produce a GitHub Copilot orchestrator agent definition that coordinates
all ASDD sub-agents following the project's architecture patterns.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

export async function runOrchestratorAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)
  const archPrinciples = ctx.architecturePatterns?.principles?.join(', ') || 'SOLID, DRY, KISS, YAGNI'
  const detectedPatterns = ctx.architecturePatterns?.detected?.length
    ? `The project uses: ${ctx.architecturePatterns.detected.join(', ')}.`
    : 'No specific patterns detected — use SOLID, DRY, KISS, YAGNI as defaults.'

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/orchestrator.agent.md\` — the meta-orchestrator GitHub Copilot agent.

Architecture context: ${detectedPatterns}
Principles: ${archPrinciples}

This agent is invoked with @orchestrator to coordinate the full ASDD pipeline.
Pipeline rules:

**Prerequisite (must complete first):**
  @spec → generates feature spec; nothing else runs without an approved spec

**Parallel group 1 (after spec approved):**
  @tdd-backend + @tdd-frontend + @backend + @frontend

**Parallel group 2 (after group 1):**
  @documentation + @qa

The orchestrator agent must:
1. Validate the spec exists with status: approved (halt if not)
2. Verify all required sections are present and non-empty
3. Coordinate parallel execution of each group
4. Validate that ALL tests pass before moving to group 2
5. Report partial failures without blocking unaffected agents
6. Enforce that architecture principles (${archPrinciples}) are followed in outputs
7. Produce a completion summary: files generated, tests passed, coverage met

Include a \"Usage\" section with concrete invocation examples.
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

Architecture: ${detectedPatterns}

Structure with:
- Variables: {{spec_file}}, {{feature_name}}
- Pre-flight checklist (spec status, sections complete, no open questions)
- Per-group execution steps with expected outputs
- Failure handling per agent
- Final validation checklist (tests pass, docs updated, changelog updated)

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

