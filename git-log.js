#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Git-based logging utility to track commits with file changes, dates, and times
 */
class GitLogger {
    constructor() {
        this.logFile = path.join(__dirname, 'git-commit-log.txt');
        this.ensureGitRepo();
    }

    /**
     * Ensure we're in a git repository
     */
    ensureGitRepo() {
        try {
            execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        } catch (error) {
            console.log('Initializing git repository...');
            execSync('git init', { stdio: 'inherit' });
        }
    }

    /**
     * Generate comprehensive git log with file changes
     */
    generateGitLog() {
        try {
            // Get detailed commit log with file changes
            const gitLogCommand = `git log --pretty=format:"%h|%an|%ae|%ad|%s" --date=format:"%Y-%m-%d %H:%M:%S" --name-status`;
            const logOutput = execSync(gitLogCommand, { encoding: 'utf8' });
            
            // Get current branch info
            const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
            
            // Get repository status
            const repoStatus = execSync('git status --porcelain', { encoding: 'utf8' });
            
            // Format the log
            const formattedLog = this.formatGitLog(logOutput, currentBranch, repoStatus);
            
            // Write to log file
            fs.writeFileSync(this.logFile, formattedLog, 'utf8');
            
            console.log(`Git log generated successfully: ${this.logFile}`);
            console.log(`Total commits found: ${this.countCommits(logOutput)}`);
            
        } catch (error) {
            console.error('Error generating git log:', error.message);
            
            // Create a basic log even if git history is empty
            const basicLog = this.createBasicLog();
            fs.writeFileSync(this.logFile, basicLog, 'utf8');
            console.log('Created basic git log file.');
        }
    }

    /**
     * Format git log output into readable format
     */
    formatGitLog(logOutput, currentBranch, repoStatus) {
        const timestamp = new Date().toISOString();
        let formatted = `# Git Commit Log - E-Mall World Project\n`;
        formatted += `# Generated on: ${timestamp}\n`;
        formatted += `# Current Branch: ${currentBranch || 'main'}\n`;
        formatted += `# Repository Path: ${__dirname}\n`;
        formatted += `${'='.repeat(80)}\n\n`;

        // Add current repository status
        if (repoStatus.trim()) {
            formatted += `## Current Repository Status:\n`;
            const statusLines = repoStatus.trim().split('\n');
            statusLines.forEach(line => {
                const status = line.substring(0, 2);
                const file = line.substring(3);
                const statusText = this.getStatusText(status);
                formatted += `  ${statusText}: ${file}\n`;
            });
            formatted += `\n`;
        }

        if (!logOutput.trim()) {
            formatted += `## No commits found in repository\n`;
            formatted += `This appears to be a new repository with no commit history.\n\n`;
            return formatted;
        }

        formatted += `## Commit History:\n\n`;
        
        const lines = logOutput.split('\n');
        let currentCommit = null;
        let commitCount = 0;
        
        for (const line of lines) {
            if (line.includes('|')) {
                // This is a commit info line
                if (currentCommit) {
                    formatted += this.formatCommitBlock(currentCommit);
                    commitCount++;
                }
                
                const [hash, author, email, date, message] = line.split('|');
                currentCommit = {
                    hash,
                    author,
                    email,
                    date,
                    message,
                    files: []
                };
            } else if (line.trim() && currentCommit) {
                // This is a file change line
                const status = line.charAt(0);
                const fileName = line.substring(1).trim();
                if (fileName) {
                    currentCommit.files.push({ status, fileName });
                }
            }
        }
        
        // Don't forget the last commit
        if (currentCommit) {
            formatted += this.formatCommitBlock(currentCommit);
            commitCount++;
        }
        
        formatted += `\n${'='.repeat(80)}\n`;
        formatted += `Total commits: ${commitCount}\n`;
        formatted += `Log generated: ${timestamp}\n`;
        
        return formatted;
    }

    /**
     * Format individual commit block
     */
    formatCommitBlock(commit) {
        let block = `### Commit: ${commit.hash}\n`;
        block += `**Author:** ${commit.author} <${commit.email}>\n`;
        block += `**Date:** ${commit.date}\n`;
        block += `**Message:** ${commit.message}\n`;
        
        if (commit.files.length > 0) {
            block += `**Files Changed:**\n`;
            commit.files.forEach(file => {
                const statusText = this.getFileStatusText(file.status);
                block += `  - ${statusText}: ${file.fileName}\n`;
            });
        }
        
        block += `\n${'─'.repeat(60)}\n\n`;
        return block;
    }

    /**
     * Get human-readable status text
     */
    getStatusText(status) {
        const statusMap = {
            'A ': 'Added',
            'M ': 'Modified',
            'D ': 'Deleted',
            'R ': 'Renamed',
            'C ': 'Copied',
            '??': 'Untracked',
            ' M': 'Modified (unstaged)',
            ' D': 'Deleted (unstaged)'
        };
        return statusMap[status] || 'Unknown';
    }

    /**
     * Get file status text for git log
     */
    getFileStatusText(status) {
        const statusMap = {
            'A': 'Added',
            'M': 'Modified',
            'D': 'Deleted',
            'R': 'Renamed',
            'C': 'Copied'
        };
        return statusMap[status] || 'Changed';
    }

    /**
     * Count total commits
     */
    countCommits(logOutput) {
        return (logOutput.match(/\|/g) || []).length;
    }

    /**
     * Create basic log for new repositories
     */
    createBasicLog() {
        const timestamp = new Date().toISOString();
        let log = `# Git Commit Log - E-Mall World Project\n`;
        log += `# Generated on: ${timestamp}\n`;
        log += `# Repository Path: ${__dirname}\n`;
        log += `${'='.repeat(80)}\n\n`;
        log += `## Repository Status\n`;
        log += `This appears to be a new git repository with no commit history yet.\n`;
        log += `To start tracking changes, make your first commit:\n\n`;
        log += `\`\`\`bash\n`;
        log += `git add .\n`;
        log += `git commit -m "Initial commit"\n`;
        log += `\`\`\`\n\n`;
        log += `After making commits, run this script again to see the commit history.\n`;
        return log;
    }

    /**
     * Watch for git changes and auto-update log
     */
    watchGitChanges() {
        console.log('Watching for git changes...');
        const gitDir = path.join(__dirname, '.git');
        
        if (fs.existsSync(gitDir)) {
            fs.watch(gitDir, { recursive: true }, (eventType, filename) => {
                if (filename && (filename.includes('HEAD') || filename.includes('refs'))) {
                    console.log('Git change detected, updating log...');
                    setTimeout(() => this.generateGitLog(), 1000); // Debounce
                }
            });
        }
    }
}

// CLI usage
if (require.main === module) {
    const logger = new GitLogger();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--watch')) {
        logger.generateGitLog();
        logger.watchGitChanges();
    } else {
        logger.generateGitLog();
    }
}

module.exports = GitLogger;