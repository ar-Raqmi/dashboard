import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ar-raqmi-secret-key-change-in-production'
)

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface SessionPayload {
  userId: string
  username: string
}

// Password hashing
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = await bcrypt.genSalt(12)
  const hash = await bcrypt.hash(password, salt)
  return { hash, salt }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWT Token management
export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      username: payload.username as string,
    }
  } catch {
    return null
  }
}

export function getSessionDuration(): number {
  return SESSION_DURATION
}
