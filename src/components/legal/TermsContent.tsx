import Link from 'next/link';

type Section = { title: string; text: string; list?: string[]; after?: string };

const termsEs = {
  back: 'Volver',
  title: 'Términos de Servicio',
  lastUpdated: 'Última actualización: Enero 2025',
  sections: [
    { title: '1. Aceptación de los Términos', text: 'Al acceder y utilizar Eleva, aceptas estos términos de servicio. Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestro servicio.' },
    { title: '2. Descripción del Servicio', text: 'Eleva es una plataforma de evaluación de desempeño diseñada para empresas. Proporcionamos herramientas para configurar pautas por cargo, gestionar procesos de feedback 360° y generar reportes.' },
    { title: '3. Cuentas de Usuario', text: 'Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Debes notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.' },
    {
      title: '4. Uso Aceptable',
      text: 'Te comprometes a utilizar Eleva únicamente para propósitos legales y de acuerdo con estos términos. No debes:',
      list: [
        'Usar el servicio de manera que viole leyes aplicables',
        'Intentar acceder a áreas restringidas del sistema',
        'Transmitir malware o código malicioso',
        'Interferir con el funcionamiento del servicio',
      ],
    },
    { title: '5. Propiedad Intelectual', text: 'Todos los derechos de propiedad intelectual sobre Eleva y su contenido pertenecen a nosotros o nuestros licenciantes. No adquieres ningún derecho de propiedad sobre el servicio.' },
    { title: '6. Limitación de Responsabilidad', text: 'En la máxima medida permitida por la ley, Eleva no será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso del servicio.' },
    { title: '7. Modificaciones', text: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor al publicarse en esta página.' },
    { title: '8. Contacto', text: 'Para consultas sobre estos términos, contáctanos en:', after: 'Email: contacto@eleva.cl' },
  ] as Section[],
};

const termsEn: typeof termsEs = {
  back: 'Back',
  title: 'Terms of Service',
  lastUpdated: 'Last updated: January 2025',
  sections: [
    { title: '1. Acceptance of the Terms', text: 'By accessing and using Eleva, you accept these terms of service. If you do not agree with any part of these terms, you must not use our service.' },
    { title: '2. Description of the Service', text: 'Eleva is a performance evaluation platform designed for companies. We provide tools to set up rubrics for each role, run 360° feedback processes and generate reports.' },
    { title: '3. User Accounts', text: 'You are responsible for keeping your account and password confidential. You must notify us immediately of any unauthorized use of your account.' },
    {
      title: '4. Acceptable Use',
      text: 'You agree to use Eleva only for lawful purposes and in accordance with these terms. You must not:',
      list: [
        'Use the service in a way that violates applicable laws',
        'Attempt to access restricted areas of the system',
        'Transmit malware or malicious code',
        'Interfere with the operation of the service',
      ],
    },
    { title: '5. Intellectual Property', text: 'All intellectual property rights in Eleva and its content belong to us or our licensors. You do not acquire any ownership rights over the service.' },
    { title: '6. Limitation of Liability', text: 'To the maximum extent permitted by law, Eleva will not be liable for indirect, incidental, special or consequential damages arising from the use of the service.' },
    { title: '7. Changes', text: 'We reserve the right to modify these terms at any time. Changes take effect when they are published on this page.' },
    { title: '8. Contact', text: 'For questions about these terms, contact us at:', after: 'Email: contacto@eleva.cl' },
  ],
};

/** The terms of service, in Spanish or English (its address: /es/terminos/, /en/terms/). */
export default function TermsContent({ locale }: { locale: string }) {
  const content = locale === 'en' ? termsEn : termsEs;

  return (
    <div className="min-h-screen bg-[#070A12]">
      <div className="mx-auto max-w-3xl px-5 py-20">
        <Link
          href={`/${locale === 'en' ? 'en' : 'es'}/`}
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {content.back}
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">{content.title}</h1>
        <p className="text-white/50 text-sm mb-8">{content.lastUpdated}</p>

        <div className="prose prose-invert prose-sm max-w-none">
          <div className="space-y-6 text-white/70">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold text-white mb-3">{section.title}</h2>
                <p>{section.text}</p>
                {section.list ? (
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {section.after ? <p className="mt-2">{section.after}</p> : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
