#!/usr/bin/env sh
set -eu

PROJECT_MODE=0
FORCE=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --project)
      PROJECT_MODE=1
      ;;
    --force)
      FORCE=1
      ;;
    -h|--help)
      printf '%s\n' "Usage: install-ai-cli-context.sh [--project] [--force]"
      printf '%s\n' ""
      printf '%s\n' "Creates global AGENTS.md, CLAUDE.md, Codex MCP config, a Claude MCP example, and find-skills."
      printf '%s\n' "Use --project to also create AGENTS.md, CLAUDE.md, .codex/config.toml, and .mcp.json in the current repo when absent."
      exit 0
      ;;
    *)
      printf '%s\n' "Unknown option: $1" >&2
      exit 1
      ;;
  esac
  shift
done

backup_file() {
  file_path="$1"
  if [ -f "$file_path" ] && [ "$FORCE" -eq 0 ]; then
    backup_path="$file_path.backup.$(date +%Y%m%d%H%M%S)"
    cp "$file_path" "$backup_path"
    printf '%s\n' "backup: $backup_path"
  fi
}

append_block_once() {
  file_path="$1"
  marker="$2"
  block="$3"

  mkdir -p "$(dirname "$file_path")"

  if [ -f "$file_path" ] && grep -q "$marker" "$file_path" 2>/dev/null; then
    printf '%s\n' "skip: $file_path already has $marker"
    return
  fi

  if [ -f "$file_path" ]; then
    backup_file "$file_path"
  fi
  {
    printf '\n%s\n' "<!-- $marker:start -->"
    printf '%s\n' "$block"
    printf '%s\n' "<!-- $marker:end -->"
  } >> "$file_path"
  printf '%s\n' "write: $file_path"
}

append_toml_block_once() {
  file_path="$1"
  marker="$2"
  block="$3"

  mkdir -p "$(dirname "$file_path")"

  if [ -f "$file_path" ] && grep -q "$marker" "$file_path" 2>/dev/null; then
    printf '%s\n' "skip: $file_path already has $marker"
    return
  fi

  if [ -f "$file_path" ]; then
    backup_file "$file_path"
  fi
  {
    printf '\n%s\n' "# $marker:start"
    printf '%s\n' "$block"
    printf '%s\n' "# $marker:end"
  } >> "$file_path"
  printf '%s\n' "write: $file_path"
}

write_if_missing() {
  file_path="$1"
  content="$2"

  if [ -e "$file_path" ] && [ "$FORCE" -eq 0 ]; then
    printf '%s\n' "skip: $file_path exists"
    return
  fi

  mkdir -p "$(dirname "$file_path")"
  if [ -e "$file_path" ]; then
    backup_file "$file_path"
  fi
  printf '%s\n' "$content" > "$file_path"
  printf '%s\n' "write: $file_path"
}

GLOBAL_RULES='# Global AI CLI rules

You are a pragmatic software engineer in my local workspace.

## Before editing

- Inspect files before changing them.
- Read project instructions first.
- Prefer small patches.
- Never revert changes I did not ask you to revert.
- Check package scripts before inventing commands.

## Docs and examples

- Use Context7 for libraries, frameworks, SDKs, APIs, CLIs, and cloud services.
- Use gh-grep for real code examples when implementation patterns are unclear.
- Treat docs as authority and public code as evidence.

## Skills

- Use find-skills when entering a new project or unfamiliar stack.
- Use task-specific skills before specialist work.

## Verification

- Run relevant checks when feasible.
- Never claim a check passed unless it ran.
- If a check was skipped, say why.'

PROJECT_RULES='# Project AI CLI rules

This file should describe this repo. Replace this paragraph with the actual stack, commands, architecture boundaries, style rules, and forbidden moves.

## Fill this in before trusting the agent

- Project type:
- Main stack:
- Package/test/build commands:
- Important directories:
- Things the agent must preserve:
- Things the agent must never do:

## Default behavior

- Inspect files before editing.
- Prefer small patches.
- Use Context7 for library docs.
- Use gh-grep for real code examples when patterns are unclear.
- Run relevant checks before claiming success.'

FIND_SKILLS='# find-skills

Use this skill when the user asks how to improve AI context for a project, choose skills for a stack, or discover task-specific agent behavior.

## Workflow

1. Inspect the project stack from files like `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `docker-compose.yml`, and framework config.
2. Identify the project purpose: app, library, CLI, infrastructure, docs, data pipeline, or mixed.
3. Recommend existing skills that match the stack and purpose.
4. If no skill exists, propose a small new skill with trigger phrases and rules.
5. Explain when each skill should be used and when it should not be used.

## Output

- Project stack detected.
- Useful skills.
- Missing skills worth creating.
- Suggested global or project instruction updates.'

CODEX_MCP='[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.gh-grep]
command = "gh-grep-mcp"
args = ["--stdio"]'

CLAUDE_MCP='{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"]
  },
  "gh-grep": {
    "command": "gh-grep-mcp",
    "args": ["--stdio"]
  }
}'

append_block_once "$HOME/AGENTS.md" "ai-cli-context" "$GLOBAL_RULES"
append_block_once "$HOME/CLAUDE.md" "ai-cli-context" "$GLOBAL_RULES"
write_if_missing "$HOME/.agents/skills/find-skills/SKILL.md" "$FIND_SKILLS"
append_toml_block_once "$HOME/.codex/config.toml" "ai-cli-context" "$CODEX_MCP"
write_if_missing "$HOME/.mcp.ai-cli-tools.json" "$CLAUDE_MCP"

if [ "$PROJECT_MODE" -eq 1 ]; then
  write_if_missing "./AGENTS.md" "$PROJECT_RULES"
  write_if_missing "./CLAUDE.md" "$PROJECT_RULES"
  append_toml_block_once "./.codex/config.toml" "ai-cli-context" "$CODEX_MCP"
  write_if_missing "./.mcp.json" "$CLAUDE_MCP"
fi

if ! command -v npx >/dev/null 2>&1; then
  printf '%s\n' "warn: npx not found. Context7 command uses npx." >&2
fi

if ! command -v gh-grep-mcp >/dev/null 2>&1; then
  printf '%s\n' "warn: gh-grep-mcp not found on PATH. Install your gh-grep MCP server or edit the generated MCP config." >&2
fi

printf '%s\n' "done: AI CLI context files installed. Restart Codex or Claude Code so MCP config is reloaded."
