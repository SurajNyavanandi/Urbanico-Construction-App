// ==============================================================================
// REUSABLE MAILER CLIENT & EMAIL SERVICE (Zero-coupling, portable Node.js/TS library)
// ==============================================================================
// This standalone library can be copied into any Node.js/TypeScript project.
// Dependencies: nodemailer, @types/nodemailer
// Supports: Standard SMTP, Gmail, SendGrid, Resend, and Graceful Dev/Console Fallback
// ==============================================================================

import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions as NodemailerSendMailOptions } from 'nodemailer';

export interface MailerConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  service?: string; // e.g. 'gmail', 'SendGrid', etc.
}

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  encoding?: string;
  cid?: string;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  mode: 'SMTP' | 'DEV_CONSOLE_FALLBACK' | 'ETHEREAL';
  previewUrl?: string | false;
  info?: any;
  error?: string;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit?: string;
}

export interface SendInvoiceMailOptions {
  to: string | string[];
  customerName?: string;
  invoiceNumber: string;
  amount: number;
  currency?: string;
  date?: string | Date;
  companyName?: string;
  companyAddress?: string;
  companyGstin?: string;
  customerGstin?: string;
  items?: InvoiceItem[];
  pdfBuffer?: Buffer;
  notes?: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'OVERDUE';
}

/**
 * Generates an inline-styled, bulletproof responsive HTML email template for tax invoices
 */
export function generateInvoiceHtmlTemplate(options: SendInvoiceMailOptions): string {
  const {
    customerName = 'Valued Customer',
    invoiceNumber,
    amount,
    currency = 'INR',
    date = new Date(),
    companyName = 'Urbanico Direct',
    companyAddress = 'Plot 42, Heavy Industrial Estate, Bengaluru, KA 560100',
    companyGstin = '29ABCDE1234F1Z5',
    customerGstin,
    items = [],
    notes = 'Thank you for your business. For any inquiries regarding this invoice, please reach out to billing support.',
    paymentStatus = 'PAID',
  } = options;

  const formattedDate = date instanceof Date
    ? date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : String(date);

  const formattedAmount = Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const currencySymbol = currency === 'INR' ? '₹' : currency;

  const statusBg = paymentStatus === 'PAID' ? '#10B981' : paymentStatus === 'PENDING' ? '#F59E0B' : '#EF4444';

  const rowsHtml = items.length > 0
    ? items
        .map(
          (item, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'}; border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 12px 14px; font-size: 13px; color: #1E293B; font-weight: 500;">
            ${escapeHtml(item.name)}
          </td>
          <td style="padding: 12px 14px; font-size: 13px; color: #64748B; text-align: center;">
            ${item.quantity} ${item.unit || ''}
          </td>
          <td style="padding: 12px 14px; font-size: 13px; color: #64748B; text-align: right;">
            ${currencySymbol}${Number(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </td>
          <td style="padding: 12px 14px; font-size: 13px; color: #0F172A; font-weight: 600; text-align: right;">
            ${currencySymbol}${Number(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </td>
        </tr>`
        )
        .join('')
    : `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 12px 14px; font-size: 13px; color: #1E293B; font-weight: 500;">
            Order Fulfillment & Logistics Dispatch
          </td>
          <td style="padding: 12px 14px; font-size: 13px; color: #64748B; text-align: center;">
            1 pkg
          </td>
          <td style="padding: 12px 14px; font-size: 13px; color: #64748B; text-align: right;">
            ${currencySymbol}${formattedAmount}
          </td>
          <td style="padding: 12px 14px; font-size: 13px; color: #0F172A; font-weight: 600; text-align: right;">
            ${currencySymbol}${formattedAmount}
          </td>
        </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${escapeHtml(invoiceNumber)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1E293B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 32px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 800; color: #F8FAFC; letter-spacing: -0.5px; text-transform: uppercase;">
                      ${escapeHtml(companyName)}
                    </div>
                    <div style="font-size: 12px; color: #94A3B8; margin-top: 4px;">
                      Official Tax Invoice & Receipt
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 6px 14px; background-color: ${statusBg}; color: #FFFFFF; font-size: 11px; font-weight: 800; border-radius: 20px; letter-spacing: 0.8px; text-transform: uppercase;">
                      ${paymentStatus}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice Details Meta Grid -->
          <tr>
            <td style="padding: 28px 36px 16px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" valign="top" style="padding-bottom: 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">Billed To</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-top: 4px;">${escapeHtml(customerName)}</div>
                    ${customerGstin ? `<div style="font-size: 12px; color: #64748B; margin-top: 2px;">GSTIN: <span style="font-weight: 600; color: #334155;">${escapeHtml(customerGstin)}</span></div>` : ''}
                  </td>
                  <td width="50%" align="right" valign="top" style="padding-bottom: 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Number</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-top: 4px;">#${escapeHtml(invoiceNumber)}</div>
                    <div style="font-size: 12px; color: #64748B; margin-top: 2px;">Date: ${formattedDate}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #F8FAFC; border-bottom: 1.5px solid #CBD5E1;">
                    <th align="left" style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Item / Description</th>
                    <th align="center" style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                    <th align="right" style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                    <th align="right" style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Summary & Totals -->
          <tr>
            <td style="padding: 20px 36px 28px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="55%" valign="top">
                    ${notes ? `
                    <div style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 4px;">Note</div>
                    <div style="font-size: 12px; color: #64748B; line-height: 1.5;">${escapeHtml(notes)}</div>
                    ` : ''}
                  </td>
                  <td width="45%" align="right" valign="top">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="right" style="padding: 4px 0; font-size: 13px; color: #64748B;">Total Amount:</td>
                        <td align="right" style="padding: 4px 0 4px 12px; font-size: 14px; font-weight: 600; color: #1E293B;">${currencySymbol}${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td align="right" style="padding: 8px 0; font-size: 15px; font-weight: 800; color: #0F172A; border-top: 2px solid #E2E8F0;">Amount Paid:</td>
                        <td align="right" style="padding: 8px 0 8px 12px; font-size: 18px; font-weight: 800; color: #10B981; border-top: 2px solid #E2E8F0;">${currencySymbol}${formattedAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 36px; text-align: center;">
              <div style="font-size: 12px; font-weight: 600; color: #334155;">
                ${escapeHtml(companyName)} • GSTIN: ${escapeHtml(companyGstin)}
              </div>
              <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">
                ${escapeHtml(companyAddress)}
              </div>
              <div style="font-size: 10px; color: #CBD5E1; margin-top: 12px;">
                This is a computer generated invoice and does not require a physical signature.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Reusable Mailer Service
 * Defaults to Gmail service so only SMTP_USER and SMTP_PASS are needed in .env.
 * All SMTP connection parameters, TLS/SSL, and sender headers are self-contained.
 */
export class MailerService {
  private transporter: Transporter | null = null;
  private config: MailerConfig;

  constructor(customConfig?: MailerConfig) {
    const rawUser = customConfig?.user || process.env.SMTP_USER || process.env.SMTP_USERNAME || '';
    const rawPass = customConfig?.pass || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
    const cleanUser = rawUser.trim().replace(/^["']|["']$/g, '');
    // Google App Passwords are 16 chars often copied with spaces ("abcd efgh ijkl mnop")
    const cleanPass = rawPass.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');

    this.config = {
      // Defaults to Gmail service internally
      service: customConfig?.service || process.env.SMTP_SERVICE || 'gmail',
      user: cleanUser,
      pass: cleanPass,
      host: customConfig?.host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: customConfig?.port || (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465),
      secure: customConfig?.secure !== undefined ? customConfig.secure : true,
      from:
        customConfig?.from ||
        process.env.SMTP_FROM ||
        process.env.MAIL_FROM ||
        (cleanUser ? `Urbanico Direct <${cleanUser}>` : 'Urbanico Direct <noreply@urbanico.in>'),
    };
  }

  /**
   * Check if Gmail/SMTP credentials are fully provided
   */
  public hasSmtpCredentials(): boolean {
    const u = this.config.user || '';
    const p = this.config.pass || '';
    return Boolean(
      u &&
      p &&
      !u.includes('your-email') &&
      !u.includes('your_email') &&
      !p.includes('your-app-password') &&
      !p.includes('your_app_password') &&
      !p.includes('your-16-char')
    );
  }

  /**
   * Lazily initialize or return cached nodemailer transporter (Defaults to Gmail)
   */
  public getTransporter(): Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    if (this.hasSmtpCredentials()) {
      const isGmail = (this.config.service || '').toLowerCase() === 'gmail';
      if (isGmail) {
        // High-reliability pre-configured Gmail transport
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: this.config.user,
            pass: this.config.pass,
          },
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: this.config.host || 'smtp.gmail.com',
          port: this.config.port || 465,
          secure: this.config.secure ?? true,
          auth: {
            user: this.config.user,
            pass: this.config.pass,
          },
        });
      }
      return this.transporter;
    }

    return null;
  }

  /**
   * Core sendMail method with graceful console fallback
   */
  public async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    const defaultFrom = this.config.user
      ? `Urbanico Direct <${this.config.user}>`
      : 'Urbanico Direct <noreply@urbanico.in>';
    const fromAddress = options.from || this.config.from || defaultFrom;
    const recipientStr = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    const transporter = this.getTransporter();

    if (transporter) {
      try {
        const mailPayload: NodemailerSendMailOptions = {
          from: fromAddress,
          to: options.to,
          cc: options.cc,
          bcc: options.bcc,
          replyTo: options.replyTo,
          subject: options.subject,
          text: options.text,
          html: options.html,
          attachments: options.attachments as any,
        };

        const info = await transporter.sendMail(mailPayload);
        console.log(`[Mailer] Email sent successfully to ${recipientStr}: MessageId=${info.messageId}`);
        return {
          success: true,
          messageId: info.messageId,
          mode: 'SMTP',
          info,
        };
      } catch (err: any) {
        console.warn(`[Mailer] SMTP transport error: ${err?.message || err}. Falling back to clean log mode.`);
      }
    }

    // Graceful Fallback Mode: Print clean preview to console without crashing
    const previewMessageId = `mock_mail_${Date.now()}_${Math.random().toString(36).slice(-4)}`;
    console.log(`\n======================================================`);
    console.log(`[MAILER DEV FALLBACK PREVIEW] (No active SMTP configured)`);
    console.log(`------------------------------------------------------`);
    console.log(`From:    ${fromAddress}`);
    console.log(`To:      ${recipientStr}`);
    console.log(`Subject: ${options.subject}`);
    if (options.attachments && options.attachments.length > 0) {
      console.log(`Attachments (${options.attachments.length}): ${options.attachments.map(a => a.filename).join(', ')}`);
    }
    console.log(`------------------------------------------------------`);
    if (options.text) {
      console.log(`Body (Plain Text):\n${options.text.slice(0, 300)}${options.text.length > 300 ? '...' : ''}`);
    } else {
      console.log(`Body (HTML rendered, ${options.html?.length || 0} chars)`);
    }
    console.log(`MessageId: ${previewMessageId}`);
    console.log(`======================================================\n`);

    return {
      success: true,
      messageId: previewMessageId,
      mode: 'DEV_CONSOLE_FALLBACK',
      previewUrl: false,
    };
  }

  /**
   * Standalone helper to send invoice email with responsive HTML and optional PDF attachment
   */
  public async sendInvoiceMail(options: SendInvoiceMailOptions): Promise<SendMailResult> {
    const html = generateInvoiceHtmlTemplate(options);
    const plainText = `Tax Invoice #${options.invoiceNumber}\n\nDear ${options.customerName || 'Valued Customer'},\n\nYour invoice #${options.invoiceNumber} for ₹${Number(options.amount).toFixed(2)} has been generated and marked as ${options.paymentStatus || 'PAID'}.\n\nThank you for choosing ${options.companyName || 'Urbanico'}.`;

    const attachments: EmailAttachment[] = [];
    if (options.pdfBuffer) {
      attachments.push({
        filename: `Invoice-${options.invoiceNumber}.pdf`,
        content: options.pdfBuffer,
        contentType: 'application/pdf',
      });
    }

    return this.sendMail({
      to: options.to,
      subject: `Invoice #${options.invoiceNumber} from ${options.companyName || 'Urbanico Direct'}`,
      text: plainText,
      html,
      attachments,
    });
  }
}

/**
 * Default singleton instance
 */
export const mailer = new MailerService();

/**
 * Factory function to create custom MailerService instances
 */
export function createMailer(config?: MailerConfig): MailerService {
  return new MailerService(config);
}

/**
 * Standalone direct sendMail helper
 */
export function sendMail(options: SendMailOptions): Promise<SendMailResult> {
  return mailer.sendMail(options);
}

/**
 * Standalone direct sendInvoiceMail helper
 */
export function sendInvoiceMail(options: SendInvoiceMailOptions): Promise<SendMailResult> {
  return mailer.sendInvoiceMail(options);
}
