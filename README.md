# 📚 Learning App

A modern spaced repetition learning application built with Next.js 15, featuring the SM-2 algorithm for optimal knowledge retention.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-V4-38bdf8)

## ✨ Features

### 📝 Question Management
- **Flexible Import**: Import questions from markdown or JSON with multiple format support
- **Category Organization**: Organize questions into subjects/topics (Math, History, etc.)
- **Multiple Question Types**: 
  - Regular multiple choice (single or multiple correct answers)
  - Drag-and-drop sorting questions
  - Fill-in-the-blank with text input
- **Type Conversion**: Switch between question types anytime in the editor
- **Live Preview**: See parsed questions in real-time as you type
- **CRUD Operations**: Create, view, edit, and delete questions
- **Export/Import**: Full backup and restore with JSON export/import
- **Rich Explanations**: Markdown formatting in explanations (optional)

### 🎯 Smart Study System
- **Spaced Repetition**: Industry-standard SM-2 algorithm
- **Category Filtering**: Study specific subjects/topics
- **Three Study Modes**:
  - **Review Due**: Only study questions due today (most efficient)
  - **All Questions**: Practice everything in order
  - **Random Order**: Shuffled questions for variety
- **Interactive Question Types**:
  - Multiple choice with randomized answer positions
  - Drag-and-drop sorting (arrange items in correct order)
  - Text input for fill-in-the-blank questions
- **Immediate Feedback**: See correct/incorrect answers instantly
- **Progress Tracking**: Visual progress bar and question counter

### 📊 Statistics & Analytics
- **Progress Dashboard**: Track your learning over time
- **Category Filtering**: View statistics per subject/topic
- **Four Learning States**:
  - 🔵 **New**: Never reviewed
  - 🟠 **Learning**: 1 correct answer
  - 🟢 **Review**: 2+ consecutive correct (mastered)
  - 🔴 **Due Today**: Questions needing review
- **Backup & Restore**: Export/import statistics to preserve learning progress
- **Orphaned Data Cleanup**: Detect and remove statistics for deleted questions
- **Upcoming Reviews**: See what's coming in the next 10 reviews
- **Mastery Percentage**: Track overall progress per category

### 🎨 User Experience
- **Dark Mode**: Full dark mode support with system preference detection
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Keyboard Navigation**: Full keyboard accessibility
- **Category Badges**: Visual indicators showing question categories
- **Interactive UI**: Drag-and-drop sorting, text input validation
- **Smart Validation**: Detailed error reporting on import failures
- **No Backend Required**: All data stored locally in your browser

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/benchuangxd/learning-app.git
cd learning-app

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### 1. Import Questions

Navigate to the **Questions** page and choose your import method:

#### Text Import (Markdown Format)

Paste your questions in markdown format with optional category:

```markdown
**Question 1 (1 point)**

Which of the following best defines an Embedded System?

A. A system that only uses analogue electronics.
B. A general-purpose computer for various tasks.
C. A standalone software application.
D. A computing system dedicated to a specific task. ✅

— Embedded systems are specialized computing systems designed for one dedicated purpose.

**Question 2 (1 point)** - Sorting Question

Sort from least to most intrusive (#1 to #4):

#1 Desk-checking
#2 Hardware Breakpoints
#3 LED monitoring
#4 Print statements

— Each method has different performance impacts.

**Question 3 (1 point)** - Fill-in-Blank

A ___ count is used to obtain a 1-second timer.

30,000,000 ✅

— This is the cycle count for a 1-second delay.
---
```

**Supported Formats:**
- **Regular Multiple Choice**: A-F labeled choices, bullet lists
- **Sorting Questions**: #1, #2, #3, #4 numbering for correct order
- **Fill-in-Blank**: Use `___` in question text with one correct answer
- Multiple correct answers (multiple ✅ marks)
- **Optional explanations**: Can be blank, but must exist as field (`"explanation": ""`)
- Markdown formatting in explanations

**Validation Rules:**
- Each question must have: id, text, points, difficulty, choices array
- Explanation field required but can be empty string
- At least one choice must be marked correct (✅)
- Sorting questions need unique, sequential order numbers (1, 2, 3, 4...)
- Fill-in-blank needs exactly one correct answer
- Import shows detailed errors for any validation failures

#### JSON Import

Import questions from exported JSON files:
- Preserves all question data and types (regular, sorting, fill-in-blank)
- Includes category information
- Choose to merge with existing or replace all
- **Detailed validation**: Shows exactly which questions failed and why
- **Upfront warnings**: Tells you before import how many will be skipped
- Blank explanations are allowed

#### Category Organization

When importing, optionally specify a category (e.g., "Math", "History"):
- Type in the category field or select from existing categories
- Autocomplete suggests previously used categories
- Leave blank for no category
- Filter questions by category on all pages

### 2. Start Studying

Go to the **Study** page:

1. **(Optional) Filter by Category**: Select a specific subject to study
2. **Choose a Study Mode**:
   - **Review Due**: Most efficient - only studies questions due today
   - **All Questions**: Practice everything in order
   - **Random Order**: Shuffled for varied practice

**Interactive Question Types:**
- **Multiple Choice**: Click to select answer(s)
- **Sorting**: Drag items into correct order (#1 to #4)
- **Fill-in-Blank**: Type the answer in the text field

### 3. Track Progress

Visit the **Statistics** page to see:
- **(Optional) Filter by Category**: View stats for specific subjects
- Your mastery percentage (overall or per category)
- Questions in each learning state
- Upcoming review schedule
- Overall progress metrics

### 4. Backup & Restore

**Export Your Data:**
- **Questions**: Export all questions to JSON (preserves types, categories, all data)
- **Statistics**: Export learning progress (spaced repetition data, review schedules)

**Import Your Data:**
- **Questions**: Import from JSON with merge or replace options
- **Statistics**: Import progress data with smart question matching
- **Validation**: Detailed error reporting shows exactly what failed
- **Orphaned Cleanup**: Automatically skips statistics for deleted questions

**Use Cases:**
- Backup before making changes
- Transfer between devices
- Share question sets with others
- Archive historical learning data

## 🧠 How Spaced Repetition Works

The app uses the **SM-2 algorithm** (used by Anki, SuperMemo):

### Learning Timeline

```
Answer correctly → Review in 1 day
Answer correctly again → Review in 6 days
Keep answering correctly → Intervals grow exponentially (15d, 37d, 93d...)
Answer incorrectly → Reset to 1 day
```

### Question States

1. **New** (🔵): Never studied - review immediately
2. **Learning** (🟠): 1 correct answer - still learning
3. **Review** (🟢): 2+ correct - mastered, long intervals
4. **Due** (🔴): Time to review again

### Benefits

- ✅ Optimal review timing prevents forgetting
- ✅ Focuses study time on difficult material
- ✅ Minimizes daily review burden
- ✅ Maximizes long-term retention

## 🛠️ Tech Stack

### Core
- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **React**: Version 19
- **TypeScript**: Strict mode enabled
- **Build Tool**: Turbopack (default in Next.js 15)

### Styling
- **Tailwind CSS V4**: CSS-first configuration
- **ShadCN UI**: CLI-based component library
- **Radix UI**: Headless accessible components

### Algorithm & Data
- **SM-2**: Spaced repetition algorithm
- **LocalStorage**: Browser-based persistence
- **@dnd-kit**: Drag-and-drop library for sorting questions

### Code Quality
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Zero `any` types
- **Type Safety**: 100% type coverage

## 📁 Project Structure

```
learning-app/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with theme
│   ├── page.tsx           # Home page
│   ├── questions/         # Question management
│   ├── study/             # Study session
│   └── statistics/        # Progress tracking
├── components/
│   ├── layout/            # Navigation, theme toggle
│   ├── questions/         # Import, list components
│   ├── study/             # Study session component
│   └── ui/                # ShadCN UI components
├── lib/
│   ├── algorithms/        # SM-2 algorithm
│   ├── services/          # Review management
│   ├── storage/           # LocalStorage adapter
│   └── parsers/           # Question parser
├── types/                 # TypeScript definitions
└── docs/                  # Reference documentation
```

## 🎨 Customization

### Theme Colors

Edit `app/globals.css` to customize colors:

```css
@theme {
  --color-primary: #3b82f6;    /* Primary blue */
  --color-secondary: #8b5cf6;  /* Secondary purple */
  --color-success: #10b981;    /* Success green */
  --color-error: #ef4444;      /* Error red */
}
```

### Dark Mode

Toggle dark mode using the sun/moon icon in the navbar. Choices:
- ☀️ **Light**: Always light theme
- 🌙 **Dark**: Always dark theme
- 💻 **System**: Follow OS preference (default)

## 📦 Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run format       # Format code with Prettier
```

## 🔒 Data Privacy

- ✅ **100% Local**: All data stored in your browser
- ✅ **No Backend**: No server, no database
- ✅ **No Tracking**: No analytics or tracking
- ✅ **No Accounts**: No sign-up required
- ✅ **Offline Ready**: Works without internet (after first load)

**Important Notes:**
- Data is stored in browser LocalStorage
- Clearing browser data will delete your questions and progress
- **Always export your data** before clearing browser data or switching browsers
- Use export/import to transfer between devices or backup your progress

## 🌟 Key Features in Detail

### Question Import

**Multiple Format Support:**
```markdown
# Format 1: Regular Multiple Choice
A. Option 1
B. Option 2 ✅

# Format 2: Bullet List
- Option 1
- Option 2 ✅

# Format 3: Multiple Correct Answers
A. Correct ✅
B. Also Correct ✅
C. Wrong

# Format 4: Sorting Question
Sort from lowest to highest (#1 to #4):
#1 One
#2 Two
#3 Three
#4 Four

# Format 5: Fill-in-Blank
The answer is ___.
42 ✅
```

**Category Organization:**
- Assign categories during text or JSON import
- Filter questions by category on Questions page
- Categories preserved in export/import

### Study Session

**Features:**
- One question at a time for focus
- Category filtering (study specific subjects)
- **Interactive Question Types:**
  - **Multiple Choice**: Randomized answer positions
  - **Sorting**: Drag-and-drop items into correct order
  - **Fill-in-Blank**: Text input with flexible validation
- Visual feedback (green = correct, red = incorrect)
- Explanation shown after answering
- Progress tracking
- Session summary with score

### Statistics Dashboard

**Metrics:**
- Category filtering (view stats per subject)
- Total questions in library (filtered or all)
- Questions due today
- Review questions (% mastered)
- Questions in learning phase
- Progress breakdown with visual bars
- Next 10 upcoming reviews

**Data Management:**
- Export statistics (backup learning progress)
- Import statistics (restore from backup)
- **Smart Question Matching**: Statistics link to questions by ID
- **Orphaned Detection**: Warns about statistics for deleted questions
- **Automatic Cleanup**: Export skips orphaned data automatically
- **Manual Cleanup**: One-click removal of orphaned statistics
- Category-based organization

## 🤝 Contributing

This project uses:
- **Linear** for issue tracking
- **Factory AGENTS.md** for AI agent instructions
- **Conventional Commits** for commit messages

## 📝 License

MIT License - feel free to use this project for learning!

## 🙏 Acknowledgments

- **SM-2 Algorithm**: [SuperMemo](https://www.supermemo.com/)
- **ShadCN UI**: [shadcn/ui](https://ui.shadcn.com/)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com/)
- **Next.js**: [nextjs.org](https://nextjs.org/)

## 💡 Tips & Troubleshooting

### Import Issues

**"Only X questions imported instead of Y":**
- Click the warning message to see validation errors
- Common issues:
  - Missing explanations (must exist as field, but can be blank: `"explanation": ""`)
  - No correct answer marked (at least one choice needs ✅)
  - Invalid choice structure
  - Sorting questions with duplicate/non-sequential order numbers

**"Export/Import doesn't preserve my data":**
- Make sure to export BOTH questions and statistics
- Import questions first, then import statistics
- Statistics link to questions by ID, so questions must exist first

### Orphaned Statistics

**"Statistics counts don't match":**
- You likely have orphaned statistics (progress data for deleted questions)
- Visit Statistics page → Statistics Backup section
- Look for warning about orphaned statistics
- Click "Clean up" to remove them

### Sorting Questions

**"No items to drag":**
- Refresh the page and try again
- Make sure questions have `correctOrder` field (1, 2, 3, 4...)
- Export/import preserves sorting question data

### Category Filtering

**"Categories not showing":**
- Import questions with categories assigned
- Categories auto-appear once questions have them
- Use autocomplete when importing to select existing categories

## 📧 Support

For issues or questions, please check:
- `AGENTS.md` - Project structure and conventions
- `docs/` - Detailed technical documentation
- `planning/LINEAR_TICKETS.md` - Feature roadmap
- Tips & Troubleshooting section above

## 🎯 Roadmap

**Current Features** (v1.0):
- ✅ Question import and management (text and JSON)
- ✅ Three question types (multiple choice, sorting, fill-in-blank)
- ✅ Question type conversion in editor
- ✅ Category organization and filtering
- ✅ Export/import for questions and statistics
- ✅ SM-2 spaced repetition
- ✅ Study sessions with interactive question types
- ✅ Category filtering on all pages
- ✅ Statistics dashboard with backup/restore
- ✅ Orphaned data cleanup
- ✅ Dark mode support

**Future Enhancements** (Optional):
- 📈 Performance charts over time
- 📅 Calendar view of reviews
- ⌨️ Keyboard shortcuts dialog
- 🔄 Sync across devices (via export/import)
- 🏷️ Tags in addition to categories
- 📊 Advanced analytics per category
- 🎨 Image support in questions
- 🔊 Audio support for language learning

---

**Made with ❤️ using Next.js 15, Tailwind V4, and TypeScript**

**Start learning smarter, not harder! 🚀**
