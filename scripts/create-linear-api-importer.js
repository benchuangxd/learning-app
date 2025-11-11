#!/usr/bin/env node

/**
 * Bulk import tickets to Linear via GraphQL API
 *
 * Usage:
 * 1. Get your Linear API key from https://linear.app/settings/api
 * 2. Set environment variable: set LINEAR_API_KEY=your_key_here
 * 3. Run: node create-linear-api-importer.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const LINEAR_API_KEY = 'lin_api_7TeND1coVAe91JYhAroCkQzrvXAd9MXtf61F73wK';
const LINEAR_API_URL = 'https://api.linear.app/graphql';

if (!LINEAR_API_KEY) {
  console.error('❌ Error: LINEAR_API_KEY environment variable not set');
  console.log('\nTo set your API key:');
  console.log('  Windows: set LINEAR_API_KEY=your_key_here');
  console.log('  macOS/Linux: export LINEAR_API_KEY=your_key_here');
  console.log('\nGet your API key from: https://linear.app/settings/api');
  process.exit(1);
}

// GraphQL query to create an issue
function createIssueQuery(teamId, projectId, title, description, priority, labels, estimate) {
  return {
    query: `
      mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            url
          }
        }
      }
    `,
    variables: {
      input: {
        teamId,
        projectId,
        title,
        description,
        priority: priority === 'High' ? 1 : priority === 'Medium' ? 2 : 3,
        estimate,
        // Note: labels need to be created first and their IDs used here
      },
    },
  };
}

// Make GraphQL request
function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'api.linear.app',
      port: 443,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: LINEAR_API_KEY,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Get team ID (required for creating issues)
async function getTeamId() {
  const query = {
    query: `
      query {
        teams {
          nodes {
            id
            name
            key
          }
        }
      }
    `,
  };

  const response = await makeRequest(query);

  if (response.errors) {
    throw new Error(`GraphQL Error: ${JSON.stringify(response.errors)}`);
  }

  const teams = response.data.teams.nodes;

  if (teams.length === 0) {
    throw new Error('No teams found in your Linear workspace');
  }

  console.log('\n📋 Available Teams:');
  teams.forEach((team, index) => {
    console.log(`  ${index + 1}. ${team.name} (${team.key})`);
  });

  // Return first team for now (you can make this interactive later)
  return teams[0].id;
}

// Get or create project
async function getProjectId(teamId, projectName) {
  const query = {
    query: `
      query($teamId: String!) {
        team(id: $teamId) {
          projects {
            nodes {
              id
              name
            }
          }
        }
      }
    `,
    variables: { teamId },
  };

  const response = await makeRequest(query);

  if (response.errors) {
    throw new Error(`GraphQL Error: ${JSON.stringify(response.errors)}`);
  }

  const projects = response.data.team.projects.nodes;
  const existingProject = projects.find((p) => p.name === projectName);

  if (existingProject) {
    console.log(`✓ Found existing project: ${projectName}`);
    return existingProject.id;
  }

  console.log(`Creating new project: ${projectName}...`);

  // Create new project
  const createQuery = {
    query: `
      mutation ProjectCreate($input: ProjectCreateInput!) {
        projectCreate(input: $input) {
          success
          project {
            id
            name
          }
        }
      }
    `,
    variables: {
      input: {
        name: projectName,
        teamIds: [teamId],
      },
    },
  };

  const createResponse = await makeRequest(createQuery);

  if (createResponse.errors) {
    throw new Error(`Failed to create project: ${JSON.stringify(createResponse.errors)}`);
  }

  return createResponse.data.projectCreate.project.id;
}

// Create a single issue
async function createIssue(teamId, projectId, ticket) {
  const fullDescription = `
${ticket.description}

## Acceptance Criteria
${ticket.acceptanceCriteria}

${ticket.technicalDetails ? `## Technical Details\n${ticket.technicalDetails}` : ''}
  `.trim();

  const query = createIssueQuery(
    teamId,
    projectId,
    ticket.title,
    fullDescription,
    ticket.priority,
    ticket.labels,
    ticket.estimate
  );

  const response = await makeRequest(query);

  if (response.errors) {
    console.error(`  ❌ Failed: ${ticket.title}`);
    console.error(`     Error: ${JSON.stringify(response.errors)}`);
    return false;
  }

  if (response.data.issueCreate.success) {
    const issue = response.data.issueCreate.issue;
    console.log(`  ✓ Created: ${issue.identifier} - ${issue.title}`);
    return true;
  }

  return false;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Linear Bulk Import Starting...\n');

    // Load parsed tickets
    const ticketsPath = path.join(__dirname, 'tickets.json');

    if (!fs.existsSync(ticketsPath)) {
      console.error('❌ tickets.json not found. Run parse-tickets.js first!');
      process.exit(1);
    }

    const tickets = JSON.parse(fs.readFileSync(ticketsPath, 'utf-8'));
    console.log(`📄 Loaded ${tickets.length} tickets\n`);

    // Get team ID
    console.log('🔍 Fetching your Linear workspace...');
    const teamId = await getTeamId();
    console.log(`✓ Using team ID: ${teamId}\n`);

    // Get or create project
    const projectId = await getProjectId(teamId, 'Learning App');
    console.log(`✓ Using project ID: ${projectId}\n`);

    // Create issues
    console.log('📝 Creating issues...\n');

    let successCount = 0;
    let failCount = 0;

    for (const ticket of tickets) {
      const success = await createIssue(teamId, projectId, ticket);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Rate limiting - wait 100ms between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\n✅ Import Complete!');
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log('\n🔗 View your issues at: https://linear.app/');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
main();
