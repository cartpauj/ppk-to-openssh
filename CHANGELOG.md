# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.4] - 2024-11-06

### Fixed
- Fixed null reference errors in base64 regex match operations
- Added better validation for empty or missing key data sections
- Enhanced error reporting with detailed debugging information for troubleshooting
- Fixed potential crashes when PPK files have malformed base64 data

## [1.1.3] - 2024-11-06

### Fixed
- Fixed "Cannot read properties of undefined" errors in PPK parsing
- Added defensive programming for all split() operations to handle malformed PPK files
- Improved error handling for edge cases in PPK file structure parsing

## [1.1.2] - 2024-11-06

### Fixed
- Fixed PPK version parsing bug that caused "Unsupported PPK version: NaN" errors
- Improved regex pattern for parsing PPK v2 and v3 file headers

## [1.1.1] - 2024-11-06

### Fixed
- Fixed README.md formatting issue with missing code block closing tag
- Corrected markdown rendering for Requirements section

## [1.1.0] - 2024-11-06

### Added
- Zero dependencies: Removed all external dependencies including argon2-browser
- Built-in pure JavaScript Argon2 implementation for PPK v3 support
- Universal compatibility: Now works in Node.js, browsers, VS Code extensions, and any JavaScript environment
- Enhanced browser and VS Code extension support without dependency conflicts

### Changed
- Replaced argon2-browser dependency with built-in Argon2 implementation
- Updated documentation to highlight zero-dependency architecture
- Enhanced universal compatibility messaging

## [1.0.0] - 2024-11-06

### Added
- Initial release of ppk-to-openssh library
- Support for PPK versions 2 and 3
- Support for all key types: RSA, DSA, ECDSA (P-256, P-384, P-521), Ed25519
- Encryption support with AES-256-CBC and Argon2 key derivation
- Comprehensive error handling with structured error codes
- TypeScript definitions for better developer experience
- Command-line interface for easy conversion
- Pure JavaScript implementation with no native dependencies
- Cross-platform compatibility (Linux, macOS, Windows)
- Full MAC verification for security
- Input validation and size limits
- Both CommonJS and ES Modules support

### Features
- `parseFromFile()` - Convert PPK files from filesystem
- `parseFromString()` - Convert PPK content from strings
- `PPKParser` class with configurable options
- `PPKError` class with detailed error information
- CLI tool with comprehensive options and help
- Support for encrypted and unencrypted keys
- SHA256 fingerprint generation
- Proper OpenSSH and PEM format output

### Security
- Input validation and sanitization
- Buffer bounds checking
- File size limits (configurable, default 1MB)
- MAC verification for key integrity
- Secure error handling without information leakage