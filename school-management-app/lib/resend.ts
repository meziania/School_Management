import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY non configurée — emails désactivés')
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = 'EcoleConnect <noreply@ecoleconnect.fr>'

/**
 * Email d'invitation parent
 */
export async function sendParentInvitation({
  to,
  parentName,
  schoolName,
  loginUrl,
}: {
  to: string
  parentName: string
  schoolName: string
  loginUrl: string
}) {
  if (!resend) return

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Invitation à rejoindre ${schoolName} sur EcoleConnect`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Bienvenue sur EcoleConnect !</h1>
        <p>Bonjour ${parentName},</p>
        <p><strong>${schoolName}</strong> vous invite à rejoindre EcoleConnect pour suivre la scolarité de vos enfants.</p>
        <p>Vous aurez accès à :</p>
        <ul>
          <li>✅ Les présences quotidiennes</li>
          <li>📊 Les notes et moyennes</li>
          <li>📢 Les annonces de l'école</li>
          <li>💬 La messagerie avec la direction</li>
        </ul>
        <a href="${loginUrl}"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Accéder à mon espace →
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          Si vous n'attendiez pas cet email, ignorez-le.
        </p>
      </div>
    `,
  })
}

/**
 * Email d'alerte absence
 */
export async function sendAbsenceAlert({
  to,
  parentName,
  studentName,
  date,
  dashboardUrl,
}: {
  to: string
  parentName: string
  studentName: string
  date: string
  dashboardUrl: string
}) {
  if (!resend) return

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Absence signalée — ${studentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Absence signalée</h2>
        <p>Bonjour ${parentName},</p>
        <p>Une absence a été enregistrée pour <strong>${studentName}</strong> le <strong>${date}</strong>.</p>
        <p>Vous pouvez consulter les détails et soumettre un justificatif depuis votre espace parent.</p>
        <a href="${dashboardUrl}"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; font-weight: bold;">
          Voir le détail →
        </a>
      </div>
    `,
  })
}
