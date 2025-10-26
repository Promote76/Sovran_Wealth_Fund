const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.adminEmails = process.env.ADMIN_EMAIL_WHITELIST?.split(',') || [];
    this.fromEmail = process.env.NOTIFICATION_FROM_EMAIL || 'iela@axiom.com';
    this.setupTransporter();
  }

  setupTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
      console.log('✅ Email notification service configured');
    } else {
      console.log('ℹ️  Email notifications disabled (SMTP not configured)');
    }
  }

  async sendNewDealNotification(deal) {
    if (!this.transporter) {
      console.log('⚠️  Email notifications disabled: SMTP not configured');
      return false;
    }

    if (this.adminEmails.length === 0) {
      console.log('⚠️  Email notifications disabled: No admin emails configured');
      return false;
    }

    try {
      await this.transporter.verify();
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      return false;
    }

    try {
      const subject = `🏠 New IELA Deal: ${deal.parsed?.address || 'Property'}`;
      const html = this.generateDealEmail(deal);

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: this.adminEmails,
        subject,
        html
      });

      console.log(`✅ Sent deal notification to ${this.adminEmails.length} admins`);
      return true;
    } catch (error) {
      console.error('Failed to send deal notification:', error.message);
      return false;
    }
  }

  generateDealEmail(deal) {
    const asking = this.formatCurrency(deal.parsed?.asking);
    const arv = this.formatCurrency(deal.parsed?.arv);
    const address = deal.parsed?.address || 'No address';
    const city = deal.parsed?.city || '';
    const state = deal.parsed?.state || '';
    const zip = deal.parsed?.zip || '';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
    .property-card { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .price { font-size: 24px; font-weight: bold; color: #2d3748; }
    .label { font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    .footer { text-align: center; padding: 15px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🏠 New IELA Deal Ingested</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Deal ID: ${deal.id}</p>
    </div>
    
    <div class="content">
      <div class="property-card">
        <h2 style="margin-top: 0;">${address}</h2>
        <p style="color: #718096; margin: 5px 0 15px 0;">${city}, ${state} ${zip}</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
          <div>
            <div class="label">Asking Price</div>
            <div class="price" style="color: #48bb78;">${asking}</div>
          </div>
          <div>
            <div class="label">ARV</div>
            <div class="price" style="color: #4299e1;">${arv}</div>
          </div>
        </div>

        ${deal.parsed?.contactName ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <div class="label">Contact</div>
          <p style="margin: 5px 0;"><strong>${deal.parsed.contactName}</strong></p>
          <p style="margin: 5px 0;">${deal.parsed.contactPhone || ''}</p>
        </div>
        ` : ''}

        ${deal.parsed?.url ? `
        <div style="margin-top: 15px;">
          <a href="${deal.parsed.url}" class="button">View Listing →</a>
        </div>
        ` : ''}
      </div>

      <div style="margin-top: 20px; text-align: center;">
        <a href="${process.env.REPLIT_DOMAIN || 'http://localhost:5000'}/admin-iela.html" class="button">
          View in Dashboard →
        </a>
      </div>
    </div>

    <div class="footer">
      <p>AXIOM IELA Pipeline | Automated Deal Notification</p>
      <p style="margin: 5px 0;">Source: ${deal.source} | Status: ${deal.status}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  formatCurrency(value) {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  }
}

module.exports = new NotificationService();
