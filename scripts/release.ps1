# Snipshot Release Script
# Usage: .\scripts\release.ps1 [patch|minor|major]

param(
    [Parameter(Position=0)]
    [ValidateSet('patch', 'minor', 'major')]
    [string]$VersionType = 'patch'
)

$ErrorActionPreference = 'Stop'

Write-Host "Starting release process..." -ForegroundColor Cyan

# Step 0: Update appicon from logo (if logo exists)
Write-Host "`nUpdating appicon from logo..." -ForegroundColor Yellow
if (Test-Path "assets\logos\logo.png") {
    Copy-Item "assets\logos\logo.png" -Destination "build\appicon.png" -Force
    Write-Host "  Copied logo to appicon.png" -ForegroundColor Gray
    Write-Host "  Remember to manually convert logo.png to build\windows\icon.ico" -ForegroundColor Gray
} else {
    Write-Host "  Warning: assets\logos\logo.png not found, skipping icon update" -ForegroundColor Yellow
}

# Step 1: Bump version
Write-Host "`nBumping version ($VersionType)..." -ForegroundColor Yellow

# Read current version before bump
$packageJsonBefore = Get-Content package.json -Raw | ConvertFrom-Json
$currentVersion = $packageJsonBefore.version

# Run version bump script
$bumpOutput = node scripts/bump-version.js $VersionType 2>&1
$bumpExitCode = $LASTEXITCODE

if ($bumpExitCode -ne 0) {
    Write-Host "Version bump failed!" -ForegroundColor Red
    Write-Host $bumpOutput
    exit 1
}

# Wait a moment for file system to sync
Start-Sleep -Milliseconds 200

# Read new version from package.json (re-read file to get updated version)
$packageJsonPath = (Resolve-Path "package.json").Path
$packageJsonContent = Get-Content $packageJsonPath -Raw
$packageJson = $packageJsonContent | ConvertFrom-Json
$newVersion = $packageJson.version

if ([string]::IsNullOrEmpty($newVersion)) {
    Write-Host "Failed to read new version from package.json!" -ForegroundColor Red
    exit 1
}

Write-Host "Version bumped: $currentVersion -> $newVersion" -ForegroundColor Green

# Step 2: Build
Write-Host "`nBuilding application..." -ForegroundColor Yellow

# Clean and build portable executable
Write-Host "  Building portable executable..." -ForegroundColor Gray
wails build -clean -platform windows/amd64

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Build NSIS installer
Write-Host "  Building NSIS installer..." -ForegroundColor Gray
wails build -platform windows/amd64 -nsis

if ($LASTEXITCODE -ne 0) {
    Write-Host "Installer build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build completed successfully!" -ForegroundColor Green

# Step 3: Commit changes
Write-Host "`nCommitting changes..." -ForegroundColor Yellow

# Check if there are changes to commit
$gitStatus = git status --porcelain
if ($gitStatus) {
    git add .
    $commitMessage = "chore: release v$newVersion"
    git commit -m $commitMessage

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Failed to commit changes. You may need to commit manually." -ForegroundColor Yellow
    } else {
        Write-Host "Changes committed" -ForegroundColor Green
    }
} else {
    Write-Host "  No changes to commit" -ForegroundColor Gray
}

# Step 4: Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow

# Get the current branch name
$currentBranch = git branch --show-current
if ([string]::IsNullOrEmpty($currentBranch)) {
    $currentBranch = "main"
}

# Push commits
git push origin $currentBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Failed to push commits. You may need to push manually." -ForegroundColor Yellow
} else {
    Write-Host "Commits pushed" -ForegroundColor Green
}

# Push tags
git push origin --tags
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Failed to push tags. You may need to push tags manually." -ForegroundColor Yellow
} else {
    Write-Host "Tags pushed" -ForegroundColor Green
}

# Step 5: Create GitHub release
Write-Host "`nCreating GitHub release..." -ForegroundColor Yellow

# Check if GitHub CLI is available
$gh = Get-Command gh -ErrorAction SilentlyContinue

if ($gh) {
    $releaseNotes = "Release v$newVersion`n`n## Changes`n- See commits for details"
    $tagName = "v$newVersion"
    $portableLabel = "Snipshot Portable (v$newVersion)"
    $installerLabel = "Snipshot Installer (v$newVersion)"

    try {
        $exeFile = "build/bin/snipshot.exe"
        $installerFile = "build/bin/snipshot-amd64-installer.exe"

        & gh release create $tagName --title "Release $tagName" --notes $releaseNotes --draft "$exeFile#$portableLabel" "$installerFile#$installerLabel"

        if ($LASTEXITCODE -eq 0) {
            Write-Host "GitHub release created (draft)" -ForegroundColor Green
            Write-Host "  Review and publish at: https://github.com/fabwaseem/snipshot/releases" -ForegroundColor Gray

            $publish = Read-Host "Publish release now? (y/N)"
            if ($publish -eq "y" -or $publish -eq "Y") {
                & gh release edit $tagName --draft=false
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Release published!" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "Failed to create GitHub release via CLI" -ForegroundColor Yellow
            Write-Host "  Create manually at: https://github.com/fabwaseem/snipshot/releases/new" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Error creating GitHub release: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "  Create manually at: https://github.com/fabwaseem/snipshot/releases/new" -ForegroundColor Gray
    }
} else {
    Write-Host "  GitHub CLI not found. Install it with: winget install --id GitHub.cli" -ForegroundColor Gray
    Write-Host "  Or create release manually:" -ForegroundColor Gray
    Write-Host "    https://github.com/fabwaseem/snipshot/releases/new" -ForegroundColor Gray
    Write-Host "    Tag: v$newVersion" -ForegroundColor Gray
    Write-Host "    Upload: build/bin/snipshot.exe" -ForegroundColor Gray
    Write-Host "    Upload: build/bin/snipshot-amd64-installer.exe" -ForegroundColor Gray
}

# Step 6: Show summary
Write-Host "`nRelease Summary:" -ForegroundColor Cyan
Write-Host "  Version: v$newVersion" -ForegroundColor White
Write-Host "  Tag: v$newVersion" -ForegroundColor White
Write-Host "  Files:" -ForegroundColor White
Write-Host "    - build/bin/snipshot.exe" -ForegroundColor Gray
Write-Host "    - build/bin/snipshot-amd64-installer.exe" -ForegroundColor Gray

Write-Host "`nRelease process complete!" -ForegroundColor Green
