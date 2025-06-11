const { PPKParser, PPKError } = require('./ppk-parser');

/**
 * Parse a PPK file and convert to OpenSSH format
 * @param {string} ppkContent - The PPK file content as string
 * @param {string} passphrase - Optional passphrase for encrypted keys
 * @returns {Promise<Object>} Object containing publicKey and privateKey in OpenSSH format
 */
async function parseFromString(ppkContent, passphrase = '') {
  const parser = new PPKParser();
  return await parser.parse(ppkContent, passphrase);
}

/**
 * Parse a PPK file from filesystem path and convert to OpenSSH format
 * @param {string} filePath - Path to the PPK file
 * @param {string} passphrase - Optional passphrase for encrypted keys
 * @returns {Promise<Object>} Object containing publicKey and privateKey in OpenSSH format
 */
async function parseFromFile(filePath, passphrase = '') {
  const fs = require('fs');
  
  try {
    const ppkContent = await fs.promises.readFile(filePath, 'utf8');
    return await parseFromString(ppkContent, passphrase);
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
  convert, // deprecated alias
  PPKParser,
  PPKError
};

// Default export for CommonJS
module.exports.default = module.exports;