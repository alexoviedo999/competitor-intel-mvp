import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWeeklyReport(
  email: string,
  reportContent: string,
  weekOf: string
) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto;">
      <h1 style="color: #1f2937; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
        🕵️ Competitor Intelligence Report
      </h1>
      <p style="color: #6b7280; margin-bottom: 20px;">Week of ${weekOf}</p>
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
        ${reportContent.replace(/\n/g, '<br>')}
      </div>
      <p style="margin-top: 20px; color: #9ca3af; font-size: 12px;">
        Powered by Competitor Intel MVP
      </p>
    </div>
  `;

  return resend.emails.send({
    from: process.env.RESEND_FROM || 'intel@yourdomain.com',
    to: email,
    subject: `Weekly Intel Report - ${weekOf}`,
    html,
  });
}

export async function sendAlert(
  email: string,
  competitorName: string,
  alertType: string,
  alertTitle: string,
  alertDescription: string
) {
  const severityColors = {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  const color = severityColors[alertType] || severityColors.info;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${color}; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">🚨 Alert: ${competitorName}</h2>
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <h3 style="color: #1f2937; margin-top: 0;">${alertTitle}</h3>
        <p style="color: #4b5563;">${alertDescription}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="display: inline-block; margin-top: 15px; background: #4f46e5; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View Dashboard
        </a>
      </div>
    </div>
  `;

  return resend.emails.send({
    from: process.env.RESEND_FROM || 'alerts@yourdomain.com',
    to: email,
    subject: `[${alertType.toUpperCase()}] ${competitorName}: ${alertTitle}`,
    html,
  });
}
