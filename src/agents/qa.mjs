import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a QA engineer specializing in behavior-driven development (BDD),
Gherkin scenario writing, and acceptance test automation. 
Produce a GitHub Copilot agent that generates Gherkin feature files and acceptance tests.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

/**
 * Generates the QA / Gherkin agent file.
 * @param {object} params
 * @returns {Promise<{ 'agents/qa.agent.md': string, 'prompts/07-qa-scenarios.prompt.md': string }>}
 */
export async function runQaAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/qa.agent.md\` — a GitHub Copilot agent for QA and Gherkin scenarios.

This agent is invoked with @qa to produce acceptance tests and Gherkin feature files
from a feature specification.
It must:

1. Read the feature spec with its acceptance criteria
2. Produce **Gherkin feature files** (.feature) with:
   - Feature description and background
   - Happy path scenarios (core positive flows)
   - Negative / error scenarios (invalid inputs, unauthorized access, missing data)
   - Edge case scenarios (boundary values, concurrent operations, timeouts)
   - Performance scenarios (if relevant SLAs exist)
3. Write **step definitions** in the language/framework used (Cucumber.js, SpecFlow, Behave, Karate)
4. Define **test data** (fixtures, factories, seeds) for each scenario
5. Identify **manual test cases** for scenarios not suitable for automation
6. Produce an **exploratory testing charter** for exploratory QA sessions
7. Link each scenario back to its acceptance criteria ID
8. Validate coverage: every acceptance criterion must have at least one scenario

Gherkin quality rules:
- One behavior per scenario
- Use "Given/When/Then" strictly (not And to start)
- Avoid implementation detail in steps (use business language)
- Parameterize data with Scenario Outline / Examples tables

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

Generate \`prompts/07-qa-scenarios.prompt.md\` — a GitHub Copilot reusable prompt for QA.

Structure it with:
- Variables: {{feature_name}}, {{acceptance_criteria}}, {{actors}}
- Instructions to produce .feature files, step definitions, and test data
- Scenario coverage matrix (happy path / negative / edge / performance)
- Quality checklist for Gherkin scenarios

Use YAML frontmatter with mode: ask.
`,
      },
    ],
  })

  return {
    'agents/qa.agent.md': agentContent,
    'prompts/07-qa-scenarios.prompt.md': promptContent,
  }
}
