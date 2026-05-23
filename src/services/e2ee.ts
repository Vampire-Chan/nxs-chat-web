// Standard client-side End-to-End Encryption (E2EE) using Web Cryptography API
// Uses ECDH P-256 for key agreement and AES-GCM 256-bit for message encryption.

const PRIVATE_KEY_PREFIX = "vani_e2e_private_key_";
const PUBLIC_KEY_PREFIX = "vani_e2e_public_key_";

// Helper functions for array buffer and base64 conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates an ECDH P-256 key pair.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    ["deriveKey", "deriveBits"]
  );
}

/**
 * Exports a public key to stringified JWK format.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const jwk = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

/**
 * Exports a private key to stringified JWK format.
 */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const jwk = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

/**
 * Imports a public key from stringified JWK format.
 */
export async function importPublicKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    [] // empty array for public key in ECDH key agreement
  );
}

/**
 * Imports a private key from stringified JWK format.
 */
export async function importPrivateKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    ["deriveKey"]
  );
}

/**
 * Derives a 256-bit AES-GCM shared key from a private key and a peer's public key.
 */
export async function deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts plaintext using AES-GCM and the derived shared key.
 */
export async function encryptMessage(
  sharedKey: CryptoKey,
  plaintext: string
): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for AES-GCM
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    sharedKey,
    enc.encode(plaintext)
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypts ciphertext using AES-GCM and the derived shared key.
 */
export async function decryptMessage(
  sharedKey: CryptoKey,
  ciphertext: string,
  iv: string
): Promise<string> {
  const dec = new TextDecoder();
  const encryptedBuffer = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer),
    },
    sharedKey,
    encryptedBuffer
  );

  return dec.decode(decrypted);
}

/**
 * Retrieves the local user's E2E key pair or generates one if not found.
 */
export async function getOrGenerateUserKeys(userId: string): Promise<{ publicKeyJwk: string; privateKey: CryptoKey }> {
  const localPrivateKeyJwk = localStorage.getItem(`${PRIVATE_KEY_PREFIX}${userId}`);
  const localPublicKeyJwk = localStorage.getItem(`${PUBLIC_KEY_PREFIX}${userId}`);

  if (localPrivateKeyJwk && localPublicKeyJwk) {
    try {
      const privateKey = await importPrivateKey(localPrivateKeyJwk);
      return { publicKeyJwk: localPublicKeyJwk, privateKey };
    } catch (e) {
      console.error("Failed to import cached E2E keys, regenerating...", e);
    }
  }

  // Generate new keys
  const keyPair = await generateKeyPair();
  const pubJwk = await exportPublicKey(keyPair.publicKey);
  const privJwk = await exportPrivateKey(keyPair.privateKey);

  localStorage.setItem(`${PRIVATE_KEY_PREFIX}${userId}`, privJwk);
  localStorage.setItem(`${PUBLIC_KEY_PREFIX}${userId}`, pubJwk);

  return { publicKeyJwk: pubJwk, privateKey: keyPair.privateKey };
}

/**
 * Force-regenerate a user's keys (resets private and public keys locally).
 */
export async function regenerateUserKeys(userId: string): Promise<{ publicKeyJwk: string; privateKey: CryptoKey }> {
  localStorage.removeItem(`${PRIVATE_KEY_PREFIX}${userId}`);
  localStorage.removeItem(`${PUBLIC_KEY_PREFIX}${userId}`);
  return await getOrGenerateUserKeys(userId);
}

/**
 * Helper to check if a private key is stored locally for a given user.
 */
export function hasLocalPrivateKey(userId: string): boolean {
  return !!localStorage.getItem(`${PRIVATE_KEY_PREFIX}${userId}`);
}
