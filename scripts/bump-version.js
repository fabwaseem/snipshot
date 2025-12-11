#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Parse command line arguments
const args = process.argv.slice(2);
const versionType = args[0] || "patch"; // patch, minor, or major

if (!["patch", "minor", "major"].includes(versionType)) {
  console.error("Invalid version type. Use: patch, minor, or major");
  process.exit(1);
}

// Read current version from package.json
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const currentVersion = packageJson.version;

// Parse version
const [major, minor, patch] = currentVersion.split(".").map(Number);
let newVersion;

switch (versionType) {
  case "major":
    newVersion = `${major + 1}.0.0`;
    break;
  case "minor":
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case "patch":
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

console.log(`✅ Version bumped: ${currentVersion} → ${newVersion}`);

// Create git tag
try {
  execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, {
    stdio: "inherit",
  });
  console.log(`✅ Git tag created: v${newVersion}`);
} catch (error) {
  console.warn(
    "⚠️  Failed to create git tag. Make sure you have committed changes."
  );
}

console.log("\n📦 Next steps:");
console.log(`1. Review changes in package.json (version: ${newVersion})`);
console.log("2. Run: npm run build:release");
console.log(`3. Create GitHub release: git push origin main --tags`);
console.log(
  `4. Upload build/bin/snipshot.exe and build/bin/snipshot-amd64-installer.exe to the release`
);
