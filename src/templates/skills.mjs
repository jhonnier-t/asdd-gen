export { skillAsddOrchestrate, skillGenerateSpec, skillImplementBackend, skillImplementFrontend, skillUnitTesting, skillGherkinCaseGenerator, skillRiskIdentifier }

// SKILL.md files — slash-command skill definitions

function skillAsddOrchestrate() {
  return `---
name: asdd-orchestrate
description: "Orchestrates the full ASDD pipeline. Phase 1 (Spec) → Phase 2 (TDD Red ∥) → Phase 3 (TDD Green ∥) → Phase 4 (QA)."
argument-hint: "<feature-name> | status"
---

# ASDD Orchestrate

## Pipeline

\`\`\`
[PHASE 1 — SEQUENTIAL]
  @spec → .github/specs/<feature>.spec.md  (DRAFT → APPROVED)

[PHASE 2 — PARALLEL ∥ — TDD Red]
  @tdd-backend  ∥  @tdd-frontend
  → write failing tests — NO implementation yet
  → verify: all tests must FAIL before Phase 3

[PHASE 3 — PARALLEL ∥ — TDD Green]
  @backend  ∥  @frontend
  → implement code to make Phase 2 tests pass
  → verify: all tests must PASS before Phase 4

[PHASE 4 — PARALLEL ∥]
  @qa ∥ @documentation (optional)
  → Gherkin scenarios + risk analysis + docs
\`\`\`

## Process
1. Look for \`.github/specs/<feature>.spec.md\`
   - Does not exist → invoke \`/generate-spec\` and wait
   - \`DRAFT\` → ask user to review and approve
   - \`APPROVED\` → update to \`IN_PROGRESS\` and continue
2. Launch Phase 2 in parallel (@tdd-backend + @tdd-frontend) — Red Phase
3. Verify tests FAIL → then launch Phase 3 in parallel (@backend + @frontend) — Green Phase
4. Verify ALL tests pass → then launch Phase 4 (@qa) — optionally @documentation
5. Update spec to \`IMPLEMENTED\` and report final status

## Status command
When called with \`status\`: list all specs in \`.github/specs/\` with their current status and next pending action.

## Rules
- No spec with \`APPROVED\` status → no code. No exceptions.
- Do not implement directly — only coordinate and delegate.
- If a phase fails → stop the pipeline and report to user with context.
- Phase 5 (documentation) only if explicitly requested.
`
}

function skillGenerateSpec() {
  return `---
name: generate-spec
description: "Generates a technical ASDD spec in .github/specs/<feature>.spec.md. Required before any implementation."
argument-hint: "<feature-name>: <requirement description>"
---

# Generate Spec

## Definition of Ready — validate before generating

A story can generate a spec only if:

- [ ] Clear feature name and one-sentence description provided
- [ ] At least one user story (As a / I want / So that)
- [ ] Acceptance criteria in Given/When/Then format
- [ ] API contract defined if applicable (method, route, request, response, HTTP codes)
- [ ] No ambiguity in scope — open questions are listed

If requirements do not meet DoR → list pending questions before generating.

## Process

1. Check for existing requirement in \`.github/requirements/<feature>.md\` (use it if exists)
2. Read stack: \`.github/instructions/backend.instructions.md\`, \`.github/instructions/frontend.instructions.md\`
3. Explore existing code — do not duplicate existing models or endpoints
4. Validate DoR (above) — list questions if there are ambiguities
5. Use the spec template from \`.github/specs/SPEC-TEMPLATE.md\` EXACTLY
6. Save to \`.github/specs/<feature-name-kebab-case>.spec.md\`

## Required frontmatter

\`\`\`yaml
---
id: FEAT-XXX
title: "<Feature title>"
status: draft
created: YYYY-MM-DD
author: spec-generator
---
\`\`\`

## Required sections

- \`## 1. Context & Motivation\` — why this feature exists
- \`## 2. Goals\` — measurable objectives
- \`## 3. Acceptance Criteria\` — Given/When/Then format
- \`## 4. Data Model\` — entities and relationships
- \`## 5. API Contract\` — endpoints with request/response/codes
- \`## 6. Non-Functional Requirements\` — performance, security, accessibility

## Restrictions

- Read and create only. Do not modify existing code.
- Status always \`draft\`. User approves before implementation.
`
}

function skillImplementBackend() {
  return `---
name: implement-backend
description: "Implements a complete backend feature. Requires spec with status APPROVED in .github/specs/."
argument-hint: "<feature-name>"
---

# Implement Backend

## Prerequisites
1. Read spec: \`.github/specs/<feature>.spec.md\` — sections: API contract, data model
2. Read architecture: \`.github/instructions/backend.instructions.md\`
3. Read coding standards: \`.github/copilot-instructions.md\`

## Implementation order
\`\`\`
Domain → Application → Infrastructure → API
\`\`\`

| Layer | Responsibility | Forbidden |
|-------|---------------|-----------|
| **Domain** | Entities, value objects, business rules, domain interfaces | Framework imports |
| **Application** | Use-cases, DTOs, input validation | Direct DB queries |
| **Infrastructure** | Repository implementations, migrations, adapters | Business logic |
| **API** | Route handlers, DI wiring, request/response mapping | Business logic |

## Rules
- Make tests pass — NEVER modify tests to pass
- Follow naming and patterns from existing code exactly
- Validate all inputs at API boundaries (schema validation)
- Apply OWASP Top 10: parameterized queries, sanitized inputs, auth enforcement
- Reference spec ID in file headers: \`// Spec: FEAT-XXX\`

## Restrictions
- Only backend directory. Do not touch frontend.
- Do not generate tests (responsibility of @tdd-backend).
`
}

function skillImplementFrontend() {
  return `---
name: implement-frontend
description: "Implements a complete frontend feature. Requires spec with status APPROVED in .github/specs/."
argument-hint: "<feature-name>"
---

# Implement Frontend

## Prerequisites
1. Read spec: \`.github/specs/<feature>.spec.md\` — sections: UI requirements, acceptance criteria
2. Read conventions: \`.github/instructions/frontend.instructions.md\`
3. Read coding standards: \`.github/copilot-instructions.md\`

## Implementation checklist
- [ ] Components match spec UI requirements exactly
- [ ] Loading, error, and empty states handled for all async operations
- [ ] Form validation with inline error messages
- [ ] Accessibility: semantic HTML, ARIA attributes, keyboard navigation
- [ ] Responsive layout at mobile and desktop breakpoints
- [ ] API calls go through the project's existing data-fetching layer
- [ ] No business logic in components — extract to hooks or services
- [ ] No inline styles — use project's styling system

## Rules
- Make tests pass — NEVER modify tests to pass
- Follow component structure from existing files exactly
- Single responsibility: one component does one thing
- Reference spec ID in file headers: \`// Spec: FEAT-XXX\`

## Restrictions
- Only frontend directory. Do not touch backend.
- Do not generate tests (responsibility of @tdd-frontend).
`
}

function skillUnitTesting() {
  return `---
name: unit-testing
description: "Generates the full unit test suite for a feature. Run after spec is APPROVED, before or after implementation."
argument-hint: "<feature-name>"
---

# Unit Testing

## Process
1. Read spec: \`.github/specs/<feature>.spec.md\` — acceptance criteria and edge cases
2. Read testing conventions: \`.github/instructions/testing.instructions.md\`
3. Read existing test files to match patterns (naming, structure, helpers, mocks)
4. Generate backend and frontend test suites

## Backend tests to generate

| Layer | File pattern | Content |
|-------|-------------|---------|
| API/Routes | \`tests/routes/test_<feature>_router\` | Integration: HTTP client, auth headers |
| Services | \`tests/services/test_<feature>_service\` | Unit: mock all repos |
| Repositories | \`tests/repositories/test_<feature>_repo\` | Unit: mock DB client |

**Minimum coverage per layer:**
- Happy path (HTTP 200/201)
- Validation error (HTTP 400/422)
- Unauthorized (HTTP 401)
- Not found (HTTP 404)

## Frontend tests to generate

| Type | File pattern | Content |
|------|-------------|---------|
| Components | \`__tests__/<Component>.test\` | Renders, user events, states |
| Hooks | \`__tests__/<hook>.test\` | State transitions, mock API |
| Integration | \`__tests__/<feature>.integration.test\` | Full user flow |

## Rules
- Tests must fail before implementation (Red phase) — verify with test runner
- Mock all external dependencies at system boundaries
- Use business-readable test names, not implementation details
- Add spec ID at the top of each test file: \`// Spec: FEAT-XXX\`
- NEVER modify existing passing tests
`
}

function skillGherkinCaseGenerator() {
  return `---
name: gherkin-case-generator
description: "Maps critical flows, generates Gherkin scenarios, and defines test data from the spec. Output in docs/output/qa/."
argument-hint: "<feature-name>"
---

# Gherkin Case Generator

## Process
1. Read spec: \`.github/specs/<feature>.spec.md\` — acceptance criteria and business rules
2. Identify critical flows (happy paths + error paths + edge cases)
3. Generate one Gherkin scenario per acceptance criterion
4. Define synthetic test data per scenario
5. Save to \`docs/output/qa/<feature>-gherkin.md\`

## Critical flows — identify first

| Type | Impact | Tag |
|------|--------|-----|
| Main happy path | High | \`@smoke @critical\` |
| Input validation | Medium | \`@error-path\` |
| Authorization/auth | High | \`@smoke @security\` |
| Edge case | Variable | \`@edge-case\` |

## Gherkin format

\`\`\`gherkin
Feature: [feature in business language]
  As a [actor]
  I want to [goal]
  So that [benefit]

  @smoke @critical
  Scenario: [successful flow]
    Given [precondition]
    When [user action]
    Then [verifiable result]

  @error-path
  Scenario: [expected error]
    Given [precondition]
    When [invalid action]
    Then [appropriate error message is shown]
    And [the operation is NOT performed]
\`\`\`

## Rules
- Business language only — no API routes or technical IDs in Gherkin
- Scenarios must be independent (no shared mutable state)
- One scenario per acceptance criterion at minimum
- Include a test data table for scenarios with multiple inputs
`
}

function skillRiskIdentifier() {
  return `---
name: risk-identifier
description: "Classifies risks for a feature using the ASD risk rule (High/Medium/Low). Output in docs/output/qa/."
argument-hint: "<feature-name>"
---

# Risk Identifier

## Process
1. Read spec: \`.github/specs/<feature>.spec.md\`
2. Read implemented code for the feature
3. Identify all risk vectors
4. Classify each risk by probability × impact
5. Save to \`docs/output/qa/<feature>-risks.md\`

## ASD Risk Rule

\`\`\`
Risk Level = Probability × Impact

HIGH   = likely to occur AND significant damage if it does
MEDIUM = either likely OR significant impact, not both
LOW    = unlikely AND low damage
\`\`\`

## Risk vectors to evaluate

| Vector | Examples |
|--------|---------|
| **Security** | Auth bypass, injection, data exposure, IDOR |
| **Data integrity** | Missing validation, race conditions, partial updates |
| **Performance** | N+1 queries, missing indexes, unbounded results |
| **Availability** | No timeout on external calls, cascading failures |
| **User experience** | Missing error states, inaccessible UI, confusing flows |
| **Compliance** | PII handling, audit trail, retention policies |

## Output format

\`\`\`markdown
## Risk Matrix — <Feature>

| ID | Risk | Vector | Probability | Impact | Level | Mitigation |
|----|------|--------|-------------|--------|-------|-----------|
| R-01 | [description] | Security | High | High | **HIGH** | [action] |
\`\`\`

## Rules
- Every HIGH risk must have a concrete mitigation action
- Do not mark risks as LOW without justification
- If a risk is already mitigated in code, note it as "Mitigated: [how]"
`
}

// ---------------------------------------------------------------------------
// Git hooks and tooling
// ---------------------------------------------------------------------------
