/**
 * Error details object providing additional context about PPK parsing errors
 */
export interface PPKErrorDetails {
  /** Hint message to help users resolve the issue */
  hint?: string;
  /** File size when relevant to the error */
  size?: number;
  /** Maximum allowed size when relevant */
  max?: number;
  /** Field length when relevant */
  length?: number;
  /** Buffer offset when relevant */
  offset?: number;
  /** Requested bytes when relevant */
  requested?: number;
  /** Available bytes when relevant */
  available?: number;
  /** Algorithm name when relevant */
  algorithm?: string;
  /** Supported algorithms list when relevant */
  supported?: string[];
  /** PPK version when relevant */
  version?: number;
  /** Encryption type when relevant */
  encryption?: string;
  /** Argon2 flavor when relevant */
  flavor?: string;
  /** File path when relevant */
  path?: string;
  /** Original error message when wrapping other errors */
  originalError?: string | Error;
}

/**
 * Custom error class for PPK parsing errors with structured error codes and details
 */
export declare class PPKError extends Error {
  /** Error name (always 'PPKError') */
  name: 'PPKError';
  /** Structured error code for programmatic handling */
  code: string;
  /** Additional error details and context */
  details: PPKErrorDetails;

  constructor(message: string, code: string, details?: PPKErrorDetails);
}

/**
 * Configuration options for PPKParser
 */
export interface PPKParserOptions {
  /** Maximum file size in bytes (default: 1MB) */
  maxFileSize?: number;
  /** Maximum field size in bytes (default: 1MB) */
  maxFieldSize?: number;
}

/**
 * Result object returned by PPK parsing operations
 */
export interface PPKParseResult {
  /** OpenSSH format private key (PEM or OpenSSH format) */
  privateKey: string;
  /** OpenSSH format public key */
  publicKey: string;
  /** SHA256 fingerprint of the public key */
  fingerprint: string;
  /** Curve name for ECDSA keys (e.g., 'P-256') */
  curve?: string;
}

/**
 * Main PPK parser class with support for all PPK versions and key types
 */
export declare class PPKParser {
  /** List of supported SSH key algorithms */
  readonly supportedAlgorithms: string[];
  /** Maximum allowed file size in bytes */
  readonly maxFileSize: number;

  constructor(options?: PPKParserOptions);

  /**
   * Parse a PPK file and convert to OpenSSH format
   * @param ppkContent - The PPK file content as string
   * @param passphrase - Optional passphrase for encrypted keys
   * @returns Promise resolving to parsed key data
   * @throws PPKError - When parsing fails with structured error information
   */
  parse(ppkContent: string, passphrase?: string): Promise<PPKParseResult>;
}

/**
 * Parse a PPK file from string content and convert to OpenSSH format
 * @param ppkContent - The PPK file content as string
 * @param passphrase - Optional passphrase for encrypted keys
 * @returns Promise resolving to parsed key data
 * @throws PPKError - When parsing fails
 */
export declare function parseFromString(ppkContent: string, passphrase?: string): Promise<PPKParseResult>;

/**
 * Parse a PPK file from filesystem path and convert to OpenSSH format
 * @param filePath - Path to the PPK file
 * @param passphrase - Optional passphrase for encrypted keys
 * @returns Promise resolving to parsed key data
 * @throws PPKError - When parsing fails or file not found
 */
export declare function parseFromFile(filePath: string, passphrase?: string): Promise<PPKParseResult>;

/**
 * Convert PPK content to OpenSSH format (alias for parseFromString)
 * @deprecated Use parseFromString instead
 */
export declare function convert(ppkContent: string, passphrase?: string): Promise<PPKParseResult>;

// Default export
declare const _default: {
  parseFromString: typeof parseFromString;
  parseFromFile: typeof parseFromFile;
  convert: typeof convert;
  PPKParser: typeof PPKParser;
  PPKError: typeof PPKError;
};

export default _default;