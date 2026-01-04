# Contributing to JanDrishti

Thank you for your interest in contributing to JanDrishti! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Git
- Code editor (VS Code recommended)

### Setup Development Environment

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open http://localhost:3000

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Component Structure
```typescript
// components/example-component.tsx
import { FC } from 'react'

interface ExampleComponentProps {
  title: string
  data?: any[]
}

export const ExampleComponent: FC<ExampleComponentProps> = ({ 
  title, 
  data = [] 
}) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {/* Component content */}
    </div>
  )
}
```

### Commit Messages
Use conventional commits:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding tests

## 🐛 Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

## 🔄 Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Submit pull request with clear description

## 📋 Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🧪 Test coverage

## 💬 Community

- Join our discussions in GitHub Issues
- Follow coding standards
- Be respectful and inclusive
- Help others learn and grow

Thank you for contributing to cleaner air monitoring! 🌍