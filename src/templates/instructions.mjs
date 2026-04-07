export { instructionGeneral, instructionSpec, instructionBackend, instructionFrontend, instructionTesting, instructionSecurity, instructionGit }

// .instructions.md files — path-scoped, auto-applied via applyTo

function instructionGeneral(name) {
  return `---
applyTo: "**"
---

# General Instructions — ${name}

These instructions apply to **all files** in this project.

## Design Principles

Follow these principles in all code:

- **SOLID**: Every class/module has one reason to change; depend on abstractions not concretions
- **DRY**: Extract shared logic; never copy-paste code — create a shared utility
- **KISS**: Prefer the simplest solution that works; avoid premature abstraction
- **YAGNI**: Do not build features until they are explicitly required
- **Separation of Concerns**: Each layer/module has one well-defined responsibility

## Naming Conventions

- Variables and functions: camelCase, descriptive names (\`getUserById\`, not \`getUser\` or \`g\`)
- Classes and types: PascalCase (\`UserRepository\`, \`CreateUserDto\`)
- Constants: UPPER_SNAKE_CASE (\`MAX_RETRY_COUNT\`)
- Files: kebab-case (\`user-repository.ts\`, \`create-user.dto.ts\`)
- Boolean variables: prefix with \`is\`, \`has\`, \`can\`, \`should\`

## Error Handling

- Never silently catch and discard exceptions
- Always propagate errors to callers or translate to domain-specific errors
- Include context in error messages: what operation failed and why
- Log errors at the boundary where they are handled — not at every layer
- Distinguish recoverable errors (return error result) from unrecoverable ones (throw)

## Immutability

- Prefer \`const\` over \`let\`; never use \`var\`
- Prefer immutable data transformations (map/filter/reduce) over mutation
- Use record/object spread for updates; avoid direct mutation

## Comments

- Comment *why*, not *what* — code should be self-documenting
- Prefer renaming unclear code over adding a comment
- JSDoc/TSDoc for all public API surfaces (functions, types, classes)
- Remove commented-out code — use version control instead

## Import Organization

1. External/standard library imports
2. Internal absolute imports (by path alias)
3. Internal relative imports
4. Type-only imports (last, or grouped with their source)

## Forbidden Patterns

- No \`any\` type in TypeScript (use \`unknown\` and narrow it)
- No \`console.log\` in committed code (use project's logger)
- No hardcoded secrets, tokens, or URLs (use environment variables)
- No nested ternaries (use if/else or extract to a function)
- No functions longer than 40 lines (extract to helpers)
- No files longer than 300 lines (split into modules)

## ASDD Workflow Reminder

Always follow the spec-first workflow:
1. Spec approved → 2. Tests written → 3. Code implemented → 4. Docs updated
Never write implementation code without an approved spec.
`
}

function instructionSpec() {
  return `---
applyTo: ".github/specs/**"
---

# Spec Instructions

These instructions apply to all spec files in \`.github/specs/\`.

## Spec File Requirements

Every spec file must contain all 10 required sections (no section may be omitted or empty):

1. Context & Motivation
2. Goals
3. Non-Goals
4. Actors & Entry Points
5. Functional Requirements
6. Acceptance Criteria ← **must use Given/When/Then format**
7. Data Model
8. API Contract (or "N/A — no API changes")
9. Non-Functional Requirements
10. Open Questions (or "None — all resolved")

## Frontmatter fields

\`\`\`yaml
---
id: FEAT-XXX           # Unique, sequential, never reused
title: "Feature title" # Descriptive, verb-noun form
status: draft          # draft | in-review | approved | done | cancelled
created: YYYY-MM-DD
author: github-handle
agents: tdd-backend, backend, documentation, qa  # which agents will run
---
\`\`\`

## Acceptance Criteria format

Each criterion must use Given/When/Then:
\`\`\`
**Scenario: <name>**
- Given: <precondition that must be true>
- When: <action that the actor performs>
- Then: <expected system response>
- And: <optional additional assertion>
\`\`\`

## Status transitions

\`draft\` → \`in-review\` → \`approved\` → \`done\`

Only move to \`approved\` when:
- All sections are complete
- All Open Questions are resolved
- Acceptance criteria authored in Given/When/Then

Once \`approved\`, spec content must NOT be changed without creating a new FEAT ID.
`
}

function instructionBackend() {
  return `---
applyTo: "{src,app,server,api,lib,services,domain,infrastructure}/**"
---

# Backend Instructions

These instructions apply to all backend source files.

## Architecture

Follow a layered architecture with strict dependency direction (inward only):

\`\`\`
API / Controller   → Application / Use-Case   → Domain   ← Infrastructure
\`\`\`

- **Domain layer**: entities, value objects, domain events, repository interfaces — zero external dependencies
- **Application layer**: use-cases, commands, queries, DTOs — depends only on Domain
- **Infrastructure layer**: repositories, adapters, DB — implements Domain interfaces
- **API layer**: routes, controllers, middleware — calls Application use-cases

## API Design

- Use HTTP verbs correctly: GET (read), POST (create), PUT (full replace), PATCH (partial update), DELETE
- Use plural nouns for resource paths: \`/api/v1/users\`, \`/api/v1/orders\`
- Return proper HTTP status codes: 200 (ok), 201 (created), 204 (no content), 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 422 (unprocessable), 500 (server error)
- Version APIs: \`/api/v1/\`
- Return paginated responses for list endpoints with \`{ data: [], total, page, pageSize }\`

## Validation

- Validate all inputs at the API boundary using a schema validation library
- Never trust client input — validate types, formats, lengths, and ranges
- Return structured validation errors with field-level messages

## Database Patterns

- Never query from controllers — use repositories/services
- Use parameterized queries — never string-concatenate SQL
- Wrap multi-step operations in transactions
- Avoid N+1: use joins or batched queries for related data
- Add indexes for columns used in WHERE/ORDER BY clauses

## Security (OWASP Top 10)

- Parameterized queries for all database access (prevent SQL injection)
- Validate and sanitize all user inputs
- Enforce authentication before accessing protected routes
- Enforce authorization: verify the requester owns/can access the resource
- Never log or expose passwords, tokens, or secret keys
- Set appropriate CORS headers and CSP
- Rate-limit sensitive endpoints (login, password reset, etc.)
`
}

function instructionFrontend() {
  return `---
applyTo: "{src/components,src/pages,src/app,src/features,src/ui}/**"
---

# Frontend Instructions

These instructions apply to all frontend/UI source files.

## Component Design

- One component = one responsibility. If you need a comment to explain what it does, split it.
- Components receive data via props — no internal HTTP calls in components
- Extract data-fetching into custom hooks or a query layer
- Avoid deeply nested component hierarchies (max 4 levels)
- Export named components, not anonymous arrow functions

## State Management

| State type | Where to store |
|------------|----------------|
| Local UI state (open, selected, focused) | \`useState\` inside component |
| Shared UI state (modal, toast, theme) | Context or store |
| Server state (fetched data) | Query library / SWR / React Query |
| URL state (filters, pagination) | URL search params |
| Form state | Form library / controlled inputs |

## Async States (always handle all 3)

\`\`\`
Loading state → show skeleton/spinner, disable interactions
Error state   → show user-friendly message, offer retry
Success state → render data
\`\`\`

Never render data without first handling loading and error states.

## Accessibility

- Use semantic HTML: \`<button>\` for buttons, \`<a>\` for links, \`<nav>\` for navigation
- Every form input must have a visible \`<label>\` or \`aria-label\`
- Images need descriptive \`alt\` text (empty \`alt=""\` for decorative images)
- Interactive elements must be keyboard-operable (Tab, Enter, Space, Esc)
- Manage focus after modal open/close
- Color alone must not convey meaning

## Performance

- Lazy-load routes and heavy components (\`React.lazy\` or dynamic import)
- Memoize only when profiling proves it necessary (\`useMemo\`, \`React.memo\`)
- Never cause layout thrash (batch DOM reads and writes)
- Paginate or virtualize large lists (> 100 items)

## Styling

- Use classes/CSS modules/styled components from the project's styling system
- No inline styles for anything beyond dynamic values
- No hardcoded colors or spacing (use design tokens/theme values)
`
}

function instructionTesting() {
  return `---
applyTo: "**/*.{test,spec}.{ts,tsx,js,jsx,mjs}"
---

# Testing Instructions

These instructions apply to all test files.

## TDD Mandate

**Tests are written BEFORE implementation (Red → Green → Refactor).**

1. **Red**: Write a failing test that describes expected behavior
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Clean up without breaking the tests

## Test Organization

- Unit tests co-located with source files: \`user.service.test.ts\` next to \`user.service.ts\`
- Integration tests in \`__tests__/\` or \`tests/\` directory
- E2E tests in \`e2e/\` or \`playwright/\` directory
- Group with \`describe\` blocks matching module/class/function structure
- Test names must describe behavior: \`"should return 404 when user is not found"\`

## AAA Pattern (mandatory)

Every test must have clearly delineated sections:
\`\`\`
// Arrange — set up data, mocks, system state
// Act     — call the code under test (usually one line)
// Assert  — verify outcomes and side effects
\`\`\`

## What to test

✅ Test: public behavior, return values, side effects, error scenarios, boundaries
❌ Do not test: private methods, internal state, implementation details, third-party code

## Mocking rules

- Mock at the boundary of your module (e.g., repository, HTTP client)
- Prefer fakes/stubs over mocks when state matters
- Do not over-mock: if it's fast and deterministic, use the real thing
- Always restore/reset mocks between tests

## Test data

- Use factory functions or builders for test data creation
- No magic strings/numbers in assertions — use named constants
- Never share mutable state between tests

## Coverage targets

| Module type | Minimum coverage |
|-------------|------------------|
| Domain / Business logic | 90% |
| Use-cases / Services | 80% |
| API controllers | 70% |
| UI Components | 70% |
| Utilities | 90% |

## Forbidden patterns

- Never commit tests with \`.only\` or \`.skip\`
- Never use \`setTimeout\` / \`sleep\` in tests — use fake timers or async utilities
- Never test implementation internals (private fields, internal function calls)
- Never assert on exact timestamps — use relative comparisons or mock time
`
}

function instructionSecurity() {
  return `---
applyTo: "**"
---

# Security Instructions

These instructions apply to **all files**.

## OWASP Top 10 (mandatory compliance)

### A01 — Broken Access Control
- Always verify authentication before accessing protected resources
- Always verify authorization: requester must own/have permission for the resource
- Enforce access control at the server — never trust client-side checks
- Default to deny access; explicitly grant permissions

### A02 — Cryptographic Failures
- Never store passwords in plaintext — use bcrypt/argon2 with appropriate cost factor
- Use HTTPS everywhere — never transmit sensitive data over HTTP
- Never log or expose secrets, tokens, passwords, or PII
- Rotate secrets and tokens regularly

### A03 — Injection
- **Always** use parameterized queries or ORMs — never concatenate user input into SQL
- Escape output when rendering user-provided content in HTML
- Validate, sanitize, and encode all inputs at system boundaries

### A07 — Authentication Failures
- Implement account lockout or rate-limiting for authentication endpoints
- Use secure session management (httpOnly, Secure, SameSite cookies)
- Enforce strong password policies
- Use short-lived tokens with refresh token rotation

### A09 — Security Logging
- Log authentication events (login, logout, failed attempts)
- Log authorization failures
- Never log passwords, tokens, PII, or secrets
- Store logs securely and monitor for anomalies

## Secrets management

- All secrets must come from environment variables — never hardcoded
- Never commit \`.env\` files, API keys, or credentials to version control
- Use \`.env.example\` with placeholder values for documentation
- Validate required environment variables at startup

## Input validation

- Validate type, format, length, and range of all inputs
- Reject unexpected fields in request bodies (allowlist, not blocklist)
- Sanitize file uploads: check MIME type, file extension, and content separately

## Dependencies

- Keep dependencies up to date
- Run \`npm audit\` / \`pip-audit\` / \`cargo audit\` regularly
- Remove unused dependencies
`
}

function instructionGit() {
  return `---
applyTo: ".github/**"
---

# Git & Collaboration Instructions

## Commit Message Format (Conventional Commits)

\`\`\`
<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]

[optional footer — BREAKING CHANGE, Closes #issue, Refs FEAT-XXX]
\`\`\`

### Types
| Type | When to use |
|------|-------------|
| \`feat\` | New feature |
| \`fix\` | Bug fix |
| \`test\` | Adding/updating tests |
| \`docs\` | Documentation only |
| \`refactor\` | Code change that isn't feat or fix |
| \`chore\` | Build, tooling, dependency updates |
| \`perf\` | Performance improvement |
| \`ci\` | CI/CD pipeline changes |

### Rules
- Subject line ≤ 72 characters, imperative mood ("add" not "added")
- Always reference spec ID: \`feat(auth): add email verification (FEAT-042)\`
- Breaking changes: add \`BREAKING CHANGE:\` in footer with migration instructions

## Branch Strategy

\`\`\`
main          — production (protected, requires PR + review)
staging       — pre-production testing
develop       — integration branch (optional)
feat/FEAT-XXX-slug    — feature work
fix/FEAT-XXX-slug     — bug fixes
chore/description     — maintenance
\`\`\`

## Pull Request Rules

- PR title must follow Conventional Commits format
- PR description must link to the spec: "Implements FEAT-XXX"
- All CI checks must pass before merge
- At least one code review approval required
- Squash commits when merging feature branches
- Delete branch after merge
`
}

// ---------------------------------------------------------------------------
// ASDD Skills (slash commands)
// ---------------------------------------------------------------------------
