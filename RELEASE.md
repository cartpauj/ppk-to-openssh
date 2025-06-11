# Release Process

This document outlines the step-by-step process for creating and publishing new releases of ppk-to-openssh.

## 📋 Pre-Release Checklist

Before creating a new release, ensure the following:

- [ ] All changes are tested and working
- [ ] Documentation is updated (README.md, API docs)
- [ ] CHANGELOG.md is updated with new version entry
- [ ] All tests pass: `npm test`
- [ ] Library builds successfully: `npm run build`
- [ ] No uncommitted changes in git

## 🔢 Version Numbering

This project follows [Semantic Versioning](https://semver.org/):

- **PATCH** (1.0.1): Bug fixes, no breaking changes
- **MINOR** (1.1.0): New features, backward compatible
- **MAJOR** (2.0.0): Breaking changes

### Examples:
```bash
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
npm version minor   # 1.0.0 → 1.1.0 (new features)
npm version major   # 1.0.0 → 2.0.0 (breaking changes)
```

## 🚀 Release Steps

### 1. Update CHANGELOG.md

Add a new section for the upcoming version:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features or capabilities

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Removed
- Removed features or capabilities
```

### 2. Run Pre-Release Verification

```bash
# Ensure clean working directory
git status

# Run all tests
npm test

# Build the library
npm run build

# Test both import styles
node -e "const { PPKParser } = require('./lib/index.js'); console.log('CommonJS OK');"
node -e "import('./lib/index.mjs').then(() => console.log('ESM OK'));"

# Preview what will be published
npm pack --dry-run
```

### 3. Commit Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: describe your changes here

- Detail 1
- Detail 2
- Detail 3"
```

### 4. Bump Version and Tag

```bash
# Choose one based on the type of changes:
npm version patch   # For bug fixes
npm version minor   # For new features
npm version major   # For breaking changes

# This will:
# - Update package.json version
# - Create a git tag (e.g., v1.1.0)
# - Commit the version change
```

### 5. Push to GitHub

```bash
# Push commits and tags
git push && git push --tags
```

### 6. Publish to npm

```bash
# Publish to npm registry
npm publish

# The prepublishOnly script will automatically:
# - Run npm run build
# - Run npm test
# - Then publish if everything passes
```

### 7. Create GitHub Release

1. Go to https://github.com/cartpauj/ppk-to-openssh/releases
2. Click "Create a new release"
3. Select the tag you just created (e.g., v1.1.0)
4. Use the version number as the release title
5. Copy the relevant section from CHANGELOG.md as the description
6. Click "Publish release"

## 🔧 Complete Release Command Sequence

Here's the complete sequence for a typical release:

```bash
# 1. Verify everything is ready
npm test && npm run build

# 2. Commit your changes
git add .
git commit -m "feat: your changes description"

# 3. Bump version (choose patch/minor/major)
npm version minor

# 4. Push to GitHub
git push && git push --tags

# 5. Publish to npm
npm publish
```

## 📊 Post-Release Tasks

After publishing:

- [ ] Verify the package appears on https://www.npmjs.com/package/ppk-to-openssh
- [ ] Test installation: `npm install ppk-to-openssh@latest` in a fresh directory
- [ ] Create GitHub release with release notes
- [ ] Update any documentation that references version numbers
- [ ] Announce the release (if significant)

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. Version Already Exists
```bash
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/ppk-to-openssh - You cannot publish over the previously published versions
```
**Solution**: The version already exists. Increment version again:
```bash
npm version patch
npm publish
```

#### 2. Authentication Error
```bash
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/ppk-to-openssh - You must be logged in to publish packages
```
**Solution**: Login to npm:
```bash
npm login
# Enter your npm username, password, and email
```

#### 3. Package Name Conflict
```bash
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/ppk-to-openssh - Package name too similar to existing packages
```
**Solution**: The package name is taken or too similar. Change the name in package.json.

#### 4. Build Failures
```bash
npm ERR! prepublishOnly script failed
```
**Solution**: Fix the build issues before publishing:
```bash
npm run build
npm test
# Fix any errors, then try publishing again
```

#### 5. Git Tag Issues
```bash
fatal: tag 'v1.1.0' already exists
```
**Solution**: Delete the tag and recreate:
```bash
git tag -d v1.1.0           # Delete local tag
git push origin :refs/tags/v1.1.0  # Delete remote tag
npm version minor           # Create new version
```

### Rollback a Release

If you need to rollback a release:

```bash
# Unpublish the version (only possible within 72 hours)
npm unpublish ppk-to-openssh@1.1.0

# Delete the git tag
git tag -d v1.1.0
git push origin :refs/tags/v1.1.0

# Reset to previous commit
git reset --hard HEAD~1
git push --force-with-lease
```

## 📞 Getting Help

- **npm documentation**: https://docs.npmjs.com/cli/v8/commands/npm-publish
- **Semantic Versioning**: https://semver.org/
- **Keep a Changelog**: https://keepachangelog.com/
- **GitHub Releases**: https://docs.github.com/en/repositories/releasing-projects-on-github

## 🎯 Release Checklist Template

Copy this checklist for each release:

```
## Release X.Y.Z Checklist

### Pre-Release
- [ ] All features/fixes implemented and tested
- [ ] Documentation updated (README.md)
- [ ] CHANGELOG.md updated with new version
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No uncommitted changes

### Release Process
- [ ] Changes committed with descriptive message
- [ ] Version bumped: `npm version [patch|minor|major]`
- [ ] Pushed to GitHub: `git push && git push --tags`
- [ ] Published to npm: `npm publish`

### Post-Release
- [ ] Verified on npmjs.com
- [ ] GitHub release created
- [ ] Installation tested in fresh environment
- [ ] Documentation updated (if needed)
- [ ] Stakeholders notified (if significant release)
```

## 📈 Release History

Track your releases here:

- **v1.1.0** (2024-11-06): Zero dependencies, built-in Argon2, universal compatibility
- **v1.0.0** (2024-11-06): Initial release with full PPK support

---

*Remember: Each release should add value for users. Test thoroughly and document changes clearly.*