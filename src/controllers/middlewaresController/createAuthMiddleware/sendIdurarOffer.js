const { afterRegistrationSuccess } = require('@/emailTemplate/emailVerfication');
const { Resend } = require('resend');

/**
 * Sends a welcome email after successful registration.
 * @param {Object} params
 * @param {string} params.email - Recipient email
 * @param {string} params.name  - Recipient name
 */
const sendWelcomeEmail = async ({ email, name }) => {
  try {
    const resend = new Resend(process.env.RESEND_API);

    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || 'no-reply@coffewithcorporates.com',
      to: email,
      subject: 'Welcome to Coffee With Corporates!',
      html: afterRegistrationSuccess({ name }),
    });

    if (error) {
      console.error('[sendWelcomeEmail] Email error:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[sendWelcomeEmail] Unexpected error:', err.message);
    return null;
  }
};

module.exports = sendWelcomeEmail;
