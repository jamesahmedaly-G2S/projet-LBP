/**
 * STU-VEILLE-04 — notification e-mail + SMS après détection. Pauline
 * (CR 10/09) : "priorité fonctionnelle numéro un du projet", circuit
 * attendu de bout en bout incluant explicitement l'envoi d'une
 * notification. Contrat Brevo (endpoints, en-têtes, forme du corps) repris
 * mot pour mot de l'annexe 5.1/5.3 du cahier des charges réel
 * (`LBP_Cahier_des_charges_et_technique-3.pdf`) : `MAIL_TO`/`SMS_TO`
 * correspondent aux vraies coordonnées de Pauline citées dans ce document.
 *
 * Gardé derrière `BREVO_API_KEY` — absente pour ce prototype, jamais
 * simulé : `status: "not_configured"` explicite plutôt qu'un faux succès.
 */

export interface NewMonitoringItem {
  source: string;
  title: string;
  link: string | null;
}

export interface NotificationResult {
  status: "ok" | "not_configured" | "error";
  message?: string;
}

export async function sendVeilleNotification(
  items: NewMonitoringItem[],
): Promise<NotificationResult> {
  if (items.length === 0) {
    return { status: "ok", message: "Rien de nouveau, aucune notification à envoyer." };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return {
      status: "not_configured",
      message:
        "BREVO_API_KEY non configurée — notification e-mail/SMS non envoyée. " +
        `${items.length} nouvelle(s) entrée(s) restent visibles dans /veille.`,
    };
  }

  const mailTo = process.env.MAIL_TO || "pauline.letourneur@groupe-2s.com";
  const mailFrom = process.env.MAIL_FROM || "veille@groupe-2s.com";
  const mailFromName = process.env.MAIL_FROM_NAME || "LBP — Veille réglementaire";
  const smsTo = process.env.SMS_TO;
  const smsSender = process.env.SMS_SENDER || "G2S";

  const emailResult = await sendEmail(apiKey, {
    to: mailTo,
    from: mailFrom,
    fromName: mailFromName,
    subject: `Veille réglementaire — ${items.length} nouveau(x) texte(s)`,
    html: emailTemplate(items),
  });

  if (!emailResult.ok) {
    return { status: "error", message: `Échec e-mail Brevo : ${emailResult.error}` };
  }

  if (smsTo) {
    const smsResult = await sendSms(apiKey, {
      to: smsTo,
      sender: smsSender,
      text: `G2S — Veille RH/Paie : ${items.length} nouveau(x) texte(s) détecté(s). Détail dans le LBP et par e-mail.`,
    });
    if (!smsResult.ok) {
      return { status: "error", message: `E-mail envoyé, échec SMS Brevo : ${smsResult.error}` };
    }
  }

  return {
    status: "ok",
    message: `Notification envoyée pour ${items.length} nouvelle(s) entrée(s).`,
  };
}

async function sendEmail(
  apiKey: string,
  params: { to: string; from: string; fromName: string; subject: string; html: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "content-type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        sender: { email: params.from, name: params.fromName },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "erreur réseau" };
  }
}

async function sendSms(
  apiKey: string,
  params: { to: string; sender: string; text: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: { "content-type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        type: "transactional",
        unicodeEnabled: true,
        sender: params.sender,
        recipient: params.to,
        content: params.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "erreur réseau" };
  }
}

function emailTemplate(items: NewMonitoringItem[]): string {
  const rows = items
    .map(
      (item) => `<tr><td style="padding:14px 0;border-bottom:1px solid #E7E3D9">
        <div style="font-size:11px;color:#6F8657;font-weight:700;text-transform:uppercase">${escapeHtml(item.source)}</div>
        <div style="font-size:16px;font-weight:800;color:#181818;margin:4px 0">${escapeHtml(item.title)}</div>
        ${item.link ? `<a href="${escapeHtml(item.link)}" style="color:#C24A3A;font-weight:700;font-size:13px">Voir le texte officiel ↗</a>` : ""}
      </td></tr>`,
    )
    .join("");

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:auto">
    <h2 style="color:#181818">Veille réglementaire</h2>
    <p style="color:#78766E">${items.length} nouveau(x) texte(s) susceptible(s) d'impacter la paie et la RH.</p>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
    <p style="color:#78766E;font-size:12px;margin-top:20px">Retrouvez le détail dans le Studio LBP, onglet « Veille & mises à jour ».</p>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
