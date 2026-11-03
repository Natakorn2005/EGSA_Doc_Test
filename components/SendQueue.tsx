"use client";

/**
 * คิวส่งเอกสารเบื้องหลัง
 *
 * ทำให้การยื่นเอกสาร / อนุมัติ / ตีกลับ / ส่งต่อให้นายกฯ ทำงานต่อได้แม้ผู้ใช้เปลี่ยนไปหน้าอื่นในเว็บ
 * แล้วแจ้งผลเป็นกล่องแจ้งเตือนที่มุมจอเมื่อเสร็จ
 *
 * ทำงานอย่างไร
 * - ตัวนี้ถูกวางไว้ที่ชั้นนอกสุดของทุกหน้า (app/layout.tsx) จึงไม่ถูกปิดตอนเปลี่ยนหน้าในเว็บ
 *   คำขอที่ส่งค้างไว้จึงวิ่งต่อจนเสร็จ
 * - ข้อจำกัด: ตัวที่ส่งไฟล์คือเบราว์เซอร์ของผู้ใช้ ถ้าปิดแท็บ ปิดเบราว์เซอร์ หรือรีเฟรช การส่งจะหยุด
 *   จึงมี (1) เบราว์เซอร์ถามก่อนปิดถ้ายังส่งไม่เสร็จ และ (2) บันทึกรายการที่กำลังส่งไว้ในเครื่อง
 *   ถ้าหยุดกลางทาง เปิดเว็บครั้งต่อไปจะขึ้นแจ้งให้ตรวจสอบ
 * - ลิงก์ภายในเว็บต้องใช้ <Link> ของ Next.js เสมอ ห้ามใช้ <a href="/..."> เพราะ <a> จะโหลดหน้าใหม่ทั้งหน้า
 *   ผลเหมือนกดรีเฟรช ทำให้การส่งที่ค้างอยู่หยุดกลางทาง
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { colors } from "@/lib/theme";

export type SendKind = "submit" | "approve" | "reject" | "advance";
export type SendStatus = "sending" | "done" | "error" | "interrupted";

export type SendJob = {
  id: string;
  kind: SendKind;
  /** ชื่อเอกสาร ใช้แสดงในแถบและกล่องแจ้งเตือน */
  label: string;
  /** Tracking ID ของเอกสารที่เจ้าหน้าที่กำลังดำเนินการ (การยื่นใหม่ยังไม่มี) */
  trackingId?: string;
  status: SendStatus;
  result?: { trackingId?: string; docName?: string };
  error?: string;
  warning?: string;
  /** แสดงเป็นกล่องแจ้งเตือนหรือไม่ (ไม่แสดงถ้าผู้ใช้ยังเปิดหน้าที่รอผลอยู่ เพราะหน้านั้นแสดงผลเองแล้ว) */
  toast: boolean;
  /** ลองส่งใหม่ได้หรือไม่ (รายการที่ค้างจากการปิดแท็บครั้งก่อนไม่มีข้อมูลให้ส่งซ้ำ) */
  retryable: boolean;
};

export type SendRequest = {
  endpoint: string;
  /** FormData สำหรับคำขอที่มีไฟล์ หรือ object ธรรมดาสำหรับคำขอ JSON */
  body: FormData | Record<string, unknown>;
};

type EnqueueInput = {
  kind: SendKind;
  label: string;
  trackingId?: string;
  request: SendRequest;
};

type SendQueueApi = {
  jobs: SendJob[];
  enqueue: (input: EnqueueInput) => string;
  retry: (id: string) => void;
  dismiss: (id: string) => void;
  /** หน้าที่แสดงผลของงานนี้เองให้เรียก เพื่อไม่ให้เด้งกล่องแจ้งเตือนซ้ำ */
  watch: (id: string) => () => void;
};

const SendQueueContext = createContext<SendQueueApi | null>(null);

export function useSendQueue(): SendQueueApi {
  const ctx = useContext(SendQueueContext);
  if (!ctx) throw new Error("useSendQueue must be used inside <SendQueueProvider>");
  return ctx;
}

/** ติดตามงานเดียว — หน้าที่เรียกใช้จะถือว่า "กำลังดูผลอยู่" จึงไม่เด้งกล่องแจ้งเตือนซ้ำ */
export function useSendJob(id: string | null): SendJob | null {
  const { jobs, watch } = useSendQueue();
  useEffect(() => (id ? watch(id) : undefined), [id, watch]);
  return id ? jobs.find((j) => j.id === id) || null : null;
}

// ---- บันทึกรายการที่กำลังส่งไว้ในเครื่อง เพื่อจับกรณีปิดแท็บกลางคัน ----
// เก็บแบบแยกแท็บ และมี lastSeen คอยอัปเดต จะได้ไม่เข้าใจผิดว่าแท็บอื่นที่ยังเปิดอยู่ส่งไม่สำเร็จ
const STORAGE_KEY = "egsa.sendQueue.v1";
const HEARTBEAT_MS = 4000;
const STALE_MS = 15000;

type InflightRecord = { id: string; tab: string; kind: SendKind; label: string; lastSeen: number };

function readInflight(): InflightRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeInflight(records: InflightRecord[]) {
  try {
    if (records.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // โหมดส่วนตัว / ปิดการเก็บข้อมูล — ข้ามไป ระบบยังทำงานได้ แค่ตรวจจับการปิดแท็บกลางคันไม่ได้
  }
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const EMAIL_WARNING_KEY: Record<SendKind, string | null> = {
  submit: null,
  advance: "advanceEmailWarning",
  reject: "rejectEmailWarning",
  approve: "approveEmailWarning",
};

export function SendQueueProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("sendQueue");
  const tq = useTranslations("queue");
  const router = useRouter();
  const [jobs, setJobs] = useState<SendJob[]>([]);
  const requests = useRef(new Map<string, SendRequest>());
  const meta = useRef(new Map<string, { kind: SendKind; label: string }>());
  const watchers = useRef(new Map<string, number>());
  const tabId = useRef<string>("");

  const patch = useCallback((id: string, changes: Partial<SendJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...changes } : j)));
  }, []);

  const trackInflight = useCallback((id: string, on: boolean) => {
    const others = readInflight().filter((r) => r.id !== id);
    if (on) {
      const m = meta.current.get(id);
      if (m) others.push({ id, tab: tabId.current, kind: m.kind, label: m.label, lastSeen: Date.now() });
    }
    writeInflight(others);
  }, []);

  const run = useCallback(
    async (id: string) => {
      const req = requests.current.get(id);
      const m = meta.current.get(id);
      if (!req || !m) return;
      trackInflight(id, true);

      let next: Partial<SendJob>;
      try {
        const init: RequestInit =
          req.body instanceof FormData
            ? { method: "POST", body: req.body }
            : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req.body) };
        const res = await fetch(req.endpoint, init);
        let data: { success?: boolean; error?: string; data?: Record<string, unknown> };
        try {
          data = await res.json();
        } catch {
          data = { success: false, error: `HTTP ${res.status}` };
        }

        if (data.success) {
          const warnKey = EMAIL_WARNING_KEY[m.kind];
          next = {
            status: "done",
            result: (data.data as SendJob["result"]) || {},
            warning: warnKey && data.data?.emailSent === false ? tq(warnKey) : undefined,
            error: undefined,
          };
        } else {
          next = { status: "error", error: data.error || t("genericError") };
        }
      } catch {
        next = { status: "error", error: t("networkError") };
      }

      trackInflight(id, false);
      next.toast = (watchers.current.get(id) || 0) === 0;
      patch(id, next);

      // งานของเจ้าหน้าที่เสร็จแล้ว ให้โหลดข้อมูลคิวใหม่ เอกสารที่ทำเสร็จจะหายไปจากรายการ
      if (next.status === "done" && m.kind !== "submit") router.refresh();
    },
    [patch, router, t, tq, trackInflight]
  );

  const enqueue = useCallback(
    (input: EnqueueInput) => {
      const id = newId();
      requests.current.set(id, input.request);
      meta.current.set(id, { kind: input.kind, label: input.label });
      setJobs((prev) => [
        ...prev,
        {
          id,
          kind: input.kind,
          label: input.label,
          trackingId: input.trackingId,
          status: "sending",
          toast: false,
          retryable: true,
        },
      ]);
      void run(id);
      return id;
    },
    [run]
  );

  const retry = useCallback(
    (id: string) => {
      if (!requests.current.has(id)) return;
      patch(id, { status: "sending", error: undefined, toast: false });
      void run(id);
    },
    [patch, run]
  );

  const dismiss = useCallback((id: string) => {
    requests.current.delete(id);
    meta.current.delete(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const watch = useCallback((id: string) => {
    watchers.current.set(id, (watchers.current.get(id) || 0) + 1);
    return () => {
      const n = (watchers.current.get(id) || 1) - 1;
      if (n <= 0) watchers.current.delete(id);
      else watchers.current.set(id, n);
    };
  }, []);

  // ตอนเปิดเว็บ: หารายการที่ค้างจากครั้งก่อน (แท็บที่ปิดไปแล้ว) แล้วแจ้งผู้ใช้
  useEffect(() => {
    tabId.current = newId();
    const now = Date.now();
    const all = readInflight();
    const stale = all.filter((r) => now - r.lastSeen > STALE_MS);
    if (stale.length === 0) return;
    writeInflight(all.filter((r) => now - r.lastSeen <= STALE_MS));
    // แสดงหลังหน้าเว็บโหลดเสร็จ (อ่านจาก localStorage ได้เฉพาะฝั่งเบราว์เซอร์)
    const timer = window.setTimeout(() => {
      setJobs((prev) => [
        ...prev,
        ...stale.map<SendJob>((r) => ({
          id: newId(),
          kind: r.kind,
          label: r.label,
          status: "interrupted",
          toast: true,
          retryable: false,
        })),
      ]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const sendingIds = jobs.filter((j) => j.status === "sending").map((j) => j.id);
  const isSending = sendingIds.length > 0;
  const sendingKey = sendingIds.join(",");

  // อัปเดตเวลาล่าสุดของงานที่แท็บนี้กำลังส่ง บอกแท็บอื่นว่ายังทำงานอยู่
  useEffect(() => {
    if (!sendingKey) return;
    const ids = new Set(sendingKey.split(","));
    const beat = () => {
      const now = Date.now();
      writeInflight(readInflight().map((r) => (ids.has(r.id) ? { ...r, lastSeen: now } : r)));
    };
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [sendingKey]);

  // กันเผลอปิดแท็บ / รีเฟรช ระหว่างที่ยังส่งไม่เสร็จ
  useEffect(() => {
    if (!isSending) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isSending]);

  // กล่องแจ้งเตือนที่สำเร็จและไม่มีคำเตือน ปิดเองหลัง 8 วินาที
  const autoCloseKey = jobs
    .filter((j) => j.toast && j.status === "done" && !j.warning)
    .map((j) => j.id)
    .join(",");
  useEffect(() => {
    if (!autoCloseKey) return;
    const timers = autoCloseKey.split(",").map((id) => window.setTimeout(() => dismiss(id), 8000));
    return () => timers.forEach((tm) => window.clearTimeout(tm));
  }, [autoCloseKey, dismiss]);

  const api = useMemo<SendQueueApi>(() => ({ jobs, enqueue, retry, dismiss, watch }), [jobs, enqueue, retry, dismiss, watch]);

  const sending = jobs.filter((j) => j.status === "sending");
  const toasts = jobs.filter((j) => j.toast && j.status !== "sending");

  return (
    <SendQueueContext.Provider value={api}>
      {children}
      {(sending.length > 0 || toasts.length > 0) && (
        <div className="egsa-sendqueue" role="region" aria-label={t("regionLabel")} aria-live="polite">
          {toasts.map((job) => (
            <Toast key={job.id} job={job} canRetry={job.retryable} onRetry={retry} onDismiss={dismiss} />
          ))}
          {sending.length > 0 && <SendingBar jobs={sending} />}
        </div>
      )}
      <style>{`
        .egsa-sendqueue {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 60;
          width: 360px;
          max-width: calc(100vw - 32px);
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-family: var(--font-body);
        }
        @media (max-width: 768px) {
          .egsa-sendqueue { left: 16px; right: 16px; bottom: 16px; width: auto; max-width: none; }
        }
        @keyframes egsa-spin { to { transform: rotate(360deg); } }
        .egsa-spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          animation: egsa-spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        .egsa-spinner-dark {
          border-color: ${colors.tintBorder};
          border-top-color: ${colors.primary};
        }
        @media (prefers-reduced-motion: reduce) {
          .egsa-spinner { animation-duration: 2.4s; }
        }
      `}</style>
    </SendQueueContext.Provider>
  );
}

function SendingBar({ jobs }: { jobs: SendJob[] }) {
  const t = useTranslations("sendQueue");
  const shown = jobs.slice(0, 3);
  return (
    <div
      style={{
        background: colors.primaryDark,
        color: "#fff",
        borderRadius: 12,
        padding: "12px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="egsa-spinner" aria-hidden="true" />
        <strong style={{ fontSize: 14, fontWeight: 500 }}>{t("sendingTitle", { count: jobs.length })}</strong>
      </div>
      <ul style={{ margin: "6px 0 0 26px", padding: 0, listStyle: "none", fontSize: 13, opacity: 0.92 }}>
        {shown.map((j) => (
          <li key={j.id} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t(`kind.${j.kind}`)}: {j.label}
          </li>
        ))}
        {jobs.length > shown.length && <li>{t("andMore", { count: jobs.length - shown.length })}</li>}
      </ul>
      <p style={{ margin: "8px 0 0 26px", fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>{t("keepTabOpen")}</p>
    </div>
  );
}

function Toast({
  job,
  canRetry,
  onRetry,
  onDismiss,
}: {
  job: SendJob;
  canRetry: boolean;
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const t = useTranslations("sendQueue");

  const tone =
    job.status === "done" && !job.warning
      ? { bg: "#f1f8f1", border: "#cde5cf", color: "#1b5e20", icon: "ti-circle-check" }
      : job.status === "done"
        ? { bg: "#fff8e1", border: "#ffe082", color: "#8a4b00", icon: "ti-alert-triangle" }
        : job.status === "interrupted"
          ? { bg: "#fff8e1", border: "#ffe082", color: "#8a4b00", icon: "ti-help-circle" }
          : { bg: "#fff3f3", border: "#f3c2c2", color: "#b00020", icon: "ti-alert-circle" };

  const title =
    job.status === "done"
      ? t(`done.${job.kind}`)
      : job.status === "interrupted"
        ? t("interruptedTitle")
        : t("failedTitle");

  const submittedId = job.kind === "submit" ? job.result?.trackingId : undefined;

  const linkStyle: React.CSSProperties = { color: tone.color, fontWeight: 500, textDecoration: "underline" };
  const btnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    padding: 0,
    color: tone.color,
    fontWeight: 500,
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "var(--font-body)",
  };

  return (
    <div
      role={job.status === "error" ? "alert" : "status"}
      style={{
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        borderRadius: 12,
        padding: "12px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        color: tone.color,
        fontSize: 13,
        lineHeight: 1.55,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <i className={`ti ${tone.icon}`} style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: "block", fontSize: 14, fontWeight: 500 }}>{title}</strong>
          <div style={{ color: colors.textSecondary, overflowWrap: "anywhere" }}>{job.label}</div>

          {submittedId && (
            <div style={{ marginTop: 4, color: colors.textSecondary }}>
              {t("trackingIdLabel")}: <strong style={{ color: colors.primaryDark }}>{submittedId}</strong>
              <div style={{ fontSize: 12 }}>{t("emailSoon")}</div>
            </div>
          )}
          {job.warning && <div style={{ marginTop: 6 }}>{job.warning}</div>}
          {job.status === "error" && job.error && (
            <div style={{ marginTop: 6, overflowWrap: "anywhere" }}>{job.error}</div>
          )}
          {job.status === "interrupted" && (
            <div style={{ marginTop: 6, color: colors.textSecondary }}>
              {t(job.kind === "submit" ? "interruptedBodySubmit" : "interruptedBodyStaff")}
            </div>
          )}

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
            {submittedId && (
              <Link href={`/status?q=${encodeURIComponent(submittedId)}`} style={linkStyle} onClick={() => onDismiss(job.id)}>
                {t("viewStatus")}
              </Link>
            )}
            {job.status === "error" && canRetry && (
              <button type="button" onClick={() => onRetry(job.id)} style={btnStyle}>
                {t("retry")}
              </button>
            )}
            {job.status === "interrupted" && job.kind === "submit" && (
              <Link href="/my" style={linkStyle} onClick={() => onDismiss(job.id)}>
                {t("checkMyDocs")}
              </Link>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(job.id)}
          aria-label={t("close")}
          style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: colors.textMuted, flexShrink: 0 }}
        >
          <i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
