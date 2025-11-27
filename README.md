# Flip Dat Card 🃏

A modern, responsive card flipping Higher/Lower game built with React, TypeScript, and MobX.

## 🎮 Game Rules

Guess whether the next card will be **higher** or **lower** than the current card. Each correct guess increases your score!

## ✨ Features

- **Modern UI/UX**: Beautiful gradient backgrounds, smooth animations, and responsive design
- **Card Flip Animations**: Smooth card flipping effects
- **Reactive State Management**: Built with MobX for efficient state updates
- **Fully Responsive**: Works perfectly on desktop, tablet, and mobile devices
- **TypeScript**: Type-safe codebase for better maintainability

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Or start with automatic browser opening
npm start
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
# Create optimized production build
npm run build
```

The built files will be in the `dist/` directory.

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **MobX 6** - State management
- **Styled Components** - CSS-in-JS styling
- **Webpack 5** - Module bundler
- **React Card Flip** - Card animation library

## 📁 Project Structure

```
flip-dat-card/
├── src/
│   ├── Card.ts              # Card model
│   ├── CardGenerator.ts     # Deck generation and shuffling
│   ├── Player.ts            # Player state and game logic
│   ├── CardFlip.tsx         # Card flip component
│   ├── pop.tsx              # Main game component
│   └── index.tsx            # App entry point
├── images/                  # Card images
├── dist/                    # Production build output
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── webpack.config.js        # Webpack configuration
```

## 🎨 Modern UI Improvements

This version includes several modern design improvements:

- **Gradient Backgrounds**: Beautiful purple-blue gradient backdrop
- **Glass Morphism**: Semi-transparent UI elements with backdrop blur
- **Smooth Animations**: Hover effects and transitions
- **Modern Typography**: Inter font family for clean, readable text
- **Responsive Design**: Mobile-first approach with breakpoints
- **Improved Buttons**: Gradient buttons with hover effects
- **Better Layout**: Centered, well-spaced components
- **Game Over Screen**: Dedicated end-game UI with restart option

## 🔧 Recent Updates

- ✅ Updated all dependencies to latest versions
- ✅ Fixed security vulnerabilities
- ✅ Migrated to TypeScript
- ✅ Modernized UI with gradient design
- ✅ Improved responsive layout
- ✅ Added proper build tooling
- ✅ Enhanced component structure

## 📝 License

MIT
