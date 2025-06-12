# ppk-to-openssh

[![npm version](https://badge.fury.io/js/ppk-to-openssh.svg)](https://badge.fury.io/js/ppk-to-openssh)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A pure JavaScript library for parsing and converting PuTTY private key files (.ppk) to OpenSSH format. Supports all PPK versions (v2 and v3) and key types (RSA, DSA, ECDSA, Ed25519). Handles both encrypted and unencrypted keys with full MAC verification. **Production-ready PPK v3 support** with universal Argon2 implementation that works in Node.js, browsers, and any JavaScript environment.

## ✨ Features

- **Complete PPK Support**: Handles PPK versions 2 and 3 with full feature parity
- **All Key Types**: RSA, DSA, ECDSA (P-256, P-384, P-521), and Ed25519
- **Production-Ready PPK v3**: Full Argon2id/Argon2i/Argon2d support with HMAC-SHA-256 verification
- **Universal Argon2**: WebAssembly-based implementation works in browsers and Node.js
- **Security**: Full MAC verification, input validation, and cryptographic best practices
- **Minimal Dependencies**: Only one dependency (hash-wasm) for universal Argon2 support
- **Universal Compatibility**: Works in Node.js, browsers, VS Code extensions, and any JavaScript environment
- **Cross-Platform**: Linux, macOS, Windows support
- **TypeScript**: Includes comprehensive TypeScript definitions
- **CLI Tool**: Command-line interface for easy conversion
- **Comprehensive Error Handling**: Detailed error codes and helpful hints

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

### 3. Batch Processing Multiple Keys

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

### 4. Using the PPKParser Class with Options

```javascript
const { PPKParser } = require('ppk-to-openssh');

async function advancedUsage() {
  const parser = new PPKParser({
    maxFileSize: 2 * 1024 * 1024, // 2MB limit
    maxFieldSize: 1024 * 1024     // 1MB field limit
  });
  
  const ppkContent = fs.readFileSync('./mykey.ppk', 'utf8');
  const result = await parser.parse(ppkContent, 'passphrase');
  
  console.log('Algorithm:', result.publicKey.split(' ')[0]);
  if (result.curve) {
    console.log('Curve:', result.curve);
  }
  
  // Access parser info
  console.log('Supported algorithms:', parser.supportedAlgorithms);
}
```

### 5. ES Modules (ESM) Usage

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

### 6. TypeScript Usage

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

### 7. Browser Usage (with bundlers)

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

### 7.1. VS Code Extension Usage

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

### 8. Express.js API Endpoint

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
      algorithm: result.publicKey.split(' ')[0]
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

### 9. Stream Processing

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

### 10. CLI Integration in Node.js Scripts

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

### Functions

#### `parseFromFile(filePath, passphrase?)`

Convert a PPK file from the filesystem.

- **filePath** `string` - Path to the PPK file
- **passphrase** `string` (optional) - Passphrase for encrypted keys
- **Returns** `Promise<PPKParseResult>` - Conversion result
- **Throws** `PPKError` - On parsing errors

#### `parseFromString(ppkContent, passphrase?)`

Convert PPK content from a string.

- **ppkContent** `string` - PPK file content
- **passphrase** `string` (optional) - Passphrase for encrypted keys
- **Returns** `Promise<PPKParseResult>` - Conversion result
- **Throws** `PPKError` - On parsing errors

### Classes

#### `PPKParser`

Main parser class with configurable options.

```javascript
const parser = new PPKParser({
  maxFileSize: 1024 * 1024,  // Maximum file size (default: 1MB)
  maxFieldSize: 1024 * 1024  // Maximum field size (default: 1MB)
});

// Properties
parser.supportedAlgorithms  // Array of supported key algorithms
parser.maxFileSize         // Current max file size setting

// Methods
await parser.parse(ppkContent, passphrase)  // Parse PPK content
```

**Constructor Options:**
- `maxFileSize` (number): Maximum PPK file size in bytes (default: 1MB)
- `maxFieldSize` (number): Maximum individual field size in bytes (default: 1MB)

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
  curve?: string;        // Curve name for ECDSA keys
}
```

## 🔐 Supported Key Types

| Algorithm | PPK v2 | PPK v3 | Encryption | Notes |
|-----------|--------|--------|------------|-------|
| RSA | ✅ | ✅ | ✅ | All key sizes |
| DSA | ✅ | ✅ | ✅ | Standard DSA keys |
| ECDSA P-256 | ✅ | ✅ | ✅ | secp256r1 |
| ECDSA P-384 | ✅ | ✅ | ✅ | secp384r1 |
| ECDSA P-521 | ✅ | ✅ | ✅ | secp521r1 |
| Ed25519 | ✅ | ✅ | ✅ | Modern curve |

## 🚀 PPK v3 Features

PPK v3 support includes all advanced security features:

- **Argon2 Key Derivation**: Full support for Argon2id, Argon2i, and Argon2d variants
- **Enhanced Security**: HMAC-SHA-256 MAC verification (vs SHA-1 in PPK v2)  
- **AES-256-CBC Encryption**: Industry-standard symmetric encryption
- **Memory-Hard Functions**: Protection against brute-force attacks
- **Universal Compatibility**: WebAssembly-based Argon2 works everywhere
- **Production Ready**: Tested against PuTTY-generated PPK v3 files

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
- **Dependencies**: Only hash-wasm for universal Argon2 support across all environments

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
