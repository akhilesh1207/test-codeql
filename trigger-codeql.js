#!/usr/bin/env node

/**
 * Script to trigger the CodeQL workflow via GitHub API
 * Usage: node trigger-codeql.js
 * 
 * Requirements:
 * - Set GITHUB_TOKEN environment variable
 */

const https = require('https');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'akhilesh1207';
const REPO = 'test-codeql';
const WORKFLOW_FILE = 'codeql-manual.yml';

if (!GITHUB_TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

async function triggerWorkflow(options = {}) {
  const {
    languages = 'javascript-typescript,actions',
    queries = 'security-extended',
    uploadSarif = true,
    ref = 'main'
  } = options;

  const data = JSON.stringify({
    ref: ref,
    inputs: {
      languages: languages,
      queries: queries,
      upload_sarif: uploadSarif.toString()
    }
  });

  const requestOptions = {
    hostname: 'api.github.com',
    port: 443,
    path: `/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'User-Agent': 'CodeQL-Trigger/1.0.0'
    }
  };

  return new Promise((resolve, reject) => {
    console.log('🚀 Triggering CodeQL workflow...');
    console.log(`📋 Configuration:`);
    console.log(`   - Languages: ${languages}`);
    console.log(`   - Queries: ${queries}`);
    console.log(`   - Upload SARIF: ${uploadSarif}`);
    console.log(`   - Branch: ${ref}`);

    const req = https.request(requestOptions, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 204) {
          console.log('✅ Workflow triggered successfully!');
          console.log(`🔗 Check status: https://github.com/${OWNER}/${REPO}/actions`);
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          console.error(`❌ Failed to trigger workflow (Status: ${res.statusCode})`);
          console.error('Response:', responseData);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// CLI interface
async function main() {
  try {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i];
      const value = args[i + 1];

      switch (key) {
        case '--languages':
          options.languages = value;
          break;
        case '--queries':
          options.queries = value;
          break;
        case '--upload-sarif':
          options.uploadSarif = value === 'true';
          break;
        case '--ref':
          options.ref = value;
          break;
        case '--help':
          console.log(`
Usage: node trigger-codeql.js [options]

Options:
  --languages <langs>     Languages to analyze (comma-separated)
                          Default: javascript-typescript,actions
                          
  --queries <pack>        Query pack to use
                          Options: security-extended, security-and-quality, default
                          Default: security-extended
                          
  --upload-sarif <bool>   Upload SARIF to Security tab
                          Options: true, false
                          Default: true
                          
  --ref <branch>          Branch to analyze
                          Default: main
                          
  --help                  Show this help message

Examples:
  node trigger-codeql.js
  node trigger-codeql.js --languages "python,javascript-typescript"
  node trigger-codeql.js --queries "security-and-quality" --upload-sarif false
          `);
          return;
      }
    }

    await triggerWorkflow(options);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { triggerWorkflow };
