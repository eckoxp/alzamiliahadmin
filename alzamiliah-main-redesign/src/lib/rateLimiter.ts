interface AttemptRecord {
    count: number;
    firstAttemptAt: number;
    lockedUntil: number | null;
}
 
const attempts = new Map<string, AttemptRecord>();
 
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة
const LOCKOUT_MS = 15 * 60 * 1000; // 15 دقيقة قفل بعد ما يتخطى المحاولات
 
/**
 * بيتفحص قبل أي محاولة تسجيل دخول. بيرجع null لو مسموح يكمل،
 * أو عدد الدقايق المتبقية على الفك لو مقفول.
 */
export function checkRateLimit(key: string): { blocked: boolean; retryAfterMinutes?: number } {
    const record = attempts.get(key);
    if (!record) return { blocked: false };
 
    // لو القفل خلص وقته، امسح السجل وسيبه يجرب تاني
    if (record.lockedUntil && Date.now() > record.lockedUntil) {
        attempts.delete(key);
        return { blocked: false };
    }
 
    if (record.lockedUntil) {
        const retryAfterMinutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
        return { blocked: true, retryAfterMinutes };
    }
 
    return { blocked: false };
}
 
/** بيتنادى بعد كل محاولة فاشلة */
export function recordFailedAttempt(key: string) {
    const now = Date.now();
    const record = attempts.get(key);
 
    if (!record || now - record.firstAttemptAt > WINDOW_MS) {
        // أول محاولة، أو الشباك القديم انتهى - نبدأ عداد جديد
        attempts.set(key, { count: 1, firstAttemptAt: now, lockedUntil: null });
        return;
    }
 
    record.count++;
    if (record.count >= MAX_ATTEMPTS) {
        record.lockedUntil = now + LOCKOUT_MS;
    }
}
 
/** بيتنادى بعد نجاح تسجيل الدخول - يمسح أي سجل محاولات فاشلة قديم */
export function clearAttempts(key: string) {
    attempts.delete(key);
}
