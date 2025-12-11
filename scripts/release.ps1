# Snipshot Release Script
# Usage: .\scripts\release.ps1 [patch|minor|major]

param(
    [Parameter(Position=0)]
    [ValidateSet('patch', 'minor', 'major')]
    [string]$VersionType = 'patch'
)

$ErrorActionPreference = 'Stop'

Write-Host "🚀 Starting release process..." -ForegroundColor Cyan

# Step 0: Update appicon from logo (if logo exists)
Write-Host "`n🎨 Updating appicon from logo..." -ForegroundColor Yellow
if (Test-Path "assets\logos\logo.png") {
    Copy-Item "assets\logos\logo.png" -Destination "build\appicon.png" -Force
    Write-Host "  ✓ Copied logo to appicon.png" -ForegroundColor Gray
    Write-Host "  ℹ️  Remember to manually convert logo.png to build\windows\icon.ico" -ForegroundColor Gray
} else {
    Write-Host "  ⚠️  Warning: assets\logos\logo.png not found, skipping icon update" -ForegroundColor Yellow
}

# Step 1: Bump version
Write-Host "`n📝 Bumping version ($VersionType)..." -ForegroundColor Yellow
node scripts/bump-version.js $VersionType

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Version bump failed!" -ForegroundColor Red
    exit 1
}

# Read new version from package.json
$packageJson = Get-Content package.json | ConvertFrom-Json
$newVersion = $packageJson.version

Write-Host "✅ Version bumped to: $newVersion" -ForegroundColor Green

# Step 2: Build
Write-Host "`n🔨 Building application..." -ForegroundColor Yellow

# Clean and build portable executable
Write-Host "  Building portable executable..." -ForegroundColor Gray
wails build -clean -platform windows/amd64

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Build NSIS installer
Write-Host "  Building NSIS installer..." -ForegroundColor Gray
wails build -platform windows/amd64 -nsis

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Installer build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Step 3: Show summary
Write-Host "`n📦 Release Summary:" -ForegroundColor Cyan
Write-Host "  Version: $newVersion" -ForegroundColor White
Write-Host "  Files:" -ForegroundColor White
Write-Host "    - build/bin/snipshot.exe" -ForegroundColor Gray
Write-Host "    - build/bin/snipshot-amd64-installer.exe" -ForegroundColor Gray

Write-Host "`n📤 Next steps:" -ForegroundColor Cyan
Write-Host "1. Test the built executables" -ForegroundColor White
Write-Host "2. Commit changes: git add . && git commit -m `"chore: release v$newVersion`"" -ForegroundColor Gray
Write-Host "3. Push to GitHub: git push origin main --tags" -ForegroundColor Gray
Write-Host "4. Create GitHub release:" -ForegroundColor White
Write-Host "   - Go to: https://github.com/fabwaseem/snipshot/releases/new" -ForegroundColor Gray
Write-Host "   - Tag: v$newVersion" -ForegroundColor Gray
Write-Host "   - Title: Release v$newVersion" -ForegroundColor Gray
Write-Host "   - Upload: build/bin/snipshot.exe" -ForegroundColor Gray
Write-Host "   - Upload: build/bin/snipshot-amd64-installer.exe" -ForegroundColor Gray

Write-Host "`n✅ Release preparation complete!" -ForegroundColor Green

