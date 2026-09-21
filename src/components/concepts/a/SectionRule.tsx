type Props = {
  code: string;
  runningHead: string;
  className?: string;
};

/**
 * Full-width hairline with the §NN code (mono) at left and the running head (Geist) at right.
 * Plain elements: the Section Director draws them (hairline scales in, code and running head
 * wipe) as the section arrives, per the transition into it. `data-rule-pending` is the
 * CSS-parked initial state (complete SSR, no flash); the director removes it when it takes
 * over, reduced motion and no-JS lift it in CSS.
 */
export default function SectionRule({ code, runningHead, className }: Props) {
  return (
    <div className={`a-rule${className ? ` ${className}` : ''}`} data-rule-pending="">
      <i className="a-rule-line" aria-hidden="true" />
      <span className="a-rule-code">{code}</span>
      <span className="a-running">{runningHead}</span>
    </div>
  );
}
