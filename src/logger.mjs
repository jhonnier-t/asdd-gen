// ANSI color codes — no external dependencies
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const MAGENTA = '\x1b[35m'
const BLUE = '\x1b[34m'

export const log = {
  info: (msg) => console.log(`${CYAN}ℹ${RESET} ${msg}`),
  success: (msg) => console.log(`${GREEN}✔${RESET} ${msg}`),
  warn: (msg) => console.log(`${YELLOW}⚠${RESET} ${msg}`),
  error: (msg) => console.error(`${RED}✖${RESET} ${msg}`),
  phase: (phase, msg) => console.log(`${BOLD}${MAGENTA}[Phase ${phase}]${RESET} ${msg}`),
  agent: (name, msg) => console.log(`  ${BLUE}→${RESET} ${DIM}${name}${RESET}: ${msg}`),
  title: (msg) => console.log(`\n${BOLD}${CYAN}${msg}${RESET}\n`),
  dim: (msg) => console.log(`${DIM}${msg}${RESET}`),
}
