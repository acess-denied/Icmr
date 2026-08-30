/**
 * Cryptographic Utility for HMAC-SHA256 Request Signing & Verification
 * Compatible with Web Crypto API (Cloudflare Workers / Browser / Node.js >= 18)
 */

export interface CanonicalRequest {
  timestamp: string; // Unix epoch milliseconds or seconds
  method: string;    // 'POST'
  pathname: string;  // '/api/form-submit'
  bodyString: string;// Exact UTF-8 raw JSON body
}

/**
 * Computes SHA-256 hash of a string in lowercase hex.
 */
export async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Builds the deterministic canonical string for HMAC signing.
 * Format:
 * <TIMESTAMP>\n<METHOD>\n<PATHNAME>\n<BODY_SHA256_HEX>
 */
export async function buildCanonicalString(req: CanonicalRequest): Promise<string> {
  const bodyHash = await sha256Hex(req.bodyString);
  return `${req.timestamp}\n${req.method.toUpperCase()}\n${req.pathname}\n${bodyHash}`;
}

/**
 * Computes HMAC-SHA256 signature in lowercase hex.
 */
export async function computeHmacSha256Hex(canonicalString: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(canonicalString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time comparison between two hex signature strings to prevent timing attacks.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generates a cryptographically strong Participant ID.
 * Standard format: STS-2026-XXXXXX (6 hex characters from 24 bits of crypto entropy)
 */
export function generateParticipantId(year = '2026'): string {
  const randomBytes = new Uint8Array(3);
  crypto.getRandomValues(randomBytes);
  const hexSuffix = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `STS-${year}-${hexSuffix}`;
}

/**
 * Generates an audit event ID.
 */
export function generateEventId(): string {
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  return `EVT-${Date.now()}-${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}
