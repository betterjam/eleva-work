'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { gsap, ScrollTrigger } from '@/components/concepts/shared/gsapSetup';
import { EASE, MQ, useMotion, type MotionKit } from './motion';

type Status = 'idle' | 'submitting' | 'success';
type RoleOption = { value: string; label: string };

const WHATSAPP_NUMBER = '56979591791';

/**
 * § Solicitar demo — five ruled fields whose underlines draw in, a honeypot,
 * simulated submit (700 ms) and a "Recibido" stamp with "Te escribimos a {email}".
 */
export default function DemoFormB() {
  const t = useTranslations('conceptB');
  const options = t.raw('demo.fields.role.options') as RoleOption[];
  const [status, setStatus] = useState<Status>('idle');
  const [email, setEmail] = useState('');

  const root = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const ictx = useRef<gsap.Context | null>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {}, el);
    ictx.current = ctx;
    return () => {
      ictx.current = null;
      ctx.revert();
    };
  }, []);

  const build = useCallback((kit: MotionKit) => {
    const { mm, q, splitLines } = kit;
    mm.add(MQ.motion, () => {
      if (h2Ref.current) {
        const h = h2Ref.current;
        splitLines(h, (self) => gsap.from(self.lines, { yPercent: 110, duration: 0.9, stagger: 0.08, ease: EASE.reveal, scrollTrigger: { trigger: h, start: 'top 80%', once: true } }));
      }
      if (bodyRef.current) {
        const b = bodyRef.current;
        splitLines(b, (self) => gsap.from(self.lines, { yPercent: 100, duration: 0.7, stagger: 0.05, ease: EASE.reveal, delay: 0.2, scrollTrigger: { trigger: b, start: 'top 80%', once: true } }));
      }
      const form = formRef.current;
      if (!form) return;
      const mobile = kit.isMobile();
      const tl = gsap.timeline({ scrollTrigger: { trigger: form, start: 'top 75%', once: true }, defaults: { ease: EASE.reveal } });
      const rules = q('.b-field-rule', form);
      const labels = q('.b-field .b-mask > label', form);
      const fades = q('.r-fade', root.current ?? form);
      const submit = form.querySelector('button[type="submit"]');
      if (rules.length) tl.fromTo(rules, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.6, stagger: mobile ? 0.04 : 0.06 }, 0);
      if (labels.length) tl.fromTo(labels, { yPercent: 100, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, stagger: mobile ? 0.04 : 0.06 }, 0.1);
      if (submit) tl.fromTo(submit, { scaleX: 0.96, autoAlpha: 0 }, { scaleX: 1, autoAlpha: 1, duration: 0.5, ease: EASE.settle }, 0.5);
      if (fades.length) tl.fromTo(fades, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.08 }, 0.5);
    });
  }, []);

  useMotion(root, build);

  // Success view: stamp snaps in, frame draws, line unmasks.
  useEffect(() => {
    if (status !== 'success') return;
    const stamp = stampRef.current;
    const panel = successRef.current;
    const ctx = ictx.current;
    if (!stamp || !panel) return;
    const line = panel.querySelector('.b-mask > *');
    const reset = panel.querySelector('.b-btn-ghost');
    if (!ctx) return;
    panel.focus({ preventScroll: true });
    if (reducedRef.current) {
      ctx.add(() => {
        gsap.set([stamp, line, reset].filter(Boolean) as Element[], { clearProps: 'all' });
      });
      ScrollTrigger.refresh();
      return;
    }
    ctx.add(() => {
      const tl = gsap.timeline({ onComplete: () => ScrollTrigger.refresh() });
      // `.b-stamp` mixes its border from --on (0 → 1) so the colour stays a live token after a theme toggle.
      tl.fromTo(stamp, { scale: 1.4, rotate: -4, autoAlpha: 0, '--on': 0 }, { scale: 1, rotate: -4, autoAlpha: 1, duration: 0.45, ease: EASE.snap }, 0);
      tl.to(stamp, { '--on': 1, duration: 0.4 }, 0.3);
      if (line) tl.fromTo(line, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: EASE.reveal }, 0.35);
      if (reset) tl.fromTo(reset, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.7);
    });
  }, [status]);

  const finish = () => {
    const form = formRef.current;
    const ctx = ictx.current;
    if (!form || reducedRef.current || !ctx) {
      setStatus('success');
      return;
    }
    const parts = form.querySelectorAll('.b-field, .b-form-foot > *');
    ctx.add(() => {
      gsap.fromTo(
        parts,
        { clipPath: 'inset(0% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 100% 0%)',
          duration: 0.4,
          ease: EASE.snap,
          stagger: 0.03,
          onComplete: () => setStatus('success'),
        }
      );
    });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const enteredEmail = String(fd.get('email') ?? '');
    if (fd.get('website')) {
      // Honeypot filled: a bot. Pretend it worked.
      setEmail(enteredEmail);
      setStatus('success');
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setEmail(enteredEmail);
    setStatus('submitting');
    window.setTimeout(finish, 700);
  };

  const reset = () => {
    const form = formRef.current;
    form?.reset();
    const ctx = ictx.current;
    if (form && ctx) {
      ctx.add(() => {
        gsap.set(form.querySelectorAll('.b-field, .b-form-foot > *'), { clearProps: 'clipPath' });
      });
    }
    setStatus('idle');
    window.requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t('demo.whatsappMessage'))}`;

  const field = (name: 'name' | 'email' | 'school', type: string, autoComplete: string) => (
    <div className="b-field has-rule">
      <span className="b-mask">
        <label htmlFor={`b-${name}`} className="r-text">
          {t(`demo.fields.${name}.label`)}
        </label>
      </span>
      <input
        id={`b-${name}`}
        name={name}
        type={type}
        className="b-input"
        required
        placeholder={t(`demo.fields.${name}.placeholder`)}
        autoComplete={autoComplete}
      />
      <span className="b-field-rule r-rule" aria-hidden="true" />
      <span className="b-underline" aria-hidden="true" />
    </div>
  );

  return (
    <section id="request-demo" ref={root} data-chapter={t('demo.runningHead')} className="b-section">
      <div className="b-container">
        <div className="b-grid">
          <div className="b-c1-5">
            <div className="b-divider">
              <span className="b-folio">{t('demo.folio')}</span>
            </div>
            <h2 ref={h2Ref} className="b-h2 r-text" style={{ marginTop: 24 }}>
              {t('demo.title')}
            </h2>
            <p ref={bodyRef} className="b-body r-text" style={{ marginTop: 24 }}>
              {t('demo.body')}
            </p>
            <p className="b-label r-fade" style={{ marginTop: 32 }}>
              <a className="b-link" href={waHref} target="_blank" rel="noopener noreferrer">
                {t('demo.whatsappLabel')} · {t('demo.whatsappNumber')}
              </a>
            </p>
          </div>

          <div className="b-c7-12">
            <form ref={formRef} noValidate onSubmit={onSubmit} hidden={status === 'success'} aria-busy={status === 'submitting'}>
              <div className="b-form-grid">
                {field('name', 'text', 'name')}
                {field('email', 'email', 'email')}
                {field('school', 'text', 'organization')}

                <div className="b-field has-rule">
                  <span className="b-mask">
                    <label htmlFor="b-role" className="r-text">
                      {t('demo.fields.role.label')}
                    </label>
                  </span>
                  <select id="b-role" name="role" className="b-input" required defaultValue="">
                    <option value="" disabled>
                      {t('demo.fields.role.placeholder')}
                    </option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <span className="b-field-rule r-rule" aria-hidden="true" />
                  <span className="b-underline" aria-hidden="true" />
                </div>

                <div className="b-field has-rule">
                  <span className="b-mask">
                    <label htmlFor="b-message" className="r-text">
                      {t('demo.fields.message.label')}
                    </label>
                  </span>
                  <textarea id="b-message" name="message" className="b-input" rows={3} placeholder={t('demo.fields.message.placeholder')} />
                  <span className="b-field-rule r-rule" aria-hidden="true" />
                  <span className="b-underline" aria-hidden="true" />
                </div>

                <div className="b-honeypot" aria-hidden="true">
                  <label htmlFor="b-website">{t('demo.honeypotLabel')}</label>
                  <input id="b-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
                </div>
              </div>

              <div className="b-form-foot" style={{ marginTop: 20, display: 'grid', gap: 16 }}>
                <p className="b-folio r-fade" style={{ whiteSpace: 'normal' }}>
                  {t('demo.requiredNote')}
                </p>
                <button type="submit" className="b-btn" style={{ width: '100%' }} disabled={status === 'submitting'}>
                  {status === 'submitting' ? t('demo.submitting') : t('demo.submit')}
                </button>
                <p className="b-small r-fade" style={{ display: 'block' }}>
                  {t('demo.privacy')}{' '}
                  <Link href="/privacy" className="b-link">
                    {t('demo.privacyLink')}
                  </Link>
                  .
                </p>
              </div>
            </form>

            {/* Content is inserted only on success so the live region announces it; focus moves here. */}
            <div ref={successRef} className="b-success" hidden={status !== 'success'} role="status" aria-live="polite" tabIndex={-1}>
              {status === 'success' && (
                <>
                  <div ref={stampRef} className="b-stamp">
                    {t('demo.success.stamp')}
                  </div>
                  <span className="b-mask">
                    <p className="b-label" style={{ margin: 0 }}>
                      {t('demo.success.line', { email })}
                    </p>
                  </span>
                  <button type="button" className="b-btn-ghost" onClick={reset}>
                    {t('demo.success.reset')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
