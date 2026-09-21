'use client';

import { useEffect, useState } from 'react';
import type { BeatSnapshot, DirectorEngine, SectionSnapshot } from './SectionDirector';

type Snap = { sections: SectionSnapshot[]; holds: string[]; beats: BeatSnapshot[] };

/**
 * `?director=1`: a fixed mono panel (outside <SmoothScroll>) listing every section with its
 * mode and transition, and a live progress bar per beat. Renders nothing otherwise; the
 * query string is read in an effect, so SSR and hydration never see it.
 */
export default function DirectorDebug({ engine }: { engine: DirectorEngine }) {
  const [snap, setSnap] = useState<Snap | null>(null);

  useEffect(() => {
    let on = false;
    try {
      on = new URLSearchParams(window.location.search).get('director') === '1';
    } catch {
      on = false;
    }
    if (!on) return;
    const tick = () =>
      setSnap({ sections: engine.snapshotSections(), holds: engine.holds(), beats: engine.snapshotBeats() });
    tick();
    const id = window.setInterval(tick, 120);
    return () => window.clearInterval(id);
  }, [engine]);

  if (!snap) return null;

  const bySection = new Map<string | null, BeatSnapshot[]>();
  snap.beats.forEach((b) => {
    const list = bySection.get(b.section);
    if (list) list.push(b);
    else bySection.set(b.section, [b]);
  });
  const orphans = bySection.get(null) ?? [];

  return (
    <aside className="a-dir-debug" data-a-chrome aria-hidden="true">
      <p className="a-dir-title">
        director · {snap.beats.length} beats · {snap.holds.length} pinned
      </p>
      {snap.sections.map((s) => (
        <div key={s.id} className="a-dir-sec" data-pinned={snap.holds.includes(s.id) ? 'true' : 'false'}>
          <p className="a-dir-sec-head">
            <span>{s.id}</span>
            <span>
              {s.mode}
              {s.effective !== s.mode ? `→${s.effective}` : ''} · {s.next}
            </span>
          </p>
          {(bySection.get(s.id) ?? []).map((b) => (
            <Row key={b.id} b={b} />
          ))}
        </div>
      ))}
      {orphans.length ? (
        <div className="a-dir-sec">
          <p className="a-dir-sec-head">
            <span>(no section)</span>
          </p>
          {orphans.map((b) => (
            <Row key={b.id} b={b} />
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function Row({ b }: { b: BeatSnapshot }) {
  const p = Math.max(0, Math.min(1, b.progress));
  return (
    <div className="a-dir-beat" data-locked={b.locked ? 'true' : 'false'} data-held={b.held ? 'true' : 'false'} data-mode={b.mode}>
      <span className="a-dir-id">{b.id}</span>
      <span className="a-dir-bar">
        <i style={{ transform: `scaleX(${p.toFixed(3)})` }} />
      </span>
      <span className="a-dir-val">{b.mode === 'self' ? 'self' : b.locked ? 'lock' : p.toFixed(2)}</span>
    </div>
  );
}
