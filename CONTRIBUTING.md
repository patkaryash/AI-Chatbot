# Contributing to AI-Chatbot

Thank you for your interest in contributing to the AI-Chatbot project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to:

- Be respectful and inclusive in all interactions
- Welcome newcomers and help them get started
- Focus on constructive feedback and collaboration
- Respect different viewpoints and experiences

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AI-Chatbot.git
   cd AI-Chatbot
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/patkaryash/AI-Chatbot.git
   ```

## Development Setup

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local instance or cloud connection string)
- **Git**

### Installation

1. **Install root dependencies**:
   ```bash
   npm install
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Set up environment variables**:
   - Copy `backend/.env.example` to `backend/.env` (if available)
   - Configure your MongoDB connection string
   - Set JWT secret and other required variables

5. **Start the development servers**:
   - Backend: `cd backend && npm run dev` (or `node server.js`)
   - Frontend: `cd frontend && npm run dev`

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check the existing issues to avoid duplicates. When reporting a bug, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node.js version, browser)
- Any error messages or logs

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- A clear description of the enhancement
- The motivation or use case
- Any potential implementation ideas
- Mockups or examples (if applicable)

### Contributing Code

1. **Create a new branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes** following our coding standards

3. **Test your changes** thoroughly

4. **Commit** with a clear message (see [Commit Message Guidelines](#commit-message-guidelines))

5. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** against the `main` branch

## Coding Standards

### JavaScript/Node.js

- Use **ES6+** syntax
- Follow **Airbnb JavaScript Style Guide** (or project-specific ESLint config)
- Use `const` and `let` instead of `var`
- Use async/await for asynchronous operations
- Add JSDoc comments for functions and classes

### React/Frontend

- Use **functional components** with hooks
- Follow component naming conventions (PascalCase)
- Keep components small and focused
- Use PropTypes or TypeScript for type checking (if applicable)

### General

- Write **clear, self-documenting code**
- Add comments for complex logic
- Keep functions small and focused (single responsibility)
- Use meaningful variable and function names
- Avoid code duplication (DRY principle)

## Commit Message Guidelines

We follow the **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, etc.

### Examples

```
feat(auth): add JWT token refresh mechanism

fix(chat): resolve WebSocket connection drop on mobile

docs(readme): update installation instructions
```

## Pull Request Process

1. **Ensure your PR is up to date** with the `main` branch:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Fill out the PR template** (if available) with:
   - Description of changes
   - Related issue numbers (e.g., `Closes #123`)
   - Screenshots (for UI changes)
   - Testing performed

3. **Request review** from maintainers

4. **Address feedback** promptly and professionally

5. **Once approved**, a maintainer will merge your PR

### PR Requirements

- All tests must pass
- Code must follow project style guidelines
- New features should include tests
- Documentation should be updated if needed
- No merge conflicts with `main`

## Issue Reporting

### Before Creating an Issue

- Check existing issues (open and closed)
- Update to the latest version to see if the issue is resolved
- Gather relevant information (logs, error messages, environment)

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Documentation improvements
- `good first issue`: Suitable for newcomers
- `help wanted`: Extra attention needed

## Community

- **GitHub Discussions**: For general questions and ideas
- **Issues**: For bug reports and feature requests
- **Pull Requests**: For code contributions

## Questions?

If you have questions not covered by this guide, feel free to:

- Open a GitHub Discussion
- Comment on a related issue
- Reach out to maintainers

Thank you for contributing to AI-Chatbot!
