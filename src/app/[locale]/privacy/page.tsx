import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

const privacyContentEs = {
  back: 'Volver',
  title: 'Política de Privacidad',
  lastUpdated: 'Última actualización: Enero 2025',
  sections: [
    {
      title: '1. Responsable del Tratamiento',
      content: `Eleva SpA ("Eleva", "nosotros" o "nuestro"), con domicilio en Santiago, Chile, es responsable del tratamiento de los datos personales recopilados a través de este sitio web y la plataforma Eleva.

Para cualquier consulta relacionada con privacidad, puedes contactarnos en: privacidad@eleva.cl`
    },
    {
      title: '2. Datos que Recopilamos',
      content: `Recopilamos los siguientes tipos de información:

**Datos proporcionados directamente:**
• Nombre completo y cargo
• Correo electrónico institucional
• Nombre del establecimiento educacional
• Teléfono de contacto (opcional)
• Mensajes y consultas enviadas

**Datos de uso del sitio:**
• Dirección IP y ubicación aproximada
• Tipo de navegador y dispositivo
• Páginas visitadas y tiempo de permanencia
• Fuente de referencia

**Datos de la plataforma (para usuarios registrados):**
• Información de evaluaciones de desempeño
• Documentos y evidencias cargadas
• Registros de actividad y auditoría`
    },
    {
      title: '3. Finalidad del Tratamiento',
      content: `Utilizamos tus datos para:

• Responder solicitudes de demo y consultas comerciales
• Proporcionar acceso y soporte a la plataforma Eleva
• Enviar comunicaciones sobre actualizaciones del servicio
• Mejorar la experiencia de usuario y funcionalidades
• Generar estadísticas agregadas y anónimas
• Cumplir con obligaciones legales y contractuales
• Prevenir fraude y garantizar la seguridad

No utilizamos tus datos para publicidad de terceros ni los vendemos bajo ninguna circunstancia.`
    },
    {
      title: '4. Base Legal',
      content: `El tratamiento de datos se fundamenta en:

• **Consentimiento:** Al enviar formularios o aceptar cookies
• **Ejecución contractual:** Para proveer los servicios contratados
• **Interés legítimo:** Para mejorar nuestros servicios y seguridad
• **Obligación legal:** Para cumplir con normativas aplicables

En Chile, el tratamiento se rige por la Ley 19.628 sobre Protección de la Vida Privada.`
    },
    {
      title: '5. Cookies y Tecnologías Similares',
      content: `Utilizamos cookies para:

**Cookies esenciales:**
• Preferencia de idioma y tema (claro/oscuro)
• Estado de sesión para usuarios autenticados
• Configuración de consentimiento de cookies

**Cookies analíticas (opcionales):**
• Análisis de uso del sitio web
• Métricas de rendimiento

Puedes gestionar tus preferencias de cookies desde el banner de consentimiento o configurando tu navegador. Algunas funcionalidades pueden verse afectadas si rechazas cookies esenciales.`
    },
    {
      title: '6. Compartir Información',
      content: `Podemos compartir datos con:

• **Proveedores de servicios:** Hosting, email, analytics (bajo acuerdos de confidencialidad)
• **Establecimientos educacionales:** Datos de evaluación según el contrato de servicio
• **Autoridades:** Cuando sea requerido por ley o proceso judicial

No vendemos, alquilamos ni comercializamos datos personales a terceros.`
    },
    {
      title: '7. Seguridad de los Datos',
      content: `Implementamos medidas de seguridad incluyendo:

• Cifrado de datos en tránsito (HTTPS/TLS)
• Cifrado de datos sensibles en reposo
• Control de acceso basado en roles
• Monitoreo y registro de actividades
• Respaldos periódicos y plan de recuperación
• Capacitación en seguridad para el equipo

Ningún sistema es 100% seguro. En caso de brecha de seguridad, notificaremos a los afectados según lo requiera la ley.`
    },
    {
      title: '8. Retención de Datos',
      content: `Conservamos los datos por el tiempo necesario para:

• **Datos de contacto:** Mientras exista relación comercial o hasta solicitud de eliminación
• **Datos de plataforma:** Según el contrato con el establecimiento, típicamente durante la vigencia más 5 años
• **Logs de seguridad:** 2 años
• **Datos de facturación:** 6 años (requisito legal)

Los datos de evaluación pertenecen al establecimiento educacional y se gestionan según sus políticas.`
    },
    {
      title: '9. Tus Derechos',
      content: `Tienes derecho a:

• **Acceso:** Solicitar copia de tus datos personales
• **Rectificación:** Corregir datos inexactos o incompletos
• **Eliminación:** Solicitar la eliminación de tus datos
• **Oposición:** Oponerte a ciertos tratamientos
• **Portabilidad:** Recibir tus datos en formato estructurado

Para ejercer estos derechos, contacta a privacidad@eleva.cl con tu solicitud. Responderemos en un plazo máximo de 30 días.

Para datos de evaluación, contacta al administrador de tu establecimiento educacional.`
    },
    {
      title: '10. Transferencias Internacionales',
      content: `Nuestros servidores están ubicados en Estados Unidos (AWS). Al utilizar nuestros servicios, aceptas la transferencia de datos a servidores fuera de Chile.

Garantizamos que los proveedores cumplen con estándares de seguridad equivalentes mediante cláusulas contractuales y certificaciones (SOC 2, ISO 27001).`
    },
    {
      title: '11. Menores de Edad',
      content: `Eleva está diseñado para uso por personal administrativo y docente de establecimientos educacionales. No recopilamos intencionalmente datos de menores de 18 años a través de este sitio.

Los datos de estudiantes que puedan existir en la plataforma son gestionados por el establecimiento educacional según sus propias políticas.`
    },
    {
      title: '12. Cambios a esta Política',
      content: `Podemos actualizar esta política periódicamente. Notificaremos cambios significativos mediante:

• Aviso en el sitio web
• Email a usuarios registrados (para cambios materiales)

Te recomendamos revisar esta página regularmente.`
    },
    {
      title: '13. Contacto',
      content: `Para consultas sobre privacidad:

**Email:** privacidad@eleva.cl
**Dirección:** Santiago, Chile

Para consultas generales: contacto@eleva.cl`
    }
  ]
};

const privacyContentEn = {
  back: 'Back',
  title: 'Privacy Policy',
  lastUpdated: 'Last updated: January 2025',
  sections: [
    {
      title: '1. Data Controller',
      content: `Eleva SpA ("Eleva", "we" or "our"), based in Santiago, Chile, is the data controller for personal data collected through this website and the Eleva platform.

For any privacy-related inquiries, contact us at: privacy@eleva.cl`
    },
    {
      title: '2. Data We Collect',
      content: `We collect the following types of information:

**Data you provide directly:**
• Full name and job title
• Institutional email address
• School/institution name
• Contact phone (optional)
• Messages and inquiries

**Website usage data:**
• IP address and approximate location
• Browser type and device
• Pages visited and time spent
• Referral source

**Platform data (for registered users):**
• Performance evaluation information
• Uploaded documents and evidence
• Activity and audit logs`
    },
    {
      title: '3. Purpose of Processing',
      content: `We use your data to:

• Respond to demo requests and commercial inquiries
• Provide platform access and support
• Send service update communications
• Improve user experience and features
• Generate aggregate, anonymous statistics
• Fulfill legal and contractual obligations
• Prevent fraud and ensure security

We do not use your data for third-party advertising nor sell it under any circumstances.`
    },
    {
      title: '4. Legal Basis',
      content: `Data processing is based on:

• **Consent:** When submitting forms or accepting cookies
• **Contract performance:** To provide contracted services
• **Legitimate interest:** To improve our services and security
• **Legal obligation:** To comply with applicable regulations

In Chile, processing is governed by Law 19.628 on Protection of Private Life.`
    },
    {
      title: '5. Cookies and Similar Technologies',
      content: `We use cookies for:

**Essential cookies:**
• Language and theme preferences (light/dark)
• Session state for authenticated users
• Cookie consent configuration

**Analytics cookies (optional):**
• Website usage analysis
• Performance metrics

You can manage your cookie preferences from the consent banner or by configuring your browser. Some features may be affected if you reject essential cookies.`
    },
    {
      title: '6. Information Sharing',
      content: `We may share data with:

• **Service providers:** Hosting, email, analytics (under confidentiality agreements)
• **Educational institutions:** Evaluation data per service agreement
• **Authorities:** When required by law or legal process

We do not sell, rent, or trade personal data to third parties.`
    },
    {
      title: '7. Data Security',
      content: `We implement security measures including:

• Data encryption in transit (HTTPS/TLS)
• Encryption of sensitive data at rest
• Role-based access control
• Activity monitoring and logging
• Periodic backups and recovery plan
• Security training for our team

No system is 100% secure. In case of a security breach, we will notify affected parties as required by law.`
    },
    {
      title: '8. Data Retention',
      content: `We retain data for the time necessary for:

• **Contact data:** While commercial relationship exists or until deletion request
• **Platform data:** Per agreement with institution, typically during service plus 5 years
• **Security logs:** 2 years
• **Billing data:** 6 years (legal requirement)

Evaluation data belongs to the educational institution and is managed according to their policies.`
    },
    {
      title: '9. Your Rights',
      content: `You have the right to:

• **Access:** Request a copy of your personal data
• **Rectification:** Correct inaccurate or incomplete data
• **Deletion:** Request deletion of your data
• **Objection:** Object to certain processing
• **Portability:** Receive your data in structured format

To exercise these rights, contact privacy@eleva.cl with your request. We will respond within 30 days maximum.

For evaluation data, contact your educational institution's administrator.`
    },
    {
      title: '10. International Transfers',
      content: `Our servers are located in the United States (AWS). By using our services, you consent to data transfer to servers outside Chile.

We ensure providers meet equivalent security standards through contractual clauses and certifications (SOC 2, ISO 27001).`
    },
    {
      title: '11. Minors',
      content: `Eleva is designed for use by administrative and teaching staff of educational institutions. We do not intentionally collect data from minors under 18 through this website.

Student data that may exist on the platform is managed by the educational institution according to their own policies.`
    },
    {
      title: '12. Changes to this Policy',
      content: `We may update this policy periodically. We will notify significant changes through:

• Notice on the website
• Email to registered users (for material changes)

We recommend reviewing this page regularly.`
    },
    {
      title: '13. Contact',
      content: `For privacy inquiries:

**Email:** privacy@eleva.cl
**Address:** Santiago, Chile

For general inquiries: contact@eleva.cl`
    }
  ]
};

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const content = locale === 'es' ? privacyContentEs : privacyContentEn;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-3xl px-5 py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-8"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {content.back}
        </Link>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{content.title}</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">{content.lastUpdated}</p>

        <div className="space-y-8">
          {content.sections.map((section, index) => (
            <section key={index}>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">{section.title}</h2>
              <div className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
