#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read source files
const indexContent = fs.readFileSync(path.join(__dirname, '../src/index.js'), 'utf8');
const ppkParserContent = fs.readFileSync(path.join(__dirname, '../src/ppk-parser.js'), 'utf8');

// Convert ES modules to CommonJS
function convertToCommonJS(content) {
  let result = content
    // Convert imports to requires
    .replace(/import\s+crypto\s+from\s+['"]crypto['"];/g, "const crypto = require('crypto');")
    .replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]hash-wasm['"];/g, "const { $1 } = require('hash-wasm');")
    .replace(/import\s+sshpk\s+from\s+['"]sshpk['"];/g, "const sshpk = require('sshpk');")
    .replace(/import\s+\{\s*PPKParser,\s*PPKError\s*\}\s+from\s+['"]\.\/ppk-parser\.js['"];/g, "const { PPKParser, PPKError } = require('./ppk-parser');")
    // Convert dynamic imports to requires for Node.js built-ins
    .replace(/const\s+\{\s*promises:\s*fs\s*\}\s+=\s+await\s+import\(['"]fs['"]\);/g, "const fs = require('fs');")
    .replace(/const\s+\{\s*default:\s*ssh2Streams\s*\}\s+=\s+await\s+import\(['"]ssh2-streams['"]\);/g, "const ssh2Streams = require('ssh2-streams');")
    // Fix error code for CommonJS
    .replace(/error\.code === 'ERR_MODULE_NOT_FOUND'/g, "error.code === 'MODULE_NOT_FOUND'");

  // Handle exports manually to avoid issues
  if (result.includes('export {')) {
    // Replace the export block with multiline support
    result = result.replace(
      /\/\/ Export main functions and classes\nexport \{\s*([\s\S]*?)\s*\};\s*\n\n\/\/ Default export\nexport default \{\s*([\s\S]*?)\s*\};?/,
      (match, namedExports, defaultContent) => {
        const exportList = namedExports.split(/,?\s*\n\s*/).map(e => 
          e.trim()
           .replace(/,?\s*\/\/.*$/, '') // Remove comments and trailing commas
           .replace(/,$/, '') // Remove trailing comma
           .trim()
        ).filter(e => e); // Remove empty entries
        const assignments = exportList.map(e => `module.exports.${e} = ${e};`).join('\n');
        return `// Export main functions and classes\n${assignments}\n\n// Default export\nmodule.exports = {${defaultContent}};\nmodule.exports.default = module.exports;`;
      }
    );
  } else if (result.includes('export default') || result.includes('export {')) {
    // Handle simple exports
    result = result.replace(/export default ([^;]+);?\s*/g, 'module.exports = $1;\nmodule.exports.default = module.exports;\n');
    result = result.replace(/export \{\s*([^}]+)\s*\};?\s*/g, (match, exports) => {
      const exportList = exports.split(',').map(e => e.trim());
      return exportList.map(e => `module.exports.${e} = ${e};`).join('\n') + '\n';
    });
  }

  return result;
}

// Convert and write CommonJS files
const cjsIndexContent = convertToCommonJS(indexContent);
const cjsPpkParserContent = convertToCommonJS(ppkParserContent);

// Ensure lib directory exists
if (!fs.existsSync(path.join(__dirname, '../lib'))) {
  fs.mkdirSync(path.join(__dirname, '../lib'), { recursive: true });
}

fs.writeFileSync(path.join(__dirname, '../lib/index.js'), cjsIndexContent);
fs.writeFileSync(path.join(__dirname, '../lib/ppk-parser.js'), cjsPpkParserContent);

console.log('CommonJS build completed successfully');