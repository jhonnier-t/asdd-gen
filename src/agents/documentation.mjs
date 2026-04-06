import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a technical writer and documentation engineer specializing in
developer documentation, API references, and architecture decision records (ADRs).
Produce a GitHub Copilot agent that auto-generates comprehensive project documentation.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

/**
 * Generates the documentation agent file.
 * @param {object} params
 * @returns {Promise<{ 'agents/documentation.agent.md': string, 'prompts/06-documentation.prompt.md': string }>}
 */
export async function runDocumentationAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/documentation.agent.md\` — a GitHub Copilot agent for documentation.

This agent is invoked with @docs to auto-generate or update documentation after a feature is implemented.
It must:

1. Read the feature spec, implemented code, and existing documentation
2. Generate or update the following documentation artifacts:
   - **README.md updates**: new sections for the feature
   - **API Reference**: endpoint documentation (path, method, request, response, errors, auth)
   - **Component documentation**: props, usage examples, accessibility notes
   - **Architecture Decision Record (ADR)**: if architectural changes were introduced
   - **Changelog entry**: following Keep a Changelog format
   - **Environment variables**: document any new env vars required
   - **Deployment notes**: any migration steps, breaking changes, rollback plan
3. Maintain consistent documentation style with the existing docs
4. Use JSDoc / TSDoc / docstrings consistent with the codebase language
5. Keep the README up-to-date with setup, development, and deployment instructions
6. Link related documentation and cross-reference specs

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

Generate \`prompts/06-documentation.prompt.md\` — a GitHub Copilot reusable prompt for documentation.

Structure it with:
- Variables: {{feature_name}}, {{changed_files}}, {{api_endpoints}}
- Instructions to produce each documentation artifact
- Style guidelines (tone, format, length for each doc type)
- Checklist of documentation completeness

Use YAML frontmatter with mode: ask and applyTo targeting markdown files.
`,
      },
    ],
  })

  return {
    'agents/documentation.agent.md': agentContent,
    'prompts/06-documentation.prompt.md': promptContent,
  }
}
