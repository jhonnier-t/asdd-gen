import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, extname } from 'node:path'

// Directories to skip when scanning
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.astro',
  'out', 'coverage', '.cache', '.turbo', 'vendor', '__pycache__',
  '.venv', 'venv', 'target', 'bin', 'obj', '.gradle',
  '.mypy_cache', '.pytest_cache', '.ruff_cache', '.tox', '.claude',
])

// Directories where we look for markdown documentation (in scan order)
const DOC_DIRS = ['', 'docs', 'wiki', 'doc', 'documentation', '.github', 'architecture', 'adr']

const MAX_DOC_CHARS = 6000   // max chars to read per markdown file
const MAX_TOTAL_DOCS = 25    // max number of markdown files to include
const MAX_DIR_DEPTH = 3      // depth for directory overview tree

// Architecture pattern signatures detected from docs
const ARCHITECTURE_SIGNATURES = [
  { name: 'Clean Architecture', keywords: ['clean architecture', 'domain layer', 'application layer', 'infrastructure layer', 'interface adapter'] },
  { name: 'Hexagonal Architecture', keywords: ['hexagonal', 'ports and adapters', 'primary port', 'secondary port', 'driven adapter'] },
  { name: 'Domain-Driven Design (DDD)', keywords: ['domain-driven', ' ddd ', 'bounded context', 'aggregate root', 'value object', 'domain event', 'ubiquitous language'] },
  { name: 'CQRS', keywords: ['cqrs', 'command query responsibility', 'command handler', 'query handler', 'read model', 'write model'] },
  { name: 'Event Sourcing', keywords: ['event sourcing', 'event store', 'event stream'] },
  { name: 'MVC', keywords: ['model-view-controller', ' mvc ', 'controller layer', 'view layer'] },
  { name: 'Repository Pattern', keywords: ['repository pattern', 'irepository', 'data repository', 'repository interface'] },
  { name: 'Event-Driven Architecture', keywords: ['event-driven', 'event bus', 'message broker', 'publish/subscribe', 'pub/sub'] },
  { name: 'Microservices', keywords: ['microservice', 'service mesh', 'api gateway', 'service discovery'] },
  { name: 'Layered Architecture', keywords: ['layered architecture', 'n-tier', 'presentation layer', 'business layer', 'data access layer'] },
]

const DEFAULT_PRINCIPLES = ['SOLID', 'DRY', 'KISS', 'YAGNI', 'Separation of Concerns']

/**
 * Reads project context by scanning only markdown documentation files.
 * Source code is not read — only .md/.mdx docs and package.json metadata.
 *
 * @param {string} rootDir - Absolute path to the project root
 * @param {object} [options]
 * @param {(event: {type: string, path?: string, message?: string}) => void} [options.onProgress]
 * @returns {ProjectContext}
 */
export function readProjectContext(rootDir, options = {}) {
  const { onProgress } = options

  const packageJson = readPackageJson(rootDir, onProgress)
  const docs = readMarkdownDocs(rootDir, onProgress)
  const techStack = detectTechStack(rootDir, packageJson)
  const architecturePatterns = detectArchitecturePatterns(docs)
  const directoryTree = buildDirectoryTree(rootDir)

  onProgress?.({
    type: 'summary',
    message: `Read ${docs.length} documentation file${docs.length !== 1 ? 's' : ''}`,
  })

  return {
    rootDir,
    projectName: packageJson?.name ?? extractNameFromPath(rootDir),
    description: packageJson?.description ?? extractDescriptionFromDocs(docs),
    version: packageJson?.version,
    techStack,
    architecturePatterns,
    docs,
    directoryTree,
    packageJson,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readPackageJson(rootDir, onProgress) {
  const filePath = join(rootDir, 'package.json')
  if (!existsSync(filePath)) return null
  try {
    onProgress?.({ type: 'file-read', path: 'package.json' })
    const pkg = JSON.parse(readFileSync(filePath, 'utf8'))
    onProgress?.({ type: 'file-indexed', path: 'package.json' })
    return pkg
  } catch {
    return null
  }
}

/**
 * Reads markdown files from known documentation directories only.
 * Does not recurse into source code directories.
 */
function readMarkdownDocs(rootDir, onProgress) {
  const docs = []
  const seen = new Set()

  for (const docDir of DOC_DIRS) {
    if (docs.length >= MAX_TOTAL_DOCS) break

    const scanDir = docDir ? join(rootDir, docDir) : rootDir
    if (!existsSync(scanDir)) continue

    let entries
    try {
      entries = readdirSync(scanDir)
    } catch {
      continue
    }

    for (const entry of entries) {
      if (docs.length >= MAX_TOTAL_DOCS) break

      const ext = extname(entry).toLowerCase()
      if (ext !== '.md' && ext !== '.mdx') continue

      const fullPath = join(scanDir, entry)
      const relPath = relative(rootDir, fullPath)

      // Skip generated spec files to avoid circular context
      if (relPath.startsWith('.github\\specs') || relPath.startsWith('.github/specs')) continue

      if (seen.has(relPath)) continue
      seen.add(relPath)

      try {
        onProgress?.({ type: 'file-read', path: relPath })
        const raw = readFileSync(fullPath, 'utf8')
        const content = raw.slice(0, MAX_DOC_CHARS)
        docs.push({ path: relPath, content })
        onProgress?.({ type: 'file-indexed', path: relPath })
      } catch {
        // unreadable file — skip
      }
    }
  }

  return docs
}

/**
 * Analyzes markdown docs to detect architecture patterns.
 * Falls back to universal design principles if nothing specific is found.
 */
function detectArchitecturePatterns(docs) {
  if (!docs.length) {
    return { detected: [], principles: DEFAULT_PRINCIPLES, isDefault: true }
  }

  const combined = docs.map((d) => d.content).join('\n').toLowerCase()
  const detected = []

  for (const { name, keywords } of ARCHITECTURE_SIGNATURES) {
    if (keywords.some((kw) => combined.includes(kw))) {
      detected.push(name)
    }
  }

  // Always include base principles alongside detected patterns
  const principles = detected.length > 0
    ? [...detected, ...DEFAULT_PRINCIPLES]
    : DEFAULT_PRINCIPLES

  return { detected, principles, isDefault: detected.length === 0 }
}

/**
 * Builds a lightweight directory structure overview (directories only, no file contents).
 */
function buildDirectoryTree(rootDir) {
  const lines = []

  function walk(dir, depth, prefix) {
    if (depth > MAX_DIR_DEPTH) return
    let entries
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }

    const dirs = entries.filter((e) => {
      const p = join(dir, e)
      return isDir(p) && !SKIP_DIRS.has(e)
    }).sort()

    for (let i = 0; i < dirs.length; i++) {
      const name = dirs[i]
      const fullPath = join(dir, name)
      const isLast = i === dirs.length - 1
      const connector = isLast ? '└── ' : '├── '
      const childPrefix = isLast ? prefix + '    ' : prefix + '│   '
      lines.push(`${prefix}${connector}${name}/`)
      walk(fullPath, depth + 1, childPrefix)
    }
  }

  walk(rootDir, 0, '')
  return lines.join('\n')
}

function isDir(p) {
  try { return statSync(p).isDirectory() } catch { return false }
}

function detectTechStack(rootDir, pkg) {
  const stack = []
  const deps = {
    ...pkg?.dependencies,
    ...pkg?.devDependencies,
  }

  const checks = [
    // Frontend frameworks
    ['react', ['react']],
    ['next.js', ['next']],
    ['vue', ['vue', '@vue/core']],
    ['nuxt', ['nuxt']],
    ['svelte', ['svelte', '@sveltejs/kit']],
    ['angular', ['@angular/core']],
    ['astro', ['astro']],
    // Styling
    ['tailwindcss', ['tailwindcss', '@tailwindcss/vite']],
    ['shadcn/ui', []] , // detected by config file
    // Backend
    ['express', ['express']],
    ['nestjs', ['@nestjs/core']],
    ['fastify', ['fastify']],
    ['hono', ['hono']],
    // Runtime/tooling
    ['typescript', ['typescript']],
    ['vite', ['vite']],
    ['vitest', ['vitest']],
    ['jest', ['jest', '@jest/core']],
    ['playwright', ['@playwright/test', 'playwright']],
    // Databases/ORM
    ['prisma', ['prisma', '@prisma/client']],
    ['drizzle', ['drizzle-orm', 'drizzle-kit']],
    ['supabase', ['@supabase/supabase-js']],
    // Auth
    ['clerk', []],   // detected by @clerk/* scope below
    ['better-auth', ['better-auth']],
    // Mobile
    ['react-native', ['react-native']],
    ['expo', ['expo']],
  ]

  for (const [name, packages] of checks) {
    if (packages.some((p) => p in deps)) stack.push(name)
  }

  // Scope-based detection
  if (Object.keys(deps).some((d) => d.startsWith('@clerk/'))) stack.push('clerk')
  if (Object.keys(deps).some((d) => d.startsWith('@aws-sdk/'))) stack.push('aws')
  if (Object.keys(deps).some((d) => d.startsWith('@azure/'))) stack.push('azure')

  // Config-file based
  if (existsSync(join(rootDir, 'components.json'))) stack.push('shadcn/ui')
  if (
    existsSync(join(rootDir, 'bun.lockb')) ||
    existsSync(join(rootDir, 'bun.lock'))
  ) stack.push('bun')
  if (existsSync(join(rootDir, 'deno.json'))) stack.push('deno')
  if (existsSync(join(rootDir, 'wrangler.toml')) ||
      existsSync(join(rootDir, 'wrangler.json'))) stack.push('cloudflare-workers')
  if (existsSync(join(rootDir, 'docker-compose.yml')) ||
      existsSync(join(rootDir, 'docker-compose.yaml')) ||
      existsSync(join(rootDir, 'Dockerfile'))) stack.push('docker')
  if (existsSync(join(rootDir, 'go.mod'))) stack.push('go')
  if (existsSync(join(rootDir, 'requirements.txt')) ||
      existsSync(join(rootDir, 'pyproject.toml'))) stack.push('python')
  if (existsSync(join(rootDir, 'Cargo.toml'))) stack.push('rust')
  if (existsSync(join(rootDir, 'pom.xml'))) stack.push('java/maven')
  if (existsSync(join(rootDir, 'build.gradle')) ||
      existsSync(join(rootDir, 'build.gradle.kts'))) stack.push('gradle')

  return [...new Set(stack)]
}

function extractNameFromPath(dir) {
  return dir.split(/[\\/]/).filter(Boolean).pop() ?? 'my-project'
}

function extractDescriptionFromDocs(docs) {
  if (!docs.length) return ''
  // Look in the README doc first, then any doc
  const readme = docs.find((d) => d.path.toLowerCase().endsWith('readme.md')) ?? docs[0]
  const lines = readme.content.split('\n').map((l) => l.trim()).filter(Boolean)
  for (const line of lines) {
    if (!line.startsWith('#') && line.length > 10) return line.slice(0, 200)
  }
  return ''
}
