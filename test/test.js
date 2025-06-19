#!/usr/bin/env node

const assert = require('assert');
const crypto = require('crypto');
const sshpk = require('sshpk');
const fs = require('fs');
const path = require('path');
const { parseFromString, parseFromFile, PPKParser, PPKError } = require('../src/index.js');

// Test suite
class TestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('Running PPK Parser Tests...\n');

    for (const test of this.tests) {
      try {
        await test.testFn();
        console.log(`✓ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

// Create test sample PPK data
const sampleRSAPPK = `PuTTY-User-Key-File-2: ssh-rsa
Encryption: none
Comment: rsa-key-20240101
Public-Lines: 6
AAAAB3NzaC1yc2EAAAADAQABAAABAQDTgvwjlRHZ1POwCg1pODGYdR4LPTUq6g2Q
+3RHX2g8/gV6JgYbQL1L1ZrQjJKdGJnOnSN3F+kgUfF6Hl3VGrL9H8Fh7F8FGQ
C3C6gTjYgG3jEh5TFH8jPyNcwQ2MjCY4Y5H5GJxEP2lPVJxGF1XjX8YqYpzF1L
JqGt8j5kG8H3XQtQ5GrNrTJjZgY2Y4kF6PzVPQ3F8QRQY9lP4H1QhY4V1Y5KzF
YtQjNR3YhFNQ2tGjsWbJ3FXjQ2F8FH3XQKjY8G2HjNrGjKGhQpF9TjYgGR4Yh8
YrFJnQ3Y4ZjQ2F8FH3XQKjY8G2HjNrGjKGhQpF9TjYgGR4Yh8YrFJnQ3Y4ZjQ2
Private-Lines: 14
AAABAQCTgvwjlRHZ1POwCg1pODGYdR4LPTUq6g2Q+3RHX2g8/gV6JgYbQL1L1Zr
QjJKdGJnOnSN3F+kgUfF6Hl3VGrL9H8Fh7F8FGQC3C6gTjYgG3jEh5TFH8jPyNc
wQ2MjCY4Y5H5GJxEP2lPVJxGF1XjX8YqYpzF1LJqGt8j5kG8H3XQtQ5GrNrTJj
ZgY2Y4kF6PzVPQ3F8QRQY9lP4H1QhY4V1Y5KzFYtQjNR3YhFNQ2tGjsWbJ3FXj
Q2F8FH3XQKjY8G2HjNrGjKGhQpF9TjYgGR4Yh8YrFJnQ3Y4ZjQ2F8FH3XQKjY8
G2HjNrGjKGhQpF9TjYgGR4Yh8YrFJnQ3Y4ZjQ2F8FH3XQKjY8G2HjNrGjKGhQp
F9TjYgGR4Yh8YrFJnQ3Y4ZjQ2F8FH3XQKjY8G2HjNrGjKGhQpF9TjYgGR4Yh8Yr
FJnQ3Y4ZjQ2F8FH3XQKjY8G2HjNrGjKGhQpF9TjYgGR4Yh8YrFJnQ3Y4ZjQ2F8
FH3XQKjY8G2HjNrGjKGhQpF9TjYgGR4Yh8YrFJnQ3Y4ZjQ2F8FH3XQKjY8G2Hj
NrGjKGhQpF9TjYgGR4Yh8YrFJnQ3Y4ZjQ2F8FH3XQKjY8G2HjNrGjKGhQpF9Tj
YgGR4Yh8YrFJnQ3Y4ZjQ2F8FH3XQKjY8G2HjNrGjKGhQpF9TjYgGR4Yh8YrFJn
Q3Y4ZjQ2F8FH3XQKjY8G2HjNrGjKGhQpF9TjYgGR4Yh8YrFJnQ3Y4ZjQ2F8FH3
XQKjY8G2HjNrGjKGhQpF9TjYgGR4Yh8YrFJnQ3Y4ZjQ2F8FH3XQKjY8G2HjNrG
jKGhQpF9TjYgGR4Yh8YrFJnQ3Y4ZjQ2F8FH3XQKjY8G2HjNrGjKGhQpF9TjYgG
Private-MAC: 1234567890abcdef1234567890abcdef12345678`;

// Initialize test suite
const suite = new TestSuite();

// Test 1: Basic PPK Parser instantiation
suite.addTest('PPK Parser instantiation', () => {
  const parser = new PPKParser();
  assert(parser instanceof PPKParser, 'Parser should be instance of PPKParser');
  assert(Array.isArray(parser.supportedAlgorithms), 'Should have supported algorithms array');
  assert(parser.supportedAlgorithms.includes('ssh-rsa'), 'Should support ssh-rsa');
});

// Test 2: PPKError class functionality
suite.addTest('PPKError class', () => {
  const error = new PPKError('Test error', 'TEST_CODE', { hint: 'Test hint' });
  assert(error instanceof Error, 'PPKError should extend Error');
  assert(error instanceof PPKError, 'Should be instance of PPKError');
  assert.strictEqual(error.name, 'PPKError', 'Should have correct name');
  assert.strictEqual(error.code, 'TEST_CODE', 'Should have correct code');
  assert.strictEqual(error.details.hint, 'Test hint', 'Should have correct details');
});

// Test 3: Input validation
suite.addTest('Input validation', async () => {
  const parser = new PPKParser();
  
  // Test empty input
  try {
    await parser.parse('');
    assert.fail('Should throw error for empty input');
  } catch (error) {
    assert(error instanceof PPKError, 'Should throw PPKError');
    assert.strictEqual(error.code, 'INVALID_INPUT', 'Should have correct error code');
  }
  
  // Test non-string input
  try {
    await parser.parse(null);
    assert.fail('Should throw error for null input');
  } catch (error) {
    assert(error instanceof PPKError, 'Should throw PPKError');
    assert.strictEqual(error.code, 'INVALID_INPUT', 'Should have correct error code');
  }
});

// Test 4: Wrong format detection
suite.addTest('Wrong format detection', async () => {
  const parser = new PPKParser();
  
  // Test OpenSSH key detection
  try {
    await parser.parse('-----BEGIN OPENSSH PRIVATE KEY-----\ntest\n-----END OPENSSH PRIVATE KEY-----');
    assert.fail('Should detect OpenSSH format');
  } catch (error) {
    assert(error instanceof PPKError, 'Should throw PPKError');
    assert.strictEqual(error.code, 'WRONG_FORMAT', 'Should detect wrong format');
  }
  
  // Test PEM format detection
  try {
    await parser.parse('-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----');
    assert.fail('Should detect PEM format');
  } catch (error) {
    assert(error instanceof PPKError, 'Should throw PPKError');
    assert.strictEqual(error.code, 'WRONG_FORMAT', 'Should detect wrong format');
  }
});

// Test 5: Missing PPK header detection
suite.addTest('Missing PPK header detection', async () => {
  const parser = new PPKParser();
  
  try {
    await parser.parse('Not a PPK file\nRandom content');
    assert.fail('Should detect missing PPK header');
  } catch (error) {
    assert(error instanceof PPKError, 'Should throw PPKError');
    assert.strictEqual(error.code, 'INVALID_PPK_FORMAT', 'Should detect invalid PPK format');
  }
});

// Test 6: Basic API functions
suite.addTest('API functions', async () => {
  // Test that functions are exported
  assert.strictEqual(typeof parseFromString, 'function', 'parseFromString should be a function');
  assert.strictEqual(typeof parseFromFile, 'function', 'parseFromFile should be a function');
  
  // Test error handling for missing file
  try {
    await parseFromFile('/nonexistent/path/file.ppk');
    assert.fail('Should throw error for missing file');
  } catch (error) {
    assert(error instanceof PPKError, 'Should throw PPKError');
    assert.strictEqual(error.code, 'FILE_NOT_FOUND', 'Should have correct error code');
  }
});

// Test 7: File size limit
suite.addTest('File size limit enforcement', async () => {
  const parser = new PPKParser();
  const largeContent = 'PuTTY-User-Key-File-2: ssh-rsa\n' + 'x'.repeat(2 * 1024 * 1024); // 2MB
  
  try {
    await parser.parse(largeContent);
    assert.fail('Should enforce file size limit');
  } catch (error) {
    assert(error instanceof PPKError, 'Should throw PPKError');
    assert.strictEqual(error.code, 'FILE_TOO_LARGE', 'Should detect large file');
  }
});

// Test 8: Unsupported PPK version
suite.addTest('Unsupported PPK version detection', async () => {
  const parser = new PPKParser();
  const unsupportedVersion = 'PuTTY-User-Key-File-1: ssh-rsa\nEncryption: none\nComment: test';
  
  try {
    await parser.parse(unsupportedVersion);
    assert.fail('Should detect unsupported version');
  } catch (error) {
    assert(error instanceof PPKError, 'Should throw PPKError');
    assert.strictEqual(error.code, 'UNSUPPORTED_VERSION', 'Should detect unsupported version');
  }
});

// Test 9: Error handling for incomplete PPK
suite.addTest('Error handling for incomplete PPK', async () => {
  const parser = new PPKParser();
  
  // Incomplete PPK file that should trigger an error
  const incompletePPK = `PuTTY-User-Key-File-2: ssh-rsa
Encryption: none
Comment: test`;
  
  try {
    await parser.parse(incompletePPK);
    assert.fail('Should detect incomplete PPK file');
  } catch (error) {
    assert(error instanceof PPKError, 'Should throw PPKError');
    // Should detect some kind of parsing error
    assert(error.code, 'Should have an error code');
  }
});

// Test 10: General error handling
suite.addTest('General parsing error handling', async () => {
  const parser = new PPKParser();
  
  // PPK with invalid structure
  const malformedPPK = `PuTTY-User-Key-File-2: ssh-rsa
Encryption: none
Public-Lines: abc
Private-Lines: def
Random content here`;
  
  try {
    await parser.parse(malformedPPK);
    assert.fail('Should detect malformed PPK');
  } catch (error) {
    assert(error instanceof PPKError, 'Should throw PPKError');
    // Should detect some kind of parsing error
    assert(error.code, 'Should have an error code');
  }
});

// Test 11: Output format options
suite.addTest('Output format options', () => {
  // Test default format
  const defaultParser = new PPKParser();
  assert.strictEqual(defaultParser.options.outputFormat, undefined, 'Default should be undefined (uses PEM)');
  
  // Test PEM format explicitly
  const pemParser = new PPKParser({ outputFormat: 'pem' });
  assert.strictEqual(pemParser.options.outputFormat, 'pem', 'Should set PEM format');
  
  // Test OpenSSH format
  const opensshParser = new PPKParser({ outputFormat: 'openssh' });
  assert.strictEqual(opensshParser.options.outputFormat, 'openssh', 'Should set OpenSSH format');
});

// Test 12: PPK v3 MAC key derivation logic
suite.addTest('PPK v3 MAC key derivation', () => {
  const parser = new PPKParser();
  
  // Test unencrypted PPK v3 MAC key (should be empty buffer)
  const unencryptedMacKey = parser.deriveMACKeyV3('');
  assert(Buffer.isBuffer(unencryptedMacKey), 'Should return Buffer');
  assert.strictEqual(unencryptedMacKey.length, 32, 'Should be 32 bytes');
  assert(unencryptedMacKey.equals(Buffer.alloc(32)), 'Should be all zeros for unencrypted');
  
  // Test encrypted PPK v3 MAC key (should be derived from passphrase)
  const encryptedMacKey = parser.deriveMACKeyV3('testpass');
  assert(Buffer.isBuffer(encryptedMacKey), 'Should return Buffer');
  assert.strictEqual(encryptedMacKey.length, 32, 'Should be 32 bytes');
  assert(!encryptedMacKey.equals(Buffer.alloc(32)), 'Should not be all zeros for encrypted');
});

// Function to convert PPK with encryption using pure JavaScript (sshpk + Node.js crypto)
// Now supports ALL key types including Ed25519!
async function convertPPKWithEncryption(ppkContent, inputPassphrase = '', outputPassphrase) {
  try {
    // Convert PPK to OpenSSH format (unencrypted)
    const result = await parseFromString(ppkContent, inputPassphrase);
    
    // Try sshpk first (works with all key types including Ed25519)
    try {
      const key = sshpk.parsePrivateKey(result.privateKey, 'auto');
      const encryptedPrivateKey = key.toString('openssh', { passphrase: outputPassphrase });
      
      return {
        ...result,
        privateKey: encryptedPrivateKey
      };
    } catch (sshpkError) {
      // Fallback to Node.js crypto for PEM format keys
      if (result.privateKey.includes('BEGIN OPENSSH PRIVATE KEY')) {
        throw new Error(`sshpk encryption failed: ${sshpkError.message}`);
      }
      
      const keyObject = crypto.createPrivateKey(result.privateKey);
      const encryptedPrivateKey = keyObject.export({
        format: 'pem',
        type: 'pkcs8',
        cipher: 'aes-256-cbc',
        passphrase: outputPassphrase
      });
      
      return {
        ...result,
        privateKey: encryptedPrivateKey
      };
    }
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

// Test 13: Pure JS encryption - RSA keys
suite.addTest('Pure JS encryption - RSA keys', async () => {
  const testFiles = [
    'test/fixtures/ppk-keys/rsa-2048-v2-nopass.ppk',
    'test/fixtures/ppk-keys/rsa-2048-v3-nopass.ppk'
  ];
  
  for (const filePath of testFiles) {
    if (fs.existsSync(filePath)) {
      const ppkContent = fs.readFileSync(filePath, 'utf8');
      const originalResult = await parseFromString(ppkContent, '');
      const encryptedResult = await convertPPKWithEncryption(ppkContent, '', 'test-password');
      
      // Encrypted key should be different from original
      assert(encryptedResult.privateKey !== originalResult.privateKey, 'Encrypted key should differ from original');
      
      // Should be able to decrypt with appropriate tool
      if (encryptedResult.privateKey.includes('BEGIN ENCRYPTED PRIVATE KEY')) {
        // PKCS#8 format - use Node.js crypto
        const decryptedKey = crypto.createPrivateKey({
          key: encryptedResult.privateKey,
          passphrase: 'test-password'
        });
        assert(decryptedKey, 'Should be able to decrypt PKCS#8 key');
      } else {
        // OpenSSH format - use sshpk
        const decryptedKey = sshpk.parsePrivateKey(encryptedResult.privateKey, 'openssh', { passphrase: 'test-password' });
        assert(decryptedKey, 'Should be able to decrypt OpenSSH key');
      }
    }
  }
});

// Test 14: Pure JS encryption - DSA keys
suite.addTest('Pure JS encryption - DSA keys', async () => {
  const testFiles = [
    'test/fixtures/ppk-keys/dsa-1024-v2-nopass.ppk',
    'test/fixtures/ppk-keys/dsa-1024-v3-nopass.ppk'
  ];
  
  for (const filePath of testFiles) {
    if (fs.existsSync(filePath)) {
      const ppkContent = fs.readFileSync(filePath, 'utf8');
      const originalResult = await parseFromString(ppkContent, '');
      const encryptedResult = await convertPPKWithEncryption(ppkContent, '', 'test-password');
      
      // Encrypted key should be different from original
      assert(encryptedResult.privateKey !== originalResult.privateKey, 'Encrypted key should differ from original');
      
      // Should be able to decrypt with appropriate tool
      if (encryptedResult.privateKey.includes('BEGIN ENCRYPTED PRIVATE KEY')) {
        // PKCS#8 format - use Node.js crypto
        const decryptedKey = crypto.createPrivateKey({
          key: encryptedResult.privateKey,
          passphrase: 'test-password'
        });
        assert(decryptedKey, 'Should be able to decrypt PKCS#8 key');
      } else {
        // OpenSSH format - use sshpk
        const decryptedKey = sshpk.parsePrivateKey(encryptedResult.privateKey, 'openssh', { passphrase: 'test-password' });
        assert(decryptedKey, 'Should be able to decrypt OpenSSH key');
      }
    }
  }
});

// Test 15: Pure JS encryption - ECDSA keys
suite.addTest('Pure JS encryption - ECDSA keys', async () => {
  const testFiles = [
    'test/fixtures/ppk-keys/ecdsa-256-v2-nopass.ppk',
    'test/fixtures/ppk-keys/ecdsa-384-v3-nopass.ppk',
    'test/fixtures/ppk-keys/ecdsa-521-v2-nopass.ppk'
  ];
  
  for (const filePath of testFiles) {
    if (fs.existsSync(filePath)) {
      const ppkContent = fs.readFileSync(filePath, 'utf8');
      const originalResult = await parseFromString(ppkContent, '');
      const encryptedResult = await convertPPKWithEncryption(ppkContent, '', 'test-password');
      
      // Encrypted key should be different from original
      assert(encryptedResult.privateKey !== originalResult.privateKey, 'Encrypted key should differ from original');
      
      // Should be able to decrypt with appropriate tool
      if (encryptedResult.privateKey.includes('BEGIN ENCRYPTED PRIVATE KEY')) {
        // PKCS#8 format - use Node.js crypto
        const decryptedKey = crypto.createPrivateKey({
          key: encryptedResult.privateKey,
          passphrase: 'test-password'
        });
        assert(decryptedKey, 'Should be able to decrypt PKCS#8 key');
      } else {
        // OpenSSH format - use sshpk
        const decryptedKey = sshpk.parsePrivateKey(encryptedResult.privateKey, 'openssh', { passphrase: 'test-password' });
        assert(decryptedKey, 'Should be able to decrypt OpenSSH key');
      }
    }
  }
});

// Test 16: Pure JS encryption - Ed25519 keys (now working with sshpk!)
suite.addTest('Pure JS encryption - Ed25519 keys', async () => {
  const testFiles = [
    'test/fixtures/ppk-keys/ed25519-v2-nopass.ppk',
    'test/fixtures/ppk-keys/ed25519-v3-nopass.ppk'
  ];
  
  for (const filePath of testFiles) {
    if (fs.existsSync(filePath)) {
      const ppkContent = fs.readFileSync(filePath, 'utf8');
      const result = await convertPPKWithEncryption(ppkContent, '', 'test-password');
      
      assert(result.privateKey.includes('BEGIN OPENSSH PRIVATE KEY'), 'Should be OpenSSH format');
      assert(result.privateKey !== ppkContent, 'Should be different from original (encrypted)');
      
      // Verify we can decrypt it back with sshpk
      const decryptedKey = sshpk.parsePrivateKey(result.privateKey, 'openssh', { passphrase: 'test-password' });
      assert(decryptedKey, 'Should be able to decrypt the key');
      assert.strictEqual(decryptedKey.type, 'ed25519', 'Should be Ed25519 key type');
    }
  }
});

// Test 17: Comprehensive encryption test - encrypt flag with main API
suite.addTest('Comprehensive encryption test - encrypt flag with main API', async () => {
  const manifest = JSON.parse(fs.readFileSync('test/fixtures/test-keys-manifest.json', 'utf8'));
  
  let totalTested = 0;
  let totalSuccessful = 0;
  
  for (const keyInfo of manifest.keys) {
    const ppkContent = fs.readFileSync(keyInfo.files.ppk, 'utf8');
    const passphrase = keyInfo.passphrase;
    
    // Test 1: Parse without encryption (should be unencrypted)
    const unencryptedResult = await parseFromString(ppkContent, passphrase);
    
    // Test 2: Parse with encrypt flag (should be encrypted)
    const encryptedResult = await parseFromString(ppkContent, passphrase, {
      encrypt: true,
      outputPassphrase: 'test-encrypt-pass'
    });
    
    // Verify encryption worked (key should be different)
    assert(encryptedResult.privateKey !== unencryptedResult.privateKey, 
           `Encryption failed for ${keyInfo.name}: key unchanged`);
    
    // Verify public keys are identical
    assert.strictEqual(encryptedResult.publicKey, unencryptedResult.publicKey,
                      `Public keys should be identical for ${keyInfo.name}`);
    
    // Verify encrypted key can be decrypted
    if (encryptedResult.privateKey.includes('BEGIN ENCRYPTED PRIVATE KEY')) {
      // PKCS#8 format - use Node.js crypto
      const decryptedKey = crypto.createPrivateKey({
        key: encryptedResult.privateKey,
        passphrase: 'test-encrypt-pass'
      });
      assert(decryptedKey, `PKCS#8 decryption failed for ${keyInfo.name}`);
    } else {
      // OpenSSH format - use sshpk
      const decryptedKey = sshpk.parsePrivateKey(encryptedResult.privateKey, 'openssh', { 
        passphrase: 'test-encrypt-pass' 
      });
      assert(decryptedKey, `OpenSSH decryption failed for ${keyInfo.name}`);
    }
    
    totalTested++;
    totalSuccessful++;
  }
  
  assert.strictEqual(totalSuccessful, totalTested, `Expected all ${totalTested} keys to encrypt successfully`);
  assert.strictEqual(totalTested, manifest.keys.length, 'Should test all keys in manifest');
});

// Test 18: Encrypt flag validation
suite.addTest('Encrypt flag validation', async () => {
  const ppkContent = fs.readFileSync('test/fixtures/ppk-keys/rsa-2048-v2-nopass.ppk', 'utf8');
  
  // Test error when encrypt is true but no outputPassphrase
  try {
    await parseFromString(ppkContent, '', { encrypt: true });
    assert.fail('Should throw error when encrypt is true but outputPassphrase is missing');
  } catch (error) {
    assert(error.message.includes('outputPassphrase is required'), 'Should require outputPassphrase');
  }
  
  // Test that encrypt: false works (same as no options)
  const result1 = await parseFromString(ppkContent, '');
  const result2 = await parseFromString(ppkContent, '', { encrypt: false });
  assert.strictEqual(result1.privateKey, result2.privateKey, 'encrypt: false should work like no options');
});

// Test 19: parseFromFile with encrypt flag
suite.addTest('parseFromFile with encrypt flag', async () => {
  const filePath = 'test/fixtures/ppk-keys/ed25519-v2-nopass.ppk';
  
  // Test without encryption
  const unencryptedResult = await parseFromFile(filePath, '');
  
  // Test with encryption
  const encryptedResult = await parseFromFile(filePath, '', {
    encrypt: true,
    outputPassphrase: 'test-file-encrypt'
  });
  
  // Verify they're different
  assert(encryptedResult.privateKey !== unencryptedResult.privateKey, 'File encryption should work');
  assert.strictEqual(encryptedResult.publicKey, unencryptedResult.publicKey, 'Public keys should match');
  
  // Verify encrypted key works
  const decryptedKey = sshpk.parsePrivateKey(encryptedResult.privateKey, 'openssh', { 
    passphrase: 'test-file-encrypt' 
  });
  assert(decryptedKey, 'Should be able to decrypt file-encrypted key');
  assert.strictEqual(decryptedKey.type, 'ed25519', 'Should be Ed25519 key');
});

// Run the test suite
if (require.main === module) {
  suite.run().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { TestSuite, sampleRSAPPK, convertPPKWithEncryption };