import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const appendFile = promisify(fs.appendFile);
const stat = promisify(fs.stat);
const rename = promisify(fs.rename);
const access = promisify(fs.access);

class Logger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.logFile = options.logFile || 'system.log';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
    this.maxBackups = options.maxBackups || 5;
    this.logLevel = options.logLevel || 'info';
    
    // Ensure logs directory exists
    this.ensureLogDirectory();
  }

  /**
   * Ensure the logs directory exists with proper permissions
   */
  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true, mode: 0o750 });
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error.message);
    }
  }

  /**
   * Get the full path to the current log file
   */
  getLogFilePath() {
    return path.join(this.logDir, this.logFile);
  }

  /**
   * Format timestamp in YYYY-MM-DD HH:MM:SS format
   */
  formatTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Extract IP address from request object
   */
  getIpAddress(req) {
    if (!req) return 'unknown';
    
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers?.['x-real-ip'] ||
           'unknown';
  }

  /**
   * Extract user information from request object
   */
  getUserInfo(req) {
    if (!req) return { userId: null, sessionId: null };
    
    return {
      userId: req.userId || req.user?.id || req.user?._id || null,
      sessionId: req.sessionID || req.session?.id || null
    };
  }

  /**
   * Create a standardized log entry
   */
  createLogEntry(level, action, status, req = null, additionalData = {}) {
    const timestamp = this.formatTimestamp();
    const ipAddress = this.getIpAddress(req);
    const { userId, sessionId } = this.getUserInfo(req);
    
    return {
      timestamp,
      level,
      userId,
      sessionId,
      ipAddress,
      action,
      status,
      ...additionalData
    };
  }

  /**
   * Rotate log files when they exceed the maximum size
   */
  async rotateLogFile() {
    try {
      const logFilePath = this.getLogFilePath();
      
      // Check if log file exists and its size
      try {
        const stats = await stat(logFilePath);
        if (stats.size < this.maxFileSize) {
          return; // No rotation needed
        }
      } catch (error) {
        // File doesn't exist, no rotation needed
        return;
      }

      // Shift existing backup files
      for (let i = this.maxBackups - 1; i >= 1; i--) {
        const oldBackup = `${logFilePath}.${i}`;
        const newBackup = `${logFilePath}.${i + 1}`;
        
        try {
          await access(oldBackup);
          if (i === this.maxBackups - 1) {
            // Delete the oldest backup
            fs.unlinkSync(newBackup);
          }
          await rename(oldBackup, newBackup);
        } catch (error) {
          // File doesn't exist, continue
        }
      }

      // Move current log to .1
      const firstBackup = `${logFilePath}.1`;
      await rename(logFilePath, firstBackup);
      
    } catch (error) {
      console.error('Log rotation failed:', error.message);
    }
  }

  /**
   * Write log entry to file with error handling
   */
  async writeLogEntry(logEntry) {
    try {
      await this.rotateLogFile();
      
      const logLine = JSON.stringify(logEntry) + '\n';
      const logFilePath = this.getLogFilePath();
      
      await appendFile(logFilePath, logLine, { mode: 0o640 });
    } catch (error) {
      // Fallback to console logging if file write fails
      console.error('Failed to write to log file:', error.message);
      console.log('LOG ENTRY:', JSON.stringify(logEntry));
    }
  }

  /**
   * Log info level messages
   */
  async info(action, status, req = null, additionalData = {}) {
    const logEntry = this.createLogEntry('info', action, status, req, additionalData);
    await this.writeLogEntry(logEntry);
  }

  /**
   * Log warning level messages
   */
  async warn(action, status, req = null, additionalData = {}) {
    const logEntry = this.createLogEntry('warn', action, status, req, additionalData);
    await this.writeLogEntry(logEntry);
  }

  /**
   * Log error level messages
   */
  async error(action, status, req = null, additionalData = {}) {
    const logEntry = this.createLogEntry('error', action, status, req, additionalData);
    await this.writeLogEntry(logEntry);
  }

  /**
   * Log authentication events
   */
  async logAuth(action, status, req = null, additionalData = {}) {
    await this.info(action, status, req, {
      category: 'authentication',
      ...additionalData
    });
  }

  /**
   * Log system events
   */
  async logSystem(action, status, req = null, additionalData = {}) {
    await this.info(action, status, req, {
      category: 'system',
      ...additionalData
    });
  }

  /**
   * Log API requests with detailed information
   */
  async logApiRequest(req, res, responseTime, additionalData = {}) {
    const statusCode = res.statusCode;
    const status = statusCode >= 200 && statusCode < 400 ? 'success' : 'failure';
    
    await this.info('api_request', status, req, {
      category: 'api',
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      userAgent: req.headers?.['user-agent'] || 'unknown',
      responseTime: `${responseTime}ms`,
      ...additionalData
    });
  }
}

// Create singleton logger instance
const logger = new Logger();

/**
 * Express middleware for automatic request logging
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log the request asynchronously to avoid blocking
    setImmediate(() => {
      logger.logApiRequest(req, res, responseTime).catch(error => {
        console.error('Request logging failed:', error.message);
      });
    });
    
    // Call original end method
    originalEnd.apply(this, args);
  };
  
  next();
};

export { Logger, logger, requestLogger };
