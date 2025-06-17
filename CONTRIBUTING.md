# Contributing to ModerationKit

Thank you for your interest in contributing to ModerationKit! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/moderationkit.git
   cd moderationkit
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/DevanshuNEU/moderationkit.git
   ```

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Add the following to your `.env` file:

```bash
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

## Making Changes

### Before You Start

1. **Check existing issues** to see if your idea is already being worked on
2. **Create an issue** for significant changes to discuss the approach
3. **Keep changes focused** - one feature or fix per pull request

### Development Workflow

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes** thoroughly:
   ```bash
   npm test
   npm run test:coverage
   ```

4. **Update documentation** if needed

5. **Commit your changes** following our commit guidelines

## Commit Guidelines

We use [Conventional Commits](https://conventionalcommits.org/) for clear and automated release notes.

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without changing functionality
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates

### Examples

```bash
# Good commit messages
feat(api): add platform-specific moderation rules
fix(validation): handle empty content gracefully
docs(readme): update installation instructions
test(moderation): add tests for context-aware logic

# Bad commit messages
update stuff
fix bug
changes
```

### Scope Guidelines

- `api`: API endpoints and server logic
- `moderation`: Core moderation engine
- `ui`: Frontend interface changes
- `config`: Configuration and environment setup
- `deps`: Dependency updates

## Pull Request Process

### Before Submitting

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run the full test suite**:
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

3. **Update documentation** if your changes affect the API or user interface

### PR Requirements

- [ ] Clear title and description
- [ ] Tests pass locally
- [ ] Code follows project conventions
- [ ] Documentation updated (if applicable)
- [ ] No merge conflicts with main branch

### PR Template

When creating a PR, please use this template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for changes
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Additional Notes
Any additional context or considerations
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- moderation.test.ts
```

### Writing Tests

- Write tests for all new functionality
- Follow existing test patterns
- Use descriptive test names
- Include edge cases and error scenarios

### Test Structure

```typescript
describe('ModerationEngine', () => {
  describe('platform-specific rules', () => {
    it('should allow fantasy violence on Character.ai', async () => {
      // Test implementation
    });
    
    it('should block real threats on all platforms', async () => {
      // Test implementation
    });
  });
});
```

## Documentation

### Code Documentation

- Use TypeScript types for self-documenting code
- Add JSDoc comments for complex functions
- Keep comments concise and focused on "why" not "what"

### API Documentation

When adding new API endpoints:

1. Update the API reference in README.md
2. Include request/response examples
3. Document error cases
4. Add TypeScript interfaces

### Examples

```typescript
/**
 * Analyzes content for moderation using platform-specific rules
 * @param request - The moderation request containing content and context
 * @returns Promise resolving to moderation result with confidence scores
 */
async function moderateContent(request: ModerationRequest): Promise<ModerationResult> {
  // Implementation
}
```

## Questions?

- **General questions**: Open a GitHub issue with the "question" label
- **Bug reports**: Use the bug report template
- **Feature requests**: Use the feature request template
- **Security issues**: Email chicholikar.d@northeastern.edu directly

## Recognition

All contributors will be recognized in our README.md contributors section. Thank you for helping make ModerationKit better!
