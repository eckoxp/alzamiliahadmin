const PRIVATE_IP =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fe80:|fc|fd|unknown$)/i;

export function isPrivateIp(ip: string) {
  return PRIVATE_IP.test(ip);
}

/** بيرجع كود الدولة (مثلاً SA) أو null لو فشل لأي سبب - عمره ما بيرمي error */
export async function getCountryCode(ip: string): Promise<string | null> {
  const token = process.env.IPINFO_TOKEN;
  if (!token || isPrivateIp(ip)) return null;

  try {
    const res = await fetch(
      `https://api.ipinfo.io/lite/${encodeURIComponent(ip)}?token=${token}`,
      { signal: AbortSignal.timeout(2000), cache: 'no-store' },
    );

    if (!res.ok) return null;
    const data = await res.json();
    const code = data?.country_code;
    return typeof code === 'string' && code.length === 2
      ? code.toUpperCase()
      : null;
  } catch {
    return null;
  }
}
