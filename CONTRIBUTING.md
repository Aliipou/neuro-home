# Contributing to NeuroHome

Thank you for your interest in contributing to NeuroHome! This document provides guidelines and best practices for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Testing](#testing)
6. [Documentation](#documentation)
7. [Pull Request Process](#pull-request-process)
8. [Issue Reporting](#issue-reporting)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, background, or identity.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or insulting/derogatory remarks
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Python >= 3.9 (for ML components)
- PlatformIO (for firmware development)
- Docker (optional, recommended)

### Setting Up Development Environment

1. **Fork the repository**
```bash
git clone https://github.com/YOUR_USERNAME/neurohome.git
cd neurohome
```

2. **Install dependencies**
```bash
npm install
```

3. **Build all packages**
```bash
npm run build
```

4. **Run tests**
```bash
npm test
```

5. **Start development servers**
```bash
npm run dev
```

### Project Structure

Familiarize yourself with the monorepo structure:
- `backend/` - Backend services (Node.js/TypeScript)
- `edge/` - Firmware and edge computing (C++, Python)
- `clients/` - Client applications (React Native, Next.js)
- `docs/` - Documentation
- `tools/` - Development tools and utilities

## Development Workflow

### Branching Strategy

We use Git Flow:
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `release/*` - Release preparation

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in logical, atomic commits
2. Write clear, descriptive commit messages
3. Keep commits focused on a single concern
4. Reference issues in commit messages (e.g., "Fixes #123")

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(event-processor): add priority-based event handling

Implement a priority queue system for event processing
that ensures critical events are handled first.

Closes #42
```

## Code Standards

### TypeScript/JavaScript

- Use TypeScript for all backend and client code
- Enable strict mode
- No `any` types (use `unknown` if necessary)
- Prefer functional programming patterns
- Use async/await over callbacks
- Maximum line length: 100 characters

**Good Example:**
```typescript
interface DeviceState {
  id: string;
  status: 'online' | 'offline';
  lastSeen: Date;
}

async function getDeviceState(deviceId: string): Promise<DeviceState> {
  const device = await deviceRepository.findById(deviceId);
  if (!device) {
    throw new Error(`Device ${deviceId} not found`);
  }
  return {
    id: device.id,
    status: device.isOnline() ? 'online' : 'offline',
    lastSeen: device.lastSeenAt,
  };
}
```

### Python

- Follow PEP 8 style guide
- Use type hints for all functions
- Maximum line length: 100 characters
- Use Black for formatting
- Use pylint for linting

**Good Example:**
```python
from typing import List, Dict
from datetime import datetime

def calculate_embedding(
    actions: List[str],
    window_size: int = 10
) -> Dict[str, float]:
    """Calculate behavior embedding from action sequence.

    Args:
        actions: List of user actions
        window_size: Sliding window size

    Returns:
        Dictionary containing embedding vector
    """
    # Implementation
    pass
```

### C++ (Firmware)

- Follow Google C++ Style Guide
- Use modern C++ features (C++17)
- Prefer RAII for resource management
- Maximum line length: 100 characters
- Comment non-obvious code

**Good Example:**
```cpp
class SensorDriver {
public:
    explicit SensorDriver(uint8_t pin) : pin_(pin) {
        pinMode(pin_, INPUT);
    }

    float readValue() const {
        return analogRead(pin_) * SCALE_FACTOR;
    }

private:
    uint8_t pin_;
    static constexpr float SCALE_FACTOR = 3.3f / 4095.0f;
};
```

### General Principles

- **DRY**: Don't Repeat Yourself
- **SOLID**: Follow SOLID principles
- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It
- **Clean Code**: Write self-documenting code
- **Security First**: Always validate input, sanitize output

## Testing

### Test Coverage Requirements

- Unit tests: Aim for 80%+ coverage
- Integration tests: Cover critical paths
- E2E tests: Cover main user workflows

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
npm test --workspace=backend/services/event-processor

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Writing Tests

Use Vitest for TypeScript/JavaScript:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { EventProcessor } from './event-processor';

describe('EventProcessor', () => {
  let processor: EventProcessor;

  beforeEach(() => {
    processor = new EventProcessor();
  });

  it('should process events in priority order', async () => {
    await processor.addEvent({ priority: 1, data: 'low' });
    await processor.addEvent({ priority: 10, data: 'high' });

    const next = await processor.getNext();
    expect(next.data).toBe('high');
  });
});
```

### Testing Best Practices

- One assertion per test (when possible)
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies
- Keep tests fast and independent

## Documentation

### Code Documentation

- Document all public APIs
- Use JSDoc for TypeScript
- Use docstrings for Python
- Use Doxygen comments for C++

### README Updates

Update README.md when:
- Adding new features
- Changing setup instructions
- Modifying dependencies

### API Documentation

- Document all endpoints
- Include request/response examples
- Document error codes
- Keep OpenAPI spec up to date

## Pull Request Process

### Before Submitting

1. **Update from develop**
```bash
git checkout develop
git pull origin develop
git checkout your-feature-branch
git rebase develop
```

2. **Run all checks**
```bash
npm run lint
npm run typecheck
npm test
npm run build
```

3. **Update documentation**
   - Update relevant docs
   - Add/update tests
   - Update CHANGELOG.md

### Submitting PR

1. Push your branch to your fork
2. Open PR against `develop` branch
3. Fill out the PR template completely
4. Link related issues
5. Request reviews from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
```

### Review Process

- At least one approval required
- All CI checks must pass
- No unresolved conversations
- Squash commits if requested

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Node version: [e.g., 18.16.0]
- NeuroHome version: [e.g., 0.1.0]

**Additional context**
Any other relevant information
```

### Feature Requests

Use the feature request template:

```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why is this needed?

**Proposed Solution**
Your suggested implementation

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Mockups, examples, etc.
```

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to community events
- Given contributor badge (coming soon)

## Questions?

- Check existing issues and discussions
- Join our Discord (coming soon)
- Ask in GitHub Discussions
- Email: contribute@neurohome.org (coming soon)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making NeuroHome better!
