import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[mail] RESEND_API_KEY not configured.');
    return;
  }

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'The Catalyst <onboarding@resend.dev>',
    to,
    subject,
    html,
  });

  if (error) {
    console.error('[Resend]', error);
    throw new Error(error.message);
  }
}

export async function sendSubmissionReceivedEmail(submission) {
  await sendMail({
    to: submission.email,
    subject: `Submission Received — Tracking ID ${submission.trackingId}`,
    html: `
      <p>Dear ${submission.authorName},</p>
      <p>Thank you for submitting your paper <strong>"${submission.paperTitle}"</strong> to The Catalyst.</p>
      <p>Your tracking ID is: <strong>${submission.trackingId}</strong></p>
      <p>To complete your submission, please finish the publication fee payment. Once payment is confirmed, our editorial team will begin the review process.</p>
      <p>Best regards,<br/>The Catalyst Editorial Team</p>
    `,
  });
}

export async function sendPaymentSuccessEmail(submission) {
  await sendMail({
    to: submission.email,
    subject: `Payment Confirmed — ${submission.trackingId}`,
    html: `
      <p>Dear ${submission.authorName},</p>
      <p>We've received your publication fee payment for <strong>"${submission.paperTitle}"</strong>.</p>
      <p>Tracking ID: <strong>${submission.trackingId}</strong></p>
      <p>Payment ID: ${submission.paymentId}</p>
      <p>Your submission is now complete and will proceed to peer review. We'll notify you of any updates via email.</p>
      <p>Best regards,<br/>The Catalyst Editorial Team</p>
    `,
  });
}

export async function sendPaymentUnderVerificationEmail(submission, payment) {
  await sendMail({
    to: submission.email,
    subject: `Payment Received — Verification Pending (${submission.trackingId})`,
    html: `
      <p>Dear ${submission.authorName},</p>
      <p>We've recorded your ${payment.method.toUpperCase()} payment for <strong>"${submission.paperTitle}"</strong> and it is now pending manual verification by our team.</p>
      <p>Tracking ID: <strong>${submission.trackingId}</strong></p>
      ${
        payment.transactionId
          ? `<p>Reference / Transaction ID: ${payment.transactionId}</p>`
          : ''
      }
      <p>We'll confirm your payment shortly. You'll receive another email once it's verified.</p>
      <p>Best regards,<br/>The Catalyst Editorial Team</p>
    `,
  });
}

export async function sendSubmissionStatusEmail(submission) {
  const statusCopy = {
    accepted: {
      subject: 'Your Paper Has Been Accepted',
      body: `<p>We're pleased to inform you that your paper <strong>"${submission.paperTitle}"</strong> has been accepted for publication.</p>`,
    },
    rejected: {
      subject: 'Update on Your Submission',
      body: `<p>After careful review, we regret to inform you that your paper <strong>"${submission.paperTitle}"</strong> was not accepted for publication at this time.</p>`,
    },
    'revision-requested': {
      subject: 'Revisions Requested for Your Submission',
      body: `
        <p>Our editorial team has reviewed your paper <strong>"${submission.paperTitle}"</strong> and requests revisions before it can proceed.</p>
        ${
          submission.revisionNote
            ? `<p><strong>Editor's note:</strong> ${submission.revisionNote}</p>`
            : ''
        }
        <p>Please reply to this email with your revised manuscript.</p>
      `,
    },
  };

  const copy = statusCopy[submission.status];
  if (!copy) return;

  await sendMail({
    to: submission.email,
    subject: `${copy.subject} — ${submission.trackingId}`,
    html: `
      <p>Dear ${submission.authorName},</p>
      ${copy.body}
      <p>Tracking ID: <strong>${submission.trackingId}</strong></p>
      <p>Best regards,<br/>The Catalyst Editorial Team</p>
    `,
  });
}

export async function sendAdminNewSubmissionNotice(submission) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) return;

  await sendMail({
    to: adminEmail,
    subject: `New Submission: ${submission.paperTitle}`,
    html: `
      <p>A new paper has been submitted.</p>
      <ul>
        <li><strong>Tracking ID:</strong> ${submission.trackingId}</li>
        <li><strong>Author:</strong> ${submission.authorName} (${submission.email})</li>
        <li><strong>Title:</strong> ${submission.paperTitle}</li>
        <li><strong>Institution:</strong> ${submission.institution}, ${submission.country}</li>
      </ul>
      <p>Log in to the admin panel to review it.</p>
    `,
  });
}

export async function sendPaymentVerifiedEmail(submission, payment) {
  await sendMail({
    to: submission.email,
    subject: `Payment Verified — ${submission.trackingId}`,
    html: `
      <p>Dear ${submission.authorName},</p>
      <p>Your ${payment.method.toUpperCase()} payment for <strong>"${submission.paperTitle}"</strong> has been verified and confirmed.</p>
      <p>Tracking ID: <strong>${submission.trackingId}</strong></p>
      <p>Your submission is now complete and will proceed to peer review.</p>
      <p>Best regards,<br/>The Catalyst Editorial Team</p>
    `,
  });
}

export async function sendPaymentRejectedEmail(submission, payment) {
  await sendMail({
    to: submission.email,
    subject: `Payment Could Not Be Verified — ${submission.trackingId}`,
    html: `
      <p>Dear ${submission.authorName},</p>
      <p>We were unable to verify your ${payment.method.toUpperCase()} payment for <strong>"${submission.paperTitle}"</strong>.</p>
      <p>Tracking ID: <strong>${submission.trackingId}</strong></p>
      <p>Please contact us or retry your payment. Reply to this email if you believe this is an error.</p>
      <p>Best regards,<br/>The Catalyst Editorial Team</p>
    `,
  });
}

export async function sendContactFormEmail(message) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) return;

  await sendMail({
    to: adminEmail,
    subject: `New Contact Message: ${message.subject}`,
    html: `
      <p><strong>From:</strong> ${message.name} (${message.email})</p>
      <p><strong>Subject:</strong> ${message.subject}</p>
      <p>${message.message}</p>
    `,
  });
}