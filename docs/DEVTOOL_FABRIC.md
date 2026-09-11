# APEX Devtool Fabric

This repository is the control plane for the muffy86 development ecosystem. The goal is not to install every AI developer tool; it is to expose a small, composable set of high-value tools behind stable interfaces and policy gates.

## Architecture

```text
ChatGPT / Remote Desktop Commander / GitHub
                 |
        APEX Control Plane
                 |
   +-------------+-------------+
   |             |             |
 Codex        Gemini         Goose
 primary       reviewer       MCP/ACP
 builder       Android        extensibility
   |             |             |
   +------ Git worktrees ------+
                 |
         Context + analysis
          Jctx / Aider
                 |
          build / test / CI
                 |
             projects
```

## Phase 1 core

1. **OpenAI Codex CLI** — primary implementation agent. Apache-2.0. Install with `npm install -g @openai/codex`.
2. **Gemini CLI** — Android/Google review lane, shell + MCP. Apache-2.0. Install with `npm install -g @google/gemini-cli@latest`.
3. **Goose** — vendor-neutral local agent and MCP/ACP bridge. Install from the official AAIF release script.
4. **Aider** — narrow Git-aware patching and model-independent second implementation path.
5. **Jctx** — architecture-aware Java/Kotlin/Python context extraction; especially valuable for Android repositories.

## Phase 2 candidates

Evaluate before adoption: SwarmClaw, AgentsMesh, Bernstein/OpenASE, CCG Workflow, sourcebook, codesight, 4DA, Qodo/CodeRabbit and `crit`. No tool enters the trusted execution path until its license, maintenance status, credential handling, sandbox model and overlap with the core are reviewed.

## Execution policy

- `main` is protected by process: agents work on dedicated branches/worktrees and changes merge through PRs.
- Agents do not receive production credentials by default.
- Secrets stay in OS keychains, environment injection, CI secret stores or dedicated vaults; never repository files.
- Destructive shell, package publishing, signing-key access, cloud deletion and production deployment require an explicit approval boundary.
- Local models are preferred for low-risk/high-volume work; frontier models are reserved for difficult reasoning and final review.
- Every automated implementation task ends with build/tests plus a concise machine-readable report.
- Android runtime code remains Android-native; workstation agents build and verify it rather than being shipped inside the APK.

## ChatGPT bridge

GitHub is already the durable bridge between ChatGPT and the projects: repository inspection, branch creation, file edits, issues, PRs and CI investigation can be driven from chat. The stronger bridge is a user-authorized remote-computer connector, which lets ChatGPT operate the development machine's filesystem and terminal. That turns the local CLI agents above into callable execution workers while GitHub remains the audit log and review boundary.

## Project lanes

- `ai-orchestration-platform`: development control plane, tool registry, routing, policy, telemetry and project adapters.
- `aura-ai-copilot`: user-facing multi-agent workspace; should consume control-plane APIs rather than duplicate orchestration.
- Android sovereign-agent project: native Kotlin/Compose client/runtime with voice, MediaProjection/vision, Accessibility, local inference, memory, browser/tool execution and approval policy.
- PDR projects such as `dent-ai-vision-suite`: domain workers plugged into the same control plane, with separate data/security policies.

## Immediate acceptance tests

A workstation is considered ready when all of these pass:

```text
node --version
npm --version
codex --version
gemini --version
goose --version
aider --version
jctx --version
adb version
java -version
```

Then each project must pass its native build/test commands before any agent-driven PR is considered mergeable.
