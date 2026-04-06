# asdd-gen

**Agentic Spec Driven Development** generator.

One command. Full ASDD infrastructure for your project, generated with GitHub Copilot.

```bash
npx asdd-gen
```

Reads your project context (package.json, README, file tree), connects to GitHub Models API (powered by Copilot), and generates the complete ASDD infrastructure: AI agents, Copilot skills, git hooks, and VS Code config — everything your team needs to follow the spec-driven development workflow.

> `asdd-gen` generates the **structure**. Your team (and the generated agents) create the specs and code.

---

## What it generates

```
npx asdd-gen
```

1. **Phase 0** — Reads project context locally (package.json, README, file tree)
2. **Phase 1** — Generates `copilot-instructions.md`, the `@spec` agent definition, and `specs/SPEC-TEMPLATE.md`
3. **Phase 2** — Generates TDD backend + TDD frontend + Backend + Frontend agent definitions **in parallel**
4. **Phase 3** — Generates Documentation + QA + Orchestrator agents + Copilot skills + git hooks + VS Code config **in parallel**
5. Writes everything to `.github/`, project root, and `.vscode/`

---

## Generated structure

```
.github/
├── copilot-instructions.md          ← Main Copilot context + ASDD workflow rules
├── specs/
│   └── SPEC-TEMPLATE.md             ← Blank template — copy this per feature
├── agents/
│   ├── orchestrator.agent.md        ← @orchestrator: coordinates all sub-agents
│   ├── spec.agent.md                ← @spec: creates specs in .github/specs/
│   ├── tdd-backend.agent.md         ← @tdd-backend: writes backend tests first (reads spec)
│   ├── tdd-frontend.agent.md        ← @tdd-frontend: writes frontend tests first (reads spec)
│   ├── backend.agent.md             ← @backend: implements backend code to pass tests
│   ├── frontend.agent.md            ← @frontend: implements frontend code to pass tests
│   ├── documentation.agent.md       ← @docs: updates docs, ADRs, changelog
│   └── qa.agent.md                  ← @qa: generates Gherkin scenarios from spec
├── prompts/
│   ├── 00-orchestrate.prompt.md
│   ├── 02-tdd-backend.prompt.md
│   ├── 03-tdd-frontend.prompt.md
│   ├── 04-backend.prompt.md
│   ├── 05-frontend.prompt.md
│   ├── 06-documentation.prompt.md
│   └── 07-qa-scenarios.prompt.md
└── instructions/                    ← Copilot skills (auto-loaded by applyTo glob)
    ├── spec.instructions.md         ← Spec template + ASDD flow (applyTo: .github/specs/**)
    ├── general.instructions.md      ← Global rules (applyTo: **)
    ├── backend.instructions.md      ← Backend conventions
    ├── frontend.instructions.md     ← Frontend/component conventions
    ├── testing.instructions.md      ← TDD mandate + test patterns
    ├── security.instructions.md     ← OWASP rules (applyTo: **)
    └── git.instructions.md          ← Commit conventions + branch strategy

.husky/
├── pre-commit                       ← Runs lint-staged on staged files
├── commit-msg                       ← Validates Conventional Commits with commitlint
└── pre-push                         ← Type-check + full test suite before push

.vscode/
├── settings.json                    ← Copilot agent mode enabled + editor config
└── extensions.json                  ← Recommended extensions for this stack

commitlint.config.mjs                ← Project-specific commit scopes (generated)
lint-staged.config.mjs               ← Per-filetype lint rules (generated)
AGENTS.md                            ← AI agent catalog (human-readable)
CHANGELOG.md                         ← Project changelog
```

---

## The ASDD workflow (after running asdd-gen)

Once the structure is generated, your team follows this flow using the installed agents:

```
1. @spec   →  creates .github/specs/FEAT-001-<slug>.md
              Developer reviews and sets status: approved

2. @orchestrator  →  reads the approved spec, triggers:
   (parallel)  @tdd-backend  @tdd-frontend  @backend  @frontend

3. (parallel)  @documentation  @qa  @orchestrator(validate)
```

---

## Auth

The tool resolves a GitHub token in this order:

| Priority | Source |
|----------|--------|
| 1 | `--token <value>` CLI flag |
| 2 | `GITHUB_TOKEN` environment variable |
| 3 | `GH_TOKEN` environment variable |
| 4 | `gh auth token` (GitHub CLI) |
| 5 | OAuth device flow (opens github.com/login/device) |

---

## Options

```
--dry-run        Show what would be generated, without writing files
--model <name>   GitHub Models model (default: openai/gpt-4o)
--token <tok>    GitHub token
--output <dir>   Output directory (default: current working directory)
-y, --yes        Skip confirmation prompts
-h, --help       Show help
```

---

## Requirements

- Node.js >= 22.0.0
- A GitHub account with access to [GitHub Models](https://github.com/marketplace/models)

---

## License

MIT


