/**
 * Plate crop registry for Concept B ("Memoria Anual").
 * Every screenshot is tipped in as an exact percentage crop on a fixed-aspect
 * box: no object-fit, no JS measurement, hydration-safe. Source sizes come
 * from product-facts.md; crop rectangles are in source pixels.
 */
export type Crop = { x: number; y: number; w: number; h: number };

export type PlateDef = {
  src: string;
  w: number;
  h: number;
  crop: Crop;
  cropMobile?: Crop;
};

const RUBRIC = '/images/app/generated-evaluation-rubric.png';
const ORG = '/images/app/org-chart-editor.png';
const CATALOG = '/images/app/role-catalog-tree.png';
const MATCH = '/images/app/role-template-ai-match.png';
const BANK = '/images/app/question-bank-catalog.png';
const WEIGHTS = '/images/app/perspective-weights-wizard.png';
const STAGES = '/images/app/evaluation-stages-config.png';
const ANSWERING = '/images/app/evaluation-answering-360.png';

export const PLATES = {
  /** Lámina 01 — title, Director · DIR · 116, dims (11), normativas header, questions 1–2 with law chips */
  heroRubric: {
    src: RUBRIC,
    w: 1390,
    h: 951,
    crop: { x: 0, y: 0, w: 1390, h: 560 },
    cropMobile: { x: 0, y: 0, w: 700, h: 560 },
  },
  /** Lámina 02 — stats row, Actual/Propuesto, Mejorar árbol con IA, Sostenedor → Directorio → servicios generales */
  orgChart: {
    src: ORG,
    w: 1540,
    h: 1162,
    crop: { x: 30, y: 0, w: 1510, h: 1110 },
    cropMobile: { x: 30, y: 0, w: 870, h: 800 },
  },
  /** Lámina 03 — Director node with alias chips + the detail panel */
  roleCatalog: {
    src: CATALOG,
    w: 1576,
    h: 1173,
    crop: { x: 400, y: 250, w: 1176, h: 923 },
    cropMobile: { x: 1040, y: 250, w: 536, h: 750 },
  },
  /** Lámina 04 — four options 99/40/30/10 with Elegir, reasoning, template detail */
  aiMatch: {
    src: MATCH,
    w: 1505,
    h: 1010,
    crop: { x: 0, y: 0, w: 1505, h: 640 },
    cropMobile: { x: 20, y: 310, w: 660, h: 330 },
  },
  /**
   * Lámina 05 — title + 600 · 13 · 24, filters, table header + 3 rows and the
   * Q_COLAB_RED_06 detail panel down to "Normativas (1)". The spec's 540px height
   * cut the panel above its normativa chip, so the crop runs to y=770.
   */
  bank: {
    src: BANK,
    w: 1578,
    h: 990,
    crop: { x: 40, y: 40, w: 1500, h: 730 },
    cropMobile: { x: 40, y: 300, w: 860, h: 280 },
  },
  /** Lámina 06 (mobile only) — the assembled pauta, questions 1–4 */
  rubricMobile: {
    src: RUBRIC,
    w: 1390,
    h: 951,
    crop: { x: 400, y: 60, w: 700, h: 611 },
  },
  /** Lámina 07 — question, four inputs at 25, Total 100 / 100, donut */
  weights: {
    src: WEIGHTS,
    w: 1490,
    h: 1154,
    crop: { x: 320, y: 340, w: 880, h: 440 },
    cropMobile: { x: 320, y: 360, w: 460, h: 380 },
  },
  /** Lámina 08 — full screen; mobile: the six stage rows */
  stages: {
    src: STAGES,
    w: 806,
    h: 797,
    crop: { x: 0, y: 0, w: 806, h: 797 },
    cropMobile: { x: 58, y: 245, w: 692, h: 445 },
  },
  /** Lámina 09 — header card with Progreso 32/32, LOGRO 3.83, dominios, first three Likert rows */
  answering: {
    src: ANSWERING,
    w: 1305,
    h: 1104,
    crop: { x: 250, y: 0, w: 860, h: 800 },
    cropMobile: { x: 560, y: 0, w: 550, h: 360 },
  },
  /** Lámina 04 · detalle — the four Elegir options + reasoning */
  aiMatchDetail: {
    src: MATCH,
    w: 1505,
    h: 1010,
    crop: { x: 30, y: 340, w: 640, h: 290 },
  },
} as const satisfies Record<string, PlateDef>;

export type PlateKey = keyof typeof PLATES;

/** The one cover plate (Cap. 02) is not cropped: it fills the assembled frame. */
export const RUBRIC_COVER = { src: RUBRIC, w: 1390, h: 951 } as const;

const pct = (n: number) => `${Number(n.toFixed(4))}%`;

/** CSS custom properties that place the crop inside the fixed-aspect box. */
export function cropVars(def: PlateDef): Record<string, string> {
  const vars: Record<string, string> = {};
  const set = (c: Crop, suffix: '' | '-m') => {
    vars[`--ar${suffix}`] = `${c.w} / ${c.h}`;
    vars[`--pw${suffix}`] = pct((def.w / c.w) * 100);
    vars[`--pl${suffix}`] = pct(-(c.x / c.w) * 100);
    vars[`--pt${suffix}`] = pct(-(c.y / c.h) * 100);
  };
  set(def.crop, '');
  if (def.cropMobile) set(def.cropMobile, '-m');
  return vars;
}
