/**
 * จำกัดจำนวนครั้งการยื่นเอกสาร (rate limiting) แบบง่าย เก็บใน memory
 *
 * *** ข้อจำกัดที่ต้องรู้ ***
 * เก็บใน memory ของ serverless instance แต่ละตัว — Vercel อาจมีหลาย instance พร้อมกัน
 * และ instance ถูกรีเซ็ตเมื่อไม่มีคนใช้สักพัก แปลว่านี่ "ไม่ใช่" การป้องกันระดับ production จริงจัง
 * แต่เพียงพอสำหรับกันการยิงรัว ๆ จากคนเดียว/บอทตัวเดียว ซึ่งเป็นภัยหลักที่เราเจอจริง
 *
 * ถ้าในอนาคตต้องการของจริงจัง ควรใช้ Upstash Redis หรือ Vercel KV แทน
 */

type Entry = { count: number; windowStart: number };

const ipBuckets = new Map<string, Entry>();
const emailBuckets = new Map<string, Entry>();

// จำกัด: 5 ครั้งต่อ 10 นาที ต่อ IP
const IP_LIMIT = 5;
const IP_WINDOW_MS = 10 * 60 * 1000;

// จำกัด: 10 ครั้งต่อวัน ต่ออีเมล
const EMAIL_LIMIT = 10;
const EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000;

function check(buckets: Map<string, Entry>, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count += 1;
  return true;
}

/** เก็บกวาด entry เก่าเป็นระยะ กัน memory โตไม่หยุด */
function cleanup(buckets: Map<string, Entry>, windowMs: number) {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (now - entry.windowStart > windowMs) buckets.delete(key);
  }
}

export function checkSubmitRateLimit(ip: string, email: string): { ok: boolean; reason?: "ip" | "email" } {
  if (Math.random() < 0.05) {
    cleanup(ipBuckets, IP_WINDOW_MS);
    cleanup(emailBuckets, EMAIL_WINDOW_MS);
  }

  if (!check(ipBuckets, ip, IP_LIMIT, IP_WINDOW_MS)) {
    return { ok: false, reason: "ip" };
  }
  if (email && !check(emailBuckets, email.toLowerCase(), EMAIL_LIMIT, EMAIL_WINDOW_MS)) {
    return { ok: false, reason: "email" };
  }
  return { ok: true };
}
