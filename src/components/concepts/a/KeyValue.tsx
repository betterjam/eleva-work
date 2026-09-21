export type KeyValueRow = { key: string; value: string };

type Props = {
  rows: KeyValueRow[];
  className?: string;
  /** Add `.rv-*` hooks so `useReveal` draws the rules and wipes the values. */
  animated?: boolean;
  /** Style the last row as a total (line-2 rule above). */
  totalLast?: boolean;
  /** Extra class on every value cell (e.g. `a-num-md` for tally numerals). */
  valueClassName?: string;
};

/**
 * Key / value list rendered as grid rows (a <dl>) so each row can own an
 * absolutely positioned 1px rule that scales in from the left.
 */
export default function KeyValue({ rows, className, animated = true, totalLast = false, valueClassName }: Props) {
  return (
    <dl className={`a-kv2${className ? ` ${className}` : ''}`}>
      {rows.map((row, i) => {
        const isTotal = totalLast && i === rows.length - 1;
        const ddClass = [animated ? 'rv-wipe' : '', valueClassName ?? ''].filter(Boolean).join(' ');
        return (
          <div key={`${row.key}-${i}`} className={`a-kv2-row${isTotal ? ' is-total' : ''}`}>
            <dt>{row.key}</dt>
            <dd className={ddClass || undefined}>{row.value}</dd>
            <span className={`a-kv2-rule${animated ? ' rv-rule-x' : ''}`} aria-hidden="true" />
          </div>
        );
      })}
    </dl>
  );
}
