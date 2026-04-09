import nodemailer from 'nodemailer';

export interface SendEmailContent {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonLabel?: string;
  buttonUrl?: string;
}

export interface SendEmailProps {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  content?: SendEmailContent;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  content = {},
}: SendEmailProps) {
  const { title, subtitle, description, buttonLabel, buttonUrl } = content;

  // Build the email HTML template with inline conditions for each section.
  const emailHtml =
    html ??
    `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 20px 10px; background-color: #f6f6f6; font-family: Arial, sans-serif; color: #333;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f6f6f6;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="5" style="background-color: #ffffff;">
                  <!-- Header -->
                  <tr>
                    <td align="center" style="background-color: #ffffff; color: #333; padding: 20px; text-align: center;">
                      <h1 style="margin: 0; font-size: 20px;">AI Dev Brain</h1>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 20px; color: #333;">
                      ${title ? `<h2 style="margin-top: 0; font-size: 20px;">${title}</h2>` : ''}
                      ${subtitle ? `<p style="margin: 10px 0; font-size: 16px;">${subtitle}</p>` : ''}
                      ${
                        buttonLabel && buttonUrl
                          ? `
                        <p style="text-align: center; margin: 30px 0;">
                          <a href="${buttonUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 9px;">
                            ${buttonLabel}
                          </a>
                        </p>`
                          : ''
                      }
                      ${description ? `<p style="margin: 20px 0; font-size: 16px;">${description}</p>` : ''}
                      <p style="margin: 10px 0; font-size: 16px;">
                        Thank you,<br />
                        AI Dev Brain Team
                      </p>
                    </td>
                  </tr>
                  <!-- Footer (Optional) -->
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`;

  const port = Number(process.env.SMTP_PORT) || 465;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `${process.env.SMTP_SENDER} <${process.env.SMTP_FROM}>`,
    to,
    subject,
    text,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email: ${error}`);
  }
}
