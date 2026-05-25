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

const DB_NAME = "VaniSecureVault";
const STORE_NAME = "identity_keys";

function getSecureDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function savePrivateKeySecurely(userId: string, key: CryptoKey): Promise<void> {
  return getSecureDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(key, `priv_${userId}`);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

function getPrivateKeySecurely(userId: string): Promise<CryptoKey | null> {
  return getSecureDB().then(db => {
    return new Promise<CryptoKey | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(`priv_${userId}`);
      req.onsuccess = () => resolve((req.result as CryptoKey) || null);
      req.onerror = () => reject(req.error);
    });
  }).catch(() => null);
}

function removePrivateKeySecurely(userId: string): Promise<void> {
  return getSecureDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(`priv_${userId}`);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

/**
 * Retrieves the local user's E2E key pair or generates one if not found.
 * Private key is stored securely in IndexedDB, public key in localStorage.
 */
export async function getOrGenerateUserKeys(userId: string): Promise<{ publicKeyJwk: string; privateKey: CryptoKey }> {
  const securePrivateKey = await getPrivateKeySecurely(userId);
  const localPublicKeyJwk = localStorage.getItem(`${PUBLIC_KEY_PREFIX}${userId}`);

  // Migration logic: check if there's an old key in localStorage
  const legacyPrivateKeyJwk = localStorage.getItem(`${PRIVATE_KEY_PREFIX}${userId}`);

  if (securePrivateKey && localPublicKeyJwk) {
    // If we have legacy keys in localStorage, clean them up now that they are migrated/secured
    if (legacyPrivateKeyJwk) {
      localStorage.removeItem(`${PRIVATE_KEY_PREFIX}${userId}`);
    }
    return { publicKeyJwk: localPublicKeyJwk, privateKey: securePrivateKey };
  }

  // If we have a legacy private key in localStorage but not in IndexedDB, migrate it now
  if (legacyPrivateKeyJwk && localPublicKeyJwk) {
    try {
      const imported = await importPrivateKey(legacyPrivateKeyJwk);
      await savePrivateKeySecurely(userId, imported);
      localStorage.removeItem(`${PRIVATE_KEY_PREFIX}${userId}`);
      return { publicKeyJwk: localPublicKeyJwk, privateKey: imported };
    } catch (e) {
      console.error("Failed to migrate legacy E2E private key:", e);
    }
  }

  // Generate new keys
  const keyPair = await generateKeyPair();
  const pubJwk = await exportPublicKey(keyPair.publicKey);

  await savePrivateKeySecurely(userId, keyPair.privateKey);
  localStorage.setItem(`${PUBLIC_KEY_PREFIX}${userId}`, pubJwk);

  return { publicKeyJwk: pubJwk, privateKey: keyPair.privateKey };
}

/**
 * Force-regenerate a user's keys (resets private key in IndexedDB and public key locally).
 */
export async function regenerateUserKeys(userId: string): Promise<{ publicKeyJwk: string; privateKey: CryptoKey }> {
  localStorage.removeItem(`${PUBLIC_KEY_PREFIX}${userId}`);
  localStorage.removeItem(`${PRIVATE_KEY_PREFIX}${userId}`); // Clean up legacy key if any
  await removePrivateKeySecurely(userId);
  return await getOrGenerateUserKeys(userId);
}

/**
 * Helper to check if a private key is stored locally for a given user.
 */
export function hasLocalPrivateKey(userId: string): boolean {
  // Synchronous approximation: if we have the public key local, we also have the private key
  return !!localStorage.getItem(`${PUBLIC_KEY_PREFIX}${userId}`);
}

/**
 * Generates a random AES-GCM 256-bit key for a channel.
 */
export async function generateChannelKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Exports a symmetric CryptoKey to stringified JWK format.
 */
export async function exportSymmetricKey(key: CryptoKey): Promise<string> {
  const jwk = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

/**
 * Imports a symmetric CryptoKey from stringified JWK format.
 */
export async function importSymmetricKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "AES-GCM",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a channel key JWK string for a peer using ECDH key agreement.
 */
export async function encryptChannelKeyForPeer(
  myPrivateKey: CryptoKey,
  peerPublicKey: CryptoKey,
  channelKeyJwk: string
): Promise<{ ciphertext: string; iv: string }> {
  const sharedKey = await deriveSharedKey(myPrivateKey, peerPublicKey);
  return await encryptMessage(sharedKey, channelKeyJwk);
}

/**
 * Decrypts a channel key JWK string from a peer using ECDH key agreement.
 */
export async function decryptChannelKeyFromPeer(
  myPrivateKey: CryptoKey,
  peerPublicKey: CryptoKey,
  ciphertext: string,
  iv: string
): Promise<CryptoKey> {
  const sharedKey = await deriveSharedKey(myPrivateKey, peerPublicKey);
  const decryptedJwk = await decryptMessage(sharedKey, ciphertext, iv);
  return await importSymmetricKey(decryptedJwk);
}
