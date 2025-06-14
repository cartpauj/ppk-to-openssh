#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseFromFile, PPKError } = require('../lib/index.js');

// Prompt for passphrase with hidden input
function promptPassphrase(message = 'Enter passphrase: ') {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    process.stdout.write(message);
    
    let input = '';
    const onData = (char) => {
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(input);
          break;
        case '\u0003': // Ctrl+C
          process.stdout.write('\n');
          process.exit(1);
          break;
        case '\u007f': // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
          }
          break;
        default:
          if (char >= ' ') {
            input += char;
          }
          break;
      }
    };
    
    stdin.on('data', onData);
  });
}

function showUsage() {
  console.log(`
ppk-to-openssh - Convert PuTTY PPK files to OpenSSH format

Usage:
  ppk-to-openssh <input.ppk> [output-prefix] [options]

Arguments:
  input.ppk       Path to the PPK file to convert
  output-prefix   Optional prefix for output files (default: uses input filename)

Options:
  -p, --passphrase <pass>  Passphrase for encrypted PPK files
  -o, --output <dir>       Output directory (default: current directory)
  --public-only           Only output the public key
  --private-only          Only output the private key
  -v, --verbose           Show detailed information
  -h, --help              Show this help message

Examples:
  ppk-to-openssh mykey.ppk
  ppk-to-openssh mykey.ppk id_rsa -p mypassphrase
  ppk-to-openssh mykey.ppk --output ~/.ssh/
  ppk-to-openssh encrypted.ppk --passphrase secret --verbose
  ppk-to-openssh encrypted.ppk  # Will prompt for passphrase if needed

Interactive Mode:
  If a PPK file is encrypted and no passphrase is provided via -p,
  the tool will automatically prompt for the passphrase (input hidden).

Output files:
  <prefix>        - Private key file
  <prefix>.pub    - Public key file
`);
}

function parseArgs(args) {
  const options = {
    inputFile: null,
    outputPrefix: null,
    passphrase: '',
    outputDir: '.',
    publicOnly: false,
    privateOnly: false,
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '-v' || arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--public-only') {
      options.publicOnly = true;
    } else if (arg === '--private-only') {
      options.privateOnly = true;
    } else if (arg === '-p' || arg === '--passphrase') {
      options.passphrase = args[++i] || '';
    } else if (arg === '-o' || arg === '--output') {
      options.outputDir = args[++i] || '.';
    } else if (!options.inputFile) {
      options.inputFile = arg;
    } else if (!options.outputPrefix) {
      options.outputPrefix = arg;
    }
  }

  return options;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showUsage();
    process.exit(1);
  }

  const options = parseArgs(args);

  if (options.help) {
    showUsage();
    process.exit(0);
  }

  if (!options.inputFile) {
    console.error('Error: Input PPK file is required');
    showUsage();
    process.exit(1);
  }

  // Determine output prefix
  if (!options.outputPrefix) {
    const basename = path.basename(options.inputFile, path.extname(options.inputFile));
    options.outputPrefix = basename;
  }

  // Ensure output directory exists
  try {
    await fs.promises.mkdir(options.outputDir, { recursive: true });
  } catch (error) {
    console.error(`Error creating output directory: ${error.message}`);
    process.exit(1);
  }

  try {
    if (options.verbose) {
      console.log(`Converting PPK file: ${options.inputFile}`);
      console.log(`Output directory: ${options.outputDir}`);
      console.log(`Output prefix: ${options.outputPrefix}`);
    }

    let result;
    let passphrase = options.passphrase;
    
    // Try parsing with provided passphrase (or empty string)
    try {
      result = await parseFromFile(options.inputFile, passphrase);
    } catch (error) {
      // If passphrase is required and we don't have one, prompt for it
      if (error instanceof PPKError && error.code === 'PASSPHRASE_REQUIRED' && !passphrase) {
        passphrase = await promptPassphrase('This PPK file is encrypted. Enter passphrase: ');
        result = await parseFromFile(options.inputFile, passphrase);
      } else {
        throw error; // Re-throw other errors
      }
    }

    if (options.verbose) {
      console.log(`Key type: ${result.publicKey.split(' ')[0]}`);
      console.log(`Fingerprint: ${result.fingerprint}`);
      if (result.curve) {
        console.log(`Curve: ${result.curve}`);
      }
    }

    // Write private key
    if (!options.publicOnly) {
      const privateKeyPath = path.join(options.outputDir, options.outputPrefix);
      await fs.promises.writeFile(privateKeyPath, result.privateKey);
      
      // Set secure permissions on private key
      try {
        await fs.promises.chmod(privateKeyPath, 0o600);
      } catch (err) {
        if (options.verbose) {
          console.warn(`Warning: Could not set permissions on private key: ${err.message}`);
        }
      }
      
      if (options.verbose) {
        console.log(`Private key written to: ${privateKeyPath}`);
      }
    }

    // Write public key
    if (!options.privateOnly) {
      const publicKeyPath = path.join(options.outputDir, options.outputPrefix + '.pub');
      await fs.promises.writeFile(publicKeyPath, result.publicKey + '\n');
      
      if (options.verbose) {
        console.log(`Public key written to: ${publicKeyPath}`);
      }
    }

    if (!options.verbose) {
      console.log('Conversion completed successfully');
    }

  } catch (error) {
    if (error instanceof PPKError) {
      console.error(`Error: ${error.message}`);
      if (error.details.hint && options.verbose) {
        console.error(`Hint: ${error.details.hint}`);
      }
      if (options.verbose) {
        console.error(`Error code: ${error.code}`);
      }
    } else {
      console.error(`Unexpected error: ${error.message}`);
      if (options.verbose) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}