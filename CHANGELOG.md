# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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