import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function PrivacyPage() {
  const t = useTranslations('legal');

  return (
    <div className="min-h-screen bg-[#070A12]">
      <div className="mx-auto max-w-3xl px-5 py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">{t('privacyTitle')}</h1>
        <p className="text-white/50 text-sm mb-8">{t('lastUpdated')}: Enero 2025</p>

        <div className="prose prose-invert prose-sm max-w-none">
          <div className="space-y-6 text-white/70">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Información que Recopilamos</h2>
              <p>Recopilamos información que nos proporcionas directamente, como tu nombre, correo electrónico, nombre del colegio y cargo cuando solicitas una demo o te contactas con nosotros.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Uso de la Información</h2>
              <p>Utilizamos la información recopilada para:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Responder a tus consultas y solicitudes de demo</li>
                <li>Enviarte información sobre nuestros servicios</li>
                <li>Mejorar nuestra plataforma y experiencia de usuario</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Cookies</h2>
              <p>Utilizamos cookies esenciales para el funcionamiento del sitio y cookies analíticas para entender cómo interactúas con nuestra página. Puedes configurar tu navegador para rechazar cookies.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Compartir Información</h2>
              <p>No vendemos ni compartimos tu información personal con terceros, excepto cuando sea necesario para proporcionar nuestros servicios o cumplir con la ley.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Seguridad</h2>
              <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra acceso no autorizado, pérdida o alteración.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Tus Derechos</h2>
              <p>Tienes derecho a acceder, rectificar, eliminar o limitar el procesamiento de tus datos personales. Para ejercer estos derechos, contáctanos en contacto@eleva.cl</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Contacto</h2>
              <p>Si tienes preguntas sobre esta política de privacidad, puedes contactarnos en:</p>
              <p className="mt-2">Email: contacto@eleva.cl</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
