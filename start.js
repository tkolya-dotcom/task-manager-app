/**
 * Task Manager Application Launcher
 * 
 * This script starts the backend server for the Task Management Application.
 * The frontend is a standalone HTML file at index.html
 * 
 * Usage: 
 *   node start.js
 *   or
 *   npm start
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = join(__dirname, 'backend', '.env');
  const envExamplePath = join(__dirname, 'backend', '.env.example');
  
  if (!existsSync(envPath)) {
    log('\n⚠️  No .env file found in backend folder!', 'yellow');
    log('Please create backend/.env with your Supabase credentials.', 'yellow');
    
    if (existsSync(envExamplePath)) {
      log('Use .env.example as a template:', 'yellow');
      const example = readFileSync(envExamplePath, 'utf-8');
      console.log(example);
    }
    return false;
  }
  return true;
}

function startBackend() {
  log('\n🚀 Starting Task Manager Backend...', 'green');
  
  const backendDir = join(__dirname, 'backend');
  const isWindows = process.platform === 'win32';
  
  // Start the backend server
  const backendProcess = spawn(isWindows ? 'npm.cmd' : 'npm', ['start'], {
    cwd: backendDir,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  backendProcess.on('error', (error) => {
    log(`\n❌ Failed to start backend: ${error.message}`, 'red');
    process.exit(1);
  });

  backendProcess.on('exit', (code) => {
    if (code !== 0) {
      log(`\n⚠️  Backend process exited with code ${code}`, 'red');
    }
    process.exit(code);
  });

  return backendProcess;
}

function showStartupInfo() {
  log('\n' + '='.repeat(50), 'blue');
  log('  Task Manager Application', 'bright');
  log('='.repeat(50), 'blue');
  log('\n📋 Instructions:', 'bright');
  log('1. Open http://localhost:3001 in your browser', 'reset');
  log('\n2. Login with test accounts:', 'reset');
  log('   - Manager: Tkolya@gmail.com', 'green');
  log('   - Worker: worker@test.com', 'green');
  log('   (Password: any)', 'reset');
  log('\n3. Make sure Supabase is configured', 'yellow');
  log('   with the schema from sql/schema.sql', 'reset');
  log('\n' + '='.repeat(50), 'blue');
}

// Main execution
log('\n🎯 Task Manager - Starting Application...\n', 'bright');

if (!checkEnvFile()) {
  log('\n⚠️  Warning: Application may not work without proper configuration.\n', 'yellow');
}

// Start the backend
startBackend();

// Show startup information
setTimeout(showStartupInfo, 1000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n\n👋 Shutting down...', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n\n👋 Shutting down...', 'yellow');
  process.exit(0);
});
