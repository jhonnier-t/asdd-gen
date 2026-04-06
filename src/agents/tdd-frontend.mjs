import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a senior frontend engineer and TDD practitioner specializing in
component-driven development, accessibility, and visual regression testing.
Produce a GitHub Copilot agent definition file for frontend TDD.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

/**
 * Generates frontend TDD agent file.
 * @param {object} params
 * @returns {Promise<{ 'agents/tdd-frontend.agent.md': string, 'prompts/03-tdd-frontend.prompt.md': string }>}
 */
export async function runTddFrontendAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/tdd-frontend.agent.md\` — a GitHub Copilot agent for frontend TDD.

This agent is invoked with @tdd-frontend to write component/UI tests BEFORE implementation.
It must:

1. Read the feature spec and UI/UX requirements
2. Identify all frontend units: components, pages, hooks, stores, utils, services
3. Write failing tests first (Red phase) for:
   - **Component tests**: render, props, events, state, snapshots
   - **Hook tests**: state transitions, side effects
   - **Integration tests**: user flows across multiple components
   - **Accessibility tests**: ARIA, keyboard navigation, screen-reader support
   - **Visual regression tests**: if Playwright/Storybook is available
4. Define mock strategy for API calls, router, i18n, auth context
5. Specify test IDs / data-testid conventions
6. Include testing-library best practices (query by role, not by class)

Tech stack context: ${ctx.techStack.join(', ') || 'generic'}

Consider testing tools: Vitest, Jest, Testing Library, Playwright, Cypress, Storybook.
Include YAML frontmatter with: description, tools, model suggestion.
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

Generate \`prompts/03-tdd-frontend.prompt.md\` — a GitHub Copilot reusable prompt.

This prompt is used to generate frontend test files for a UI feature.
Structure it with:
- Context variables: {{component_name}}, {{feature_description}}, {{props_interface}}
- Instructions to produce test files per layer (component / hook / e2e)
- Guidelines for accessibility and responsive behavior testing
- Output format expectations

Use YAML frontmatter with mode: ask and applyTo targeting test files.
`,
      },
    ],
  })

  return {
    'agents/tdd-frontend.agent.md': agentContent,
    'prompts/03-tdd-frontend.prompt.md': promptContent,
  }
}
