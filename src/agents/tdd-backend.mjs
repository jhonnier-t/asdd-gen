import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a senior backend engineer and TDD practitioner.
Your task is to produce a GitHub Copilot agent definition file that guides AI agents
to write backend tests BEFORE writing implementation code.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

/**
 * Generates backend TDD agent file.
 * @param {object} params
 * @returns {Promise<{ 'agents/tdd-backend.agent.md': string, 'prompts/02-tdd-backend.prompt.md': string }>}
 */
export async function runTddBackendAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/tdd-backend.agent.md\` — a GitHub Copilot agent for backend TDD.

This agent is invoked with @tdd-backend to write tests BEFORE backend implementation.
It must:

1. Read the feature spec (from .github/agents/spec.agent.md output)
2. Identify all backend units to test: services, controllers, repositories, use-cases, utilities
3. Write failing tests first (Red phase) following the test framework used in this stack
4. Group tests logically: unit tests, integration tests, contract tests
5. For each test file, produce:
   - Test file path following the project's convention
   - Import structure
   - Test suite structure (describe blocks)
   - Individual test cases with clear "arrange / act / assert" pattern
   - Mocking strategy for external dependencies
6. Include test coverage requirements (minimum coverage thresholds per module)
7. Define test data factories / fixtures / builders

Tech stack context: ${ctx.techStack.join(', ') || 'generic'}

Consider test frameworks appropriate for this stack (Jest, Vitest, pytest, JUnit, etc.).
Include YAML frontmatter with: description, tools (fileSystem, codebase), model suggestion.
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

Generate \`prompts/02-tdd-backend.prompt.md\` — a GitHub Copilot prompt file.

This is a reusable prompt that a developer runs to generate backend tests for a feature.
It must:
- Accept a feature spec as input context
- Output complete, runnable test files following TDD (Red-Green-Refactor)
- Be structured with clear variable placeholders: {{feature_name}}, {{module_path}}
- Include instructions for each test layer (unit / integration / e2e)

Use YAML frontmatter with mode: ask and applyTo targeting test files.
`,
      },
    ],
  })

  return {
    'agents/tdd-backend.agent.md': agentContent,
    'prompts/02-tdd-backend.prompt.md': promptContent,
  }
}
