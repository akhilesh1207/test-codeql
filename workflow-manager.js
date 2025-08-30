#!/usr/bin/env node

/**
 * Script to disable/enable GitHub Actions workflows
 * Usage: node workflow-manager.js <action> [workflow-file]
 * 
 * Actions: disable, enable, status, list
 * Examples:
 *   node workflow-manager.js disable codeql-manual.yml
 *   node workflow-manager.js enable codeql-manual.yml
 *   node workflow-manager.js status codeql-manual.yml
 *   node workflow-manager.js list
 */

const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'akhilesh1207';
const REPO = 'test-codeql';

if (!GITHUB_TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Workflow-Manager/1.0.0'
      }
    };

    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: responseData });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function disableWorkflow(workflowFile) {
  try {
    console.log(`🔴 Disabling workflow: ${workflowFile}`);
    const response = await makeRequest(`/repos/${OWNER}/${REPO}/actions/workflows/${workflowFile}/disable`, 'PUT');
    console.log('✅ Workflow disabled successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to disable workflow:', error.message);
    throw error;
  }
}

async function enableWorkflow(workflowFile) {
  try {
    console.log(`🟢 Enabling workflow: ${workflowFile}`);
    const response = await makeRequest(`/repos/${OWNER}/${REPO}/actions/workflows/${workflowFile}/enable`, 'PUT');
    console.log('✅ Workflow enabled successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to enable workflow:', error.message);
    throw error;
  }
}

async function getWorkflowStatus(workflowFile) {
  try {
    console.log(`📊 Getting status for workflow: ${workflowFile}`);
    const response = await makeRequest(`/repos/${OWNER}/${REPO}/actions/workflows/${workflowFile}`);
    
    const workflow = response.data;
    console.log(`\n📋 Workflow Details:`);
    console.log(`   Name: ${workflow.name}`);
    console.log(`   State: ${workflow.state}`);
    console.log(`   Path: ${workflow.path}`);
    console.log(`   ID: ${workflow.id}`);
    console.log(`   Created: ${workflow.created_at}`);
    console.log(`   Updated: ${workflow.updated_at}`);
    
    return response;
  } catch (error) {
    console.error('❌ Failed to get workflow status:', error.message);
    throw error;
  }
}

async function listWorkflows() {
  try {
    console.log('📋 Listing all workflows...');
    const response = await makeRequest(`/repos/${OWNER}/${REPO}/actions/workflows`);
    
    const workflows = response.data.workflows;
    console.log(`\nFound ${workflows.length} workflow(s):\n`);
    
    workflows.forEach((workflow, index) => {
      const status = workflow.state === 'active' ? '🟢' : '🔴';
      console.log(`${index + 1}. ${status} ${workflow.name}`);
      console.log(`   File: ${workflow.path}`);
      console.log(`   State: ${workflow.state}`);
      console.log(`   ID: ${workflow.id}`);
      console.log('');
    });
    
    return response;
  } catch (error) {
    console.error('❌ Failed to list workflows:', error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const action = args[0];
  const workflowFile = args[1];

  if (!action) {
    console.log(`
Usage: node workflow-manager.js <action> [workflow-file]

Actions:
  disable <file>    Disable a specific workflow
  enable <file>     Enable a specific workflow  
  status <file>     Get status of a specific workflow
  list             List all workflows

Examples:
  node workflow-manager.js disable codeql-manual.yml
  node workflow-manager.js enable codeql-manual.yml
  node workflow-manager.js status codeql-manual.yml
  node workflow-manager.js list

Workflow files in your repo:
  - codeql-manual.yml
  - codeql.yml
    `);
    return;
  }

  try {
    switch (action.toLowerCase()) {
      case 'disable':
        if (!workflowFile) {
          console.error('❌ Workflow file required for disable action');
          process.exit(1);
        }
        await disableWorkflow(workflowFile);
        break;

      case 'enable':
        if (!workflowFile) {
          console.error('❌ Workflow file required for enable action');
          process.exit(1);
        }
        await enableWorkflow(workflowFile);
        break;

      case 'status':
        if (!workflowFile) {
          console.error('❌ Workflow file required for status action');
          process.exit(1);
        }
        await getWorkflowStatus(workflowFile);
        break;

      case 'list':
        await listWorkflows();
        break;

      default:
        console.error(`❌ Unknown action: ${action}`);
        console.log('Valid actions: disable, enable, status, list');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  disableWorkflow,
  enableWorkflow, 
  getWorkflowStatus,
  listWorkflows
};
