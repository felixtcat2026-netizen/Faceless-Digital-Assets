param()

$ErrorActionPreference = "Stop"

function Get-LatestAdapterTestPath {
  $root = Join-Path $env:LOCALAPPDATA "npm-cache\_npx"
  if (-not (Test-Path -LiteralPath $root)) {
    throw "npx cache root not found: $root"
  }

  $match = Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like '*hermes-paperclip-adapter\dist\server\test.js' } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 -ExpandProperty FullName

  if (-not $match) {
    throw "Could not find hermes-paperclip-adapter/dist/server/test.js under $root"
  }

  return $match
}

$path = Get-LatestAdapterTestPath
$backup = "$path.bak"

if (-not (Test-Path -LiteralPath $backup)) {
  Copy-Item -LiteralPath $path -Destination $backup
}

$content = Get-Content -LiteralPath $backup -Raw

$importOld = @'
import { execFile } from "node:child_process";
'@

$importNew = @'
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
'@

$content = $content.Replace($importOld, $importNew)

$pythonPattern = 'async function checkPython\(\) \{.*?\n\}\nfunction checkModel\(config\) \{'
$pythonReplacement = @'
async function checkPython() {
    const candidates = platform() === "win32"
        ? [
            { command: "python3", args: ["--version"] },
            { command: "python", args: ["--version"] },
            { command: "py", args: ["-3", "--version"] },
        ]
        : [
            { command: "python3", args: ["--version"] },
            { command: "python", args: ["--version"] },
        ];
    for (const candidate of candidates) {
        try {
            const { stdout, stderr } = await execFileAsync(candidate.command, candidate.args, {
                timeout: 5_000,
            });
            const version = `${stdout ?? ""}${stderr ?? ""}`.trim();
            const match = version.match(/(\d+)\.(\d+)/);
            if (match) {
                const major = parseInt(match[1], 10);
                const minor = parseInt(match[2], 10);
                if (major < 3 || (major === 3 && minor < 10)) {
                    return {
                        level: "error",
                        message: `Python ${version} found - Hermes requires Python 3.10+`,
                        hint: "Upgrade Python to 3.10 or later",
                        code: "hermes_python_old",
                    };
                }
            }
            return null;
        }
        catch {
        }
    }
    return {
        level: "warn",
        message: "Python 3.10+ not found in PATH",
        hint: "Install Python 3.10+ or ensure python/python3 resolves in the Paperclip server environment",
        code: "hermes_python_missing",
    };
}
function hasHermesAuthTokens(provider) {
    try {
        const authPath = join(homedir(), ".hermes", "auth.json");
        if (!existsSync(authPath)) {
            return false;
        }
        const auth = JSON.parse(readFileSync(authPath, "utf-8"));
        const tokens = auth?.providers?.[provider]?.tokens;
        return !!(tokens?.access_token || tokens?.refresh_token || tokens?.id_token);
    }
    catch {
        return false;
    }
}
function checkModel(config) {
'@

$content = [regex]::Replace(
  $content,
  $pythonPattern,
  $pythonReplacement,
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$apiPattern = 'function checkApiKeys\(config\) \{.*?\n\}\n/\*\*\n \* Check provider/model consistency\.'
$apiReplacement = @'
function checkApiKeys(config) {
    const envConfig = (config.env ?? {});
    const resolvedEnv = {};
    for (const [key, value] of Object.entries(envConfig)) {
        if (typeof value === "string" && value.length > 0)
            resolvedEnv[key] = value;
    }
    const has = (key) => !!(resolvedEnv[key] ?? process.env[key]);
    const hasAnthropic = has("ANTHROPIC_API_KEY");
    const hasOpenRouter = has("OPENROUTER_API_KEY");
    const hasOpenAI = has("OPENAI_API_KEY");
    const hasZai = has("ZAI_API_KEY");
    const hasKimi = has("KIMI_API_KEY");
    const hasMiniMax = has("MINIMAX_API_KEY");
    const model = asString(config.model)?.toLowerCase() ?? "";
    const explicitProvider = asString(config.provider);
    const hasOpenAICodexOauth = (explicitProvider === "openai-codex" || model.includes("codex")) && hasHermesAuthTokens("openai-codex");
    if (!hasAnthropic && !hasOpenRouter && !hasOpenAI && !hasZai && !hasKimi && !hasMiniMax) {
        if (hasOpenAICodexOauth) {
            return {
                level: "info",
                message: "OpenAI Codex OAuth credentials found in Hermes auth store",
                code: "hermes_oauth_credentials_found",
            };
        }
        return {
            level: "warn",
            message: "No LLM API keys found in environment",
            hint: "Set API keys in the agent's env secrets or ~/.hermes/.env. Hermes supports: ANTHROPIC_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, ZAI_API_KEY, KIMI_API_KEY, MINIMAX_API_KEY",
            code: "hermes_no_api_keys",
        };
    }
    const providers = [];
    if (hasAnthropic)
        providers.push("Anthropic");
    if (hasOpenRouter)
        providers.push("OpenRouter");
    if (hasOpenAI)
        providers.push("OpenAI");
    if (hasZai)
        providers.push("Z.AI");
    if (hasKimi)
        providers.push("Kimi");
    if (hasMiniMax)
        providers.push("MiniMax");
    return {
        level: "info",
        message: `API keys found: ${providers.join(", ")}`,
        code: "hermes_api_keys_found",
    };
}
/**
 * Check provider/model consistency.
'@

$content = [regex]::Replace(
  $content,
  $apiPattern,
  $apiReplacement,
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

Set-Content -LiteralPath $path -Value $content -Encoding UTF8

Write-Host "Patched Hermes Paperclip adapter at: $path"
