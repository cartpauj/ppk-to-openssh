# ppk-to-openssh

[![npm version](https://badge.fury.io/js/ppk-to-openssh.svg)](https://badge.fury.io/js/ppk-to-openssh)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A pure JavaScript library for parsing and converting PuTTY private key files (.ppk) to OpenSSH format. Supports all PPK versions (v2 and v3) and key types (RSA, DSA, ECDSA, Ed25519). Handles both encrypted and unencrypted keys with full MAC verification. **Production-ready PPK v3 support** with universal Argon2 implementation that works in Node.js, browsers, and any JavaScript environment. **Comprehensively tested** with 200+ test cases covering all PPK variants and edge cases.

## ✨ Features

- **Complete PPK Support**: Handles PPK versions 2 and 3 with full feature parity
- **All Key Types**: RSA, DSA, ECDSA (P-256, P-384, P-521), and Ed25519
- **Pure JavaScript Encryption**: Encrypt output keys with pure JS for ALL key types (including Ed25519)
- **Dual Output Formats**: Legacy PEM format (default) and modern OpenSSH format with full DSA support
- **Production-Ready PPK v3**: Full Argon2id/Argon2i/Argon2d support with HMAC-SHA-256 verification
- **Universal Argon2**: WebAssembly-based implementation works in browsers and Node.js
- **Security**: Full MAC verification, input validation, and cryptographic best practices
- **Minimal Dependencies**: Only sshpk and hash-wasm for universal compatibility
- **Universal Compatibility**: Works in Node.js, browsers, VS Code extensions, and any JavaScript environment
- **Cross-Platform**: Linux, macOS, Windows support
- **TypeScript**: Includes comprehensive TypeScript definitions
- **CLI Tool**: Command-line interface for easy conversion
- **Comprehensive Error Handling**: Detailed error codes and helpful hints
- **Extensive Testing**: 200+ test cases covering all PPK variants, edge cases, and special passphrases

## 📦 Installation

### For End Users

```bash
npm install ppk-to-openssh
```

The library uses **hash-wasm** for universal Argon2 support, ensuring PPK v3 compatibility across all JavaScript environments.

### For Developers

If you want to contribute or build from source:

```bash
# Clone the repository
git clone https://github.com/cartpauj/ppk-to-openssh.git
cd ppk-to-openssh

# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Test the CLI
./bin/cli.js --help
```

#### Development Scripts

- `npm run build` - Build both CommonJS and ES modules
- `npm run build:cjs` - Build CommonJS version only
- `npm run build:esm` - Build ES modules version only  
- `npm run build:types` - Copy TypeScript definitions
- `npm test` - Run the test suite
- `npm run clean` - Remove built files

## 🚀 Quick Start

### Command Line Usage

```bash
# Convert a PPK file
npx ppk-to-openssh mykey.ppk

# With passphrase for encrypted keys
npx ppk-to-openssh mykey.ppk -p mypassphrase

# Interactive mode - prompts for passphrase if needed (input hidden)
npx ppk-to-openssh encrypted.ppk

# Specify output location
npx ppk-to-openssh mykey.ppk id_rsa --output ~/.ssh/

# Show help
npx ppk-to-openssh --help
```

#### Interactive Passphrase Prompting

The CLI automatically detects encrypted PPK files and prompts for passphrases when needed:

```bash
$ npx ppk-to-openssh encrypted.ppk
This PPK file is encrypted. Enter passphrase: [hidden input]
Conversion completed successfully
```

### JavaScript API

## 📚 Usage Examples

### 1. Basic File Conversion

```javascript
const { parseFromFile } = require('ppk-to-openssh');

async function convertPPK() {
  try {
    const result = await parseFromFile('./mykey.ppk', 'optional-passphrase');
    
    console.log('Private Key:');
    console.log(result.privateKey);
    
    console.log('Public Key:');
    console.log(result.publicKey);
    
    console.log('Fingerprint:', result.fingerprint);
    console.log('Algorithm:', result.algorithm);
    console.log('Comment:', result.comment);
  } catch (error) {
    console.error('Conversion failed:', error.message);
  }
}
```

### 2. Convert from String Content

```javascript
const fs = require('fs');
const { parseFromString } = require('ppk-to-openssh');

async function convertFromString() {
  const ppkContent = fs.readFileSync('./mykey.ppk', 'utf8');
  const result = await parseFromString(ppkContent, 'passphrase');
  
  // Save the converted keys
  fs.writeFileSync('./id_rsa', result.privateKey);
  fs.writeFileSync('./id_rsa.pub', result.publicKey);
}
```

### 3. Convert with Output Encryption (NEW!)

```javascript
const { parseFromString } = require('ppk-to-openssh');

async function convertWithEncryption() {
  const ppkContent = fs.readFileSync('./mykey.ppk', 'utf8');
  
  // Convert and encrypt the output private key
  const result = await parseFromString(ppkContent, 'input-passphrase', {
    encrypt: true,
    outputPassphrase: 'new-secure-password'
  });
  
  // Private key is now encrypted with 'new-secure-password'
  console.log('Encrypted private key:', result.privateKey.split('\n')[0]);
  // Output: -----BEGIN OPENSSH PRIVATE KEY----- (encrypted)
  
  fs.writeFileSync('./id_rsa', result.privateKey);
  fs.writeFileSync('./id_rsa.pub', result.publicKey);
}

// Works with ALL key types including Ed25519!
async function encryptEd25519() {
  const ppkContent = fs.readFileSync('./ed25519-key.ppk', 'utf8');
  
  const result = await parseFromString(ppkContent, '', {
    encrypt: true,
    outputPassphrase: 'secure-ed25519-password'
  });
  
  // Ed25519 key successfully encrypted with pure JavaScript!
  console.log('Ed25519 key encrypted successfully');
}
```

### 4. Batch Processing Multiple Keys

```javascript
const { parseFromFile } = require('ppk-to-openssh');
const fs = require('fs');
const path = require('path');

async function convertMultipleKeys(directory, passphrase = '') {
  const files = fs.readdirSync(directory).filter(f => f.endsWith('.ppk'));
  
  for (const file of files) {
    try {
      const filePath = path.join(directory, file);
      const result = await parseFromFile(filePath, passphrase);
      
      const baseName = path.basename(file, '.ppk');
      fs.writeFileSync(`${baseName}`, result.privateKey);
      fs.writeFileSync(`${baseName}.pub`, result.publicKey);
      
      console.log(`✓ Converted ${file}`);
    } catch (error) {
      console.error(`✗ Failed to convert ${file}:`, error.message);
    }
  }
}
```

### 5. Using the PPKParser Class with Options

```javascript
const { PPKParser } = require('ppk-to-openssh');

async function advancedUsage() {
  // Basic parser without encryption
  const parser = new PPKParser({
    maxFileSize: 2 * 1024 * 1024, // 2MB limit
    maxFieldSize: 1024 * 1024     // 1MB field limit
  });
  
  const ppkContent = fs.readFileSync('./mykey.ppk', 'utf8');
  const result = await parser.parse(ppkContent, 'passphrase'); // Only 2 parameters!
  
  console.log('Algorithm:', result.algorithm);
  if (result.curve) {
    console.log('Curve:', result.curve);
  }
  
  // Access parser info
  console.log('Supported algorithms:', parser.supportedAlgorithms);
}

// Example with output encryption - outputPassphrase goes in constructor
async function encryptedOutput() {
  const parser = new PPKParser({
    outputFormat: 'openssh',
    outputPassphrase: 'new-secure-password'  // Goes in constructor, not parse()
  });
  
  const ppkContent = fs.readFileSync('./mykey.ppk', 'utf8');
  const result = await parser.parse(ppkContent, 'input-passphrase'); // Still only 2 parameters!
  
  // Private key is now encrypted with 'new-secure-password'
  console.log('Encrypted private key:', result.privateKey.split('\n')[0]);
}
```

### 6. OpenSSH Format Output (ssh2-streams Compatible)

```javascript
const { PPKParser } = require('ppk-to-openssh');

async function openSSHFormatExample() {
  // Create parser with OpenSSH output format
  const parser = new PPKParser({
    outputFormat: 'openssh'  // Use modern OpenSSH format instead of legacy PEM
  });
  
  const ppkContent = fs.readFileSync('./mykey.ppk', 'utf8');
  const result = await parser.parse(ppkContent, 'passphrase'); // Only 2 parameters
  
  // Private key will be in OpenSSH format for ssh2-streams compatibility
  console.log('Private Key Format:', result.privateKey.split('\n')[0]);
  // Output: -----BEGIN OPENSSH PRIVATE KEY-----
  
  // Use with ssh2-streams based libraries
  const { Client } = require('ssh2');
  const conn = new Client();
  
  conn.connect({
    host: 'example.com',
    username: 'user',
    privateKey: result.privateKey,  // OpenSSH format works perfectly
    passphrase: 'key-passphrase'    // If the converted key is encrypted
  });
}

// Example with encrypted output using PPKParser directly
async function encryptedOpenSSHOutput() {
  const parser = new PPKParser({
    outputFormat: 'openssh',
    outputPassphrase: 'secure-output-password'  // Encryption options go in constructor
  });
  
  const ppkContent = fs.readFileSync('./mykey.ppk', 'utf8');
  const result = await parser.parse(ppkContent, 'input-passphrase'); // Only 2 parameters
  
  // Private key is encrypted with 'secure-output-password'
  console.log('Encrypted OpenSSH key:', result.privateKey.split('\n')[0]);
}

// Backward compatibility: Default behavior unchanged
async function defaultBehavior() {
  const { parseFromFile } = require('ppk-to-openssh');
  
  // Still outputs PEM format by default (no breaking changes)
  const result = await parseFromFile('./mykey.ppk', 'passphrase');
  console.log(result.privateKey.split('\n')[0]);
  // Output: -----BEGIN RSA PRIVATE KEY----- (or DSA/EC for other key types)
}
```

### 7. ES Modules (ESM) Usage

```javascript
import { parseFromFile, parseFromString, PPKError } from 'ppk-to-openssh';

// Basic usage
try {
  const result = await parseFromFile('./mykey.ppk');
  console.log('Conversion successful!');
} catch (error) {
  if (error instanceof PPKError) {
    console.error(`PPK Error [${error.code}]:`, error.message);
    if (error.details.hint) {
      console.error('Hint:', error.details.hint);
    }
  }
}

// With dynamic import
const ppkConverter = await import('ppk-to-openssh');
const result = await ppkConverter.parseFromFile('./mykey.ppk');
```

### 8. TypeScript Usage

```typescript
import { parseFromFile, PPKParseResult, PPKError } from 'ppk-to-openssh';

async function convertKey(filePath: string, passphrase?: string): Promise<PPKParseResult> {
  try {
    const result: PPKParseResult = await parseFromFile(filePath, passphrase);
    return result;
  } catch (error) {
    if (error instanceof PPKError) {
      console.error(`Error [${error.code}]:`, error.message);
      throw error;
    }
    throw new Error(`Unexpected error: ${error}`);
  }
}
```

### 9. Browser Usage (with bundlers)

```javascript
// In a browser environment with webpack/rollup/etc
// Universal Argon2 support via WebAssembly!
import { parseFromString } from 'ppk-to-openssh';

// Handle file upload
document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    const content = await file.text();
    const passphrase = document.getElementById('passphrase').value;
    
    try {
      const result = await parseFromString(content, passphrase);
      document.getElementById('output').textContent = result.publicKey;
    } catch (error) {
      console.error('Conversion failed:', error.message);
    }
  }
});
```

### 10. VS Code Extension Usage

```javascript
// Perfect for VS Code extensions - minimal dependencies!
const vscode = require('vscode');
const { parseFromString } = require('ppk-to-openssh');

async function convertPPKCommand() {
  try {
    // Get PPK content from user
    const ppkContent = await vscode.window.showInputBox({
      prompt: 'Paste your PPK file content',
      multiline: true
    });
    
    const passphrase = await vscode.window.showInputBox({
      prompt: 'Enter passphrase (leave empty for unencrypted keys)',
      password: true
    });
    
    const result = await parseFromString(ppkContent, passphrase || '');
    
    // Show result in new document
    const doc = await vscode.workspace.openTextDocument({
      content: result.privateKey,
      language: 'text'
    });
    await vscode.window.showTextDocument(doc);
    
    vscode.window.showInformationMessage('PPK converted successfully!');
  } catch (error) {
    vscode.window.showErrorMessage(`Conversion failed: ${error.message}`);
  }
}
```

### 11. Express.js API Endpoint

```javascript
const express = require('express');
const { parseFromString, PPKError } = require('ppk-to-openssh');
const app = express();

app.use(express.json());

app.post('/convert-ppk', async (req, res) => {
  try {
    const { ppkContent, passphrase } = req.body;
    
    if (!ppkContent) {
      return res.status(400).json({ error: 'PPK content is required' });
    }
    
    const result = await parseFromString(ppkContent, passphrase || '');
    
    res.json({
      success: true,
      publicKey: result.publicKey,
      fingerprint: result.fingerprint,
      algorithm: result.algorithm
    });
  } catch (error) {
    if (error instanceof PPKError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
        hint: error.details.hint
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});
```

### 12. Stream Processing

```javascript
const { parseFromString } = require('ppk-to-openssh');
const fs = require('fs');
const { Transform } = require('stream');

class PPKConverter extends Transform {
  constructor(passphrase = '') {
    super({ objectMode: true });
    this.passphrase = passphrase;
  }
  
  async _transform(chunk, encoding, callback) {
    try {
      const result = await parseFromString(chunk.toString(), this.passphrase);
      this.push({
        filename: chunk.filename,
        publicKey: result.publicKey,
        privateKey: result.privateKey,
        fingerprint: result.fingerprint
      });
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

// Usage
const converter = new PPKConverter('mypassphrase');
// ... pipe PPK content through converter
```

### 13. CLI Integration in Node.js Scripts

```javascript
const { spawn } = require('child_process');
const { parseFromFile } = require('ppk-to-openssh');

async function convertAndUseSSH(ppkPath, host, command) {
  // Convert PPK to OpenSSH format
  const result = await parseFromFile(ppkPath, process.env.PPK_PASSPHRASE);
  
  // Write temporary key file
  const tmpKeyPath = '/tmp/ssh_key';
  fs.writeFileSync(tmpKeyPath, result.privateKey, { mode: 0o600 });
  
  try {
    // Use with SSH
    const ssh = spawn('ssh', ['-i', tmpKeyPath, host, command]);
    
    ssh.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    ssh.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
  } finally {
    // Clean up temporary file
    fs.unlinkSync(tmpKeyPath);
  }
}
```

## 📖 API Reference

### ⚠️ Important API Notes

This library provides **two different APIs** with different parameter signatures:

#### 1. Wrapper Functions (Recommended)
```javascript
// These support options as 3rd parameter:
parseFromString(ppkContent, passphrase, options)
parseFromFile(filePath, passphrase, options)

// Example with encryption:
const result = await parseFromString(ppkContent, 'input-pass', {
  encrypt: true,
  outputPassphrase: 'output-pass'
});
```

#### 2. PPKParser Class (Advanced)
```javascript  
// Constructor takes all options, parse() only takes 2 parameters:
const parser = new PPKParser({
  outputFormat: 'openssh',
  outputPassphrase: 'output-pass'  // Goes in constructor!
});

const result = await parser.parse(ppkContent, 'input-pass'); // Only 2 params!
```

**Key Difference:** Wrapper functions accept options in the function call, while PPKParser takes options in the constructor.

### Functions

#### `parseFromFile(filePath, passphrase?, options?)`

Convert a PPK file from the filesystem.

- **filePath** `string` - Path to the PPK file
- **passphrase** `string` (optional) - Passphrase for encrypted keys
- **options** `object` (optional) - Configuration options
  - **encrypt** `boolean` - Whether to encrypt the output private key
  - **outputPassphrase** `string` - Passphrase for encrypting the output (required if encrypt is true)
- **Returns** `Promise<PPKParseResult>` - Conversion result
- **Throws** `PPKError` - On parsing errors

#### `parseFromString(ppkContent, passphrase?, options?)`

Convert PPK content from a string.

- **ppkContent** `string` - PPK file content
- **passphrase** `string` (optional) - Passphrase for encrypted keys
- **options** `object` (optional) - Configuration options
  - **encrypt** `boolean` - Whether to encrypt the output private key
  - **outputPassphrase** `string` - Passphrase for encrypting the output (required if encrypt is true)
- **Returns** `Promise<PPKParseResult>` - Conversion result
- **Throws** `PPKError` - On parsing errors

#### `convertPPKWithEncryption(ppkContent, inputPassphrase?, outputPassphrase)`

Convert PPK content and encrypt the output with pure JavaScript (supports ALL key types including Ed25519).

- **ppkContent** `string` - PPK file content
- **inputPassphrase** `string` (optional) - Passphrase for encrypted PPK files
- **outputPassphrase** `string` - Passphrase to encrypt the output key with
- **Returns** `Promise<PPKParseResult>` - Conversion result with encrypted private key
- **Throws** `Error` - On conversion or encryption errors

### Classes

#### `PPKParser`

Main parser class with configurable options.

```javascript
const parser = new PPKParser({
  maxFileSize: 1024 * 1024,  // Maximum file size (default: 1MB)
  maxFieldSize: 1024 * 1024, // Maximum field size (default: 1MB)
  outputFormat: 'pem'        // Output format: 'pem' or 'openssh' (default: 'pem')
});

// Properties
parser.supportedAlgorithms  // Array of supported key algorithms
parser.maxFileSize         // Current max file size setting

// Methods
await parser.parse(ppkContent, passphrase)  // Parse PPK content (2 parameters only!)
```

**Constructor Options:**
- `maxFileSize` (number): Maximum PPK file size in bytes (default: 1MB)
- `maxFieldSize` (number): Maximum individual field size in bytes (default: 1MB)  
- `outputFormat` (string): Private key output format - `'pem'` or `'openssh'` (default: `'pem'`)
- `outputPassphrase` (string): Passphrase to encrypt the output private key (when provided, automatically encrypts output)

#### `PPKError`

Custom error class with structured error information.

```javascript
try {
  await parseFromFile('./key.ppk', 'wrong-pass');
} catch (error) {
  if (error instanceof PPKError) {
    console.log(error.name);       // 'PPKError'
    console.log(error.message);    // Human-readable error message
    console.log(error.code);       // Structured error code
    console.log(error.details);    // Additional context object
  }
}
```

**Properties:**
- `name` (string): Always 'PPKError'
- `message` (string): Human-readable error description
- `code` (string): Structured error code for programmatic handling
- `details` (object): Additional error context and hints

**Common Error Codes:**
- `INVALID_INPUT` - Invalid input parameters
- `FILE_NOT_FOUND` - PPK file not found
- `WRONG_FORMAT` - Not a PPK file (OpenSSH/PEM detected)
- `INVALID_PPK_FORMAT` - Missing PPK header
- `UNSUPPORTED_VERSION` - Unsupported PPK version
- `PASSPHRASE_REQUIRED` - Encrypted key needs passphrase
- `INVALID_MAC` - Wrong passphrase or corrupted file
- `UNSUPPORTED_ALGORITHM` - Unsupported key algorithm
- `FILE_TOO_LARGE` - File exceeds size limit
- `UNSUPPORTED_ARGON2` - Unsupported Argon2 variant
- `UNSUPPORTED_ENCRYPTION` - Unsupported encryption method

### Types

#### `PPKParseResult`

```typescript
interface PPKParseResult {
  privateKey: string;    // OpenSSH/PEM format private key
  publicKey: string;     // OpenSSH format public key  
  fingerprint: string;   // SHA256 fingerprint
  algorithm: string;     // Key algorithm (ssh-rsa, ssh-dss, ecdsa-sha2-*, ssh-ed25519)
  comment: string;       // Key comment from PPK file
  curve?: string;        // Curve name for ECDSA keys
}
```

## 🔐 Supported Key Types

| Algorithm | PPK v2 | PPK v3 | Input Decryption | Output Encryption | Notes |
|-----------|--------|--------|------------------|-------------------|-------|
| RSA | ✅ | ✅ | ✅ | ✅ (Pure JS) | All key sizes |
| DSA | ✅ | ✅ | ✅ | ✅ (Pure JS) | Standard DSA keys |
| ECDSA P-256 | ✅ | ✅ | ✅ | ✅ (Pure JS) | secp256r1 |
| ECDSA P-384 | ✅ | ✅ | ✅ | ✅ (Pure JS) | secp384r1 |
| ECDSA P-521 | ✅ | ✅ | ✅ | ✅ (Pure JS) | secp521r1 |
| Ed25519 | ✅ | ✅ | ✅ | ✅ (Pure JS) | Pure JS encryption solution! |

## 🔐 Pure JavaScript Encryption

This library now supports **encrypting output keys with pure JavaScript** for ALL key types, including Ed25519!

### Encryption Support Matrix

| Key Type | Encryption Method | Output Format | Status |
|----------|------------------|---------------|---------|
| RSA | sshpk + Node.js crypto fallback | OpenSSH or PKCS#8 | ✅ Fully supported |
| DSA | sshpk + Node.js crypto fallback | OpenSSH or PKCS#8 | ✅ Fully supported |
| ECDSA | sshpk + Node.js crypto fallback | OpenSSH or PKCS#8 | ✅ Fully supported |
| Ed25519 | sshpk (pure JS) | OpenSSH | ✅ **Now supported!** |

### Key Benefits
- **No external tools required** - 100% pure JavaScript solution
- **Universal Ed25519 support** - Previously impossible with Node.js crypto alone
- **Secure encryption** - Uses industry-standard AES-256-CBC and OpenSSH formats
- **Backward compatible** - Existing code continues to work unchanged

```javascript
// NEW: Encrypt any key type including Ed25519
const result = await parseFromString(ppkContent, inputPass, {
  encrypt: true,
  outputPassphrase: 'secure-password'
});
```

## 🔧 Output Formats

This library supports two output formats for private keys:

| Key Type | Default (PEM) Format | OpenSSH Format | Encrypted Format |
|----------|---------------------|----------------|------------------|
| RSA | `-----BEGIN RSA PRIVATE KEY-----` | `-----BEGIN OPENSSH PRIVATE KEY-----` | PKCS#8 or OpenSSH |
| DSA | `-----BEGIN DSA PRIVATE KEY-----` | `-----BEGIN OPENSSH PRIVATE KEY-----` | PKCS#8 or OpenSSH |
| ECDSA | `-----BEGIN EC PRIVATE KEY-----` | `-----BEGIN OPENSSH PRIVATE KEY-----` | PKCS#8 or OpenSSH |
| Ed25519 | `-----BEGIN OPENSSH PRIVATE KEY-----` | `-----BEGIN OPENSSH PRIVATE KEY-----` | OpenSSH only |

**Default Behavior (Backward Compatible):**
- `parseFromFile()` and `parseFromString()` use PEM format by default
- No breaking changes to existing code

**OpenSSH Format (ssh2-streams Compatible):**
- Use `new PPKParser({ outputFormat: 'openssh' })` for modern OpenSSH format
- Better compatibility with ssh2, ssh2-sftp-client, and similar libraries
- Contains proper `openssh-key-v1` structure

**Encrypted Output:**
- Use `encrypt: true` option for encrypted private keys
- Works with all key types via pure JavaScript implementation

## 🚀 PPK v3 Features

PPK v3 support includes all advanced security features:

- **Argon2 Key Derivation**: Full support for Argon2id, Argon2i, and Argon2d variants
- **Enhanced Security**: HMAC-SHA-256 MAC verification (vs SHA-1 in PPK v2)  
- **AES-256-CBC Encryption**: Industry-standard symmetric encryption
- **Memory-Hard Functions**: Protection against brute-force attacks
- **Universal Compatibility**: WebAssembly-based Argon2 works everywhere
- **Production Ready**: Tested against PuTTY-generated PPK v3 files

## 🧪 Testing & Quality Assurance

This library is **comprehensively tested** with 200+ test cases covering:

### Test Coverage (28 Test Keys)
- **RSA Keys**: 8 variants (1024-bit v2, 2048-bit v2+v3, 4096-bit v3)
- **DSA Keys**: 4 variants (1024-bit v2+v3)
- **ECDSA Keys**: 11 variants (P-256 v2+v3, P-384 v2+v3, P-521 v2+v3)
- **Ed25519 Keys**: 5 variants (v2+v3)

### Edge Cases Tested
- **PPK Versions**: Both genuine PPK v2 and v3 formats
- **Input Encryption**: Unencrypted and AES-256-CBC encrypted PPK variants
- **Output Encryption**: Pure JS encryption testing for ALL key types including Ed25519
- **Passphrases**: Simple, complex, special characters (`p@ssw0rd!#$%^&*()`), 100-character long, Unicode (`pásswōrd_ñeẅ_123`)
- **Format Consistency**: Validation between PEM and OpenSSH outputs
- **Error Handling**: Wrong passphrases, corrupted files, unsupported formats
- **Encryption Validation**: encrypt flag testing, output passphrase requirements, decryption verification

### Test Suite Features
- **PPK Parsing**: Algorithm detection, comment preservation, fingerprint generation
- **Format Conversion**: Both PEM and OpenSSH output validation
- **Version Detection**: Proper PPK v2 vs v3 handling
- **Security**: MAC verification, passphrase handling, encryption/decryption
- **Pure JS Encryption**: All 28 keys tested with encrypt flag, Ed25519 encryption validation
- **Structure Validation**: Key encoding, Base64 validation, SSH format compliance

Run the test suite:
```bash
npm test                         # Complete test suite (19 tests including encryption)
npm run test:coverage            # Test suite with coverage reporting
```

## 🛠️ Advanced Usage

### Custom Error Handling

```javascript
const { parseFromFile, PPKError } = require('ppk-to-openssh');

async function robustConversion(filePath, passphrase) {
  try {
    return await parseFromFile(filePath, passphrase);
  } catch (error) {
    if (error instanceof PPKError) {
      switch (error.code) {
        case 'PASSPHRASE_REQUIRED':
          throw new Error('This key is encrypted. Please provide a passphrase.');
        case 'INVALID_MAC':
          throw new Error('Invalid passphrase or corrupted key file.');
        case 'FILE_NOT_FOUND':
          throw new Error(`PPK file not found: ${error.details.path}`);
        case 'WRONG_FORMAT':
          throw new Error(`This appears to be a ${error.details.hint}`);
        case 'UNSUPPORTED_ALGORITHM':
          throw new Error(`Unsupported key type: ${error.details.algorithm}`);
        default:
          throw new Error(`PPK parsing failed: ${error.message}`);
      }
    }
    throw error; // Re-throw non-PPK errors
  }
}
```

### Environment-based Configuration

```javascript
const { PPKParser } = require('ppk-to-openssh');

const parser = new PPKParser({
  maxFileSize: process.env.MAX_PPK_SIZE ? parseInt(process.env.MAX_PPK_SIZE) : 1024 * 1024,
  maxFieldSize: process.env.MAX_FIELD_SIZE ? parseInt(process.env.MAX_FIELD_SIZE) : 1024 * 1024
});

// Set via environment variables:
// MAX_PPK_SIZE=2097152 MAX_FIELD_SIZE=1048576 node myapp.js
```

### Performance Monitoring

```javascript
const { parseFromFile } = require('ppk-to-openssh');

async function timedConversion(filePath, passphrase) {
  const startTime = process.hrtime.bigint();
  
  try {
    const result = await parseFromFile(filePath, passphrase);
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    console.log(`Conversion completed in ${duration.toFixed(2)}ms`);
    return { ...result, conversionTime: duration };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    console.log(`Conversion failed after ${duration.toFixed(2)}ms`);
    throw error;
  }
}
```

## 🏗️ Requirements

- **Node.js**: 14.0.0 or higher  
- **Dependencies**: 
  - `hash-wasm` - Universal Argon2 support for PPK v3 compatibility
  - `sshpk` - Pure JavaScript SSH key encryption (enables Ed25519 encryption)

## 🌍 Environments

This library works in any JavaScript environment:

- **Node.js** (14.0.0+) - Server-side applications, CLI tools, automation scripts
- **Browsers** - Web applications (with bundlers like webpack, rollup, etc.)
- **VS Code Extensions** - No dependency conflicts with VS Code's environment
- **Electron Apps** - Desktop applications with web technologies
- **React Native** - Mobile applications (with appropriate polyfills)
- **Deno** - Modern JavaScript runtime (with Node.js compatibility layer)
- **Serverless Functions** - AWS Lambda, Vercel, Netlify, etc.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📜 License

GPL-3.0 License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Paul C** ([@cartpauj](https://github.com/cartpauj))

## 🙏 Acknowledgments

- PuTTY team for the PPK format specification
- OpenSSH project for the target format standards  
- [hash-wasm](https://github.com/Daninet/hash-wasm) for universal Argon2 implementation
