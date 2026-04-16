#!/bin/bash
# 1) Accept Xcode license (once): sudo xcodebuild -license accept
# 2) chmod +x scripts/push-to-github.sh
# 3) ./scripts/push-to-github.sh
# Sign in to GitHub when Git asks (HTTPS + token, or SSH if you use that remote URL).

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO_URL="${GITHUB_REPO_URL:-https://github.com/presi007/New-Life-City-Church.git}"

echo "Project: $ROOT"
echo "Remote:  $REPO_URL"
echo ""

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  git init
  git branch -M main
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REPO_URL"
fi

git add -A
if git diff --staged --quiet 2>/dev/null; then
  echo "No changes to commit."
else
  git commit -m "Add New Life City Church site and assets"
fi

if git push -u origin main 2>/dev/null; then
  echo "Push succeeded."
else
  echo "First push failed (remote may already have commits). Merging remote history..."
  git fetch origin
  git pull origin main --allow-unrelated-histories --no-rebase --no-edit || true
  git push -u origin main
fi

echo ""
echo "Done: https://github.com/presi007/New-Life-City-Church"
