import type { ReactNode } from 'react';

/** Labels for the four stations (all from messages; built by SystemSheet). */
export type SystemLabels = {
  index: { num: string; label: string }[];
  nodes: { name: string; code: string }[];
  catalogTitle: string;
  catalogNote: string;
  perspectives: { label: string; weight: string }[];
  ringCenter: string;
  ringLabel: string;
  bank: string;
  rubric: string;
  rubricLine: string;
  rubricNote: string;
  criteria: string[];
  stages: string[];
  logroLabel: string;
  logroValue: string;
  logroUnit: string;
  exampleTag: string;
};

/** Plate slot boxes over the stage (percent of the 1200×640 stage). */
export const SLOTS = [
  { left: '3.3%', top: '53.1%', width: '20.8%' },
  { left: '27.1%', top: '53.1%', width: '20.8%' },
  { left: '52.9%', top: '53.1%', width: '20.8%' },
  { left: '76.7%', top: '53.1%', width: '20.8%' },
];

/** Per-station viewBoxes for the stacked mobile figures. */
export const STATION_VIEWBOX = ['0 0 300 340', '260 0 380 290', '640 0 240 270', '890 0 310 240'];

/** LOGRO ring: 3.83 / 5 = 76.6 % of a r=44 circle. */
export const LOGRO = { cx: 1135, cy: 156, r: 44, ratio: 0.766 };
export const LOGRO_LEN = 2 * Math.PI * LOGRO.r;
export const LOGRO_OFFSET = LOGRO_LEN * (1 - LOGRO.ratio);

type ClipTextProps = {
  p: string;
  id: string;
  x: number;
  y: number;
  className: string;
  anchor?: 'start' | 'middle' | 'end';
  /** Wipe direction: default left→right (rect width 0→1); `up` = bottom→top (y 1→0, height 0→1). */
  up?: boolean;
  lit?: boolean;
  children: ReactNode;
};

/**
 * SVG text with its own objectBoundingBox clipPath so the timeline can wipe it
 * (rect width 0→1) without measuring anything. Ids are prefixed per SVG instance.
 */
export function ClipText({ p, id, x, y, className, anchor, up, lit, children }: ClipTextProps) {
  const cid = `${p}-clip-${id}`;
  return (
    <>
      <clipPath id={cid} clipPathUnits="objectBoundingBox">
        <rect data-clip={id} data-clip-up={up ? 'true' : undefined} x="0" y="0" width="1" height="1" />
      </clipPath>
      <text
        className={className}
        x={x}
        y={y}
        textAnchor={anchor}
        clipPath={`url(#${cid})`}
        data-lit={lit ? 'false' : undefined}
      >
        {children}
      </text>
    </>
  );
}

export function StationEstructura({ p, L }: { p: string; L: SystemLabels }) {
  const ys = [48, 128, 208];
  return (
    <g data-station="1">
      <text className="a-svg-tag" x={40} y={30}>
        {L.index[0].num} {L.index[0].label}
      </text>
      {ys.map((y, i) => (
        <g key={i}>
          <rect className="a-draw" data-draw={`r${i + 1}`} data-wet="false" x={40} y={y} width={200} height={44} />
          <ClipText p={p} id={`n${i}`} x={52} y={y + 19} className="a-svg-label a-svg-label-sm">
            {L.nodes[i]?.name}
          </ClipText>
          <ClipText p={p} id={`c${i}`} x={52} y={y + 36} className="a-svg-code a-svg-code-sm">
            {L.nodes[i]?.code}
          </ClipText>
        </g>
      ))}
      <path className="a-draw" data-draw="e1" data-wet="false" d="M140 92 V128" />
      {/* levels omitted between Director and the assistant: a broken edge, not a direct line */}
      <path className="a-draw" data-draw="e2" data-wet="false" d="M140 173 V179 M140 187 V193 M140 201 V207" />
      {/* Catalog readout: coverage, not a count (wiped in as the tree finishes drawing). */}
      <ClipText p={p} id="catalog" x={40} y={298} className="a-svg-label a-svg-label-sm">
        {L.catalogTitle}
      </ClipText>
      <ClipText p={p} id="catalogNote" x={40} y={320} className="a-svg-tag">
        {L.catalogNote}
      </ClipText>
    </g>
  );
}

export function StationPerspectivas({ p, L }: { p: string; L: SystemLabels }) {
  const P = L.perspectives;
  return (
    <g data-station="2">
      <text className="a-svg-tag" x={290} y={30}>
        {L.index[1].num} {L.index[1].label}
      </text>
      <circle className="a-draw-thin" cx={450} cy={150} r={76} />
      <path className="a-draw" data-draw="arc1" data-wet="false" d="M450 74 A76 76 0 0 1 526 150" />
      <path className="a-draw" data-draw="arc2" data-wet="false" d="M526 150 A76 76 0 0 1 450 226" />
      <path className="a-draw" data-draw="arc3" data-wet="false" d="M450 226 A76 76 0 0 1 374 150" />
      <path className="a-draw" data-draw="arc4" data-wet="false" d="M374 150 A76 76 0 0 1 450 74" />
      <path className="a-draw" data-draw="arrowUp" data-wet="false" d="M450 136 V80 M444 86 L450 80 L456 86" />
      <path className="a-draw" data-draw="arrowRight" data-wet="false" d="M464 150 H520 M514 144 L520 150 L514 156" />
      <path className="a-draw" data-draw="arrowDown" data-wet="false" d="M450 164 V220 M444 214 L450 220 L456 214" />
      <path className="a-draw" data-draw="arrowLeft" data-wet="false" d="M436 150 H380 M386 144 L380 150 L386 156" />
      <ClipText p={p} id="p0" x={450} y={60} anchor="middle" className="a-svg-label a-svg-label-sm">
        {P[0]?.label} · {P[0]?.weight}
      </ClipText>
      <ClipText p={p} id="p1a" x={532} y={138} className="a-svg-label a-svg-label-sm">
        {P[1]?.label}
      </ClipText>
      <ClipText p={p} id="p1b" x={532} y={166} className="a-svg-label a-svg-label-sm">
        {P[1]?.weight}
      </ClipText>
      <ClipText p={p} id="p2" x={450} y={252} anchor="middle" className="a-svg-label a-svg-label-sm">
        {P[2]?.label} · {P[2]?.weight}
      </ClipText>
      <ClipText p={p} id="p3a" x={368} y={138} anchor="end" className="a-svg-label a-svg-label-sm">
        {P[3]?.label}
      </ClipText>
      <ClipText p={p} id="p3b" x={368} y={166} anchor="end" className="a-svg-label a-svg-label-sm">
        {P[3]?.weight}
      </ClipText>
      <text className="a-svg-label a-svg-label-md" data-text="ringCenter" data-count={L.ringCenter} x={450} y={155} textAnchor="middle">
        {L.ringCenter}
      </text>
      <text className="a-svg-tag" x={450} y={270} textAnchor="middle">
        {L.ringLabel}
      </text>
    </g>
  );
}

export function StationPauta({ p, L }: { p: string; L: SystemLabels }) {
  return (
    <g data-station="3">
      <text className="a-svg-tag" x={660} y={30}>
        {L.index[2].num} {L.index[2].label}
      </text>
      <rect className="a-draw" data-draw="bank" data-wet="false" x={660} y={48} width={200} height={44} />
      <ClipText p={p} id="bank" x={672} y={75} className="a-svg-label a-svg-label-sm">
        {L.bank}
      </ClipText>
      <path className="a-draw" data-draw="bankEdge" data-wet="false" d="M760 92 V150" />
      {L.criteria.slice(0, 4).map((c, i) => (
        <text key={c} className="a-svg-tag" data-crit={i} data-lit="false" x={772} y={104 + i * 14}>
          {c}
        </text>
      ))}
      <rect className="a-draw" data-draw="rubric" data-wet="false" x={660} y={150} width={200} height={110} />
      <ClipText p={p} id="rubric" x={672} y={170} className="a-svg-label a-svg-label-sm">
        {L.rubric}
      </ClipText>
      <ClipText p={p} id="rubricLine" x={672} y={206} className="a-svg-label a-svg-label-sm">
        {L.rubricLine}
      </ClipText>
      <ClipText p={p} id="rubricNote" x={672} y={244} className="a-svg-tag">
        {L.rubricNote}
      </ClipText>
    </g>
  );
}

export function StationProceso({ p, L }: { p: string; L: SystemLabels }) {
  return (
    <g data-station="4">
      <text className="a-svg-tag" x={900} y={30}>
        {L.index[3].num} {L.index[3].label}
      </text>
      <path className="a-draw" data-draw="rail" data-wet="false" d="M920 56 V256" />
      {L.stages.slice(0, 6).map((s, k) => (
        <g key={s}>
          <circle
            className="a-draw a-node"
            data-draw={`node${k}`}
            data-wet="false"
            data-fill="none"
            cx={920}
            cy={56 + 40 * k}
            r={7}
          />
          <ClipText p={p} id={`stage${k}`} x={936} y={60 + 40 * k} className="a-svg-label a-svg-label-sm">
            {s}
          </ClipText>
        </g>
      ))}
      <circle className="a-draw-thin" cx={LOGRO.cx} cy={LOGRO.cy} r={LOGRO.r} />
      <circle
        className="a-draw"
        data-draw="logro"
        data-wet="false"
        data-final-offset={LOGRO_OFFSET.toFixed(2)}
        cx={LOGRO.cx}
        cy={LOGRO.cy}
        r={LOGRO.r}
        transform={`rotate(-90 ${LOGRO.cx} ${LOGRO.cy})`}
        strokeDasharray={LOGRO_LEN.toFixed(2)}
        strokeDashoffset={LOGRO_OFFSET.toFixed(2)}
      />
      <ClipText p={p} id="logroLabel" x={LOGRO.cx} y={96} anchor="middle" className="a-svg-tag">
        {L.logroLabel}
      </ClipText>
      <ClipText p={p} id="logroNum" x={LOGRO.cx} y={166} anchor="middle" className="a-svg-num a-svg-num-md" up>
        {L.logroValue}
        <tspan className="a-svg-tag" dx={4}>
          {L.logroUnit}
        </tspan>
      </ClipText>
      <ClipText p={p} id="logroExample" x={LOGRO.cx} y={222} anchor="middle" className="a-svg-tag">
        {L.exampleTag}
      </ClipText>
    </g>
  );
}

/** Desktop-only connectors between stations. */
export function Connectors() {
  return (
    <g data-connectors="true">
      <path className="a-draw" data-draw="c1" data-wet="false" d="M240 150 H372" />
      <path className="a-draw" data-draw="c2" data-wet="false" d="M526 150 H600 V205 H660" />
      <path className="a-draw" data-draw="c3" data-wet="false" d="M860 205 H890 V56 H913" />
    </g>
  );
}

export const STATIONS = [StationEstructura, StationPerspectivas, StationPauta, StationProceso];
