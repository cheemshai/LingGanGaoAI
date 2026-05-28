$ErrorActionPreference = "Stop"

$repoUrl = "https://github.com/cheemshai/LingGanGaoAI.git"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Invoke-Git {
    git @args
    if ($LASTEXITCODE -ne 0) {
        throw "git $args failed with exit code $LASTEXITCODE"
    }
}

$safeRoot = $root.Replace("\", "/")
git config --global --add safe.directory $safeRoot

if (-not (Test-Path -LiteralPath ".git")) {
    Invoke-Git init -b main
}

Invoke-Git config user.name "cheemshai"
Invoke-Git config user.email "cheemshai@users.noreply.github.com"

$remoteExists = $false
$remotes = git remote
if ($LASTEXITCODE -ne 0) {
    throw "git remote failed with exit code $LASTEXITCODE"
}

if ($remotes -contains "origin") {
    $remoteExists = $true
} else {
    $remoteExists = $false
}

if ($remoteExists) {
    Invoke-Git remote set-url origin $repoUrl
} else {
    Invoke-Git remote add origin $repoUrl
}

Invoke-Git add .gitignore .github ci LingGanGaoAI project.yml README.md push-to-github.ps1

git diff --cached --quiet
if ($LASTEXITCODE -eq 1) {
    Invoke-Git commit -m "Initial LingGanGaoAI iOS app scaffold"
} elseif ($LASTEXITCODE -ne 0) {
    throw "git diff --cached --quiet failed with exit code $LASTEXITCODE"
}

Invoke-Git branch -M main
Invoke-Git push -u origin main

Write-Host "Uploaded to $repoUrl"
