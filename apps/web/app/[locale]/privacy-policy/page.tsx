import { Container } from "@/components/site/container";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { setRequestLocale } from "@/lib/i18n";
import { pageMetadata, privacyCopy, resolveLocale } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const copy = privacyCopy[locale];
  return pageMetadata({
    locale,
    path: "/privacy-policy",
    title: copy.title,
    description: copy.description,
    robots: { index: true, follow: false },
  });
}

const lastUpdated = "2026-05-27";

type Section = {
  heading: string;
  body: string;
  items?: string[];
};

type TableRow = { data: string; purpose: string; retention: string };

type Content = {
  title: string;
  updated: string;
  intro: string;
  controllerLabel: string;
  controller: string;
  sections: Section[];
  tableTitle: string;
  tableHeaders: [string, string, string];
  tableRows: TableRow[];
  thirdPartyTitle: string;
  thirdParties: Section[];
  cookieTitle: string;
  cookies: Section[];
  rightsTitle: string;
  rights: Section[];
  contactTitle: string;
  contact: string;
};

const content: Record<"pt-br" | "en" | "es", Content> = {
  "pt-br": {
    title: "Política de Privacidade",
    updated: "Última atualização",
    intro:
      "Esta Política de Privacidade descreve como o Amazon Hacking, programa do CESUPA, coleta, utiliza e protege os dados pessoais dos usuários deste site e do sistema de votação popular. O tratamento de dados segue estritamente a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).",
    controllerLabel: "Controlador",
    controller:
      "Centro Universitário do Estado do Pará (CESUPA) — amazon.hacking@cesupa.br",
    sections: [
      {
        heading: "1. Dados coletados na navegação",
        body: "Ao navegar pelo site sem realizar login, coletamos apenas:",
        items: [
          "Preferência de idioma (cookie do sistema)",
          "Estatísticas anônimas de acesso e telemetria agregada (sem rastreamento entre sites ou criação de perfis de usuário)",
          "Dados técnicos de telemetria para diagnóstico de erros na plataforma",
        ],
      },
      {
        heading: "2. Dados coletados no login (Google OAuth)",
        body: "Ao fazer login com Google para participar da votação, coletamos:",
        items: [
          "Nome completo",
          "Endereço de e-mail",
          "Foto de perfil",
        ],
      },
      {
        heading: "3. Dados coletados na votação",
        body: "Para garantir a integridade do processo de votação popular, coletamos dados adicionais no momento do voto:",
        items: [
          "Número de telefone (para validação de identidade via canais digitais)",
          "Endereço IP e região aproximada de acesso",
          "Características técnicas do navegador e do dispositivo (user agent e dados de identificação técnica do terminal)",
          "Metadados de validação automatizada de integridade (sistemas CAPTCHA e ferramentas de análise de risco de rede)",
        ],
      },
      {
        heading: "4. Finalidade do tratamento",
        body: "Os dados são coletados exclusivamente para:",
        items: [
          "Autenticar o usuário e manter sua sessão ativa",
          "Garantir a integridade eleitoral (voto único por cidadão)",
          "Detectar e prevenir fraudes, acessos automatizados ilícitos ou múltiplos votos artificiais",
          "Enviar o código de validação de identidade",
          "Gerar estatísticas anônimas de desempenho do site",
          "Monitorar a estabilidade técnica e segurança da plataforma",
        ],
      },
      {
        heading: "5. Base legal (LGPD)",
        body: "O tratamento dos dados pessoais fundamenta-se nas seguintes hipóteses legais da LGPD:",
        items: [
          "Execução de contrato ou procedimentos preliminares (art. 7º, V): para a criação, login e manutenção da conta de acesso do usuário por sua própria escolha de participar do evento.",
          "Legítimo interesse (art. 7º, IX): para o levantamento de métricas operacionais e auditorias que otimizem a experiência e o funcionamento da plataforma.",
          "Prevenção à fraude e segurança do titular (art. 11, II, 'g'): aplicado na validação do voto e na checagem de integridade do ambiente digital, com o objetivo de coibir abusos eletrônicos e votos inválidos.",
        ],
      },
    ],
    tableTitle: "6. Retenção dos dados",
    tableHeaders: ["Dado", "Finalidade", "Retenção"],
    tableRows: [
      { data: "Dados técnicos de sessão e rede", purpose: "Segurança e Autenticação", retention: "7 dias" },
      { data: "Token técnico de validação", purpose: "Validação do voto", retention: "5 minutos" },
      { data: "Identificadores de preferência", purpose: "Idioma e personalização básica", retention: "13 meses" },
      { data: "Dados da conta (nome, e-mail)", purpose: "Identificação", retention: "Até o encerramento da edição" },
      { data: "Registro e metadados de voto", purpose: "Integridade eleitoral", retention: "Até o encerramento da edição" },
    ],
    thirdPartyTitle: "7. Compartilhamento com terceiros",
    thirdParties: [
      {
        heading: "Provedor de Identidade (Google)",
        body: "Autenticação OAuth — recebe as credenciais do usuário diretamente para realizar o login seguro.",
      },
      {
        heading: "Serviços de Segurança e Infraestrutura de Rede",
        body: "Proteção contra ataques de negação de serviço (DDoS), distribuição de conteúdo e barreiras contra acessos automatizados ilícitos.",
      },
      {
        heading: "Serviços de Análise de Risco de Rede",
        body: "Sistemas de verificação de reputação de IP e integridade de conexões eletrônicas no momento do voto.",
      },
      {
        heading: "Ferramentas de Mensageria e Notificação",
        body: "Sistemas responsáveis pelo disparo dos códigos de verificação de identidade por canais digitais (WhatsApp e e-mail).",
      },
      {
        heading: "Plataformas de Monitoramento Técnico",
        body: "Sistemas internos e cookieless focados em analisar estatísticas gerais de tráfego e diagnosticar falhas de código em tempo real.",
      },
    ],
    cookieTitle: "8. Cookies e armazenamento local",
    cookies: [
      {
        heading: "Preferencia de Idioma",
        body: "Armazena a escolha de linguagem do visitante. Cookie próprio, válido por 13 meses. Pode ser limpo nas configurações do navegador.",
      },
      {
        heading: "Identificador de Sessão",
        body: "Mantém o usuário autenticado de forma segura após o login. Possui atributos de segurança estritos (HttpOnly, Secure, SameSite). Expira em 7 dias.",
      },
      {
        heading: "LocalStorage de Consentimento",
        body: "Registra que o aviso de privacidade do site foi visualizado e fechado, evitando reexibições incômodas.",
      },
    ],
    rightsTitle: "9. Direitos do titular (LGPD)",
    rights: [
      {
        heading: "Seus direitos",
        body: "Nos termos da LGPD, você tem direito a:",
        items: [
          "Confirmar a existência de tratamento dos seus dados",
          "Acessar seus dados pessoais recolhidos",
          "Corrigir dados incompletos, inexatos ou desatualizados",
          "Solicitar a eliminação dos dados (com exceção daqueles cuja retenção seja necessária para cumprimento de obrigações de segurança, auditoria e garantia da integridade da votação)",
          "Solicitar informações sobre as entidades com as quais compartilhamos dados",
        ],
      },
      {
        heading: "Como exercer",
        body: "Envie sua solicitação para amazon.hacking@cesupa.br identificando-se com o e-mail usado no login. Responderemos em até 15 dias úteis.",
      },
    ],
    contactTitle: "10. Contato",
    contact:
      "Para dúvidas sobre esta política ou sobre o tratamento de seus dados pessoais, entre em contato pelo e-mail amazon.hacking@cesupa.br.",
  },

  en: {
    title: "Privacy Policy",
    updated: "Last updated",
    intro:
      "This Privacy Policy describes how Amazon Hacking, a CESUPA program, collects, uses and protects the personal data of users of this website and the popular voting system. Data processing strictly follows Brazil's General Data Protection Law (LGPD — Law 13,709/2018).",
    controllerLabel: "Data Controller",
    controller:
      "Centro Universitário do Estado do Pará (CESUPA) — amazon.hacking@cesupa.br",
    sections: [
      {
        heading: "1. Data collected during browsing",
        body: "When browsing the site without logging in, we only collect:",
        items: [
          "Language preference (system cookie)",
          "Anonymous access statistics and aggregated telemetry (no cross-site tracking or user profiling)",
          "Technical telemetry data for platform error diagnosis",
        ],
      },
      {
        heading: "2. Data collected at login (Google OAuth)",
        body: "When logging in with Google to participate in voting, we collect:",
        items: [
          "Full name",
          "Email address",
          "Profile picture",
        ],
      },
      {
        heading: "3. Data collected during voting",
        body: "To ensure the integrity of the popular vote, we collect additional data at the time of voting:",
        items: [
          "Phone number (for identity validation via digital channels)",
          "IP address and approximate access region",
          "Technical characteristics of the browser and device (user agent and endpoint technical identification data)",
          "Automated integrity validation metadata (CAPTCHA systems and network risk analysis tools)",
        ],
      },
      {
        heading: "4. Purpose of processing",
        body: "Data is collected exclusively to:",
        items: [
          "Authenticate the user and maintain an active session",
          "Ensure electoral integrity (single vote per user)",
          "Detect and prevent fraud, illicit automated access, or multiple artificial votes",
          "Send the identity validation code",
          "Generate anonymous site performance statistics",
          "Monitor platform technical stability and security",
        ],
      },
      {
        heading: "5. Legal basis (LGPD)",
        body: "Personal data processing is based on the following legal grounds under the LGPD:",
        items: [
          "Performance of a contract or preliminary procedures (Art. 7, V): for the creation, login, and maintenance of the user account by their own choice to participate in the event.",
          "Legitimate interest (Art. 7, IX): for gathering operational metrics and audits to optimize platform experience and functionality.",
          "Fraud prevention and data subject security (Art. 11, II, 'g'): applied to vote validation and digital environment integrity checks, aiming to curb electronic abuse and invalid votes.",
        ],
      },
    ],
    tableTitle: "6. Data retention",
    tableHeaders: ["Data", "Purpose", "Retention"],
    tableRows: [
      { data: "Technical session and network data", purpose: "Security and Authentication", retention: "7 days" },
      { data: "Technical validation token", purpose: "Vote validation", retention: "5 minutes" },
      { data: "Preference identifiers", purpose: "Language and basic customization", retention: "13 months" },
      { data: "Account data (name, email)", purpose: "Identification", retention: "Until end of edition" },
      { data: "Vote record and metadata", purpose: "Electoral integrity", retention: "Until end of edition" },
    ],
    thirdPartyTitle: "7. Third-party sharing",
    thirdParties: [
      {
        heading: "Identity Provider (Google)",
        body: "OAuth Authentication — receives user credentials directly to complete a secure login.",
      },
      {
        heading: "Security and Network Infrastructure Services",
        body: "Protection against denial-of-service (DDoS) attacks, content delivery, and barriers against illicit automated access.",
      },
      {
        heading: "Network Risk Analysis Services",
        body: "IP reputation verification and electronic connection integrity systems at the time of voting.",
      },
      {
        heading: "Messaging and Notification Tools",
        body: "Systems responsible for sending identity verification codes via digital channels (WhatsApp and email).",
      },
      {
        heading: "Technical Monitoring Platforms",
        body: "Internal and cookieless systems focused on analyzing general traffic statistics and diagnosing code failures in real time.",
      },
    ],
    cookieTitle: "8. Cookies and local storage",
    cookies: [
      {
        heading: "Language Preference",
        body: "Stores the visitor's choice of language. First-party cookie, valid for 13 months. Can be cleared in browser settings.",
      },
      {
        heading: "Session Identifier",
        body: "Keeps the user securely authenticated after login. Features strict security attributes (HttpOnly, Secure, SameSite). Expires in 7 days.",
      },
      {
        heading: "Consent LocalStorage",
        body: "Records that the privacy notice was viewed and dismissed, avoiding redundant popups.",
      },
    ],
    rightsTitle: "9. Data subject rights (LGPD)",
    rights: [
      {
        heading: "Your rights",
        body: "Under the LGPD, you have the right to:",
        items: [
          "Confirm the existence of processing of your data",
          "Access your collected personal data",
          "Correct incomplete, inaccurate, or outdated data",
          "Request deletion of data (except where retention is required to fulfill safety, audit, and voting integrity obligations)",
          "Request information about the entities with whom we share data",
        ],
      },
      {
        heading: "How to exercise",
        body: "Send your request to amazon.hacking@cesupa.br identifying yourself with the email used at login. We will respond within 15 business days.",
      },
    ],
    contactTitle: "10. Contact",
    contact:
      "For questions about this policy or the processing of your personal data, contact us at amazon.hacking@cesupa.br.",
  },

  es: {
    title: "Política de Privacidad",
    updated: "Última actualización",
    intro:
      "Esta Política de Privacidad describe cómo Amazon Hacking, programa del CESUPA, recolecta, utiliza y protege los datos personales de los usuarios de este sitio y del sistema de votación popular. El tratamiento de datos sigue estrictamente la Ley General de Protección de Datos de Brasil (LGPD — Ley 13.709/2018).",
    controllerLabel: "Responsable del tratamiento",
    controller:
      "Centro Universitário do Estado do Pará (CESUPA) — amazon.hacking@cesupa.br",
    sections: [
      {
        heading: "1. Datos recolectados en la navegación",
        body: "Al navegar por el sitio sin iniciar sesión, recolectamos solo:",
        items: [
          "Preferencia de idioma (cookie del sistema)",
          "Estadísticas anónimas de acceso y telemetría agregada (sin rastreo entre sitios ni creación de perfiles de usuario)",
          "Datos técnicos de telemetría para diagnóstico de errores en la plataforma",
        ],
      },
      {
        heading: "2. Datos recolectados en el login (Google OAuth)",
        body: "Al iniciar sesión con Google para participar en la votación, recolectamos:",
        items: [
          "Nombre completo",
          "Dirección de correo electrónico",
          "Foto de perfil",
        ],
      },
      {
        heading: "3. Datos recolectados en la votación",
        body: "Para garantizar la integridad del proceso de votación popular, recolectamos datos adicionales al momento del voto:",
        items: [
          "Número de teléfono (para validación de identidad a través de canales digitales)",
          "Dirección IP y región aproximada de acceso",
          "Características técnicas del navegador y del dispositivo (user agent y datos de identificación técnica del terminal)",
          "Metadatos de validación automatizada de integridad (sistemas CAPTCHA y herramientas de análisis de riesgo de red)",
        ],
      },
      {
        heading: "4. Finalidad del tratamiento",
        body: "Los datos se recolectan exclusivamente para:",
        items: [
          "Autenticar al usuario y mantener su sesión activa",
          "Garantizar la integridad electoral (voto único por ciudadano)",
          "Detectar y prevenir fraudes, accesos automatizados ilícitos o votos múltiples artificiales",
          "Enviar el código de validación de identidad",
          "Generar estadísticas anónimas de rendimiento del sitio",
          "Monitorear la estabilidad técnica y seguridad de la plataforma",
        ],
      },
      {
        heading: "5. Base legal (LGPD)",
        body: "El tratamiento de datos personales se fundamenta en los siguientes supuestos legales de la LGPD:",
        items: [
          "Ejecución de contrato o procedimientos preliminares (Art. 7º, V): para la creación, inicio de sesión y mantenimiento de la cuenta de acceso del usuario por su propia elección de participar en el evento.",
          "Interés legítimo (Art. 7º, IX): para el levantamiento de métricas operacionales y auditorías técnicas que optimicen la experiencia y el funcionamiento de la plataforma.",
          "Prevención al fraude y seguridad del titular (Art. 11, II, 'g'): aplicado en la validación del voto y en los controles de integridad del entorno digital, con el objetivo de evitar abusos electrónicos y votos inválidos.",
        ],
      },
    ],
    tableTitle: "6. Retención de datos",
    tableHeaders: ["Dato", "Finalidad", "Retención"],
    tableRows: [
      { data: "Datos técnicos de sesión y red", purpose: "Seguridad y Autenticación", retention: "7 días" },
      { data: "Token técnico de validación", purpose: "Validación del voto", retention: "5 minutos" },
      { data: "Identificadores de preferencia", purpose: "Idioma y personalización básica", retention: "13 meses" },
      { data: "Datos de la cuenta (nombre, correo)", purpose: "Identificación", retention: "Hasta el cierre de la edición" },
      { data: "Registro y metadados de voto", purpose: "Integridad electoral", retention: "Hasta el cierre de la edición" },
    ],
    thirdPartyTitle: "7. Compartición con terceros",
    thirdParties: [
      {
        heading: "Proveedor de Identidad (Google)",
        body: "Autenticación OAuth — recibe las credenciales del usuario directamente para realizar el inicio de sesión seguro.",
      },
      {
        heading: "Servicios de Seguridad e Infraestructura de Red",
        body: "Protección contra ataques de denegación de servicio (DDoS), distribución de contenido y barreras contra accesos automatizados ilícitos.",
      },
      {
        heading: "Servicios de Análisis de Riesgo de Red",
        body: "Sistemas de verificación de reputación de IP e integridad de conexiones electrónicas al momento del voto.",
      },
      {
        heading: "Herramientas de Mensajería y Notificación",
        body: "Sistemas responsables del envío de códigos de verificación de identidad por canales digitales (WhatsApp y correo electrónico).",
      },
      {
        heading: "Plataformas de Monitoreo Técnico",
        body: "Sistemas internos y sin cookies enfocados en analizar estadísticas generales de tráfico y diagnosticar fallas de código en tiempo real.",
      },
    ],
    cookieTitle: "8. Cookies y almacenamiento local",
    cookies: [
      {
        heading: "Preferencia de Idioma",
        body: "Almacena la elección de idioma del visitante. Cookie propia, válida por 13 meses. Puede borrarse en la configuración del navegador.",
      },
      {
        heading: "Identificador de Sesión",
        body: "Mantiene al usuario autenticado de forma segura tras iniciar sesión. Cuenta con atributos de seguridad estrictos (HttpOnly, Secure, SameSite). Expira en 7 días.",
      },
      {
        heading: "LocalStorage de Consentimiento",
        body: "Registra que el aviso de privacidad fue visualizado y cerrado, evitando ventanas emergentes redundantes.",
      },
    ],
    rightsTitle: "9. Derechos del titular (LGPD)",
    rights: [
      {
        heading: "Sus derechos",
        body: "En los términos de la LGPD, usted tiene derecho a:",
        items: [
          "Confirmar la existencia del tratamiento de sus datos",
          "Acceder a sus datos personales recopilados",
          "Corregir datos incompletos, inexatos o desactualizados",
          "Solicitar la eliminación de sus datos (con excepción de aquellos cuya retención sea obligatoria para cumplir con fines de seguridad, auditoría y garantía de la integridad de la votación)",
          "Solicitar información sobre las entidades con las que compartimos datos",
        ],
      },
      {
        heading: "Cómo ejercer",
        body: "Envíe su solicitud a amazon.hacking@cesupa.br identificándose con el correo electrónico usado en el inicio de sesión. Responderemos en un plazo de 15 días hábiles.",
      },
    ],
    contactTitle: "10. Contacto",
    contact:
      "Para dudas sobre esta política o sobre el tratamiento de sus datos personales, contáctenos en amazon.hacking@cesupa.br.",
  },
} as const;

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = setRequestLocale(locale);
  const c = content[resolved];

  return (
    <>
      <Header locale={resolved} />
      <main className="bg-primary-400 pt-40 pb-0 text-white">
        <Container size="tight" className="pb-24">
          <p className="text-xs tracking-[0.18em] uppercase text-white/70">
            {c.updated}: {lastUpdated}
          </p>
          <h1 className="mt-6 text-5xl leading-[1.05] font-bold md:text-6xl">
            {c.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/80">
            {c.intro}
          </p>
          <p className="mt-4 text-sm text-white/60">
            <strong className="text-white/80">{c.controllerLabel}:</strong>{" "}
            {c.controller}
          </p>
        </Container>
      </main>

      <section className="bg-white py-20 md:py-28">
        <Container size="tight" className="space-y-16">
          {c.sections.map((section) => (
            <article key={section.heading}>
              <h2 className="text-2xl font-bold text-primary-100 md:text-3xl">
                {section.heading}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-neutrals-600 md:text-lg">
                {section.body}
              </p>
              {section.items && (
                <ul className="mt-4 space-y-2 pl-5">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="list-disc text-base leading-relaxed text-neutrals-500 md:text-lg marker:text-primary-100"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}

          <article>
            <h2 className="text-2xl font-bold text-primary-100 md:text-3xl">
              {c.tableTitle}
            </h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm md:text-base">
                <thead>
                  <tr className="border-b-2 border-primary-100/20">
                    {c.tableHeaders.map((h) => (
                      <th
                        key={h}
                        className="px-3 py-3 font-bold text-primary-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.tableRows.map((row) => (
                    <tr
                      key={row.data}
                      className="border-b border-neutrals-200"
                    >
                      <td className="px-3 py-3 font-medium text-neutrals-600">
                        {row.data}
                      </td>
                      <td className="px-3 py-3 text-neutrals-500">
                        {row.purpose}
                      </td>
                      <td className="px-3 py-3 text-neutrals-500">
                        {row.retention}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article>
            <h2 className="text-2xl font-bold text-primary-100 md:text-3xl">
              {c.thirdPartyTitle}
            </h2>
            <div className="mt-6 space-y-6">
              {c.thirdParties.map((tp) => (
                <div key={tp.heading}>
                  <h3 className="text-lg font-bold text-primary-300">
                    {tp.heading}
                  </h3>
                  <p className="mt-1 text-base leading-relaxed text-neutrals-500">
                    {tp.body}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article>
            <h2 className="text-2xl font-bold text-primary-100 md:text-3xl">
              {c.cookieTitle}
            </h2>
            <div className="mt-6 space-y-6">
              {c.cookies.map((cookie) => (
                <div key={cookie.heading}>
                  <h3 className="text-lg font-bold text-primary-300">
                    <code className="rounded bg-neutrals-200/60 px-2 py-0.5 text-[0.9em]">
                      {cookie.heading}
                    </code>
                  </h3>
                  <p className="mt-1 text-base leading-relaxed text-neutrals-500">
                    {cookie.body}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article>
            <h2 className="text-2xl font-bold text-primary-100 md:text-3xl">
              {c.rightsTitle}
            </h2>
            <div className="mt-6 space-y-6">
              {c.rights.map((right) => (
                <div key={right.heading}>
                  <h3 className="text-lg font-bold text-primary-300">
                    {right.heading}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-neutrals-500">
                    {right.body}
                  </p>
                  {right.items && (
                    <ul className="mt-3 space-y-2 pl-5">
                      {right.items.map((item) => (
                        <li
                          key={item}
                          className="list-disc text-base leading-relaxed text-neutrals-500 marker:text-primary-100"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </article>

          <article>
            <h2 className="text-2xl font-bold text-primary-100 md:text-3xl">
              {c.contactTitle}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-neutrals-600 md:text-lg">
              {c.contact}
            </p>
          </article>
        </Container>
      </section>

      <Footer />
    </>
  );
}