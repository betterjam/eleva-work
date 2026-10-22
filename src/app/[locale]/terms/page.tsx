import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('legal');

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

        <h1 className="text-3xl font-bold text-white mb-2">{t('termsTitle')}</h1>
        <p className="text-white/50 text-sm mb-8">{t('lastUpdated')}: Enero 2025</p>

        <div className="prose prose-invert prose-sm max-w-none">
          <div className="space-y-6 text-white/70">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Aceptación de los Términos</h2>
              <p>Al acceder y utilizar Eleva, aceptas estos términos de servicio. Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestro servicio.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Descripción del Servicio</h2>
              <p>Eleva es una plataforma de evaluación de desempeño diseñada para empresas. Proporcionamos herramientas para configurar pautas por cargo, gestionar procesos de feedback 360° y generar reportes.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Cuentas de Usuario</h2>
              <p>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Debes notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Uso Aceptable</h2>
              <p>Te comprometes a utilizar Eleva únicamente para propósitos legales y de acuerdo con estos términos. No debes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Usar el servicio de manera que viole leyes aplicables</li>
                <li>Intentar acceder a áreas restringidas del sistema</li>
                <li>Transmitir malware o código malicioso</li>
                <li>Interferir con el funcionamiento del servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Propiedad Intelectual</h2>
              <p>Todos los derechos de propiedad intelectual sobre Eleva y su contenido pertenecen a nosotros o nuestros licenciantes. No adquieres ningún derecho de propiedad sobre el servicio.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Limitación de Responsabilidad</h2>
              <p>En la máxima medida permitida por la ley, Eleva no será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso del servicio.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Modificaciones</h2>
              <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor al publicarse en esta página.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Contacto</h2>
              <p>Para consultas sobre estos términos, contáctanos en:</p>
              <p className="mt-2">Email: contacto@eleva.cl</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
