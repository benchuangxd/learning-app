# Import Tickets to Linear - Step-by-Step Guide

## Option 1: Manual Import (Recommended for First-Time Setup)

### Step 1: Set Up Your Linear Workspace

1. Go to https://linear.app
2. Create a new project called "Learning App"
3. Set up labels: `setup`, `feature`, `ui`, `component`, `documentation`, `quality`, `deployment`

### Step 2: Create Epics/Milestones

Create these epics in Linear first:

- Epic 1: Project Setup & Infrastructure
- Epic 2: Core Data Models & Storage
- Epic 3: Question Management UI
- Epic 4: Study Session & Spaced Repetition
- Epic 5: Statistics & Progress Tracking
- Epic 6: Layout & Navigation
- Epic 7: Type Safety & Code Quality
- Epic 8: Testing & Deployment Preparation
- Epic 9: Optional Enhancements

### Step 3: Import Tickets by Epic

Open `LINEAR_TICKETS.md` and for each ticket:

1. Click "New Issue" in Linear (or press `C`)
2. Copy the ticket title
3. Set priority (High/Medium/Low)
4. Add labels from the ticket
5. Set estimate (story points)
6. Copy the description and acceptance criteria
7. Assign to the appropriate epic
8. Click Create

**Pro Tip**: Use Linear's markdown support - you can paste the entire ticket content including code blocks!

---

## Option 2: Use Linear API (Bulk Import)

I can create a Node.js script to bulk import via Linear's GraphQL API.

### Prerequisites:

1. Get your Linear API key:
   - Go to https://linear.app/settings/api
   - Create a new Personal API Key
   - Copy the key (keep it secure!)

### Steps:

1. I'll create a script that:
   - Reads `LINEAR_TICKETS.md`
   - Parses tickets into structured data
   - Creates issues via Linear API
   - Links them to appropriate epics

Would you like me to create this script?

---

## Option 3: CSV Import (Quick Bulk Import)

### Step 1: I'll Generate a CSV File

I can parse the tickets and create a CSV file with all the data.

### Step 2: Import via Linear

1. In Linear, go to your project settings
2. Click "Import" → "CSV"
3. Upload the CSV file
4. Map columns to Linear fields
5. Click Import

---

## Recommended Approach for You

**For Best Results**: Use **Option 1 (Manual)** for the first epic (Project Setup) to:

- Understand the workflow
- Set up your Linear workspace properly
- Customize as needed

Then switch to **Option 2 (API Script)** or **Option 3 (CSV)** for remaining epics.

---

## Quick Start Template for Manual Creation

Here's a template for quick ticket creation in Linear:

```markdown
Title: [Copy from ticket]

Priority: [High/Medium/Low]

Labels: [Copy from ticket]

Estimate: [Story points]

Description:
[Copy description]

Acceptance Criteria:
[Copy checklist items]

Technical Details:
[Copy code examples and commands]
```

---

## Which Option Do You Prefer?

Let me know which approach you'd like to use, and I'll help you execute it!
