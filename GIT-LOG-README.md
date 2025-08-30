# Git-Based Logging System

This directory contains a comprehensive git-based logging system that tracks all commits with detailed file changes, dates, and times.

## Files Created

- **`git-log.js`** - Main logging utility script
- **`git-commit-log.txt`** - Generated log file with commit history
- **`package.json`** - Package configuration with npm scripts
- **`GIT-LOG-README.md`** - This documentation file

## Features

✅ **Comprehensive Commit Tracking**
- Commit hash, author, email, date/time
- Commit messages
- File changes (Added, Modified, Deleted, Renamed, Copied)
- Current repository status

✅ **Detailed File Information**
- Shows exactly which files were changed in each commit
- Tracks file status (A=Added, M=Modified, D=Deleted, etc.)
- Displays untracked files in current status

✅ **Formatted Output**
- Human-readable format with clear sections
- Timestamps in YYYY-MM-DD HH:MM:SS format
- Total commit count summary

## Usage

### Generate Log File
```bash
# Run from root directory
node git-log.js

# Or use npm script
npm run git-log
```

### Watch Mode (Auto-update on git changes)
```bash
# Automatically regenerate log when git changes occur
node git-log.js --watch

# Or use npm script
npm run git-log-watch
```

### View Generated Log
The log is saved to `git-commit-log.txt` in the root directory. It contains:

1. **Header Information**
   - Generation timestamp
   - Current branch
   - Repository path

2. **Current Repository Status**
   - Untracked files
   - Modified files
   - Staged changes

3. **Commit History**
   - Each commit with full details
   - File changes for each commit
   - Author and timestamp information

## Example Output

```
### Commit: af92db4
**Author:** Yogesh Jani <janiyogesh61@gmail.com>
**Date:** 2025-08-30 10:50:15
**Message:** feat(onboarding): enhance seller onboarding with multi-step tracking
**Files Changed:**
  - Modified: client/src/App.jsx
  - Added: client/src/Pages/Seller/EnhancedSellerOnboarding.jsx
  - Modified: server/controllers/authController.js
```

## Current Status

📊 **Repository Statistics:**
- Total commits tracked: **628**
- Last generated: Check timestamp in `git-commit-log.txt`
- Current branch: `main`

## Automation

The system can automatically update the log file when:
- New commits are made
- Branch changes occur
- Repository status changes

Use the `--watch` flag to enable automatic updates.

## Integration

This logging system complements the existing application logging in:
- `server/utils/logger.js` - Application runtime logs
- `server/logs/system.log` - Server operation logs
- `git-commit-log.txt` - Git commit history logs

Together, these provide comprehensive tracking of both code changes and runtime behavior.