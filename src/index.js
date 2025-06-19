const { PPKParser, PPKError } = require('./ppk-parser');
const crypto = require('crypto');
const sshpk = require('sshpk');

/**
 * Convert PPK with encryption using pure JavaScript (supports ALL key types including Ed25519)
 * @param {string} ppkContent - The PPK file content as string
 * @param {string} inputPassphrase - Optional passphrase for encrypted PPK files
 * @param {string} outputPassphrase - Passphrase to encrypt the output key with
 * @returns {Promise<Object>} Object containing encrypted privateKey and publicKey
 */
async function convertPPKWithEncryption(ppkContent, inputPassphrase = '', outputPassphrase) {
  try {
    // Convert PPK to OpenSSH format (unencrypted)
    const parser = new PPKParser();
    const result = await parser.parse(ppkContent, inputPassphrase);
    
    // Try sshpk first (works with ALL key types including Ed25519)
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

/**
 * Parse a PPK file and convert to OpenSSH format
 * @param {string} ppkContent - The PPK file content as string
 * @param {string} passphrase - Optional passphrase for encrypted keys
 * @param {Object} options - Optional configuration object
 * @param {boolean} options.encrypt - Whether to encrypt the output private key
 * @param {string} options.outputPassphrase - Passphrase for encrypting the output (required if encrypt is true)
 * @returns {Promise<Object>} Object containing publicKey and privateKey in OpenSSH format
 */
async function parseFromString(ppkContent, passphrase = '', options = {}) {
  // Pass options to PPKParser so it can handle encryption directly
  const parserOptions = {
    outputFormat: 'openssh', // Use openssh format when encryption is requested
    outputPassphrase: options.encrypt ? options.outputPassphrase : null
  };
  
  const parser = new PPKParser(parserOptions);
  const result = await parser.parse(ppkContent, passphrase);
  
  // If encrypt option is specified but parser doesn't support direct encryption, fall back
  if (options.encrypt && !result.privateKey.includes('BEGIN OPENSSH PRIVATE KEY')) {
    if (!options.outputPassphrase) {
      throw new Error('outputPassphrase is required when encrypt option is true');
    }
    
    // Use our encryption function as fallback
    const encryptedResult = await convertPPKWithEncryption(ppkContent, passphrase, options.outputPassphrase);
    return encryptedResult;
  }
  
  return result;
}

/**
 * Parse a PPK file from filesystem path and convert to OpenSSH format
 * @param {string} filePath - Path to the PPK file
 * @param {string} passphrase - Optional passphrase for encrypted keys
 * @param {Object} options - Optional configuration object
 * @param {boolean} options.encrypt - Whether to encrypt the output private key
 * @param {string} options.outputPassphrase - Passphrase for encrypting the output (required if encrypt is true)
 * @returns {Promise<Object>} Object containing publicKey and privateKey in OpenSSH format
 */
async function parseFromFile(filePath, passphrase = '', options = {}) {
  const fs = require('fs');
  
  try {
    const ppkContent = await fs.promises.readFile(filePath, 'utf8');
    return await parseFromString(ppkContent, passphrase, options);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new PPKError(
        `PPK file not found: ${filePath}`,
        'FILE_NOT_FOUND',
        { path: filePath }
      );
    }
    throw error;
  }
}

/**
 * Convert PPK content to OpenSSH format (alias for parseFromString for backward compatibility)
 * @deprecated Use parseFromString instead
 */
const convert = parseFromString;


// Export main functions and classes
module.exports = {
  parseFromString,
  parseFromFile,
  convertPPKWithEncryption,
  convert, // deprecated alias
  PPKParser,
  PPKError
};

// Default export for CommonJS
module.exports.default = module.exports;