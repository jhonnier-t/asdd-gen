import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a senior frontend engineer specializing in component-driven
development, performance optimization, and accessibility.
Produce a GitHub Copilot agent definition file that guides the implementation of
UI features following existing tests (Green phase of TDD).

Output format: Pure markdown with YAML frontmatter. No extra prose.`

/**
 * Generates frontend implementation agent file.
 * @param {object} params
 * @returns {Promise<{ 'agents/frontend.agent.md': string, 'prompts/05-frontend.prompt.md': string }>}
 */
export async function runFrontendAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/frontend.agent.md\` — a GitHub Copilot agent for frontend implementation.

This agent is invoked with @frontend to implement UI code that makes failing frontend tests pass.
It must:

1. Read the feature spec, UI/UX requirements, and failing TDD tests
2. Implement components following the design system / UI library in use
3. Layer the implementation:
   - **Presentational components**: stateless, prop-driven, fully accessible
   - **Container/Smart components**: state management, data fetching, side effects
   - **Pages/Routes**: route-level components, layout integration, data loading
   - **Hooks**: reusable stateful logic extracted from components
   - **Stores**: state management slices/stores for shared state
4. Follow existing component patterns and folder conventions
5. Ensure all tests turn green — DO NOT modify tests to pass
6. Validate accessibility (WCAG 2.1 AA): semantic HTML, ARIA labels, keyboard nav, focus trap
7. Apply performance patterns: code splitting, lazy loading, memoization where appropriate
8. Handle loading, error, and empty states in every component
9. Use responsive design patterns consistent with the stack

Tech stack context: ${ctx.techStack.join(', ') || 'generic'}

Include YAML frontmatter with: description, tools (fileSystem, codebase).
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

Generate \`prompts/05-frontend.prompt.md\` — a GitHub Copilot reusable prompt for frontend implementation.

Structure it with:
- Variables: {{component_name}}, {{feature_name}}, {{design_system_tokens}}
- Instructions for component hierarchy (atomic design or equivalent)
- Accessibility checklist
- Performance optimization checklist
- File output expectations (component file, styles, stories, index re-exports)

Use YAML frontmatter with mode: agent and applyTo targeting component files.
`,
      },
    ],
  })

  return {
    'agents/frontend.agent.md': agentContent,
    'prompts/05-frontend.prompt.md': promptContent,
  }
}
