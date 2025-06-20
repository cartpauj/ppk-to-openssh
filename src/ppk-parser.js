import crypto from 'crypto';
import { argon2id, argon2i, argon2d } from 'hash-wasm';

/**
 * Universal Argon2 implementation using hash-wasm
 * Works in both browsers and Node.js environments
 */
class PureArgon2 {
  constructor() {
    // Simple constructor for hash-wasm integration
  }

  async hash({ pass, salt, time, mem, hashLen, parallelism = 1, type = 2 }) {
    const password = typeof pass === 'string' ? pass : Buffer.from(pass).toString('utf8');
    const saltBuffer = Buffer.isBuffer(salt) ? salt : Buffer.from(salt);
    
    // Parameter validation
    if (time < 1) throw new Error('time must be at least 1');
    if (mem < 8 * parallelism) throw new Error('memory must be at least 8*parallelism');
    if (parallelism < 1) throw new Error('parallelism must be at least 1');
    if (hashLen < 4) throw new Error('hash length must be at least 4');
    
    // Select the appropriate Argon2 variant based on type
    let argon2Function;
    switch (type) {
      case 0: // Argon2d
        argon2Function = argon2d;
        break;
      case 1: // Argon2i
        argon2Function = argon2i;
        break;
      case 2: // Argon2id
      default:
        argon2Function = argon2id;
        break;
    }
    
    // Use hash-wasm's Argon2 implementation
    const result = await argon2Function({
      password: password,
      salt: saltBuffer,
      parallelism: parallelism,
      iterations: time,
      memorySize: mem, // in KB
      hashLength: hashLen,
      outputType: 'binary'
    });
    
    return { hash: Buffer.from(result) };
  }
}

// Argon2 type constants
const ArgonType = {
  Argon2d: 0,
  Argon2i: 1,
  Argon2id: 2
};

// Create singleton instance
const pureArgon2 = new PureArgon2();

// Custom error class for better error handling
class PPKError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'PPKError';
    this.code = code;
    this.details = details;
  }
}

class PPKParser {
  constructor(options = {}) {
    this.options = options;
    this.supportedAlgorithms = ['ssh-rsa', 'ssh-dss', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521', 'ssh-ed25519'];
    this.maxFileSize = options.maxFileSize || 1024 * 1024; // 1MB limit
  }

  /**
   * Parse a PPK file and convert to OpenSSH format
   * @param {string} ppkContent - The PPK file content as string
   * @param {string} passphrase - Optional passphrase for encrypted keys
   * @returns {Object} Object containing publicKey and privateKey in OpenSSH format, 
   *                   plus ssh2StreamsCompatible method for pure-js-sftp
   */
  async parse(ppkContent, passphrase = '') {
    let ppkData;
    try {
      // Input validation
      if (!ppkContent || typeof ppkContent !== 'string') {
        throw new PPKError(
          'Invalid input: PPK content must be a non-empty string',
          'INVALID_INPUT'
        );
      }

      if (ppkContent.length > this.maxFileSize) {
        throw new PPKError(
          `PPK file too large (max ${this.maxFileSize / 1024}KB)`,
          'FILE_TOO_LARGE',
          { size: ppkContent.length }
        );
      }

      // Format detection
      if (ppkContent.includes('-----BEGIN OPENSSH PRIVATE KEY-----')) {
        throw new PPKError(
          'This appears to be an OpenSSH key, not a PPK file',
          'WRONG_FORMAT',
          { hint: 'Use this key directly with ssh, no conversion needed' }
        );
      }

      if (ppkContent.includes('-----BEGIN RSA PRIVATE KEY-----') ||
          ppkContent.includes('-----BEGIN DSA PRIVATE KEY-----') ||
          ppkContent.includes('-----BEGIN EC PRIVATE KEY-----')) {
        throw new PPKError(
          'This appears to be a PEM format key, not a PPK file',
          'WRONG_FORMAT',
          { hint: 'Use ssh-keygen to convert: ssh-keygen -p -m PEM -f keyfile' }
        );
      }

      if (!ppkContent.includes('PuTTY-User-Key-File-')) {
        throw new PPKError(
          'Invalid PPK file: missing PuTTY header',
          'INVALID_PPK_FORMAT',
          { hint: 'Ensure this is a valid PuTTY private key file (.ppk)' }
        );
      }

      const lines = ppkContent.split(/\r?\n/);
      ppkData = this.parsePPKStructure(lines);
    
      // Validate PPK version
      if (ppkData.version !== 2 && ppkData.version !== 3) {
        throw new PPKError(
          `Unsupported PPK version: ${ppkData.version}`,
          'UNSUPPORTED_VERSION',
          { 
            version: ppkData.version,
            hint: 'Only PPK versions 2 and 3 are supported'
          }
        );
      }

      // Validate required fields
      if (!ppkData.algorithm) {
        throw new PPKError('Invalid PPK: missing algorithm', 'MISSING_FIELD');
      }

      if (ppkData.publicLines.length === 0) {
        throw new PPKError('Invalid PPK: missing public key data', 'MISSING_FIELD');
      }

      if (ppkData.privateLines.length === 0) {
        throw new PPKError('Invalid PPK: missing private key data', 'MISSING_FIELD');
      }

      // Decode public key with error handling
      let publicKeyData, privateKeyData;
      try {
        if (!ppkData.publicLines || ppkData.publicLines.length === 0) {
          throw new Error('No public key data found');
        }
        if (!ppkData.privateLines || ppkData.privateLines.length === 0) {
          throw new Error('No private key data found');
        }
        
        const publicBase64 = ppkData.publicLines.join('');
        const privateBase64 = ppkData.privateLines.join('');
        
        if (!publicBase64 || !privateBase64) {
          throw new Error('Empty key data');
        }
        
        publicKeyData = Buffer.from(publicBase64, 'base64');
        privateKeyData = Buffer.from(privateBase64, 'base64');
      } catch (e) {
        throw new PPKError(
          'Invalid PPK data: corrupted base64 encoding',
          'INVALID_BASE64',
          { originalError: e.message }
        );
      }
    
      // Handle encryption
      if (ppkData.encryption !== 'none') {
        if (!passphrase) {
          throw new PPKError(
            'Passphrase required for encrypted key',
            'PASSPHRASE_REQUIRED',
            { hint: 'Please provide the passphrase used to encrypt this key' }
          );
        }
        
        privateKeyData = await this.decryptPrivateKey(privateKeyData, passphrase, ppkData);
      }

      // Verify MAC - for unencrypted keys, always use empty passphrase for MAC verification
      const macPassphrase = ppkData.encryption === 'none' ? '' : passphrase;
      const isValid = await this.verifyMAC(publicKeyData, privateKeyData, ppkData, macPassphrase);
      if (!isValid) {
        throw new PPKError(
          'MAC verification failed',
          'INVALID_MAC',
          { 
            hint: ppkData.encryption !== 'none' 
              ? 'Wrong passphrase or corrupted key file'
              : 'Key file may be corrupted or tampered with'
          }
        );
      }

      // Convert to OpenSSH format based on algorithm
      const result = await this.convertToOpenSSH(ppkData.algorithm, publicKeyData, privateKeyData, ppkData.comment);
      
      // Add algorithm and comment to the result
      result.algorithm = ppkData.algorithm;
      result.comment = ppkData.comment;
      
      // Add ssh2-streams compatibility method only for RSA keys that need it
      if (ppkData.algorithm === 'ssh-rsa' || result.privateKey.includes('BEGIN RSA PRIVATE KEY')) {
        try {
          result.getCompatiblePrivateKey = async (signatureAlgorithm = 'sha512') => {
            return await this.createSSH2StreamsCompatibleKey(result.privateKey, signatureAlgorithm);
          };
        } catch (error) {
          // If ssh2-streams is not available, just skip the compatibility method
          // This is okay since it's an optional enhancement
        }
      }
      
      return result;

    } catch (error) {
      // Re-throw PPKErrors as-is
      if (error instanceof PPKError) {
        throw error;
      }
      
      // Wrap unexpected errors with more context
      throw new PPKError(
        `Failed to parse PPK file: ${error.message}`,
        'PARSE_ERROR',
        { 
          originalError: error,
          stack: error.stack,
          ppkDataStructure: ppkData ? {
            version: ppkData.version,
            algorithm: ppkData.algorithm,
            encryption: ppkData.encryption,
            publicLinesCount: ppkData.publicLines ? ppkData.publicLines.length : 'undefined',
            privateLinesCount: ppkData.privateLines ? ppkData.privateLines.length : 'undefined'
          } : 'undefined'
        }
      );
    }
  }

  /**
   * Parse PPK file structure
   */
  parsePPKStructure(lines) {
    const data = {
      version: 2,
      algorithm: '',
      encryption: 'none',
      comment: '',
      publicLines: [],
      privateLines: [],
      privateMac: '',
      argon2: {}
    };

    let currentSection = null;
    let lineCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('PuTTY-User-Key-File-')) {
        const parts = trimmed.split(':');
        if (parts && parts.length > 0) {
          // Extract version from "PuTTY-User-Key-File-2: ssh-rsa"
          const headerPart = parts[0]; // "PuTTY-User-Key-File-2"
          const versionMatch = headerPart.match(/PuTTY-User-Key-File-(\d+)/);
          data.version = versionMatch ? parseInt(versionMatch[1]) : 2;
          
          if (parts.length > 1) {
            data.algorithm = parts[1].trim();
          }
        }
      } else if (trimmed.startsWith('Encryption:')) {
        const parts = trimmed.split(':');
        data.encryption = parts.length > 1 ? parts[1].trim() : 'none';
      } else if (trimmed.startsWith('Comment:')) {
        data.comment = trimmed.split(':').slice(1).join(':').trim();
      } else if (trimmed.startsWith('Public-Lines:')) {
        const parts = trimmed.split(':');
        lineCount = parts.length > 1 ? parseInt(parts[1].trim()) : 0;
        currentSection = 'public';
      } else if (trimmed.startsWith('Private-Lines:')) {
        const parts = trimmed.split(':');
        lineCount = parts.length > 1 ? parseInt(parts[1].trim()) : 0;
        currentSection = 'private';
      } else if (trimmed.startsWith('Private-MAC:')) {
        const parts = trimmed.split(':');
        data.privateMac = parts.length > 1 ? parts[1].trim() : '';
      } else if (trimmed.startsWith('Key-Derivation:')) {
        const parts = trimmed.split(':');
        data.argon2.flavor = parts.length > 1 ? parts[1].trim() : '';
      } else if (trimmed.startsWith('Argon2-Memory:')) {
        const parts = trimmed.split(':');
        data.argon2.memory = parts.length > 1 ? parseInt(parts[1].trim()) : 0;
      } else if (trimmed.startsWith('Argon2-Passes:')) {
        const parts = trimmed.split(':');
        data.argon2.passes = parts.length > 1 ? parseInt(parts[1].trim()) : 0;
      } else if (trimmed.startsWith('Argon2-Parallelism:')) {
        const parts = trimmed.split(':');
        data.argon2.parallelism = parts.length > 1 ? parseInt(parts[1].trim()) : 0;
      } else if (trimmed.startsWith('Argon2-Salt:')) {
        const parts = trimmed.split(':');
        data.argon2.salt = parts.length > 1 ? parts[1].trim() : '';
      } else if (currentSection && lineCount > 0) {
        if (currentSection === 'public') {
          data.publicLines.push(trimmed);
        } else if (currentSection === 'private') {
          data.privateLines.push(trimmed);
        }
        lineCount--;
        if (lineCount === 0) {
          currentSection = null;
        }
      }
    }

    return data;
  }

  /**
   * Decrypt private key data
   */
  async decryptPrivateKey(encryptedData, passphrase, ppkData) {
    if (ppkData.encryption !== 'aes256-cbc') {
      throw new PPKError(
        `Unsupported encryption type: ${ppkData.encryption}`,
        'UNSUPPORTED_ENCRYPTION',
        { 
          encryption: ppkData.encryption,
          hint: 'Only aes256-cbc encryption is supported'
        }
      );
    }

    let key, iv, macKey;

    if (ppkData.version === 3 && ppkData.argon2.flavor) {
      // PPK v3 uses Argon2 for key derivation
      const salt = Buffer.from(ppkData.argon2.salt, 'hex');
      
      // Map PPK argon2 flavor to pure argon2 types
      const argon2Type = {
        'Argon2i': ArgonType.Argon2i,
        'Argon2d': ArgonType.Argon2d,
        'Argon2id': ArgonType.Argon2id
      }[ppkData.argon2.flavor];

      if (argon2Type === undefined) {
        throw new PPKError(
          `Unsupported Argon2 variant: ${ppkData.argon2.flavor}`,
          'UNSUPPORTED_ARGON2',
          { flavor: ppkData.argon2.flavor }
        );
      }

      const result = await pureArgon2.hash({
        pass: passphrase,
        salt: salt,
        time: ppkData.argon2.passes,
        mem: ppkData.argon2.memory,
        hashLen: 80, // 32 + 16 + 32
        parallelism: ppkData.argon2.parallelism,
        type: argon2Type
      });

      const derivedKey = Buffer.from(result.hash);
      key = derivedKey.slice(0, 32);
      iv = derivedKey.slice(32, 48);
      macKey = derivedKey.slice(48, 80);
      
      // Store macKey for later MAC verification
      ppkData._derivedMacKey = macKey;
    } else {
      // PPK v2 key derivation
      const keyData = this.deriveKeyV2(passphrase);
      key = keyData.key;
      iv = Buffer.alloc(16, 0); // PPK v2 uses zero IV
    }

    // Decrypt using AES-256-CBC
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    decipher.setAutoPadding(false);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);

    return decrypted;
  }

  /**
   * PPK v2 key derivation
   */
  deriveKeyV2(passphrase) {
    // First SHA-1 hash with sequence number 0
    const hash1 = crypto.createHash('sha1');
    hash1.update(Buffer.from([0, 0, 0, 0]));
    hash1.update(passphrase, 'utf8');
    const digest1 = hash1.digest();

    // Second SHA-1 hash with sequence number 1
    const hash2 = crypto.createHash('sha1');
    hash2.update(Buffer.from([0, 0, 0, 1]));
    hash2.update(passphrase, 'utf8');
    const digest2 = hash2.digest();

    // Concatenate and take first 32 bytes for AES-256 key
    const key = Buffer.concat([digest1, digest2]).slice(0, 32);

    return { key };
  }

  /**
   * Verify MAC
   */
  async verifyMAC(publicKeyData, privateKeyData, ppkData, passphrase) {
    const macHex = ppkData.privateMac.toLowerCase();
    let computedMac;

    if (ppkData.version === 3) {
      // PPK v3 uses HMAC-SHA-256 but same input format as v2
      const macKey = ppkData._derivedMacKey || this.deriveMACKeyV3(passphrase);
      const hmac = crypto.createHmac('sha256', macKey);
      
      // PPK v3 MAC input includes algorithm, encryption, comment, public key, private key
      // This is the same format as PPK v2, just with SHA-256 instead of SHA-1
      hmac.update(this.encodeString(ppkData.algorithm));
      hmac.update(this.encodeString(ppkData.encryption));
      hmac.update(this.encodeString(ppkData.comment));
      hmac.update(this.encodeString(publicKeyData));
      hmac.update(this.encodeString(privateKeyData));
      
      computedMac = hmac.digest('hex');
    } else {
      // PPK v2 uses HMAC-SHA-1
      const macKey = this.deriveMACKeyV2(passphrase);
      const hmac = crypto.createHmac('sha1', macKey);
      
      // MAC input includes algorithm name
      hmac.update(this.encodeString(ppkData.algorithm));
      hmac.update(this.encodeString(ppkData.encryption));
      hmac.update(this.encodeString(ppkData.comment));
      hmac.update(this.encodeString(publicKeyData));
      hmac.update(this.encodeString(privateKeyData));
      
      computedMac = hmac.digest('hex');
    }

    return computedMac === macHex;
  }

  /**
   * Derive MAC key for PPK v2
   */
  deriveMACKeyV2(passphrase) {
    const hash = crypto.createHash('sha1');
    hash.update('putty-private-key-file-mac-key');
    hash.update(passphrase || '', 'utf8');
    return hash.digest();
  }

  /**
   * Derive MAC key for PPK v3
   */
  deriveMACKeyV3(passphrase) {
    // For unencrypted keys in PPK v3, use an empty MAC key (32 zero bytes)
    // This is different from PPK v2 and encrypted PPK v3 keys
    if (!passphrase || passphrase === '') {
      return Buffer.alloc(32); // Empty MAC key for unencrypted PPK v3
    }
    
    // For encrypted keys, derive MAC key from passphrase
    const hash = crypto.createHash('sha256');
    hash.update('putty-private-key-file-mac-key');
    hash.update(passphrase, 'utf8');
    return hash.digest();
  }

  /**
   * Encode string/buffer with length prefix for MAC calculation
   */
  encodeString(data) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32BE(buffer.length, 0);
    return Buffer.concat([length, buffer]);
  }

  /**
   * Convert to OpenSSH format
   */
  async convertToOpenSSH(algorithm, publicKeyData, privateKeyData, comment) {
    // Default to PEM format for backward compatibility
    // Users can explicitly request OpenSSH format via options
    const outputFormat = this.options.outputFormat || 'pem';
    
    switch (algorithm) {
      case 'ssh-rsa':
        return await this.convertRSAToOpenSSH(publicKeyData, privateKeyData, comment, outputFormat);
      case 'ssh-dss':
        return await this.convertDSAToOpenSSH(publicKeyData, privateKeyData, comment, outputFormat);
      case 'ssh-ed25519':
        // Ed25519 always uses OpenSSH format (it's the standard)
        return this.convertEd25519ToOpenSSH(publicKeyData, privateKeyData, comment);
      case 'ecdsa-sha2-nistp256':
      case 'ecdsa-sha2-nistp384':
      case 'ecdsa-sha2-nistp521':
        return await this.convertECDSAToOpenSSH(algorithm, publicKeyData, privateKeyData, comment, outputFormat);
      default:
        throw new PPKError(
          `Unsupported algorithm: ${algorithm}`,
          'UNSUPPORTED_ALGORITHM',
          { 
            algorithm: algorithm,
            supported: this.supportedAlgorithms
          }
        );
    }
  }

  /**
   * Convert RSA key to OpenSSH format using Node.js crypto
   */
  async convertRSAToOpenSSH(publicKeyData, privateKeyData, comment, outputFormat = 'pem') {
    // Parse public key components
    const publicKey = this.parseSSHPublicKey(publicKeyData);
    
    // Parse private key components
    const reader = new BinaryReader(privateKeyData);
    const d = reader.readBuffer(); // private exponent
    const p = reader.readBuffer(); // prime1
    const q = reader.readBuffer(); // prime2
    const iqmp = reader.readBuffer(); // coefficient

    // Calculate missing components
    const n = publicKey.n;
    const e = publicKey.e;
    
    // Calculate dP and dQ
    const pBigInt = this.bufferToBigInt(p);
    const qBigInt = this.bufferToBigInt(q);
    const dBigInt = this.bufferToBigInt(d);
    
    const dP = dBigInt % (pBigInt - 1n);
    const dQ = dBigInt % (qBigInt - 1n);

    // Create OpenSSH public key
    const publicKeySSH = `ssh-rsa ${publicKeyData.toString('base64')} ${comment}`;

    let privateKeyPem;
    if (outputFormat === 'openssh') {
      // Create OpenSSH private key format
      privateKeyPem = this.createOpenSSHPrivateKey({
        keyType: 'ssh-rsa',
        publicKeyData,
        privateKeyComponents: { n, e, d, p, q, iqmp },
        comment,
        passphrase: this.options.outputPassphrase
      });
    } else {
      // Legacy PEM format
      const privateKeyDer = this.createRSAPrivateKeyDER(n, e, d, p, q, dP, dQ, iqmp);
      const base64Data = privateKeyDer.toString('base64');
      const base64Lines = base64Data.match(/.{1,64}/g) || [base64Data];
      privateKeyPem = '-----BEGIN RSA PRIVATE KEY-----\n' +
        base64Lines.join('\n') +
        '\n-----END RSA PRIVATE KEY-----\n';
    }

    return {
      privateKey: privateKeyPem,
      publicKey: publicKeySSH,
      fingerprint: this.generateFingerprint(publicKeyData)
    };
  }

  /**
   * Convert DSA key to OpenSSH format
   */
  async convertDSAToOpenSSH(publicKeyData, privateKeyData, comment, outputFormat = 'pem') {
    // Parse public key components
    const pubReader = new BinaryReader(publicKeyData);
    const keyType = pubReader.readString();
    
    if (keyType !== 'ssh-dss') {
      throw new Error(`Expected ssh-dss, got ${keyType}`);
    }

    const p = pubReader.readBuffer(); // prime
    const q = pubReader.readBuffer(); // subprime
    const g = pubReader.readBuffer(); // base
    const y = pubReader.readBuffer(); // public key

    // Parse private key components
    const privReader = new BinaryReader(privateKeyData);
    const x = privReader.readBuffer(); // private key

    // Create OpenSSH public key
    const publicKeySSH = `ssh-dss ${publicKeyData.toString('base64')} ${comment}`;

    let privateKeyPem;
    if (outputFormat === 'openssh') {
      // Create OpenSSH format for DSA
      privateKeyPem = this.createOpenSSHPrivateKey({
        keyType: 'ssh-dss',
        publicKeyData: publicKeyData,
        privateKeyComponents: { p, q, g, y, x },
        comment: comment,
        passphrase: this.options.outputPassphrase
      });
    } else {
      // Legacy PEM format
      privateKeyPem = this.createDSAPrivateKeyPEM(p, q, g, y, x);
    }

    return {
      privateKey: privateKeyPem,
      publicKey: publicKeySSH,
      fingerprint: this.generateFingerprint(publicKeyData)
    };
  }

  /**
   * Create DSA private key in PEM format
   */
  createDSAPrivateKeyPEM(p, q, g, y, x) {
    const privateKeyDer = this.createDSAPrivateKeyDER(p, q, g, y, x);
    const base64Data = privateKeyDer.toString('base64');
    const base64Lines = base64Data.match(/.{1,64}/g) || [base64Data];
    return '-----BEGIN DSA PRIVATE KEY-----\n' +
      base64Lines.join('\n') +
      '\n-----END DSA PRIVATE KEY-----\n';
  }

  /**
   * Convert ECDSA key to OpenSSH format
   */
  async convertECDSAToOpenSSH(algorithm, publicKeyData, privateKeyData, comment, outputFormat = 'pem') {
    // Parse public key components
    const pubReader = new BinaryReader(publicKeyData);
    const keyType = pubReader.readString();
    const curveName = pubReader.readString();
    const publicPoint = pubReader.readBuffer();

    // Parse private key components
    const privReader = new BinaryReader(privateKeyData);
    const privateScalar = privReader.readBuffer();

    // Map curve names to OIDs
    const curveOIDs = {
      'nistp256': '1.2.840.10045.3.1.7',  // prime256v1
      'nistp384': '1.3.132.0.34',         // secp384r1
      'nistp521': '1.3.132.0.35'          // secp521r1
    };

    const curve = curveName.replace('nistp', 'P-');
    const oid = curveOIDs[curveName];

    // Create OpenSSH public key
    const publicKeySSH = `${keyType} ${publicKeyData.toString('base64')} ${comment}`;

    let privateKeyPem;
    if (outputFormat === 'openssh') {
      // Create OpenSSH private key format for ECDSA
      privateKeyPem = this.createOpenSSHPrivateKey({
        keyType: keyType,
        publicKeyData,
        privateKeyComponents: { curveName, privateScalar, publicPoint },
        comment,
        passphrase: this.options.outputPassphrase
      });
    } else {
      // Legacy PEM format
      privateKeyPem = this.createECPrivateKeyPEM(oid, privateScalar, publicPoint);
    }

    return {
      privateKey: privateKeyPem,
      publicKey: publicKeySSH,
      fingerprint: this.generateFingerprint(publicKeyData),
      curve: curve
    };
  }

  /**
   * Create EC private key in PEM format
   */
  createECPrivateKeyPEM(oid, privateScalar, publicPoint) {
    const privateKeyDer = this.createECPrivateKeyDER(oid, privateScalar, publicPoint);
    const base64Data = privateKeyDer.toString('base64');
    const base64Lines = base64Data.match(/.{1,64}/g) || [base64Data];
    return '-----BEGIN EC PRIVATE KEY-----\n' +
      base64Lines.join('\n') +
      '\n-----END EC PRIVATE KEY-----\n';
  }

  /**
   * Convert Ed25519 key to OpenSSH format
   */
  convertEd25519ToOpenSSH(publicKeyData, privateKeyData, comment) {
    // Parse the public key
    const reader = new BinaryReader(publicKeyData);
    const _keyType = reader.readString();
    const publicKey = reader.readBuffer();

    // For Ed25519, the private key in PPK contains only the private key (32 bytes)
    const privReader = new BinaryReader(privateKeyData);
    const privateKey = privReader.readBuffer();

    // Create OpenSSH private key format using common method
    const privateKeyPem = this.createOpenSSHPrivateKey({
      keyType: 'ssh-ed25519',
      publicKeyData,
      privateKeyComponents: { privateKey, publicKey },
      comment,
      passphrase: this.options.outputPassphrase
    });

    const publicKeySSH = `ssh-ed25519 ${publicKeyData.toString('base64')} ${comment}`;

    return {
      privateKey: privateKeyPem,
      publicKey: publicKeySSH,
      fingerprint: this.generateFingerprint(publicKeyData)
    };
  }

  /**
   * Create OpenSSH private key format - common method for all key types
   */
  createOpenSSHPrivateKey({ keyType, publicKeyData, privateKeyComponents, comment, passphrase = null }) {
    const auth = passphrase ? 'aes256-ctr' : 'none';
    const kdf = passphrase ? 'bcrypt' : 'none';
    const checkInt = crypto.randomBytes(4);
    
    let privateKeyBuffer;
    if (keyType === 'ssh-ed25519') {
      // Ed25519 specific encoding
      privateKeyBuffer = Buffer.concat([privateKeyComponents.privateKey, privateKeyComponents.publicKey]);
    } else if (keyType === 'ssh-rsa') {
      // RSA specific encoding - SSH wire format
      const { n, e, d, iqmp, p, q } = privateKeyComponents;
      privateKeyBuffer = Buffer.concat([
        this.encodeBuffer(n),
        this.encodeBuffer(e),
        this.encodeBuffer(d),
        this.encodeBuffer(iqmp),
        this.encodeBuffer(p),
        this.encodeBuffer(q)
      ]);
    } else if (keyType.startsWith('ecdsa-sha2-')) {
      // ECDSA specific encoding - SSH wire format
      const { curveName, privateScalar, publicPoint } = privateKeyComponents;
      privateKeyBuffer = Buffer.concat([
        this.encodeBuffer(Buffer.from(curveName)),
        this.encodeBuffer(publicPoint),
        this.encodeBuffer(privateScalar)
      ]);
    } else if (keyType === 'ssh-dss') {
      // DSA specific encoding - SSH wire format
      const { p, q, g, y, x } = privateKeyComponents;
      privateKeyBuffer = Buffer.concat([
        this.encodeBuffer(p),
        this.encodeBuffer(q),
        this.encodeBuffer(g),
        this.encodeBuffer(y),
        this.encodeBuffer(x)
      ]);
    }
    
    // Extract public key components (skip the key type prefix)
    const pubReader = new BinaryReader(publicKeyData);
    const _pubKeyType = pubReader.readString();
    let publicKeyComponents;
    
    if (keyType === 'ssh-ed25519') {
      publicKeyComponents = pubReader.readBuffer();
    } else if (keyType === 'ssh-rsa') {
      const e = pubReader.readBuffer();
      const n = pubReader.readBuffer();
      publicKeyComponents = Buffer.concat([
        this.encodeBuffer(e),
        this.encodeBuffer(n)
      ]);
    } else if (keyType.startsWith('ecdsa-sha2-')) {
      const curveName = pubReader.readString();
      const publicPoint = pubReader.readBuffer();
      publicKeyComponents = Buffer.concat([
        this.encodeBuffer(Buffer.from(curveName)),
        this.encodeBuffer(publicPoint)
      ]);
    } else if (keyType === 'ssh-dss') {
      const p = pubReader.readBuffer();
      const q = pubReader.readBuffer();
      const g = pubReader.readBuffer();
      const y = pubReader.readBuffer();
      publicKeyComponents = Buffer.concat([
        this.encodeBuffer(p),
        this.encodeBuffer(q),
        this.encodeBuffer(g),
        this.encodeBuffer(y)
      ]);
    }
    
    // Build the key data
    const keyData = Buffer.concat([
      checkInt,
      checkInt,
      this.encodeBuffer(Buffer.from(keyType)),
      this.encodeBuffer(publicKeyComponents),
      this.encodeBuffer(privateKeyBuffer),
      this.encodeBuffer(Buffer.from(comment || ''))
    ]);

    // Add padding
    const blockSize = 8;
    const paddingLength = blockSize - (keyData.length % blockSize);
    const padding = Buffer.alloc(paddingLength);
    for (let i = 0; i < paddingLength; i++) {
      padding[i] = i + 1;
    }

    let finalKeyData = Buffer.concat([keyData, padding]);
    let kdfOptions = Buffer.from('');

    // Handle encryption if passphrase is provided
    if (passphrase) {
      const salt = crypto.randomBytes(16);
      const rounds = 16; // bcrypt rounds
      
      // Create KDF options for bcrypt
      kdfOptions = Buffer.concat([
        this.encodeBuffer(salt),
        Buffer.from([0, 0, 0, rounds])
      ]);
      
      // Derive key using bcrypt-style key derivation
      const keyIv = this.deriveKeyIv(passphrase, salt, rounds, 48); // 32 for key + 16 for IV
      const key = keyIv.slice(0, 32);
      const iv = keyIv.slice(32, 48);
      
      // Encrypt the key data
      const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
      finalKeyData = Buffer.concat([cipher.update(finalKeyData), cipher.final()]);
    }

    // Create the OpenSSH private key structure
    const privateKeyStructure = Buffer.concat([
      Buffer.from('openssh-key-v1\0'),
      this.encodeBuffer(Buffer.from(auth)),
      this.encodeBuffer(Buffer.from(kdf)),
      this.encodeBuffer(kdfOptions),
      Buffer.from([0, 0, 0, 1]), // number of keys
      this.encodeBuffer(publicKeyData),
      this.encodeBuffer(finalKeyData)
    ]);

    const base64Data = privateKeyStructure.toString('base64');
    const base64Lines = base64Data.match(/.{1,70}/g) || [base64Data];
    return '-----BEGIN OPENSSH PRIVATE KEY-----\n' +
      base64Lines.join('\n') +
      '\n-----END OPENSSH PRIVATE KEY-----\n';
  }

  /**
   * Create RSA private key in PKCS#1 DER format
   */
  createRSAPrivateKeyDER(n, e, d, p, q, dP, dQ, qInv) {
    // RSAPrivateKey ::= SEQUENCE {
    //   version           Version,
    //   modulus           INTEGER,  -- n
    //   publicExponent    INTEGER,  -- e
    //   privateExponent   INTEGER,  -- d
    //   prime1            INTEGER,  -- p
    //   prime2            INTEGER,  -- q
    //   exponent1         INTEGER,  -- dP
    //   exponent2         INTEGER,  -- dQ
    //   coefficient       INTEGER   -- qInv
    // }
    
    const version = Buffer.from([0x02, 0x01, 0x00]); // INTEGER 0
    
    const sequence = Buffer.concat([
      version,
      this.encodeInteger(n),
      this.encodeInteger(e),
      this.encodeInteger(d),
      this.encodeInteger(p),
      this.encodeInteger(q),
      this.encodeInteger(this.bigIntToBuffer(dP)),
      this.encodeInteger(this.bigIntToBuffer(dQ)),
      this.encodeInteger(qInv)
    ]);
    
    // Wrap in SEQUENCE
    return this.encodeSequence(sequence);
  }

  /**
   * Create DSA private key in DER format
   */
  createDSAPrivateKeyDER(p, q, g, y, x) {
    // DSAPrivateKey ::= SEQUENCE {
    //   version INTEGER,
    //   p INTEGER,
    //   q INTEGER,
    //   g INTEGER,
    //   y INTEGER,
    //   x INTEGER
    // }
    
    const version = Buffer.from([0x02, 0x01, 0x00]); // INTEGER 0
    
    const sequence = Buffer.concat([
      version,
      this.encodeInteger(p),
      this.encodeInteger(q),
      this.encodeInteger(g),
      this.encodeInteger(y),
      this.encodeInteger(x)
    ]);
    
    return this.encodeSequence(sequence);
  }

  /**
   * Create EC private key in SEC1 DER format
   */
  createECPrivateKeyDER(curveOID, privateKey, publicKey) {
    // ECPrivateKey ::= SEQUENCE {
    //   version INTEGER { ecPrivkeyVer1(1) },
    //   privateKey OCTET STRING,
    //   parameters [0] EXPLICIT ECDomainParameters OPTIONAL,
    //   publicKey [1] EXPLICIT BIT STRING OPTIONAL
    // }
    
    const version = Buffer.from([0x02, 0x01, 0x01]); // INTEGER 1
    
    // Encode private key as OCTET STRING
    const privateKeyOctet = Buffer.concat([
      Buffer.from([0x04]), // OCTET STRING tag
      this.encodeLength(privateKey.length),
      privateKey
    ]);
    
    // Encode curve OID with context tag [0]
    const oidEncoded = this.encodeOID(curveOID);
    const parameters = Buffer.concat([
      Buffer.from([0xa0]), // Context tag [0]
      this.encodeLength(oidEncoded.length),
      oidEncoded
    ]);
    
    // Encode public key with context tag [1]
    const publicKeyBitString = Buffer.concat([
      Buffer.from([0x03]), // BIT STRING tag
      this.encodeLength(publicKey.length + 1),
      Buffer.from([0x00]), // No unused bits
      publicKey
    ]);
    
    const publicKeyTagged = Buffer.concat([
      Buffer.from([0xa1]), // Context tag [1]
      this.encodeLength(publicKeyBitString.length),
      publicKeyBitString
    ]);
    
    const sequence = Buffer.concat([
      version,
      privateKeyOctet,
      parameters,
      publicKeyTagged
    ]);
    
    return this.encodeSequence(sequence);
  }

  /**
   * ASN.1 DER encoding helpers
   */
  encodeInteger(buffer) {
    // Add leading zero if high bit is set (to indicate positive number)
    const needsLeadingZero = buffer[0] & 0x80;
    const content = needsLeadingZero ? Buffer.concat([Buffer.from([0x00]), buffer]) : buffer;
    
    return Buffer.concat([
      Buffer.from([0x02]), // INTEGER tag
      this.encodeLength(content.length),
      content
    ]);
  }

  encodeSequence(content) {
    return Buffer.concat([
      Buffer.from([0x30]), // SEQUENCE tag
      this.encodeLength(content.length),
      content
    ]);
  }

  encodeOID(oidString) {
    const parts = oidString.split('.').map(s => parseInt(s));
    const bytes = [];
    
    // First byte combines first two numbers
    bytes.push(parts[0] * 40 + parts[1]);
    
    // Encode remaining numbers
    for (let i = 2; i < parts.length; i++) {
      const num = parts[i];
      if (num < 128) {
        bytes.push(num);
      } else {
        // Multi-byte encoding
        const temp = [];
        let n = num;
        while (n > 0) {
          temp.unshift(n & 0x7f);
          n = n >> 7;
        }
        for (let j = 0; j < temp.length - 1; j++) {
          bytes.push(temp[j] | 0x80);
        }
        bytes.push(temp[temp.length - 1]);
      }
    }
    
    return Buffer.concat([
      Buffer.from([0x06]), // OID tag
      this.encodeLength(bytes.length),
      Buffer.from(bytes)
    ]);
  }

  encodeLength(length) {
    if (length < 128) {
      return Buffer.from([length]);
    }
    
    // Long form
    const bytes = [];
    let temp = length;
    while (temp > 0) {
      bytes.unshift(temp & 0xff);
      temp = temp >> 8;
    }
    
    return Buffer.concat([
      Buffer.from([0x80 | bytes.length]),
      Buffer.from(bytes)
    ]);
  }

  /**
   * Buffer/BigInt conversion utilities
   */
  bufferToBigInt(buffer) {
    let hex = '0x';
    for (const byte of buffer) {
      hex += byte.toString(16).padStart(2, '0');
    }
    return BigInt(hex);
  }

  bigIntToBuffer(bigint) {
    let hex = bigint.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    
    return Buffer.from(bytes);
  }

  /**
   * Parse SSH public key format
   */
  parseSSHPublicKey(data) {
    const reader = new BinaryReader(data);
    const keyType = reader.readString();
    
    if (keyType === 'ssh-rsa') {
      const e = reader.readBuffer();
      const n = reader.readBuffer();
      return { keyType, e, n };
    }
    
    throw new Error(`Unsupported key type in public key: ${keyType}`);
  }

  /**
   * Create a ssh2-streams compatible key with modern signature algorithm
   * This method generates a private key that ssh2-streams can parse and then
   * modifies its signature algorithm for compatibility with modern SSH servers
   */
  async createSSH2StreamsCompatibleKey(privateKey, signatureAlgorithm = 'sha256') {
    try {
      // Only apply this enhancement for RSA keys that need signature algorithm upgrades
      // Check if this is an RSA key by looking at the key header
      if (!privateKey.includes('BEGIN RSA PRIVATE KEY') && !privateKey.includes('ssh-rsa')) {
        // For non-RSA keys, just parse normally since they don't need signature algorithm fixes
        const { default: ssh2Streams } = await import('ssh2-streams');
        return ssh2Streams.utils.parseKey(privateKey);
      }
      
      // For RSA keys, we need to override the signature algorithm
      const { default: ssh2Streams } = await import('ssh2-streams');
      
      // Parse the RSA key with ssh2-streams
      const parsedKey = ssh2Streams.utils.parseKey(privateKey);
      
      if (!parsedKey || typeof parsedKey.getPublicSSH !== 'function') {
        throw new Error('Key could not be parsed by ssh2-streams');
      }
      
      // Only modify signature algorithm for RSA keys (ssh-rsa type)
      if (parsedKey.type === 'ssh-rsa') {
        // Find and modify the hash algorithm symbol to upgrade from sha1
        const hashAlgSymbol = Object.getOwnPropertySymbols(parsedKey)
          .find(s => s.toString().includes('Hash Algorithm'));
        
        if (hashAlgSymbol) {
          const currentAlg = parsedKey[hashAlgSymbol];
          // Only upgrade if it's currently using sha1 (the ssh2-streams default)
          if (currentAlg === 'sha1') {
            parsedKey[hashAlgSymbol] = signatureAlgorithm;
          }
        }
      }
      
      return parsedKey;
      
    } catch (error) {
      if (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes('ssh2-streams')) {
        throw new Error('ssh2-streams module not available - compatibility method not supported');
      }
      throw new Error(`Failed to create ssh2-streams compatible key: ${error.message}`);
    }
  }

  /**
   * Generate SSH fingerprint
   */
  generateFingerprint(publicKeyData) {
    const hash = crypto.createHash('sha256');
    hash.update(publicKeyData);
    const digest = hash.digest();
    return 'SHA256:' + digest.toString('base64').replace(/=+$/, '');
  }

  /**
   * Derive key and IV using bcrypt-style derivation for OpenSSH format
   */
  deriveKeyIv(passphrase, salt, rounds, keyLength) {
    // OpenSSH uses a simplified bcrypt-like derivation
    // This is a simplified version that should work for most cases
    let derived = Buffer.alloc(0);
    let counter = 1;
    
    while (derived.length < keyLength) {
      const hash = crypto.createHash('sha1');
      hash.update(salt);
      hash.update(Buffer.from(passphrase, 'utf8'));
      hash.update(Buffer.from([counter]));
      
      const chunk = hash.digest();
      derived = Buffer.concat([derived, chunk]);
      counter++;
    }
    
    return derived.slice(0, keyLength);
  }

  /**
   * Encode buffer with length prefix
   */
  encodeBuffer(buffer) {
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32BE(buffer.length, 0);
    return Buffer.concat([length, buffer]);
  }
}

/**
 * Binary data reader helper class with bounds checking
 */
class BinaryReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
    this.maxFieldSize = 1024 * 1024; // 1MB per field
  }

  checkBounds(length) {
    if (this.offset + length > this.buffer.length) {
      throw new PPKError(
        'Invalid PPK data: buffer underrun',
        'BUFFER_UNDERRUN',
        { 
          offset: this.offset,
          requested: length,
          available: this.buffer.length - this.offset
        }
      );
    }
  }

  readUInt32() {
    this.checkBounds(4);
    const value = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return value;
  }

  readString() {
    const length = this.readUInt32();
    
    if (length > this.maxFieldSize) {
      throw new PPKError(
        `Invalid PPK data: field too large (${length} bytes)`,
        'FIELD_TOO_LARGE',
        { length: length, max: this.maxFieldSize }
      );
    }
    
    this.checkBounds(length);
    const value = this.buffer.toString('utf8', this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  readBuffer() {
    const length = this.readUInt32();
    
    if (length > this.maxFieldSize) {
      throw new PPKError(
        `Invalid PPK data: field too large (${length} bytes)`,
        'FIELD_TOO_LARGE',
        { length: length, max: this.maxFieldSize }
      );
    }
    
    this.checkBounds(length);
    const value = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  readBytes(length) {
    this.checkBounds(length);
    const value = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }
}

// Export the parser and error class
export default PPKParser;
export { PPKParser, PPKError };