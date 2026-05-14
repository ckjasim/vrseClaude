# Load .env vars (Pinecone keys, Anthropic key) into the shell, then open Claude Code
$envFile = Join-Path $PSScriptRoot ".env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
            Write-Host "  set $key" -ForegroundColor DarkGray
        }
    }
    Write-Host ""
}

Write-Host "Starting VrseBuilder with Claude Code..." -ForegroundColor Cyan
Write-Host "The MCP server (mcp-server/index.js) launches automatically via .mcp.json" -ForegroundColor DarkGray
Write-Host ""
claude
