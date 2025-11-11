#!/usr/bin/env node

/**
 * Parse LINEAR_TICKETS.md and convert to structured JSON
 * Can be used to generate CSV or bulk import via Linear API
 */

const fs = require('fs');
const path = require('path');

// Read the tickets file
const ticketsPath = path.join(__dirname, '..', 'LINEAR_TICKETS.md');
const content = fs.readFileSync(ticketsPath, 'utf-8');

// Parse tickets from markdown
function parseTickets(content) {
  const tickets = [];
  const lines = content.split('\n');

  let currentTicket = null;
  let currentSection = null;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentTicket && currentSection) {
        currentTicket[currentSection] += line + '\n';
      }
      continue;
    }

    // Skip if in code block
    if (inCodeBlock) {
      if (currentTicket && currentSection) {
        currentTicket[currentSection] += line + '\n';
      }
      continue;
    }

    // Detect ticket headers (### Ticket X.Y:)
    if (line.startsWith('### Ticket ')) {
      if (currentTicket) {
        tickets.push(currentTicket);
      }

      const match = line.match(/### Ticket ([\d.]+): (.+)/);
      if (match) {
        currentTicket = {
          id: match[1],
          title: match[2],
          priority: '',
          labels: [],
          estimate: 0,
          description: '',
          acceptanceCriteria: '',
          technicalDetails: '',
          epic: match[1].split('.')[0], // First number is epic
        };
      }
      continue;
    }

    // Parse ticket properties
    if (currentTicket) {
      if (line.startsWith('**Priority**:')) {
        currentTicket.priority = line.replace('**Priority**:', '').trim();
      } else if (line.startsWith('**Labels**:')) {
        const labelsText = line.replace('**Labels**:', '').trim();
        currentTicket.labels = labelsText.split(',').map((l) => l.trim());
      } else if (line.startsWith('**Estimate**:')) {
        const estimateText = line.replace('**Estimate**:', '').trim();
        const match = estimateText.match(/(\d+)/);
        if (match) {
          currentTicket.estimate = parseInt(match[1]);
        }
      } else if (line.startsWith('**Description**:')) {
        currentSection = 'description';
      } else if (line.startsWith('**Acceptance Criteria**:')) {
        currentSection = 'acceptanceCriteria';
      } else if (
        line.startsWith('**Technical Details**:') ||
        line.startsWith('**Implementation**:')
      ) {
        currentSection = 'technicalDetails';
      } else if (line.startsWith('---')) {
        // Separator - end current ticket
        if (currentTicket) {
          tickets.push(currentTicket);
          currentTicket = null;
        }
      } else if (currentSection && line.trim()) {
        currentTicket[currentSection] += line + '\n';
      }
    }
  }

  // Add last ticket if exists
  if (currentTicket) {
    tickets.push(currentTicket);
  }

  return tickets;
}

// Convert to CSV format
function toCSV(tickets) {
  const headers = ['ID', 'Title', 'Priority', 'Labels', 'Estimate', 'Description', 'Epic'];
  const rows = [headers.join(',')];

  for (const ticket of tickets) {
    const row = [
      ticket.id,
      `"${ticket.title.replace(/"/g, '""')}"`,
      ticket.priority,
      `"${ticket.labels.join(', ')}"`,
      ticket.estimate,
      `"${ticket.description.trim().replace(/"/g, '""')}"`,
      `Epic ${ticket.epic}`,
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

// Convert to JSON format for API import
function toJSON(tickets) {
  return JSON.stringify(tickets, null, 2);
}

// Main execution
const tickets = parseTickets(content);

console.log(`Parsed ${tickets.length} tickets\n`);

// Save JSON output
const jsonPath = path.join(__dirname, 'tickets.json');
fs.writeFileSync(jsonPath, toJSON(tickets));
console.log(`✓ Created: ${jsonPath}`);

// Save CSV output
const csvPath = path.join(__dirname, 'tickets.csv');
fs.writeFileSync(csvPath, toCSV(tickets));
console.log(`✓ Created: ${csvPath}`);

// Print summary
console.log('\nTickets by Epic:');
const epicCounts = {};
for (const ticket of tickets) {
  const epic = `Epic ${ticket.epic}`;
  epicCounts[epic] = (epicCounts[epic] || 0) + 1;
}

for (const [epic, count] of Object.entries(epicCounts)) {
  console.log(`  ${epic}: ${count} tickets`);
}

console.log('\n✅ Ready for import! Check:');
console.log('  - tickets.json (for API import)');
console.log('  - tickets.csv (for CSV import)');
