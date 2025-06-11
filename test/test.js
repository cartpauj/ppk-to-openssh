#!/usr/bin/env node

const assert = require('assert');
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

// Run the test suite
if (require.main === module) {
  suite.run().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { TestSuite, sampleRSAPPK };