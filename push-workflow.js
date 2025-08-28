#!/usr/bin/env node

/**
 * Script to push the CodeQL workflow to GitHub repository
 * Usage: node push-workflow.js
 * 
 * Requirements:
 * - npm install @octokit/rest
 * - Set GITHUB_TOKEN environment variable
 */

const { Octokit } = require("@octokit/rest");
const fs = require('fs');
const path = require('path');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'akhilesh1207';
const REPO = 'test-codeql';
const BRANCH = 'main';
const WORKFLOW_PATH = '.github/workflows/codeql-manual.yml';

if (!GITHUB_TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN environment variable is required');
  console.log('Set it with: export GITHUB_TOKEN=your_token_here');
  process.exit(1);
}

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'CodeQL-Workflow-Pusher/1.0.0'
});

async function pushWorkflow() {
  try {
    console.log('🚀 Starting workflow push process...');
    
    // Check if file exists locally
    const workflowFilePath = path.resolve(WORKFLOW_PATH);
    if (!fs.existsSync(workflowFilePath)) {
      throw new Error(`Workflow file not found: ${workflowFilePath}`);
    }
    
    // Read the workflow content
    const workflowContent = fs.readFileSync(workflowFilePath, 'utf8');
    console.log(`📄 Read workflow file (${workflowContent.length} characters)`);
    
    // Convert to base64
    const contentBase64 = Buffer.from(workflowContent).toString('base64');
    
    // Check if file already exists
    let existingFile = null;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: WORKFLOW_PATH,
        ref: BRANCH
      });
      existingFile = data;
      console.log('📝 File exists, will update');
    } catch (error) {
      if (error.status === 404) {
        console.log('✨ File does not exist, will create new');
      } else {
        throw error;
      }
    }
    
    // Prepare the request
    const requestData = {
      owner: OWNER,
      repo: REPO,
      path: WORKFLOW_PATH,
      message: existingFile 
        ? 'Update CodeQL manual trigger workflow'
        : 'Add CodeQL manual trigger workflow',
      content: contentBase64,
      branch: BRANCH
    };
    
    // Add SHA if updating existing file
    if (existingFile) {
      requestData.sha = existingFile.sha;
    }
    
    // Create or update the file
    console.log('⏳ Pushing to GitHub...');
    const response = await octokit.rest.repos.createOrUpdateFileContents(requestData);
    
    console.log('✅ Success!');
    console.log(`📍 Commit: ${response.data.commit.html_url}`);
    console.log(`🔗 File: https://github.com/${OWNER}/${REPO}/blob/${BRANCH}/${WORKFLOW_PATH}`);
    console.log(`🎯 Actions: https://github.com/${OWNER}/${REPO}/actions`);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error pushing workflow:', error.message);
    
    if (error.status === 401) {
      console.log('🔐 Authentication failed. Please check your GITHUB_TOKEN.');
    } else if (error.status === 403) {
      console.log('🚫 Permission denied. Ensure your token has repo permissions.');
    } else if (error.status === 404) {
      console.log('🔍 Repository not found. Check owner/repo names.');
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  pushWorkflow();
}

module.exports = { pushWorkflow };
