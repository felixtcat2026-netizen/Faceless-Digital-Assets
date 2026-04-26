# Handoff — Codex → Claude

**Created:** 2026-04-26 (CDT)
**Reason:** Codex hit usage limits mid-task. Paste this file into a Claude session to pick up where Codex left off.
**Working dir:** `c:\labs\Faceless Digital Assets`
**Branch:** `chore/nam-21-monorepo-baseline`

---

## TL;DR — Where things stand

- **All 12 agents are idle** (Atlas, Blake, Cora, Felix, Iris, Lyra, Morgan, Nova, Piper, Quinn, Remy, Rhea).
- **Felix is configured as CEO Orchestrator** with explicit title-based delegation (Atlas=SEO, Blake=funnel/CRO, Cora=copy, Quinn=email, Nova=social, Iris=content, Lyra=brand, Morgan=ops, Rhea=research, Piper=product, Remy=engineering).
- **Felix successfully delegated NAM-50** and created child issues NAM-59 → NAM-66 routed to specialist agents by title.
- **All `openclaw_gateway` agents have been migrated to `claude_local`** adapter (more stable in this Windows env).
- **NAM-41 and NAM-50** were unblocked. NAM-50 is `in_progress`.
- **Paperclip server may be stopped right now** — last verified up earlier in the session, currently not reachable on `127.0.0.1:3100`.

---

## Recent code changes Codex made (uncommitted)

In `C:\labs\paperclip` (the Paperclip dev checkout):

```
M package.json
M packages/adapters/openclaw-gateway/src/server/execute.test.ts
M packages/adapters/openclaw-gateway/src/server/execute.ts
M pnpm-lock.yaml
M server/src/__tests__/agent-permissions-routes.test.ts
M server/src/__tests__/openclaw-gateway-adapter.test.ts
M server/src/routes/agents.ts
M server/src/routes/plugins.ts
M server/src/services/heartbeat.ts
M server/src/services/plugin-loader.ts
?? "[object Object]/"           ← stray hermes home directory, safe to ignore/delete
?? packages/plugins/examples/plugin-relay-dashboard-example/
?? patches/hermes-paperclip-adapter@0.2.0.patch
```

Per Codex's transcript: changes spanned `execute.js` (+14 -3) plus `base.py` and `local.py` (+54 -8) — likely the hermes adapter's headless-mode patch and the claude-local adapter's CEO-orchestrator wiring.

---

## Two specific bugs Codex diagnosed (and fixed)

### 1. `NoConsoleScreenBufferError` (Hermes on Windows headless)

Hermes adapter was calling `hermes chat -q ...` which triggers `prompt_toolkit` Win32 console init. Failed in headless subprocess.

**Fix applied:** switched adapter to one-shot mode `hermes -z` for non-interactive runs. File patched: `execute.js` in the hermes-paperclip-adapter.

### 2. Provider/model auth mismatch

- `copilot` + `gpt-5.3-codex` — not licensed on this account.
- `openai-codex` + `gpt-5-codex` — rejected by ChatGPT Plus account.

**Fix applied:** `provider: openai-codex`, `model: gpt-5.4`. Verified locally with `hermes -z "Reply with ok" --provider openai-codex --model gpt-5.4` returning `ok`.

This account's available Codex models (queried from `chatgpt.com/backend-api/codex/models`):
`gpt-5.4` (default), `gpt-5.5`, `gpt-5.4-mini`, `gpt-5.3-codex`, `gpt-5.2`.

---

## Earlier session bugs that were also fixed (still relevant)

These came from the prior Claude session before Codex took over. Do NOT regress them:

### `HERMES_HOME` env-var bug

Adapter stored env values as `{"type":"plain","value":"..."}` envelopes but did `Object.assign(env, userEnv)` — Node passed the raw object to subprocess which `.toString()`'d it to `[object Object]`. Hermes wrote sessions to `CWD/[object Object]/` instead of `C:\Users\Damian\AppData\Local\hermes\`.

**Fixed in:**
- `C:\labs\paperclip\node_modules\.pnpm\hermes-paperclip-adapter@0.2.0_patch_hash=y4obxqzzcwat3jivmpq3bcrgbi\node_modules\hermes-paperclip-adapter\dist\server\execute.js` (lines 301-304)
- `C:\labs\paperclip\node_modules\.pnpm_patches\hermes-paperclip-adapter@0.2.0\dist\server\execute.js` (same lines)

The fix unwraps `{type, value}` envelopes before `env[key] = String(val.value)`.

There is still a stray `c:\labs\Faceless Digital Assets\[object Object]\` directory left over from the bug — safe to delete.

### OpenClaw gateway "unexpected property 'paperclip'" error

Heartbeat runs failed with `invalid agent params: at root: unexpected property 'paperclip'`. Root cause: the adapter unconditionally injected `agentParams.paperclip = paperclipPayload` which the gateway rejected.

**Fixed:** added `includePaperclipPayload` gate in `C:\labs\paperclip\packages\adapters\openclaw-gateway\src\server\execute.ts` (~line 1139). All `openclaw_gateway` agents had `includePaperclipPayload: false` set in adapterConfig.

Codex then went further and migrated those agents off `openclaw_gateway` entirely → `claude_local`, since the gateway path was unstable on this Windows host.

---

## Roster (after Codex's migration)

Company ID: `9c5d7a79-46fd-4517-81bd-45649be55dbb`

| Agent  | ID                                     | Role                          | Adapter        |
|--------|----------------------------------------|-------------------------------|----------------|
| Felix  | f20d1784-ba12-4782-a275-8a87ad8a44ef   | CEO Orchestrator              | hermes_local   |
| Remy   | 2eecf2b2-3cc2-4144-869d-8a798e7351d2   | Founding Engineer             | claude_local   |
| Iris   | 27399374-b360-49a6-aa6c-9f63f17d882e   | Content Creation              | claude_local   |
| Quinn  | af15bd32-135b-4999-a18c-bc436daa4ebd   | Email Marketing               | claude_local   |
| Nova   | 1b6e763b-1f3f-46b7-85fd-eb9473e42c68   | Social Media Strategist       | claude_local   |
| Atlas  | 4c0fe1fe-109f-4655-9010-80be068337bc   | SEO / Marketplace Optimization| claude_local   |
| Cora   | 89a90fbd-9945-4b0c-8caf-672110406245   | Copywriting                   | claude_local   |
| Blake  | c1103ccf-ebb5-4106-a4dc-c312deb2d374   | Funnel / Conversion           | claude_local   |
| Lyra   | 7313b67f-5d63-4db4-905a-7ed1805ea22b   | Graphic / Brand Asset         | claude_local   |
| Morgan | 022b50eb-b8de-42d6-ab57-64f56b53ba87   | Operations / PM               | claude_local   |
| Rhea   | 02c11baa-c1b1-4b84-8acd-18e8218dcdea   | Market Research               | claude_local   |
| Piper  | e3b64f6c-9007-4e98-b299-a52cabf13ea4   | Product Strategy              | claude_local   |

Verify any time:
```bash
curl -s "http://127.0.0.1:3100/api/companies/9c5d7a79-46fd-4517-81bd-45649be55dbb/agents" \
  | python -c "import json,sys; [print(f\"{a['name']:<8} {a['adapterType']:<16} {a['status']}\") for a in json.load(sys.stdin)]"
```

---

## Open items (where Claude should pick up)

1. **Verify Paperclip server is running** — `curl http://127.0.0.1:3100/api/health`. If down, restart from `C:\labs\paperclip` (`pnpm dev` or however the server is normally started).
2. **Confirm the live delegation actually completed** — check NAM-59 → NAM-66 child issues are progressing. The end-to-end Felix delegation test was the last thing Codex offered before completing.
3. **Commit Codex's uncommitted changes in `C:\labs\paperclip`** — they're staged but not committed. Review the diff first; do not blindly commit.
4. **GitHub Skills Hub setup** (was in-flight) — needs `GITHUB_TOKEN` (PAT classic, scopes: `repo`, `workflow`, `read:org`) added to hermes `.env`. Path: `(hermes config env-path).Trim()`. Then `hermes setup tools`.
5. **Skills repo recommendation** — Codex suggested using a private team repo `your-org/faceless-agent-skills` rather than a public catalog. Not actually created yet.
6. **Stray `[object Object]/` directories** — exist in both `c:\labs\Faceless Digital Assets\` and `C:\labs\paperclip\`. Safe to delete; they're leftovers from the env-var bug.
7. **`FollowUp Fuel (HVAC Edition)` deployment** — was `blocked` 4+ days ago. May or may not still need user re-open in Paperclip inbox.

---

## Useful commands

**Check agent state:**
```bash
curl -s "http://127.0.0.1:3100/api/agents/{agentId}?companyId=9c5d7a79-46fd-4517-81bd-45649be55dbb"
```

**Trigger a wakeup (correct endpoint — not `/run`):**
```bash
curl -s -X POST "http://127.0.0.1:3100/api/agents/{agentId}/wakeup?companyId=9c5d7a79-46fd-4517-81bd-45649be55dbb" \
  -H "Content-Type: application/json" -d '{}'
```

**Patch agent adapterConfig:**
```bash
curl -s -X PATCH "http://127.0.0.1:3100/api/agents/{agentId}?companyId=9c5d7a79-46fd-4517-81bd-45649be55dbb" \
  -H "Content-Type: application/json" -d '{"adapterConfig": {"key": "value"}}'
```
**Note:** PATCH deep-merges. To replace a nested object (like `env`), you may need to send the full replacement value; replacing a dict with a string in a deep-merge is rejected.

**Check run status:**
```bash
curl -s "http://127.0.0.1:3100/api/heartbeat-runs/{runId}?companyId=9c5d7a79-46fd-4517-81bd-45649be55dbb"
```

**Query Codex models available to this account:**
```bash
python -c "
import json, urllib.request
with open('C:/Users/Damian/AppData/Local/hermes/auth.json') as f:
    auth = json.load(f)
token = auth['providers']['openai-codex']['tokens']['access_token']
req = urllib.request.Request(
    'https://chatgpt.com/backend-api/codex/models?client_version=1.0.0',
    headers={'Authorization': f'Bearer {token}', 'User-Agent': 'HermesAgent/1.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    for m in json.loads(r.read())['models']:
        print(m['priority'], m['slug'])
"
```

---

## Key file paths

| What | Path |
|------|------|
| Paperclip server source | `C:\labs\paperclip\server\src\index.ts` |
| Hermes adapter (active in pnpm) | `C:\labs\paperclip\node_modules\.pnpm\hermes-paperclip-adapter@0.2.0_patch_hash=y4obxqzzcwat3jivmpq3bcrgbi\node_modules\hermes-paperclip-adapter\dist\server\execute.js` |
| Hermes adapter (patches archive) | `C:\labs\paperclip\node_modules\.pnpm_patches\hermes-paperclip-adapter@0.2.0\dist\server\execute.js` |
| OpenClaw-gateway adapter source | `C:\labs\paperclip\packages\adapters\openclaw-gateway\src\server\execute.ts` |
| Claude-local adapter source | `C:\labs\paperclip\packages\adapters\claude-local\src\` |
| Hermes home (correct) | `C:\Users\Damian\AppData\Local\hermes\` |
| Hermes auth | `C:\Users\Damian\AppData\Local\hermes\auth.json` |
| Hermes agent log | `C:\Users\Damian\AppData\Local\hermes\logs\agent.log` |
| Paperclip instance config | `C:\Users\Damian\.paperclip\instances\default\config.json` |
| Agent instructions (per agent) | `C:\Users\Damian\.paperclip\instances\default\companies\{companyId}\agents\{agentId}\instructions\` |
| Felix's delegation matrix | His `instructions\AGENTS.md` (per-agent) |
| OpenClaw gateway config | `C:\Users\Damian\.openclaw\config.json` |
| Paperclip UI | http://127.0.0.1:3100 |
| OpenClaw gateway UI | http://127.0.0.1:18789 |

---

## Auth context (don't re-fix)

- Hermes `auth_mode: chatgpt`
- ChatGPT account: `thescottssuitelife@gmail.com`
- `chatgpt_plan_type: plus`
- Available Codex models (from live API): `gpt-5.4`, `gpt-5.5`, `gpt-5.4-mini`, `gpt-5.3-codex`, `gpt-5.2`
- Models that DO NOT work with this account: `gpt-5-codex`, `o3`, `o4-mini`, `claude-opus-4.6` (all rejected with "not supported when using Codex with a ChatGPT account")
- OpenClaw gateway auth token (in `C:\Users\Damian\.openclaw\config.json`): `VfdHgw51IP06ZzS79R3Or6DoFEFiRSOEK38zUDjGhPU`

---

## Known gotchas / false alarms

- **Orphan reaper false alarm:** If `claude_local` runs are also affected like the old `openclaw_gateway` ones were — runs in DB may briefly flip to `failed`/`error: "Process lost"` after ~5 min, but the inline adapter often completes and overwrites with `succeeded`. Don't panic on intermediate `process_lost`; check final status.
- **`tsx watch` reloads:** Paperclip server runs via `tsx watch src/index.ts`. Changes to TypeScript source auto-reload, but changes to compiled `dist/` of workspace packages do not unless you also rebuild the package. Edits to `node_modules/.pnpm/.../dist/` files DO take effect on next run because they're loaded from `dist`.
- **PATCH endpoint deep-merges adapterConfig** — sending `{"env": {"X": "string"}}` over an existing `{"env": {"X": {"type":"plain","value":"..."}}}` will keep the dict, not replace it. To force replace, send the whole `env` object via PATCH or restart the agent config from the UI.

---

## What to do FIRST when picking this up

1. Read `c:\labs\Faceless Digital Assets\HANDOFF.md` (the prior Claude-session handoff — sets the older context).
2. Check Paperclip server health: `curl http://127.0.0.1:3100/api/health`. If down, restart it.
3. Run the "list all agents" command above and confirm 12 agents idle.
4. Check NAM-50 + NAM-59..NAM-66 status to confirm Felix's delegation actually flowed through.
5. Ask user what they want next — likely: commit the paperclip changes, or set up the GitHub skills hub.

---

*End of handoff. Pasting this as the first user message in a new Claude conversation should be enough to resume.*
