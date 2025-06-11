# Contributing to ppk-to-openssh

Thank you for your interest in contributing to ppk-to-openssh! We welcome contributions from the community.

## 🚀 Getting Started

### Prerequisites

- Node.js 14.0.0 or higher
- npm or yarn
- Git

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/cartpauj/ppk-to-openssh.git
   cd ppk-to-openssh
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the test suite to ensure everything works:
   ```bash
   npm test
   ```

6. Build the library:
   ```bash
   npm run build
   ```

## 🏗️ Development Workflow

### Project Structure

```
ppk-to-openssh/
├── src/           # Source code
│   ├── index.js   # Main API exports
│   ├── index.d.ts # TypeScript definitions
│   └── ppk-parser.js # Core parser implementation
├── lib/           # Built files (generated)
├── test/          # Test files
├── bin/           # CLI scripts
├── scripts/       # Build scripts
└── docs/          # Documentation
```

### Making Changes

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the `src/` directory
3. Add or update tests in the `test/` directory
4. Update TypeScript definitions if needed
5. Run tests to ensure everything works:
   ```bash
   npm test
   ```

6. Build the library:
   ```bash
   npm run build
   ```

7. Test the CLI if you made CLI changes:
   ```bash
   ./bin/cli.js --help
   ```

### Code Style

- Use consistent indentation (2 spaces)
- Follow existing code patterns and conventions
- Add JSDoc comments for new functions and classes
- Use meaningful variable and function names
- Keep functions focused and relatively small

### Testing

- Write tests for new functionality
- Ensure existing tests still pass
- Test error cases and edge conditions
- Include tests for both API and CLI functionality

### Documentation

- Update README.md if you add new features
- Update TypeScript definitions for new APIs
- Add JSDoc comments for new functions
- Update CHANGELOG.md following the existing format

## 🐛 Reporting Issues

When reporting issues, please include:

1. **Clear description** of the problem
2. **Steps to reproduce** the issue
3. **Expected behavior** vs actual behavior
4. **PPK file details** (version, key type, encryption) - but don't share actual keys!
5. **Environment details** (Node.js version, OS, etc.)
6. **Error messages** and stack traces if applicable

### Security Issues

If you discover a security vulnerability, please email us directly instead of opening a public issue. Security issues will be addressed with high priority.

## 🔄 Pull Request Process

1. **Ensure tests pass**: Run `npm test` before submitting
2. **Update documentation**: Update README, changelog, and comments as needed
3. **Clear commit messages**: Use descriptive commit messages
4. **One feature per PR**: Keep pull requests focused on a single feature or fix
5. **Fill out PR template**: Provide a clear description of changes

### Pull Request Checklist

- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated
- [ ] TypeScript definitions updated (if applicable)
- [ ] CHANGELOG.md updated
- [ ] Commit messages are clear and descriptive

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

### Adding Tests

- Add test cases to `test/test.js`
- Test both success and error scenarios
- Include edge cases and boundary conditions
- Test all supported key types when applicable

### Test Categories

1. **Unit tests** - Test individual functions and classes
2. **Integration tests** - Test complete conversion workflows
3. **Error handling** - Test error conditions and error messages
4. **CLI tests** - Test command-line interface

## 📋 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a professional atmosphere

## 🎯 Areas for Contribution

We especially welcome contributions in these areas:

- **Additional key formats** - Support for other key formats
- **Performance improvements** - Optimizations for large keys or batch processing
- **Better error messages** - More helpful error descriptions and hints
- **Documentation** - Examples, tutorials, and API documentation
- **Testing** - More comprehensive test coverage
- **Browser support** - Making the library work in browsers
- **Additional CLI features** - Enhanced command-line functionality

## 🤔 Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Create a new issue with the "question" label
3. Join discussions in existing issues

Thank you for contributing to ppk-to-openssh! 🎉