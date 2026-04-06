import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a senior software architect specialized in Spec Driven Development.
Your task is to analyze a project and produce specification documents and agent definitions
that will serve as the foundation for all subsequent AI agents (TDD, backend, frontend,
documentation, and QA agents).

The ASDD pipeline always starts with a spec file in .github/specs/.
No implementation, no tests, no docs are generated without a spec.

Output format: Pure markdown. No prose intro or closing remarks outside the document.`

/**
 * Generates the project specification scaffold.
 * Produces three files:
 *   - copilot-instructions.md         — global AI context + ASDD flow description
 *   - agents/spec.agent.md            — @spec agent that creates specs in .github/specs/
 *   - specs/SPEC-TEMPLATE.md          — empty spec template developers copy per feature
 *
 * @param {object} params
 * @returns {Promise<Record<string, string>>}
 */
export async function runSpecAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)

  const [instructionsContent, agentContent] = await Promise.all([
    // ---------- copilot-instructions.md ----------
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate a \`copilot-instructions.md\` file for this project.
This file is the main instruction file loaded by GitHub Copilot for every interaction.

It must include:
1. **Project overview** — What this project does, its purpose and domain
2. **Architecture** — High-level architecture description (layers, services, modules)
3. **Tech stack** — Technologies, frameworks, and their versions/roles
4. **Coding standards** — Language conventions, naming, formatting
5. **Key domain concepts** — Business entities, vocabulary, bounded contexts

6. **ASDD Workflow (mandatory section — describe this exactly)**:

   The development workflow follows Agentic Spec Driven Development (ASDD).
   Every feature MUST follow this pipeline — no exceptions:

   \`\`\`
   Step 1 — SPEC (sequential, prerequisite for everything)
     Developer or @spec agent creates .github/specs/FEAT-<id>-<slug>.md
     Spec must be approved (status: approved) before continuing

   Step 2 — PARALLEL (triggered once spec is approved)
     @tdd-backend   → writes backend tests reading the spec
     @tdd-frontend  → writes frontend tests reading the spec
     @backend       → implements backend code to pass tests
     @frontend      → implements frontend code to pass tests

   Step 3 — PARALLEL (triggered after step 2)
     @documentation → generates docs from spec + code
     @qa            → generates Gherkin scenarios from acceptance criteria
     @orchestrator  → validates the full pipeline output
   \`\`\`

   **Rules:**
   - No agent in Step 2 or 3 runs without a spec file with status: approved
   - All agents must read the spec file before generating anything
   - All generated code must reference the spec ID in file headers and commit messages

7. **AI agent roles** — Brief description of each ASDD agent and when to invoke it
8. **Important constraints** — Security rules, performance requirements, compliance

Write in clear, directive language (imperative: "Use X", "Always Y", "Never Z").
`,
        },
      ],
    }),

    // ---------- agents/spec.agent.md ----------
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate an \`agents/spec.agent.md\` file — a GitHub Copilot agent definition file.

This agent is invoked when a developer needs to create a new feature specification.
The file must define the agent so that, when invoked via @spec, it:

1. Asks for the feature name, ID, and brief description
2. Reads \`copilot-instructions.md\` and existing specs in \`.github/specs/\` for context
3. Asks clarifying questions about the feature (scope, actors, integrations, constraints)
4. Produces a complete spec file following the template in \`.github/instructions/spec.instructions.md\`
5. Saves the file as \`.github/specs/FEAT-<id>-<kebab-slug>.md\` with status: draft
6. Tells the developer: "Review the spec. When ready, set status to 'approved' and run @orchestrator"

The agent MUST enforce:
- Every spec has a unique FEAT-XXX ID (check existing specs to avoid collisions)
- All 10 sections of the template are filled (no empty sections)
- Acceptance criteria are written in Given/When/Then format
- Non-functional requirements are explicit and measurable

Use YAML frontmatter format compatible with GitHub Copilot agent files (.agent.md).
`,
        },
      ],
    }),
  ])

  // ---------- specs/SPEC-TEMPLATE.md — deterministic, no LLM needed ----------
  const specTemplate = generateSpecTemplate(ctx)

  return {
    'copilot-instructions.md': instructionsContent,
    'agents/spec.agent.md': agentContent,
    'specs/SPEC-TEMPLATE.md': specTemplate,
  }
}

// ---------------------------------------------------------------------------
// Static spec template (deterministic — canonical empty template)
// ---------------------------------------------------------------------------

function generateSpecTemplate(ctx) {
  const date = new Date().toISOString().split('T')[0]
  return `---
id: FEAT-XXX
title: "<Feature title>"
status: draft
created: ${date}
author: "<github-handle>"
agents: tdd-backend, tdd-frontend, backend, frontend, documentation, qa
---

# FEAT-XXX — <Feature title>

> **ASDD**: Set \`status: approved\` in the frontmatter, then run \`@orchestrator\` to trigger the full pipeline.

## 1. Context & Motivation

Why does this feature exist? What problem does it solve?
Reference related issues (e.g. Closes #123).

## 2. User Stories

- As a **<role>**, I want **<capability>**, so that **<benefit>**

## 3. Acceptance Criteria

\`\`\`gherkin
Scenario: <scenario title>
  Given <precondition>
  When <action>
  Then <expected result>
\`\`\`

<!-- Add one scenario per acceptance criterion. The @qa agent converts these to test files. -->

## 4. Data Model

Entities created or modified, fields, types, relationships, constraints.
Include migration notes if the schema changes.

| Entity | Field | Type | Constraints |
|--------|-------|------|-------------|
|        |       |      |             |

## 5. API Contract

### REST Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|---------|

### Events / Messages _(if event-driven)_

## 6. UI/UX Requirements

Screens, user flows, component breakdown.
Link to Figma or mockups if available.
Accessibility requirements (WCAG 2.1 AA minimum).

## 7. Non-Functional Requirements

- **Performance**: target latency / throughput (e.g. p95 < 200 ms)
- **Security**: specific threat vectors to address
- **Scalability**: expected volume, growth rate
- **Observability**: metrics, traces, and logs required

## 8. Out of Scope

Explicitly list what this spec does NOT cover to prevent scope creep:
- ...

## 9. Dependencies

- **Features**: FEAT-XXX must be completed first
- **External services**: <service name> API must be available
- **Infrastructure**: <resource> must be provisioned

## 10. Test Strategy

- **Unit tests**: <what logic to cover>
- **Integration tests**: <which boundaries to test>
- **E2E tests**: <critical user paths>
- **Estimated coverage target**: X%
`
}

