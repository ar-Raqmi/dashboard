const ENCRYPTION_KEY = process.env.JWT_SECRET || 'dashboard-secret-key-change-in-production'

// Helper to encrypt a string using AES-GCM
export async function encryptText(text: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    enc.encode(text)
  )
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  
  // Convert to Base64
  return btoa(String.fromCharCode(...combined))
}

// Helper to decrypt a string using AES-GCM
export async function decryptText(encryptedBase64: string): Promise<string> {
  try {
    const enc = new TextDecoder()
    const combined = new Uint8Array(
      atob(encryptedBase64)
        .split('')
        .map((c) => c.charCodeAt(0))
    )
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      keyMaterial,
      ciphertext
    )
    return enc.decode(decrypted)
  } catch (err) {
    console.warn('Decryption failed, returning plain text', err)
    return encryptedBase64 // Fallback if it wasn't encrypted or failed
  }
}
