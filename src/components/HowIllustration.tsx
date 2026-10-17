'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';

/**
 * "Cómo funciona" as a four-panel schematic on a 2x2 grid, read clockwise:
 * 1 the org tree with the matched role, 2 the rubric it produces, 3 the 360°
 * cycle with its weighted perspectives and six stages, then the results with
 * their target and improvement suggestion. Panels are numbered like the step
 * cards beside them; connectors run straight through the gutters.
 *
 * Only digits inside, so nothing to translate; the accessible name comes from
 * `how.illustrationAlt`. Every shape is currentColor plus an opacity, so the
 * light-theme overrides for `text-white` and `text-brand-400` recolour it.
 * All coordinates are integers: no float drift between server and client.
 */
export default function HowIllustration({ className = '' }: { className?: string }) {
  const t = useTranslations('how');
  const dots = useId();

  // Panel chrome: surface, border, numbered badge and a title bar.
  const panel = (x: number, y: number, n?: number) => (
    <g>
      <rect x={x} y={y} width={248} height={208} rx={18} className="text-white" fill="currentColor" fillOpacity={0.05} stroke="currentColor" strokeOpacity={0.14} />
      {n !== undefined ? (
        <g className="text-brand-400">
          <circle cx={x + 24} cy={y + 24} r={11} fill="currentColor" />
          <text x={x + 24} y={y + 24} fontSize="11" fontWeight="600" fill="#ffffff" textAnchor="middle" dominantBaseline="central">{n}</text>
        </g>
      ) : (
        <g className="text-brand-400">
          <circle cx={x + 24} cy={y + 24} r={11} fill="currentColor" />
          <path d={`M${x + 19} ${y + 24}l3.5 3.5 6.5-6.5`} fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      <rect x={x + 42} y={y + 20} width={72} height={8} rx={4} className="text-white" fill="currentColor" fillOpacity={0.45} />
    </g>
  );

  // Org-chart node: avatar dot plus a name bar; the matched role is teal.
  const node = (x: number, y: number, w: number, h: number, accent = false) => (
    <g className={accent ? 'text-brand-400' : 'text-white'}>
      <rect x={x} y={y} width={w} height={h} rx={5} fill="currentColor" fillOpacity={accent ? 0.2 : 0.08} stroke="currentColor" strokeOpacity={accent ? 0.8 : 0.2} />
      <circle cx={x + 9} cy={y + h / 2} r={h >= 18 ? 4 : 3} fill="currentColor" fillOpacity={accent ? 0.95 : 0.5} />
      <rect x={x + 16} y={y + h / 2 - 2} width={w - 22} height={4} rx={2} fill="currentColor" fillOpacity={accent ? 0.8 : 0.35} />
    </g>
  );

  const person = (cx: number, cy: number) => (
    <g className="text-brand-400">
      <circle cx={cx} cy={cy} r={10} fill="currentColor" />
      <circle cx={cx} cy={cy - 3} r={3} fill="#ffffff" />
      <path d={`M${cx - 5} ${cy + 6} a5 4 0 0 1 10 0 z`} fill="#ffffff" />
    </g>
  );

  const line = (x: number, y: number, w: number, op = 0.35) => (
    <rect x={x} y={y} width={w} height={6} rx={3} className="text-white" fill="currentColor" fillOpacity={op} />
  );

  const rubricRows = [
    { w: 84, y: 86 },
    { w: 64, y: 110 },
    { w: 96, y: 134 },
    { w: 72, y: 158 },
  ];

  return (
    <svg viewBox="0 0 560 480" role="img" aria-label={t('illustrationAlt')} className={className}>
      <defs>
        <pattern id={dots} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="560" height="480" rx="24" fill={`url(#${dots})`} className="text-white" opacity="0.14" />

      {/* ---- 1 · Organigrama (top left) ---- */}
      {panel(12, 12, 1)}
      <g className="text-white" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" fill="none">
        <path d="M136 74v12M60 86h152M60 86v12M136 86v12M212 86v12" />
        <path d="M60 116v14M44 130h32M44 130v16M76 130v16" />
        <path d="M136 116v14M120 130h32M120 130v16M152 130v16" />
        <path d="M212 116v14M196 130h32M196 130v16M228 130v16" />
      </g>
      {node(100, 54, 72, 20)}
      {node(32, 98, 56, 18)}
      {node(108, 98, 56, 18, true)}
      {node(184, 98, 56, 18)}
      {node(24, 146, 40, 16)}
      {node(56, 146, 40, 16)}
      {node(100, 146, 40, 16)}
      {node(132, 146, 40, 16)}
      {node(176, 146, 40, 16)}
      {node(208, 146, 40, 16)}
      <g className="text-brand-400">
        <circle cx="164" cy="98" r="7" fill="currentColor" />
        <path d="M161 98l2 2 4-4" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* confidence of the match */}
      <g>
        <rect x="32" y="184" width="200" height="6" rx="3" className="text-white" fill="currentColor" fillOpacity="0.12" />
        <rect x="32" y="184" width="186" height="6" rx="3" className="text-brand-400" fill="currentColor" fillOpacity="0.85" />
      </g>

      {/* 1 -> 2 */}
      <g className="text-brand-400" stroke="currentColor" strokeOpacity="0.85" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path className="how-flow" d="M262 116h34" />
        <path d="M292 111l6 5-6 5" />
      </g>

      {/* ---- 2 · Pauta (top right) ---- */}
      {panel(300, 12, 2)}
      <rect x="316" y="46" width="216" height="160" rx="12" className="text-white" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeOpacity="0.12" />
      {line(330, 60, 90, 0.5)}
      <g className="text-brand-400">
        <rect x="474" y="56" width="44" height="14" rx="7" fill="currentColor" fillOpacity="0.25" />
        <rect x="481" y="61" width="30" height="4" rx="2" fill="currentColor" fillOpacity="0.9" />
      </g>
      {rubricRows.map(({ w, y }) => (
        <g key={y}>
          <g className="text-brand-400">
            <rect x="330" y={y} width="12" height="12" rx="3" fill="currentColor" />
            <path d={`M333 ${y + 6}l2.5 2.5 4.5-4.5`} fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="470" y={y + 2} width="22" height="8" rx="4" fill="currentColor" fillOpacity="0.3" />
          </g>
          {line(350, y + 3, w)}
          <rect x="496" y={y + 2} width="22" height="8" rx="4" className="text-white" fill="currentColor" fillOpacity="0.22" />
        </g>
      ))}
      <g className="text-white" fill="currentColor" fillOpacity="0.18">
        <rect x="330" y="184" width="36" height="10" rx="5" />
        <rect x="372" y="184" width="44" height="10" rx="5" />
        <rect x="422" y="184" width="30" height="10" rx="5" />
      </g>

      {/* 2 -> 3 */}
      <g className="text-brand-400" stroke="currentColor" strokeOpacity="0.85" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path className="how-flow" d="M424 222v34" />
        <path d="M419 250l5 6 5-6" />
      </g>

      {/* ---- 3 · Ciclo 360° (bottom right) ---- */}
      {panel(300, 260, 3)}
      <circle cx="372" cy="352" r="46" fill="none" className="text-white" stroke="currentColor" strokeOpacity="0.12" strokeWidth="8" />
      {/* weighted perspectives: four arcs, opacity = weight */}
      {[[-130, 0.95], [-40, 0.65], [50, 0.45], [140, 0.3]].map(([rot, op]) => (
        <circle key={rot} cx="372" cy="352" r="46" fill="none" className="text-brand-400" stroke="currentColor" strokeOpacity={op} strokeWidth="8" strokeLinecap="round" strokeDasharray="60 229" transform={`rotate(${rot} 372 352)`} />
      ))}
      {person(372, 306)}
      {person(418, 352)}
      {person(372, 398)}
      {person(326, 352)}
      {/* Likert 1-5 */}
      {[352, 362, 372, 382, 392].map((cx, i) => (
        <circle key={cx} cx={cx} cy="352" r="3" className={i < 4 ? 'text-brand-400' : 'text-white'} fill="currentColor" fillOpacity={i < 4 ? 1 : 0.25} />
      ))}
      {/* process card */}
      <rect x="440" y="300" width="92" height="64" rx="10" className="text-white" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.14" />
      {line(450, 310, 44, 0.45)}
      <rect x="450" y="324" width="72" height="6" rx="3" className="text-white" fill="currentColor" fillOpacity="0.12" />
      <rect x="450" y="324" width="48" height="6" rx="3" className="text-brand-400" fill="currentColor" fillOpacity="0.9" />
      {line(450, 338, 56, 0.25)}
      {line(450, 350, 36, 0.25)}
      {/* six stages, fourth active */}
      <path d="M330 440h190" className="text-white" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round" />
      {[330, 368, 406, 444, 482, 520].map((cx, i) => (
        i < 3 ? (
          <circle key={cx} cx={cx} cy="440" r="5" className="text-brand-400" fill="currentColor" />
        ) : i === 3 ? (
          <circle key={cx} cx={cx} cy="440" r="6" className="text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5" />
        ) : (
          <circle key={cx} cx={cx} cy="440" r="5" className="text-white" fill="currentColor" fillOpacity="0.25" />
        )
      ))}

      {/* 3 -> results */}
      <g className="text-brand-400" stroke="currentColor" strokeOpacity="0.85" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path className="how-flow" d="M298 364h-34" />
        <path d="M268 359l-6 5 6 5" />
      </g>

      {/* ---- Resultados (bottom left) ---- */}
      {panel(12, 260)}
      <path d="M36 440h116" className="text-white" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round" />
      <path d="M36 352h116" className="text-white" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="3 4" strokeLinecap="round" />
      <g className="text-brand-400" fill="currentColor">
        <rect x="44" y="380" width="20" height="60" rx="5" fillOpacity="0.4" />
        <rect x="72" y="344" width="20" height="96" rx="5" fillOpacity="0.6" />
        <rect x="100" y="364" width="20" height="76" rx="5" fillOpacity="0.5" />
        <rect x="128" y="322" width="20" height="118" rx="5" />
      </g>
      {/* improvement suggestion */}
      <rect x="166" y="300" width="80" height="140" rx="10" className="text-white" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.14" />
      <g className="text-brand-400">
        <circle cx="184" cy="318" r="8" fill="currentColor" fillOpacity="0.9" />
        <path d="M184 314v5M181 322h6" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </g>
      {line(198, 315, 36, 0.45)}
      {line(176, 340, 58, 0.3)}
      {line(176, 352, 46, 0.3)}
      {line(176, 364, 54, 0.3)}
      {line(176, 376, 40, 0.3)}
      <rect x="176" y="412" width="44" height="12" rx="6" className="text-brand-400" fill="currentColor" fillOpacity="0.3" />
      <rect x="183" y="416" width="30" height="4" rx="2" className="text-brand-400" fill="currentColor" fillOpacity="0.9" />
    </svg>
  );
}
