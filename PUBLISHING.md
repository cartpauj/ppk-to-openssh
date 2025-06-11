# Publishing Guide for ppk-to-openssh

This guide will walk you through publishing the ppk-to-openssh library to npm.

## 📋 Pre-Publishing Checklist

### 1. Update Package Information

The package.json is already configured with the correct information:

```json
{
  "author": {
    "name": "Paul C",
    "url": "https://github.com/cartpauj"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/cartpauj/ppk-to-openssh.git"
  },
  "bugs": {
    "url": "https://github.com/cartpauj/ppk-to-openssh/issues"
  },
  "homepage": "https://github.com/cartpauj/ppk-to-openssh#readme"
}
```

### 2. Set Up Git Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit the initial version
git commit -m "Initial release v1.0.0"

# Create GitHub repository and push
git remote add origin https://github.com/cartpauj/ppk-to-openssh.git
git branch -M main
git push -u origin main
```

### 3. Test Everything

```bash
# Run all tests
npm test

# Build the library
npm run build

# Test CLI functionality
./bin/cli.js --help

# Test both import styles
node -e "const { PPKParser } = require('./lib/index.js'); console.log('CommonJS OK');"
node -e "import('./lib/index.mjs').then(() => console.log('ESM OK'));"
```

## 🚀 Publishing to npm

### 1. Create npm Account

If you don't have an npm account:
1. Go to [npmjs.com](https://www.npmjs.com/signup)
2. Create an account
3. Verify your email

### 2. Login to npm

```bash
npm login
# Enter your username, password, and email when prompted
# You may need to enter a one-time password if you have 2FA enabled
```

### 3. Check Package Name Availability

```bash
# Check if the package name is available
npm view ppk-to-openssh

# If it shows "npm ERR! 404 Not Found", the name is available
# If it shows package info, you need a different name
```

### 4. Prepare for Publishing

```bash
# Ensure everything is built and tested
npm run clean
npm run build
npm test

# Check what files will be published (should match the "files" array in package.json)
npm pack --dry-run
```

### 5. Publish

```bash
# For first-time publishing
npm publish

# If you get a 402 error about payment required, you might need to use:
npm publish --access public
```

## 🔄 Future Updates

### Version Management

This project uses [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.1): Bug fixes, no breaking changes
- **Minor** (1.1.0): New features, backward compatible
- **Major** (2.0.0): Breaking changes

```bash
# Update version and publish
npm version patch   # for bug fixes (1.0.0 -> 1.0.1)
npm version minor   # for new features (1.0.0 -> 1.1.0)
npm version major   # for breaking changes (1.0.0 -> 2.0.0)

# This will:
# 1. Update package.json version
# 2. Create a git tag
# 3. Commit the change

# Then publish
npm publish
```

### Update Workflow

1. Make your changes
2. Update tests and documentation
3. Update CHANGELOG.md
4. Run tests: `npm test`
5. Build: `npm run build`
6. Commit changes: `git commit -am "Description of changes"`
7. Update version: `npm version patch|minor|major`
8. Push to GitHub: `git push && git push --tags`
9. Publish to npm: `npm publish`

## 📊 Package Information

After publishing, your package will be available at:
- **npm**: https://www.npmjs.com/package/ppk-to-openssh
- **Install**: `npm install ppk-to-openssh`
- **CLI**: `npx ppk-to-openssh`

## 🛠️ Maintenance

### Analytics and Downloads

- Check download stats: https://www.npmjs.com/package/ppk-to-openssh
- Use npm-stat.com for detailed analytics

### Managing Issues

- Monitor GitHub issues for bug reports and feature requests
- Respond to issues promptly
- Use labels to categorize issues (bug, enhancement, question, etc.)

### Security

- Keep dependencies updated: `npm audit` and `npm audit fix`
- Monitor for security advisories
- Follow security best practices

## 🔐 Security Considerations

- **Never commit sensitive data** (private keys, passwords, etc.)
- **Review all contributions** carefully before merging
- **Keep dependencies updated** to avoid known vulnerabilities
- **Use .npmignore** to exclude sensitive files from the published package

## 📝 Documentation

Keep these files updated:
- `README.md` - Main documentation
- `CHANGELOG.md` - Version history
- `CONTRIBUTING.md` - Contribution guidelines
- TypeScript definitions in `src/index.d.ts`

## ❓ Troubleshooting

### Common Publishing Issues

1. **403 Forbidden**: You might not have permission. Check package name ownership.
2. **402 Payment Required**: Use `npm publish --access public` for scoped packages.
3. **Version already exists**: Increment version number with `npm version patch`.
4. **Build fails**: Ensure all dependencies are installed and tests pass.

### Getting Help

- npm documentation: https://docs.npmjs.com/
- npm support: https://www.npmjs.com/support
- GitHub issues for this project

## 🎉 Congratulations!

Once published, your library will be available to millions of developers worldwide! 

Remember to:
- ⭐ Star the repository to show it's actively maintained
- 📢 Share it on social media or relevant communities
- 📊 Monitor usage and feedback
- 🔄 Keep it updated and maintained

Happy publishing! 🚀