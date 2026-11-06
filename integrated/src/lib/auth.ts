import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'alzamiliah-super-secret-jwt-key-2024';
const COOKIE_NAME = 'admin_token';

export interface JWTPayload {
    userId: number;
    email: string;
    role: string;
}

export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function setAuthCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

export async function clearAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function getAuthToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value || null;
}

export async function requireAuth(): Promise<JWTPayload | null> {
    const token = await getAuthToken();
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    // Verify user still exists
    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
    });

    if (!user) return null;
    return payload;
}

// For API routes - extract token from Authorization header OR cookie
export async function getAuthFromRequest(request: Request): Promise<JWTPayload | null> {
    // Try Authorization header first
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        return verifyToken(token);
    }

    // Fall back to cookie
    return requireAuth();
}
