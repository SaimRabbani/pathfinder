const BREVO_TRANSACTIONAL_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return entities[character];
  });
}

function getBrevoConfig() {
  const apiKey = String(process.env.BREVO_API_KEY || '').trim();
  const senderEmail = String(process.env.BREVO_SENDER_EMAIL || '').trim();
  const senderName = String(process.env.BREVO_SENDER_NAME || 'PathFinder').trim();

  if (!apiKey || !senderEmail) {
    throw new Error('Brevo configuration is incomplete. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.');
  }

  return { apiKey, senderEmail, senderName: senderName || 'PathFinder' };
}

async function readBrevoError(response) {
  const body = await response.text();

  try {
    const parsed = JSON.parse(body);
    return parsed.message || parsed.code || body;
  } catch (error) {
    return body;
  }
}

async function sendPasswordResetEmail(to, name, resetUrl) {
  const { apiKey, senderEmail, senderName } = getBrevoConfig();
  const safeName = escapeHtml(name);
  const safeResetUrl = escapeHtml(resetUrl);
  const subject = 'PathFinder password reset';
  const textContent = `Hello ${name},\n\nUse the link below to reset your password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const htmlContent = [
    `<p>Hello ${safeName},</p>`,
    '<p>Use the link below to reset your password:</p>',
    `<p><a href="${safeResetUrl}">${safeResetUrl}</a></p>`,
    '<p>If you did not request this, you can ignore this email.</p>'
  ].join('');

  console.log(`[email] Brevo API key loaded: ${apiKey.slice(0, 10)}...`);

  const response = await fetch(BREVO_TRANSACTIONAL_EMAIL_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: senderName
      },
      to: [
        {
          email: to,
          name
        }
      ],
      subject,
      textContent,
      htmlContent,
      tags: ['password-reset']
    })
  });

  if (!response.ok) {
    const errorMessage = await readBrevoError(response);
    throw new Error(`Brevo email API returned ${response.status}: ${String(errorMessage).slice(0, 300)}`);
  }

  return response.json();
}

module.exports = {
  BREVO_TRANSACTIONAL_EMAIL_URL,
  sendPasswordResetEmail
};
