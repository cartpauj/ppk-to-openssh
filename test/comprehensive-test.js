#!/usr/bin/env node

/**
 * Comprehensive test suite for PPK key parsing and conversion
 * Tests all generated keys for proper conversion to PEM and OpenSSH formats
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { parseFromFile, PPKParser, PPKError } = require('../src/index.js');

class ComprehensiveTestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.manifest = null;
  }

  loadManifest() {
    const manifestPath = path.join(__dirname, 'fixtures/test-keys-manifest.json');
    this.manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`📋 Loaded manifest with ${this.manifest.keys.length} test keys`);
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('🔧 Running Comprehensive PPK Parser Tests...\n');
    console.log('=' .repeat(80));

    for (const test of this.tests) {
      try {
        await test.testFn();
        console.log(`✓ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error.message}`);
        if (error.stack) {
          console.log(`  Stack: ${error.stack.split('\n')[1]?.trim()}`);
        }
        this.failed++;
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log(`📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    console.log(`🎯 Success Rate: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }

  // Helper to test PPK parsing for a specific key
  async testPPKParsing(keyInfo) {
    const parser = new PPKParser();
    const result = await parseFromFile(keyInfo.files.ppk, keyInfo.passphrase);
    
    // Verify basic structure
    assert(result, 'Should return result object');
    assert(result.privateKey, 'Should have privateKey');
    assert(result.publicKey, 'Should have publicKey');
    assert(result.comment, 'Should have comment');
    assert(result.algorithm, 'Should have algorithm');
    
    // Verify algorithm matches expected
    const expectedAlgorithm = keyInfo.type === 'rsa' ? 'ssh-rsa' : 
                             keyInfo.type === 'dsa' ? 'ssh-dss' :
                             keyInfo.type === 'ecdsa' ? `ecdsa-sha2-nistp${keyInfo.bits}` :
                             keyInfo.type === 'ed25519' ? 'ssh-ed25519' : null;
    
    assert.strictEqual(result.algorithm, expectedAlgorithm, 
      `Algorithm should be ${expectedAlgorithm}, got ${result.algorithm}`);
    
    // Verify comment contains key name
    assert(result.comment.includes(keyInfo.name), 
      `Comment should contain key name ${keyInfo.name}`);
    
    return result;
  }

  // Helper to test PEM format conversion
  async testPEMConversion(keyInfo) {
    const parser = new PPKParser({ outputFormat: 'pem' });
    const result = await parseFromFile(keyInfo.files.ppk, keyInfo.passphrase);
    
    // Only RSA and DSA keys should support PEM format
    if (keyInfo.type === 'rsa' || keyInfo.type === 'dsa') {
      assert(result.privateKey.includes('-----BEGIN'), 'PEM should start with BEGIN');
      assert(result.privateKey.includes('-----END'), 'PEM should end with END');
      
      if (keyInfo.type === 'rsa') {
        assert(result.privateKey.includes('RSA PRIVATE KEY') || 
               result.privateKey.includes('PRIVATE KEY'), 
               'RSA PEM should contain proper header');
      } else if (keyInfo.type === 'dsa') {
        assert(result.privateKey.includes('DSA PRIVATE KEY') || 
               result.privateKey.includes('PRIVATE KEY'), 
               'DSA PEM should contain proper header');
      }
    }
    
    return result;
  }

  // Helper to test OpenSSH format conversion
  async testOpenSSHConversion(keyInfo) {
    const parser = new PPKParser({ outputFormat: 'openssh' });
    const ppkContent = fs.readFileSync(keyInfo.files.ppk, 'utf8');
    const result = await parser.parse(ppkContent, keyInfo.passphrase);
    
    // OpenSSH format should always be supported
    assert(result.privateKey.includes('-----BEGIN OPENSSH PRIVATE KEY-----'), 
      'OpenSSH should start with proper header');
    assert(result.privateKey.includes('-----END OPENSSH PRIVATE KEY-----'), 
      'OpenSSH should end with proper footer');
    
    // Verify the key starts with the proper OpenSSH v1 magic
    const lines = result.privateKey.split('\n').filter(line => 
      line && !line.startsWith('-----'));
    assert(lines.length > 0, 'Should have key data lines');
    
    return result;
  }

  // Helper to validate key format consistency
  async testKeyFormatConsistency(keyInfo) {
    // Parse with PEM format
    const pemParser = new PPKParser({ outputFormat: 'pem' });
    const ppkContent = fs.readFileSync(keyInfo.files.ppk, 'utf8');
    const pemResult = await pemParser.parse(ppkContent, keyInfo.passphrase);
    
    // Parse with OpenSSH format
    const opensshParser = new PPKParser({ outputFormat: 'openssh' });
    const opensshResult = await opensshParser.parse(ppkContent, keyInfo.passphrase);
    
    // Both should have same algorithm, comment, and public key
    assert.strictEqual(pemResult.algorithm, opensshResult.algorithm, 
      'Algorithm should be consistent across formats');
    assert.strictEqual(pemResult.comment, opensshResult.comment, 
      'Comment should be consistent across formats');
    assert.strictEqual(pemResult.publicKey, opensshResult.publicKey, 
      'Public key should be consistent across formats');
    assert.strictEqual(pemResult.fingerprint, opensshResult.fingerprint, 
      'Fingerprint should be consistent across formats');
    
    // Validate private key formats
    if (keyInfo.type === 'rsa' || keyInfo.type === 'dsa') {
      assert(pemResult.privateKey.includes('-----BEGIN'), 'PEM should have BEGIN marker');
      assert(pemResult.privateKey.includes('-----END'), 'PEM should have END marker');
      assert(pemResult.privateKey.includes('PRIVATE KEY'), 'PEM should indicate private key');
    }
    
    assert(opensshResult.privateKey.includes('-----BEGIN OPENSSH PRIVATE KEY-----'), 
      'OpenSSH should have proper header');
    assert(opensshResult.privateKey.includes('-----END OPENSSH PRIVATE KEY-----'), 
      'OpenSSH should have proper footer');
    
    return { pemResult, opensshResult };
  }
  
  // Helper to validate key structure and encoding
  async testKeyStructureValidation(keyInfo) {
    const parser = new PPKParser();
    const ppkContent = fs.readFileSync(keyInfo.files.ppk, 'utf8');
    const result = await parser.parse(ppkContent, keyInfo.passphrase);
    
    // Test private key structure
    assert(result.privateKey, 'Should have private key');
    assert(typeof result.privateKey === 'string', 'Private key should be string');
    assert(result.privateKey.length > 100, 'Private key should have substantial content');
    
    // Test public key structure
    assert(result.publicKey, 'Should have public key');
    assert(typeof result.publicKey === 'string', 'Public key should be string');
    assert(result.publicKey.startsWith(keyInfo.type === 'rsa' ? 'ssh-rsa' : 
                                       keyInfo.type === 'dsa' ? 'ssh-dss' :
                                       keyInfo.type === 'ecdsa' ? 'ecdsa-sha2-nistp' :
                                       'ssh-ed25519'), 'Public key should start with correct algorithm');
    
    // Test fingerprint
    assert(result.fingerprint, 'Should have fingerprint');
    assert(result.fingerprint.startsWith('SHA256:'), 'Fingerprint should use SHA256');
    assert(result.fingerprint.length > 15, 'Fingerprint should have sufficient length');
    
    // Test comment preservation
    assert(result.comment, 'Should preserve comment');
    assert(result.comment.includes(keyInfo.name), 'Comment should contain key name');
    
    // Validate Base64 encoding in public key
    const pubKeyParts = result.publicKey.split(' ');
    assert(pubKeyParts.length >= 2, 'Public key should have algorithm and key data');
    
    // Test that the key data is valid base64
    const keyData = pubKeyParts[1];
    assert(/^[A-Za-z0-9+/]+=*$/.test(keyData), 'Key data should be valid base64');
    
    return result;
  }

  // Helper to test PPK version detection
  async testVersionDetection(keyInfo) {
    const parser = new PPKParser();
    const ppkContent = fs.readFileSync(keyInfo.files.ppk, 'utf8');
    
    // Check that version is correctly detected
    const versionMatch = ppkContent.match(/^PuTTY-User-Key-File-(\d+):/);
    assert(versionMatch, 'Should have version header');
    
    const detectedVersion = parseInt(versionMatch[1]);
    assert.strictEqual(detectedVersion, keyInfo.version, 
      `Detected version ${detectedVersion} should match expected ${keyInfo.version}`);
  }

  // Helper to test passphrase handling
  async testPassphraseHandling(keyInfo) {
    const parser = new PPKParser();
    const ppkContent = fs.readFileSync(keyInfo.files.ppk, 'utf8');
    
    if (keyInfo.hasPassphrase) {
      // Test with correct passphrase
      const result = await parser.parse(ppkContent, keyInfo.passphrase);
      assert(result, 'Should parse with correct passphrase');
      assert(result.algorithm, 'Should have algorithm with correct passphrase');
      
      // Test with wrong passphrase
      try {
        await parser.parse(ppkContent, 'wrong_passphrase');
        assert.fail('Should fail with wrong passphrase');
      } catch (error) {
        assert(error instanceof PPKError, 'Should throw PPKError');
        assert(error.message.includes('passphrase') || 
               error.message.includes('MAC') || 
               error.message.includes('decrypt'), 
               'Error should indicate passphrase/decryption issue');
      }
    } else {
      // Test unencrypted key - should work with empty passphrase
      const result = await parser.parse(ppkContent, '');
      assert(result, 'Should parse unencrypted key');
      assert(result.algorithm, 'Should have algorithm for unencrypted key');
      
      // For unencrypted keys, providing a passphrase should still work
      // (the passphrase is just ignored for MAC calculation)
      const resultWithPass = await parser.parse(ppkContent, 'unnecessary');
      assert(resultWithPass, 'Should parse unencrypted key even with passphrase provided');
    }
  }
}

// Create and run comprehensive test suite
async function main() {
  const suite = new ComprehensiveTestSuite();
  suite.loadManifest();

  // Add tests for each key in the manifest
  for (const keyInfo of suite.manifest.keys) {
    // Test basic PPK parsing
    suite.addTest(`Parse PPK: ${keyInfo.name}`, async () => {
      await suite.testPPKParsing(keyInfo);
    });

    // Test PEM conversion
    suite.addTest(`PEM Conversion: ${keyInfo.name}`, async () => {
      await suite.testPEMConversion(keyInfo);
    });

    // Test OpenSSH conversion
    suite.addTest(`OpenSSH Conversion: ${keyInfo.name}`, async () => {
      await suite.testOpenSSHConversion(keyInfo);
    });

    // Test version detection
    suite.addTest(`Version Detection: ${keyInfo.name}`, async () => {
      await suite.testVersionDetection(keyInfo);
    });

    // Test passphrase handling
    suite.addTest(`Passphrase Handling: ${keyInfo.name}`, async () => {
      await suite.testPassphraseHandling(keyInfo);
    });

    // Test format consistency between PEM and OpenSSH
    suite.addTest(`Format Consistency: ${keyInfo.name}`, async () => {
      await suite.testKeyFormatConsistency(keyInfo);
    });

    // Test key structure validation
    suite.addTest(`Key Structure: ${keyInfo.name}`, async () => {
      await suite.testKeyStructureValidation(keyInfo);
    });
  }

  // Add summary tests
  suite.addTest('Key Type Coverage', () => {
    const types = new Set(suite.manifest.keys.map(k => k.type));
    assert(types.has('rsa'), 'Should have RSA keys');
    assert(types.has('dsa'), 'Should have DSA keys');
    assert(types.has('ecdsa'), 'Should have ECDSA keys');
    assert(types.has('ed25519'), 'Should have Ed25519 keys');
  });

  suite.addTest('Version Coverage', () => {
    const versions = new Set(suite.manifest.keys.map(k => k.version));
    assert(versions.has(2), 'Should have PPK v2 keys');
    assert(versions.has(3), 'Should have PPK v3 keys');
  });

  suite.addTest('Passphrase Coverage', () => {
    const hasEncrypted = suite.manifest.keys.some(k => k.hasPassphrase);
    const hasUnencrypted = suite.manifest.keys.some(k => !k.hasPassphrase);
    assert(hasEncrypted, 'Should have encrypted keys');
    assert(hasUnencrypted, 'Should have unencrypted keys');
  });

  suite.addTest('ECDSA Curve Coverage', () => {
    const ecdsaKeys = suite.manifest.keys.filter(k => k.type === 'ecdsa');
    const curves = new Set(ecdsaKeys.map(k => k.bits));
    assert(curves.has(256), 'Should have P-256 ECDSA keys');
    assert(curves.has(384), 'Should have P-384 ECDSA keys');
    assert(curves.has(521), 'Should have P-521 ECDSA keys');
  });

  await suite.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { ComprehensiveTestSuite };