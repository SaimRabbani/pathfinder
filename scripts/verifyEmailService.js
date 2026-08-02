const assert = require('assert');

const {
  BREVO_TRANSACTIONAL_EMAIL_URL,
  sendPasswordResetEmail
} = require('../server/utils/email');

async function main() {
  const originalFetch = global.fetch;
  const originalEnvironment = {
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
    BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME
  };
  let capturedRequest;

  process.env.BREVO_API_KEY = 'test-brevo-api-key';
  process.env.BREVO_SENDER_EMAIL = 'verified-sender@example.com';
  process.env.BREVO_SENDER_NAME = 'PathFinder Test';

  global.fetch = async (url, options) => {
    capturedRequest = { url, options };

    return new Response(JSON.stringify({ messageId: '<test-message-id@brevo>' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    const result = await sendPasswordResetEmail(
      'student@example.com',
      'Student <Test>',
      'http://localhost:5173/reset-password/test-token'
    );
    const payload = JSON.parse(capturedRequest.options.body);

    assert.strictEqual(capturedRequest.url, BREVO_TRANSACTIONAL_EMAIL_URL);
    assert.strictEqual(capturedRequest.options.method, 'POST');
    assert.strictEqual(capturedRequest.options.headers['api-key'], 'test-brevo-api-key');
    assert.strictEqual(payload.sender.email, 'verified-sender@example.com');
    assert.strictEqual(payload.to[0].email, 'student@example.com');
    assert.strictEqual(payload.subject, 'PathFinder password reset');
    assert(payload.htmlContent.includes('Student &lt;Test&gt;'));
    assert(payload.htmlContent.includes('reset-password/test-token'));
    assert.strictEqual(result.messageId, '<test-message-id@brevo>');

    console.log('Brevo email service verification PASSED!');
  } finally {
    global.fetch = originalFetch;

    Object.entries(originalEnvironment).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
}

main().catch((error) => {
  console.error('Brevo email service verification failed:', error.message);
  process.exit(1);
});
