# Contributing to Scan2Order

Thank you for your interest in contributing to Scan2Order! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## How to Contribute

There are several ways you can contribute to Scan2Order:

1. **Reporting Bugs**: If you find a bug, please create an issue with detailed steps to reproduce the problem.
2. **Suggesting Enhancements**: Have ideas for new features? Submit an enhancement suggestion as an issue.
3. **Pull Requests**: Submit pull requests with bug fixes or new features.

## Development Process

### Setting Up the Development Environment

1. Fork the repository
2. Clone your fork to your local machine
3. Follow the setup instructions in our [Local Development Guide](./docs/local-development.md)

### Branching Strategy

- `main`: Production-ready code
- `develop`: Development branch
- Feature branches: Create from `develop` with format `feature/your-feature-name`
- Bug fix branches: Create from `develop` with format `fix/issue-description`

### Pull Request Process

1. Create a branch from `develop` for your changes
2. Make your changes and ensure tests pass
3. Update documentation as needed
4. Submit a pull request to the `develop` branch
5. Ensure your PR description clearly describes the changes and references any related issues

## Performance Considerations

Scan2Order is designed to handle high traffic volumes (up to 1M concurrent users). When contributing, please consider:

1. **Database Efficiency**: Minimize complex queries, use appropriate indexes
2. **Memory Usage**: Avoid keeping large datasets in memory
3. **Connection Handling**: Be mindful of connection pooling and resource cleanup
4. **Batching**: For multiple operations, use batching when possible
5. **Asynchronous Processing**: Use non-blocking code patterns

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use async/await for asynchronous code
- Document complex functions with JSDoc comments
- Maintain strong typing throughout the codebase

### React Components

- Use functional components with hooks
- Keep components focused on a single responsibility
- Use proper component composition to avoid prop drilling
- Follow the existing pattern for data fetching with TanStack Query

### CSS/Styling

- Use Tailwind CSS for styling
- Follow the existing design system with shadcn/ui components
- Maintain responsive design for all screen sizes

## Testing

- Write tests for new features and bug fixes
- Ensure existing tests pass before submitting a PR
- Cover edge cases in your tests

## Documentation

- Update README.md if your changes affect the setup or usage
- Update relevant documentation in the `/docs` directory
- Document any API changes in the appropriate files
- Include inline comments for complex logic

## Review Process

Pull requests will be reviewed by project maintainers. The review process includes:

1. Code quality and style review
2. Functionality testing
3. Performance impact assessment
4. Documentation completeness

## Getting Help

If you need help with the contribution process:

1. Check existing documentation
2. Ask questions in the issues or discussions
3. Contact the maintainers

Thank you for contributing to Scan2Order!