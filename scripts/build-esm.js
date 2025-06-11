#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create ESM version of index.js
const indexContent = `import fs from "fs";
import { PPKParser, PPKError } from "./ppk-parser.mjs";

/**
 * Parse a PPK file and convert to OpenSSH format
 * @param {string} ppkContent - The PPK file content as string
 * @param {string} passphrase - Optional passphrase for encrypted keys
 * @returns {Promise<Object>} Object containing publicKey and privateKey in OpenSSH format
 */
export async function parseFromString(ppkContent, passphrase = '') {
  const parser = new PPKParser();
  return await parser.parse(ppkContent, passphrase);
}

/**
 * Parse a PPK file from filesystem path and convert to OpenSSH format
 * @param {string} filePath - Path to the PPK file
 * @param {string} passphrase - Optional passphrase for encrypted keys
 * @returns {Promise<Object>} Object containing publicKey and privateKey in OpenSSH format
 */
export async function parseFromFile(filePath, passphrase = '') {
  try {
    const ppkContent = await fs.promises.readFile(filePath, 'utf8');
    return await parseFromString(ppkContent, passphrase);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new PPKError(
        \`PPK file not found: \${filePath}\`,
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
export const convert = parseFromString;

// Export classes
export { PPKParser, PPKError };

// Default export
export default { parseFromString, parseFromFile, convert, PPKParser, PPKError };
`;

// Create ESM version of ppk-parser.js by converting the CommonJS version
const ppkParserContent = fs.readFileSync(path.join(__dirname, '../src/ppk-parser.js'), 'utf8');

const esmPpkParser = ppkParserContent
  // Replace require calls with import
  .replace(/const crypto = require\('crypto'\);/, "import crypto from 'crypto';")
  // Replace module.exports with export
  .replace(/module\.exports = PPKParser;[\s\S]*$/, 'export { PPKParser, PPKError };\nexport default PPKParser;');

// Write the ESM files
fs.writeFileSync(path.join(__dirname, '../lib/index.mjs'), indexContent);
fs.writeFileSync(path.join(__dirname, '../lib/ppk-parser.mjs'), esmPpkParser);

console.log('ESM build completed successfully');