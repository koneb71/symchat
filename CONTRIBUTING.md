# Contributing to SymChat

Thank you for your interest in contributing to SymChat! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/sympchat.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

1. Make sure Ollama is installed and running
2. Install at least one model: `ollama pull llama2`
3. Copy `.env.example` to `.env` and configure if needed
4. Start the dev server: `npm run dev`

## Code Style

We use ESLint and TypeScript for code quality:

```bash
npm run lint
```

Please ensure your code:
- Follows TypeScript best practices
- Uses functional components with hooks
- Includes proper type definitions
- Has meaningful variable/function names
- Includes comments for complex logic

## Component Guidelines

### Creating New Components

1. Place in appropriate directory:
   - UI components: `src/components/ui/`
   - Feature components: `src/components/`
   - Hooks: `src/hooks/`
   - Utils: `src/lib/`

2. Use TypeScript interfaces for props:
```typescript
interface MyComponentProps {
  title: string
  onClick: () => void
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  // Component logic
}
```

3. Export from component file:
```typescript
export { MyComponent }
```

### Styling Guidelines

- Use Tailwind CSS utility classes
- Use `cn()` utility for conditional classes
- Follow shadcn/ui patterns for consistency
- Support dark mode using CSS variables

Example:
```typescript
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)}>
```

## Adding New Features

### Before Starting

1. Check existing issues/PRs to avoid duplicates
2. Create an issue to discuss major changes
3. Get feedback on your approach

### Feature Development Process

1. Create a new branch from `main`
2. Implement your feature with tests
3. Update documentation
4. Submit a pull request

### Pull Request Guidelines

Your PR should:
- Have a clear title and description
- Reference related issues
- Include screenshots for UI changes
- Pass all CI checks
- Be reviewed by at least one maintainer

PR Template:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] No new warnings

## Screenshots
(if applicable)

## Related Issues
Closes #issue-number
```

## Testing

Currently we don't have automated tests, but please:
1. Test your changes thoroughly locally
2. Test in both light and dark modes
3. Test responsive design on mobile
4. Verify Ollama integration works
5. Check browser console for errors

## Documentation

Update documentation when:
- Adding new features
- Changing existing functionality
- Adding new configuration options
- Updating dependencies

Files to update:
- `README.md` - User-facing documentation
- `DEPLOYMENT.md` - Deployment instructions
- `CONTRIBUTING.md` - This file
- Code comments - For complex logic

## Adding Dependencies

Before adding a new dependency:
1. Check if existing libraries can solve the problem
2. Verify the package is actively maintained
3. Check bundle size impact
4. Discuss in an issue first for major dependencies

## Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(chat): add support for image uploads
fix(ui): resolve dark mode toggle issue
docs(readme): update installation instructions
```

## Project Structure

```
sympchat/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   └── ...          # Feature components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and API clients
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── CONTRIBUTING.md      # This file
├── DEPLOYMENT.md        # Deployment guide
└── README.md            # Main documentation
```

## Reporting Bugs

When reporting bugs, include:
1. **Description**: Clear description of the issue
2. **Steps to reproduce**: Detailed steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**:
   - OS and version
   - Browser and version
   - Ollama version
   - Node.js version
6. **Screenshots**: If applicable
7. **Console logs**: Error messages

## Feature Requests

When requesting features:
1. Check if it already exists or is planned
2. Describe the use case
3. Explain why it would be useful
4. Suggest possible implementation (optional)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the best solution for the project
- Respect others' time and effort

## Questions?

- Open an issue for questions
- Join discussions in existing issues
- Check README and documentation first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to SymChat! 🎉

