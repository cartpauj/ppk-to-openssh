#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Since source files are now ES modules, just copy them with .mjs extension
const indexContent = fs.readFileSync(path.join(__dirname, '../src/index.js'), 'utf8');
const ppkParserContent = fs.readFileSync(path.join(__dirname, '../src/ppk-parser.js'), 'utf8');

// Update import paths for .mjs files
const esmIndexContent = indexContent.replace(
  "import { PPKParser, PPKError } from './ppk-parser.js';",
  "import { PPKParser, PPKError } from './ppk-parser.mjs';"
);

const esmPpkParser = ppkParserContent;

// Write the ESM files
fs.writeFileSync(path.join(__dirname, '../lib/index.mjs'), esmIndexContent);
fs.writeFileSync(path.join(__dirname, '../lib/ppk-parser.mjs'), esmPpkParser);

console.log('ESM build completed successfully');