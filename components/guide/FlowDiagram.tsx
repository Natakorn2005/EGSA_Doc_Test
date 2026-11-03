// ผังการทำงานในหน้าคู่มือ — รูปทรงและตำแหน่งอยู่ในไฟล์นี้ ข้อความอยู่ใน messages/guide/th.json และ en.json
// (หมวด "diagrams" ชื่อข้อความตรงกับ id ของแต่ละกล่อง เช่น "submit-1" = บรรทัดแรกของกล่อง submit)
import { colors } from "@/lib/theme";

type Box = { id: string; x: number; y: number; w: number; h: number; kind?: "box" | "accent"; lines?: 1 | 2 };
type Diamond = { id: string; cx: number; cy: number; w: number; h: number };
type Lane = { id: string; y: number; h: number };
type Edge = { d: string; dash?: boolean };
type Label = { id: string; x: number; y: number; anchor: "start" | "middle" | "end" };
type Spec = { height: number; lanes?: Lane[]; boxes: Box[]; diamonds: Diamond[]; edges: Edge[]; labels: Label[] };

const SPECS: Record<string, Spec> = {
  overall: {
    height: 392,
    lanes: [
      { id: "app", y: 52, h: 100 },
      { id: "sec", y: 160, h: 100 },
      { id: "pres", y: 268, h: 100 },
    ],
    boxes: [
      { id: "submit", x: 130, y: 76, w: 170, h: 52 },
      { id: "resubmit", x: 335, y: 76, w: 170, h: 52 },
      { id: "done", x: 545, y: 76, w: 170, h: 52, kind: "accent" },
      { id: "review", x: 130, y: 184, w: 170, h: 52 },
      { id: "sign", x: 335, y: 292, w: 170, h: 52 },
      { id: "number", x: 545, y: 292, w: 170, h: 52 },
    ],
    diamonds: [{ id: "pass", cx: 420, cy: 210, w: 88, h: 60 }],
    edges: [
      { d: "M215 128V184" }, { d: "M300 210H376" }, { d: "M420 180V128" }, { d: "M335 102H300" },
      { d: "M420 240V292" }, { d: "M505 318H545" }, { d: "M630 292V128" },
    ],
    labels: [
      { id: "e-reject", x: 428, y: 160, anchor: "start" },
      { id: "e-again", x: 317, y: 70, anchor: "middle" },
      { id: "e-advance", x: 428, y: 268, anchor: "start" },
      { id: "e-notify", x: 638, y: 214, anchor: "start" },
      { id: "e-in", x: 223, y: 160, anchor: "start" },
    ],
  },
  applicant: {
    height: 372,
    boxes: [
      { id: "prep", x: 25, y: 70, w: 150, h: 52 },
      { id: "submit", x: 205, y: 70, w: 150, h: 52 },
      { id: "tracking", x: 385, y: 70, w: 150, h: 52 },
      { id: "follow", x: 565, y: 70, w: 150, h: 52 },
      { id: "use", x: 365, y: 184, w: 150, h: 52, kind: "accent" },
      { id: "fix", x: 565, y: 294, w: 150, h: 52 },
      { id: "gform", x: 25, y: 184, w: 150, h: 52 },
    ],
    diamonds: [{ id: "result", cx: 640, cy: 210, w: 100, h: 60 }],
    edges: [
      { d: "M175 96H205" }, { d: "M355 96H385" }, { d: "M535 96H565" }, { d: "M640 122V180" },
      { d: "M590 210H515" }, { d: "M640 240V294" }, { d: "M565 320H320V122" }, { d: "M240 122V210H175", dash: true },
    ],
    labels: [
      { id: "e-approved", x: 552, y: 202, anchor: "middle" },
      { id: "e-rejected", x: 648, y: 270, anchor: "start" },
      { id: "e-again", x: 442, y: 312, anchor: "middle" },
      { id: "e-large", x: 232, y: 166, anchor: "end" },
    ],
  },
  secretary: {
    height: 480,
    lanes: [{ id: "routine", y: 368, h: 88 }],
    boxes: [
      { id: "alert", x: 25, y: 70, w: 150, h: 52 },
      { id: "open", x: 205, y: 70, w: 150, h: 52 },
      { id: "advance", x: 545, y: 70, w: 150, h: 52 },
      { id: "notifypres", x: 545, y: 184, w: 150, h: 52, kind: "accent" },
      { id: "reason", x: 355, y: 184, w: 170, h: 52 },
      { id: "confirm", x: 365, y: 284, w: 150, h: 52 },
      { id: "notifyapp", x: 545, y: 284, w: 150, h: 52 },
      { id: "staff", x: 140, y: 386, w: 220, h: 52 },
      { id: "watch", x: 410, y: 386, w: 220, h: 52 },
    ],
    diamonds: [{ id: "ok", cx: 440, cy: 96, w: 88, h: 60 }],
    edges: [
      { d: "M175 96H205" }, { d: "M355 96H396" }, { d: "M484 96H545" }, { d: "M620 122V184" },
      { d: "M440 126V184" }, { d: "M440 236V284" }, { d: "M515 310H545" },
    ],
    labels: [
      { id: "e-pass", x: 514, y: 86, anchor: "middle" },
      { id: "e-fail", x: 448, y: 158, anchor: "start" },
    ],
  },
  president: {
    height: 350,
    boxes: [
      { id: "mail", x: 25, y: 70, w: 150, h: 52 },
      { id: "signdoc", x: 200, y: 70, w: 170, h: 52 },
      { id: "web", x: 565, y: 70, w: 150, h: 52 },
      { id: "gform", x: 370, y: 184, w: 170, h: 52 },
      { id: "issue", x: 565, y: 274, w: 150, h: 52, kind: "accent" },
    ],
    diamonds: [{ id: "size", cx: 455, cy: 96, w: 110, h: 64 }],
    edges: [
      { d: "M175 96H200" }, { d: "M370 96H400" }, { d: "M510 96H565" }, { d: "M640 122V274" },
      { d: "M455 128V184" }, { d: "M455 236V300H565" },
    ],
    labels: [
      { id: "e-no", x: 537, y: 86, anchor: "middle" },
      { id: "e-yes", x: 463, y: 160, anchor: "start" },
    ],
  },
};

const EDGE = "#a39a9b";
const LANE = "#f6eeef";

export function hasDiagram(id: string) {
  return id in SPECS;
}

export default function FlowDiagram({ id, labels }: { id: string; labels: Record<string, string> }) {
  const spec = SPECS[id];
  if (!spec) return null;
  const L = (key: string) => labels[key] ?? "";
  const marker = `guide-${id}-arrow`;

  return (
    <svg
      viewBox={`0 0 760 ${spec.height}`}
      role="img"
      aria-label={L("title")}
      style={{ width: "100%", height: "auto", display: "block", fontFamily: "var(--font-body), sans-serif" }}
      fontSize={13}
    >
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill={EDGE} />
        </marker>
      </defs>
      <text x={24} y={30} fontSize={15} fontWeight={600} fill={colors.text}>
        {L("title")}
      </text>
      {spec.lanes?.map((lane) => (
        <g key={lane.id}>
          <rect x={24} y={lane.y} width={712} height={lane.h} rx={8} fill={LANE} />
          <text x={36} y={lane.y + lane.h / 2 + 4} fontWeight={600} fill={colors.text}>
            {L(`lane-${lane.id}`)}
          </text>
        </g>
      ))}
      <g fill="none" stroke={EDGE} strokeWidth={1.25}>
        {spec.edges.map((e) => (
          <path key={e.d} d={e.d} markerEnd={`url(#${marker})`} strokeDasharray={e.dash ? "4 4" : undefined} />
        ))}
      </g>
      {spec.boxes.map((b) => {
        const accent = b.kind === "accent";
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        return (
          <g key={b.id}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={8}
              fill={accent ? colors.tint : "#fff"}
              stroke={accent ? colors.primary : EDGE}
              strokeWidth={accent ? 2 : 1.25}
            />
            <text x={cx} y={cy - 4} textAnchor="middle" fontWeight={600} fill={colors.text}>
              {L(`${b.id}-1`)}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11.5} fill={colors.textSecondary}>
              {L(`${b.id}-2`)}
            </text>
          </g>
        );
      })}
      {spec.diamonds.map((d) => (
        <g key={d.id}>
          <polygon
            points={`${d.cx - d.w / 2},${d.cy} ${d.cx},${d.cy - d.h / 2} ${d.cx + d.w / 2},${d.cy} ${d.cx},${d.cy + d.h / 2}`}
            fill="#fff"
            stroke={EDGE}
            strokeWidth={1.25}
          />
          <text x={d.cx} y={d.cy + 4} textAnchor="middle" fontWeight={600} fill={colors.text}>
            {L(`${d.id}-1`)}
          </text>
        </g>
      ))}
      {spec.labels.map((l) => (
        <text key={l.id} x={l.x} y={l.y} textAnchor={l.anchor} fontSize={11.5} fill={colors.textSecondary}>
          {L(l.id)}
        </text>
      ))}
    </svg>
  );
}
