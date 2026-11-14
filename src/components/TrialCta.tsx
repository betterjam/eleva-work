import type { AnchorHTMLAttributes } from 'react';
import { TRIAL_URL } from '@/lib/trial';

type Props = {
  /** What it invites to. */
  label: string;
  /** What it does not ask for, under the invitation. */
  note?: string;
  /** Takes the whole width of its box (the closing card). */
  wide?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

/**
 * The call to the free trial, made worth pressing: the invitation, what it does not ask for under it, and an arrow
 * that leans forward on hover. One link to the app, where the trial is taken (src/lib/trial.ts). Its halo is in
 * globals.css (.trial-cta).
 */
export default function TrialCta({ label, note, wide = false, className = '', ...rest }: Props) {
  return (
    <a
      href={TRIAL_URL}
      className={`trial-cta group ${wide ? 'flex w-full' : 'inline-flex'} items-center justify-center gap-3 rounded-2xl bg-brand-600 px-5 py-3 text-on-accent transition hover:bg-brand-700 ${className}`}
      {...rest}
    >
      <span className="flex flex-col items-start text-left leading-tight">
        <span className="text-base font-semibold">{label}</span>
        {note ? <span className="mt-0.5 text-xs opacity-85">{note}</span> : null}
      </span>
      <svg
        className="h-5 w-5 flex-none transition-transform duration-200 group-hover:translate-x-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
      </svg>
    </a>
  );
}
