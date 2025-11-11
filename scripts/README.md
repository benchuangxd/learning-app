# Linear Import Scripts

## Quick Start Guide

You have **3 options** to import your tickets to Linear:

### ✅ Option 1: Manual Import (Easiest to Start)

See `import-to-linear.md` for step-by-step guide.

**Best for**: Understanding the workflow, customizing as you go

---

### 📊 Option 2: CSV Import (Quickest Bulk Import)

**Step 1: Generate CSV**

```bash
node scripts/parse-tickets.js
```

This creates `scripts/tickets.csv`

**Step 2: Import to Linear**

1. Go to Linear → Your Project → Settings
2. Click "Import" → "CSV"
3. Upload `tickets.csv`
4. Map columns and import

---

### 🤖 Option 3: API Bulk Import (Most Automated)

**Step 1: Get Linear API Key**

1. Go to https://linear.app/settings/api
2. Create a new "Personal API Key"
3. Copy the key

**Step 2: Set API Key**
Windows:

```cmd
set LINEAR_API_KEY=your_key_here
```

macOS/Linux:

```bash
export LINEAR_API_KEY=your_key_here
```

**Step 3: Generate Tickets Data**

```bash
node scripts/parse-tickets.js
```

**Step 4: Import via API**

```bash
node scripts/create-linear-api-importer.js
```

This will:

- ✅ Connect to your Linear workspace
- ✅ Create "Learning App" project (if needed)
- ✅ Import all 37 tickets with full details
- ✅ Set priorities, estimates, and descriptions

---

## Files Created

- `import-to-linear.md` - Manual import guide
- `parse-tickets.js` - Parse tickets to JSON/CSV
- `create-linear-api-importer.js` - Bulk API import
- `tickets.json` - Generated ticket data (after running parse)
- `tickets.csv` - Generated CSV (after running parse)

---

## Recommended Approach

1. **Start with Manual** for Epic 1 (7 tickets) - Learn the workflow
2. **Switch to API/CSV** for remaining epics - Save time

---

## Support

- Linear API Docs: https://developers.linear.app/docs
- Linear CLI Docs: https://github.com/linearapp/linear/tree/master/packages/cli
- Issues? Check `LINEAR_TICKETS.md` for ticket details
