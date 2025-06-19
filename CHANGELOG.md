# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2024-12-19

### Added
- OpenSSH output format support for better ssh2-streams compatibility
- Configurable output format via `outputFormat` option (pem/openssh)
- Comprehensive OpenSSH private key format support for RSA and ECDSA

### Fixed
- PPK v3 unencrypted key MAC verification (critical bugfix)
- Proper MAC key derivation for unencrypted PPK v3 files
- Test coverage for MAC verification and output format options

### Changed
- Enhanced PPKParser constructor with outputFormat option
- Improved backward compatibility (PEM remains default)
- Updated documentation with OpenSSH format examples

### Removed
- Unnecessary development documentation files

## [1.2.3] - 2024-12-16

### Added
- Interactive passphrase prompting in CLI for encrypted PPK files
- Hidden input for passphrase entry (no echo to terminal)
- Automatic detection when passphrase is required
- Enhanced CLI help text with interactive mode documentation

### Changed
- CLI now automatically prompts for passphrases when encountering encrypted files (if no -p flag provided)
- Updated README with interactive mode examples and usage patterns
- Improved user experience for encrypted PPK file conversion

### Technical Details
- Pure JavaScript implementation using Node.js stdin raw mode
- Maintains full backward compatibility with existing -p flag
- No additional dependencies required
- Graceful error handling for Ctrl+C and other input scenarios

## [1.2.0] - 2024-12-16

### Added
- Complete PPK v3 support with Argon2id encryption
- Universal browser and Node.js compatibility via hash-wasm integration
- Production-ready PPK v3 file parsing for SSH connections

### Changed
- Replaced custom Argon2 implementation with proven hash-wasm library
- Improved error handling and debugging information
- Enhanced MAC verification for PPK v3 files

### Fixed
- PPK v3 MAC verification now works correctly with HMAC-SHA-256
- Argon2id key derivation produces correct output for PuTTY compatibility
- PPK v3 files with encrypted keys now decrypt properly for SSH use

### Technical Details
- Integrated hash-wasm (~11KB) for WebAssembly-based Argon2 implementation
- Fixed MAC calculation to use algorithm + encryption + comment + keys format
- Maintained full backward compatibility with PPK v2 files
- Added comprehensive test coverage for PPK v3 workflows

## [1.1.6] - 2024-11-06

### Fixed
- Resolved "Cannot read properties of undefined (reading '0')" crash when parsing PPK v3 files
- Simplified Argon2 implementation to prevent memory access errors
- PPK v3 files no longer crash the parser

### Known Issues
- PPK v3 full support still in development due to complex Argon2 requirements
- PPK v3 files may still fail MAC verification (decryption needs correct Argon2)
- PPK v2 files work perfectly

### Notes
- This release resolves the original crash reported by users
- Full PPK v3 support requires a complete Argon2 implementation matching PuTTY's exact algorithm

## [1.1.5] - 2024-11-06

### Fixed
- Fixed "Cannot read properties of undefined" errors in PPK v3 Argon2 processing
- Improved Argon2 memory management and reference indexing
- Added safety checks to prevent accessing uninitialized memory blocks
- Resolved variable scoping issue in error handling
- PPK v3 files now parse without crashes (MAC verification needs refinement)

### Known Issues
- PPK v3 MAC verification may fail due to simplified Argon2 implementation
- Working on full Argon2 specification compliance in next release

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