import { SignJWT, jwtVerify } from 'jose';

const te = new TextEncoder();

async function deriveKey(password: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    base,
    256
  );
  return new Uint8Array(bits);
}

function b64(bytes: Uint8Array) {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

function fromB64(str: string) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Format: pbkdf2$<salt_b64>$<hash_b64> */
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveKey(password, salt);
  // join avoids template-literal $ edge cases in bundlers
  return ['pbkdf2', b64(salt), b64(hash)].join('$');
}

export async function verifyPassword(password: string, stored: string) {
  if (!stored || !stored.startsWith('pbkdf2$')) return false;
  const parts = stored.split('$');
  let saltB64 = '';
  let hashB64 = '';

  if (parts.length >= 3 && parts[1] && parts[2]) {
    saltB64 = parts[1];
    hashB64 = parts.slice(2).join('$');
  } else if (parts.length === 2 && parts[1]?.length > 24) {
    // Legacy broken format (missing $ between salt and hash)
    saltB64 = parts[1].slice(0, 24);
    hashB64 = parts[1].slice(24);
  } else {
    return false;
  }

  try {
    const salt = fromB64(saltB64);
    const expected = fromB64(hashB64);
    const actual = await deriveKey(password, salt);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}

export async function signToken(userId: string, secret: string) {
  return new SignJWT({ id: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(te.encode(secret));
}

export async function verifyToken(token: string, secret: string) {
  const { payload } = await jwtVerify(token, te.encode(secret));
  return payload as { id: string };
}
