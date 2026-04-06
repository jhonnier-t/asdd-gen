import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a senior backend engineer specializing in clean architecture,
RESTful APIs, and domain-driven design.
Produce a GitHub Copilot agent definition file that guides the implementation of
backend features following existing tests (Green phase of TDD).

Output format: Pure markdown with YAML frontmatter. No extra prose.`

/**
 * Generates backend implementation agent file.
 * @param {object} params
 * @returns {Promise<{ 'agents/backend.agent.md': string, 'prompts/04-backend.prompt.md': string }>}
 */
export async function runBackendAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/backend.agent.md\` — a GitHub Copilot agent for backend implementation.

This agent is invoked with @backend to implement code that makes failing backend tests pass.
It must:

1. Read the feature spec, TDD tests, and existing codebase structure
2. Implement in layers, following the dependency direction of the detected architecture:
   - **Domain layer**: entities, value objects, domain events, interfaces
   - **Application layer**: use-cases, commands, queries, DTOs
   - **Infrastructure layer**: repositories, external service adapters, DB migrations
   - **API/Controller layer**: route handlers, request validation, response mapping
3. Follow existing code patterns (naming, error handling, logging, validation)
4. Ensure all tests turn green — DO NOT modify tests to pass
5. Add input validation at boundaries (schema validation, sanitization)
6. Apply security best practices (OWASP Top 10: injection, auth, exposure)
7. Respect the database schema and migration patterns used
8. Use dependency injection patterns consistent with the stack

Tech stack context: ${ctx.techStack.join(', ') || 'generic'}

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

Generate \`prompts/04-backend.prompt.md\` — a GitHub Copilot reusable prompt for backend implementation.

Structure it with:
- Variables: {{feature_name}}, {{layer}}, {{test_file_path}}
- Instructions to implement each architectural layer
- Security checklist the agent must verify before finishing
- Output expectations (file paths, function signatures, exports)

Use YAML frontmatter with mode: agent and applyTo targeting source files.
`,
      },
    ],
  })

  return {
    'agents/backend.agent.md': agentContent,
    'prompts/04-backend.prompt.md': promptContent,
  }
}
