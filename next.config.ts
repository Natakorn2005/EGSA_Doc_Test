import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            // *** HSTS — บอกเบราว์เซอร์ว่าห้ามต่อผ่าน HTTP เด็ดขาด ไป HTTPS ตรง ๆ เสมอ ***
            // ปิดช่องที่ครั้งแรกสุดของการเข้าเว็บยังไม่เข้ารหัส (ก่อนถูก redirect)
            // max-age 2 ปี, ครอบ subdomain ทั้งหมด
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // กันเว็บอื่นเอาหน้าเราไปฝังใน iframe (clickjacking)
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // กันเบราว์เซอร์เดาชนิดไฟล์เอง (MIME sniffing)
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // ไม่ส่ง URL เต็มของเราไปให้เว็บปลายทางตอนคลิกลิงก์ออก
            // (สำคัญเพราะ URL บางหน้ามี Tracking ID อยู่ใน query string)
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // ปิดการเข้าถึงอุปกรณ์ที่เว็บนี้ไม่ได้ใช้เลย
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);