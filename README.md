# 📚 Learning App

A modern spaced repetition learning application built with Next.js 15, featuring the SM-2 algorithm for optimal knowledge retention.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-V4-38bdf8)

## ✨ Features

### 📝 Question Management
- **Flexible Import**: Import questions from markdown with multiple format support
- **Live Preview**: See parsed questions in real-time as you type
- **CRUD Operations**: Create, view, and delete questions
- **Multiple Answer Types**: Support for single and multiple correct answers
- **Rich Explanations**: Markdown formatting in explanations

### 🎯 Smart Study System
- **Spaced Repetition**: Industry-standard SM-2 algorithm
- **Three Study Modes**:
  - **Review Due**: Only study questions due today (most efficient)
  - **All Questions**: Practice everything in order
  - **Random Order**: Shuffled questions for variety
- **Randomized Choices**: Answer positions shuffle to prevent pattern memorization
- **Immediate Feedback**: See correct/incorrect answers instantly
- **Progress Tracking**: Visual progress bar and question counter

### 📊 Statistics & Analytics
- **Progress Dashboard**: Track your learning over time
- **Four Learning States**:
  - 🔵 **New**: Never reviewed
  - 🟠 **Learning**: 1 correct answer
  - 🟢 **Review**: 2+ consecutive correct (mastered)
  - 🔴 **Due Today**: Questions needing review
- **Upcoming Reviews**: See what's coming in the next 10 reviews
- **Mastery Percentage**: Track overall progress

### 🎨 User Experience
- **Dark Mode**: Full dark mode support with system preference detection
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Keyboard Navigation**: Full keyboard accessibility
- **No Backend Required**: All data stored locally in your browser

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd learning-app

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### 1. Import Questions

Navigate to the **Questions** page and paste your questions in markdown format:

```markdown
**Question 1 (1 point)**

Which of the following best defines an Embedded System?

A. A system that only uses analogue electronics.
B. A general-purpose computer for various tasks.
C. A standalone software application.
D. A computing system dedicated to a specific task. ✅

— Embedded systems are specialized computing systems designed for one dedicated purpose.

---
```

**Supported Formats:**
- A-F labeled choices
- Bullet list format (`- Option text ✅`)
- Multiple correct answers (multiple ✅ marks)
- Optional "Options:" label
- Markdown formatting in explanations

### 2. Start Studying

Go to the **Study** page and choose a study mode:

- **Review Due**: Most efficient - only studies questions due today
- **All Questions**: Practice everything
- **Random Order**: Shuffled for varied practice

### 3. Track Progress

Visit the **Statistics** page to see:
- Your mastery percentage
- Questions in each learning state
- Upcoming review schedule
- Overall progress metrics

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

### Algorithm
- **SM-2**: Spaced repetition algorithm
- **LocalStorage**: Browser-based persistence

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

**Note**: Data is stored in browser LocalStorage. Clear browser data will delete your questions and progress.

## 🌟 Key Features in Detail

### Question Import

**Multiple Format Support:**
```markdown
# Format 1: A-D Choices
A. Option 1
B. Option 2 ✅

# Format 2: Bullet List
- Option 1
- Option 2 ✅

# Format 3: Multiple Correct
A. Correct ✅
B. Also Correct ✅
C. Wrong
```

### Study Session

**Features:**
- One question at a time for focus
- Randomized answer positions
- Visual feedback (green = correct, red = incorrect)
- Explanation shown after answering
- Progress tracking
- Session summary with score

### Statistics Dashboard

**Metrics:**
- Total questions in library
- Questions due today
- Mastered questions (%)
- Questions in learning phase
- Progress breakdown with visual bars
- Next 10 upcoming reviews

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

## 📧 Support

For issues or questions, please check:
- `AGENTS.md` - Project structure and conventions
- `docs/` - Detailed technical documentation
- `planning/LINEAR_TICKETS.md` - Feature roadmap

## 🎯 Roadmap

**Current Features** (v1.0):
- ✅ Question import and management
- ✅ SM-2 spaced repetition
- ✅ Study sessions with feedback
- ✅ Statistics dashboard
- ✅ Dark mode support

**Future Enhancements** (Optional):
- 📦 Export/import questions (JSON, CSV)
- 📂 Question categories and tags
- 📈 Performance charts over time
- 📅 Calendar view of reviews
- ⌨️ Keyboard shortcuts dialog
- 🔄 Sync across devices

---

**Made with ❤️ using Next.js 15, Tailwind V4, and TypeScript**

**Start learning smarter, not harder! 🚀**
