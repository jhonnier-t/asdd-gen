import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a GitHub Copilot expert and senior software architect.
Generate VS Code / GitHub Copilot instruction files (.instructions.md) that teach AI agents
the specific conventions, patterns, and best practices for this project.

IMPORTANT: You must detect and enforce the architecture patterns documented in the project.
If no specific patterns are documented, use SOLID, DRY, KISS, YAGNI, and Separation of Concerns
as defaults and state them explicitly.

Output format: Pure markdown with YAML frontmatter. No extra prose outside the file content.`

export async function runSkillsAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)
  const stack = ctx.techStack.join(', ') || 'generic'
  const archPrinciples = ctx.architecturePatterns?.principles?.join(', ') || 'SOLID, DRY, KISS, YAGNI, Separation of Concerns'
  const detectedPatterns = ctx.architecturePatterns?.detected?.length
    ? `Detected architecture patterns: ${ctx.architecturePatterns.detected.join(', ')}.`
    : 'No specific architecture detected \u2014 enforce SOLID, DRY, KISS, YAGNI, Separation of Concerns.'

  const [general, backend, frontend, testing, security, specSkill, agentsMd] = await Promise.all([
    // general.instructions.md — applies to all files
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate \`instructions/general.instructions.md\` \u2014 global Copilot instructions for ALL files.

YAML frontmatter must include:
  applyTo: "**"

Architecture context: ${detectedPatterns}

Content must cover:
1. **Project purpose** \u2014 2-3 sentences on what this project does and its domain
2. **Architecture principles** \u2014 For each of [${archPrinciples}], write 2-3 specific,
   actionable rules for THIS project. Never copy-paste generic definitions.
   If patterns were detected, describe the specific layering rules to follow.
3. **Language and formatting rules** \u2014 enforced by linter/formatter in this stack (${stack})
4. **Naming conventions** \u2014 variables, functions, classes, files, folders with examples
5. **Error handling** \u2014 how errors are handled/propagated in this stack
6. **Comment style** \u2014 when to comment (why not what), JSDoc/TSDoc/docstring rules
7. **Import organization** \u2014 import ordering, circular dependency rules
8. **Forbidden patterns** \u2014 specific anti-patterns never to use in this project
9. **ASDD workflow reminder** \u2014 spec \u2192 TDD \u2192 implement \u2192 docs \u2192 QA (always in this order)
`,
        },
      ],
    }),

    // backend.instructions.md
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate \`instructions/backend.instructions.md\` — Copilot instructions for backend code.

YAML frontmatter: applyTo targeting backend source dirs (src/**, api/**, server/**, lib/**)

Architecture context: ${detectedPatterns}
Principles: ${archPrinciples}

Content (tailored to stack: ${stack}):
1. **Architecture pattern** — Describe the specific layering rules for this project.
   If ${ctx.architecturePatterns?.detected?.[0] || 'Clean Architecture'} is used,
   describe the dependency rules and what belongs in each layer
2. **API design** — REST conventions: HTTP verbs, status codes, URL naming, versioning, pagination
3. **Request validation** — validate ALL inputs at boundaries, schema libraries to use for ${stack}
4. **Database patterns** — query patterns, transaction handling, N+1 prevention
5. **Authentication/Authorization** — middleware patterns, JWT/session handling in ${stack}
6. **Dependency injection** — how dependencies are wired in this specific stack
7. **Error handling** — domain errors vs infrastructure errors, error response format
8. **Service boundaries** — what belongs in service vs controller vs repository
9. **Security rules** — parameterized queries, input sanitization, secret handling (OWASP)
`,
        },
      ],
    }),

    // frontend.instructions.md
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate \`instructions/frontend.instructions.md\` — Copilot instructions for frontend/UI code.

YAML frontmatter: applyTo targeting frontend dirs (src/components/**, src/pages/**, src/app/**)

Content (tailored to stack: ${stack}):
1. **Component design rules** — single responsibility, prop-driven, no internal HTTP calls
2. **State management** — when to use local state vs store vs server state
3. **Data fetching patterns** — hooks, suspense, loading/error/empty states (always handle all 3)
4. **Styling conventions** — CSS patterns used in this project
5. **Accessibility rules** — semantic HTML, ARIA attributes, keyboard navigation, focus management
6. **Performance rules** — when to memoize, lazy load, code split; avoid premature optimization
7. **Component file structure** — what goes in each file (component, styles, tests, stories, index)
8. **Forms** — controlled vs uncontrolled, validation, submission, error display
9. **Routing** — navigation patterns, route guards, dynamic segments
`,
        },
      ],
    }),

    // testing.instructions.md
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate \`instructions/testing.instructions.md\` — Copilot instructions for all test files.

YAML frontmatter: applyTo targeting test files (**/*.test.*, **/*.spec.*, **/__tests__/**)

Content (tailored to stack: ${stack}):
1. **TDD mandate** — tests MUST be written before implementation (Red → Green → Refactor)
2. **Test organization** — describe/it naming convention, file colocation rules
3. **AAA pattern** — every test must have clearly delineated Arrange / Act / Assert sections
4. **What to test** — behavior not implementation; never test private methods directly
5. **Mocking rules** — when to mock, when not to; prefer fakes over mocks; no over-mocking
6. **Assertion style** — preferred matchers, custom matchers, error message quality
7. **Test data** — factories, builders, fixtures; no magic strings/numbers in tests
8. **Coverage targets** — minimum coverage per module type (services, components, utils)
9. **Forbidden test patterns** — never skip tests with .only/.skip in committed code; no sleeps
10. **E2E tests** — page object model if Playwright; scenario coverage requirements
`,
        },
      ],
    }),

    // security.instructions.md
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate \`instructions/security.instructions.md\` — Copilot security rules for ALL files.

YAML frontmatter: applyTo: "**"

This file must be directive and non-negotiable. Frame every rule as an imperative.
Cover the OWASP Top 10 adapted to this stack (${stack}):

1. **Injection prevention** — parameterized queries ALWAYS, never string interpolation in SQL/NoSQL
2. **Authentication** — password hashing requirements, session handling, token rotation
3. **Sensitive data exposure** — never log PII/tokens/passwords; encryption at rest and in transit
4. **Input validation** — validate and sanitize ALL user input at every boundary
5. **Access control** — always authorize, never rely on security through obscurity
6. **Dependency management** — no direct use of packages with known CVEs; run audit in CI
7. **Secret management** — NEVER hardcode secrets; always use env vars or secret managers
8. **XSS prevention** — escape output, use safe APIs, CSP headers
9. **CSRF protection** — token-based CSRF for state-changing operations
10. **Error handling** — never expose stack traces or internal details to clients
11. **Rate limiting** — required on all public endpoints
12. **File handling** — validate file types/sizes; no path traversal
`,
        },
      ],
    }),

    // spec.instructions.md — teaches Copilot the spec template and ASDD workflow trigger
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate \`instructions/spec.instructions.md\` — Copilot instructions that:
1. Teach the AI the ASDD spec document template
2. Explain that every new feature MUST start with a spec file in \`.github/specs/\`
3. Define the spec as the trigger that unlocks all parallel ASDD agents

YAML frontmatter:
  applyTo: ".github/specs/**"

Content must include:

## ASDD Spec-first Workflow

Explain clearly: **no implementation starts without a spec file in \`.github/specs/\`**.
The spec document is the single source of truth that all agents read before executing.

Workflow:
1. Developer (or @spec agent) creates \`.github/specs/FEAT-<id>-<slug>.md\`
2. Spec is reviewed and approved (or iterated with @spec)
3. Once spec is approved → run @orchestrator to trigger the full parallel pipeline:
   - Phase 2 (parallel): @tdd-backend, @tdd-frontend, @backend, @frontend all READ the spec
   - Phase 3 (parallel): @documentation, @qa, @orchestrator all READ the spec
4. All generated code/tests must reference the spec ID in commit messages

## Spec File Naming Convention

\`\`\`
.github/specs/FEAT-<3-digit-id>-<kebab-case-slug>.md
\`\`\`

Examples:
- \`.github/specs/FEAT-001-user-authentication.md\`
- \`.github/specs/FEAT-002-payment-checkout.md\`
- \`.github/specs/FIX-001-session-expiry-bug.md\`

## Spec Document Template

Provide the COMPLETE spec template that must be used for every spec file.
Adapt field labels and examples to the project's domain and stack (${stack}).

The template must include ALL of these sections:

\`\`\`markdown
---
id: FEAT-XXX
title: <Feature title>
status: draft | review | approved | in-progress | done
created: YYYY-MM-DD
author: <github-handle>
agents: tdd-backend, tdd-frontend, backend, frontend, documentation, qa
---

# FEAT-XXX — <Feature title>

## 1. Context & Motivation
Why does this feature exist? What problem does it solve? Reference any related issues (#123).

## 2. User Stories
- As a <role>, I want <capability>, so that <benefit>

## 3. Acceptance Criteria
Given <precondition>
When <action>
Then <expected result>

(Repeat for each scenario. These become Gherkin tests in the QA agent.)

## 4. Data Model
Entities created/modified, fields, types, relationships, constraints.
Include migration notes if applicable.

## 5. API Contract
### Endpoints (if applicable)
| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|---------|

### Events/Messages (if event-driven)

## 6. UI/UX Requirements
Screens, flows, component breakdown. Link to Figma/mockups if available.
Accessibility requirements (WCAG level).

## 7. Non-Functional Requirements
- Performance: target latency / throughput
- Security: specific threat vectors to address
- Scalability: expected volume
- Observability: metrics, traces, logs required

## 8. Out of Scope
Explicitly list what this spec does NOT cover to prevent scope creep.

## 9. Dependencies
- Features: FEAT-XXX must be done first
- External services: <service> API required
- Infrastructure: <resource> must exist

## 10. Test Strategy
Unit tests: <what to cover>
Integration tests: <boundaries to test>
E2E tests: <critical user paths>
Estimated coverage target: X%
\`\`\`

## Rules for All Agents Reading a Spec

- ALWAYS read the spec file before generating any code
- Address EVERY acceptance criterion — no silent skipping
- Reference the spec ID in all generated file headers: \`// Spec: FEAT-XXX\`
- If spec is ambiguous, STOP and ask for clarification before proceeding
- Never implement features NOT described in the spec (no gold-plating)
`,
        },
      ],
    }),

    // AGENTS.md (root level — human-readable catalog)
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate \`AGENTS.md\` — the root-level AI agent catalog for this project.
This file documents all AI agents available in the .github/ ASDD structure.
It follows the convention established by projects like Claude, Codex, and Copilot agent configs.

Structure:
# AGENTS.md

## Overview
Brief description of the ASDD (Agentic Spec Driven Development) approach used in this project.
Explain the pipeline phases and how agents collaborate.

## Pipeline

Show the pipeline diagram:
Phase 1 → spec
Phase 2 (parallel) → tdd-backend, tdd-frontend, backend, frontend
Phase 3 (parallel) → documentation, qa, orchestrator

## Available Agents

For each agent, provide a table or structured section with:
- Agent name and invocation (@handle)
- File: .github/agents/<name>.agent.md
- Purpose: one sentence
- When to use: specific trigger
- Input: what context it needs
- Output: what files/artifacts it produces

Agents to document:
1. @orchestrator — coordinates the full ASDD pipeline
2. @spec — generates feature specifications
3. @tdd-backend — writes backend tests first
4. @tdd-frontend — writes frontend tests first
5. @backend — implements backend code to pass tests
6. @frontend — implements frontend code to pass tests
7. @docs (documentation) — generates/updates documentation
8. @qa — generates Gherkin acceptance scenarios

## Skills (Instruction Files)

Table listing all .github/instructions/*.instructions.md files and their scope.

## Prompts

Table listing all .github/prompts/*.prompt.md files and when to use them.

## Usage Examples

3-5 concrete examples of invoking agents in GitHub Copilot Chat.
`,
        },
      ],
    }),
  ])

  // git.instructions.md — deterministic, no LLM needed
  const gitInstructions = generateGitInstructions(ctx)

  return {
    'instructions/general.instructions.md': general,
    'instructions/backend.instructions.md': backend,
    'instructions/frontend.instructions.md': frontend,
    'instructions/testing.instructions.md': testing,
    'instructions/security.instructions.md': security,
    'instructions/spec.instructions.md': specSkill,
    'instructions/git.instructions.md': gitInstructions,
    'ROOT:AGENTS.md': agentsMd,
  }
}

// ---------------------------------------------------------------------------
// Static git.instructions.md (deterministic — same for all projects)
// ---------------------------------------------------------------------------

function generateGitInstructions(ctx) {
  return `---
applyTo: "**"
---

# Git Conventions

## Branching Strategy

Use **trunk-based development** with short-lived feature branches:

- \`main\` — production-ready code only; protected; requires PR + approval
- \`develop\` — integration branch (if using GitFlow)
- \`feat/<ticket-id>-<short-description>\` — new features
- \`fix/<ticket-id>-<short-description>\` — bug fixes
- \`chore/<description>\` — maintenance, dependency updates
- \`docs/<description>\` — documentation only changes
- \`perf/<description>\` — performance improvements
- \`refactor/<description>\` — code refactoring without feature changes

Branch names: lowercase, hyphens-only, max 60 chars.

## Commit Message Convention

Follow **Conventional Commits** (https://www.conventionalcommits.org):

\`\`\`
<type>(<scope>): <short summary>

[optional body]

[optional footer: Closes #123, BREAKING CHANGE: ...]
\`\`\`

**Types**: feat | fix | docs | style | refactor | perf | test | chore | ci | build | revert

**Rules**:
- Summary: imperative mood, no period at end, max 72 chars
- Body: wrap at 72 chars, explain WHY not what
- Breaking changes: add \`!\` after type/scope and BREAKING CHANGE footer
- Always reference the issue number in footer: \`Closes #<id>\`

**TDD commits follow this sequence**:
1. \`test(scope): add failing tests for <feature>\`
2. \`feat(scope): implement <feature> to pass tests\`
3. \`refactor(scope): clean up <feature> implementation\`

## Pull Request Rules

- PRs must be small and focused (< 400 lines diff preferred)
- Every PR must reference an issue or spec document
- All CI checks must pass before merge
- At least 1 approval required (2 for changes to \`main\`)
- Squash merge to main; merge commit to develop
- Delete branch after merge
- Never force-push to \`main\` or \`develop\`

## What NOT to Commit

- \`.env\` files or any file containing secrets
- Generated files (dist/, build/, coverage/, node_modules/)
- Editor-specific files (add to .gitignore)
- Failing tests (except in TDD Red phase — tag commit with \`[red]\`)
- Debug code, console.log statements, TODO-only commits
`
}
