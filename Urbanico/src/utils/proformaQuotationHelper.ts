import { CartItem } from '../types';
import { getHSNCodeForMaterial, numberToWordsIndian } from './invoiceHelper';

export interface ProformaQuotationOptions {
  cartItems: CartItem[];
  subtotal: number;
  gstTax: number;
  freightCharge: number;
  freightVehicleName?: string;
  totalPayable: number;
  deliveryAddress: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerGstin?: string;
}

export function generateProformaQuotationHtml(options: ProformaQuotationOptions): { title: string; html: string } {
  const {
    cartItems,
    subtotal,
    gstTax,
    freightCharge,
    freightVehicleName = 'Standard Freight Logistics (Tipper/Truck)',
    totalPayable,
    deliveryAddress,
    customerName = 'Valued Builder / Contractor',
    customerPhone = '+91 98480 12345',
    customerEmail = 'orders@urbanico.in',
    customerGstin,
  } = options;

  const quoteId = `URB-PQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const validUntil = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const cgstAmount = 0;
  const sgstAmount = 0;
  const amountInWords = numberToWordsIndian(totalPayable);

  const itemsRowsHtml = cartItems
    .map((item, idx) => {
      const itemTotal = item.unitPrice * item.quantity;
      const taxable = itemTotal;
      const hsn = getHSNCodeForMaterial(item.itemName);

      return `
        <tr>
          <td style="text-align: center; color: #64748b; padding: 8px 6px;">${idx + 1}</td>
          <td style="padding: 8px 6px;">
            <div style="font-weight: 700; color: #0f172a;">${item.itemName}</div>
            <div style="font-size: 10px; color: #64748b;">${hsn.desc} • Industrial Quarry Direct</div>
          </td>
          <td style="text-align: center; font-family: monospace; font-size: 11px; padding: 8px 6px;">${hsn.code}</td>
          <td style="text-align: center; font-weight: 600; padding: 8px 6px;">${item.quantity} ${item.selectedOptionLabel || 'Units'}</td>
          <td style="text-align: right; padding: 8px 6px;">₹${item.unitPrice.toLocaleString('en-IN')}</td>
          <td style="text-align: right; font-weight: 600; padding: 8px 6px;">₹${taxable.toLocaleString('en-IN')}</td>
          <td style="text-align: right; font-size: 11px; padding: 8px 6px;">₹0 (0%)</td>
          <td style="text-align: right; font-size: 11px; padding: 8px 6px;">₹0 (0%)</td>
          <td style="text-align: right; font-weight: 700; color: #0f172a; padding: 8px 6px;">₹${itemTotal.toLocaleString('en-IN')}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Proforma_Quotation_${quoteId}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          font-size: 11.5px;
          line-height: 1.45;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .quotation-sheet {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #e2e8f0;
          padding: 24px;
          background: #ffffff;
        }
        .top-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 16px;
          margin-bottom: 16px;
        }
        .brand-title {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.5px;
          color: #0f172a;
          text-transform: uppercase;
        }
        .brand-sub {
          font-size: 10px;
          color: #475569;
          margin-top: 3px;
        }
        .doc-heading {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.8px;
          color: #1e3a8a;
          text-align: right;
          text-transform: uppercase;
        }
        .quote-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
          border-radius: 4px;
          margin-top: 4px;
          text-transform: uppercase;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 16px;
        }
        .meta-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          font-weight: 700;
        }
        .meta-val {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2px;
        }
        .parties-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .party-card {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          background: #ffffff;
        }
        .party-role {
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #1e40af;
          margin-bottom: 6px;
        }
        .party-name {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 3px;
        }
        .party-detail {
          font-size: 10.5px;
          color: #475569;
          line-height: 1.4;
        }
        table.items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          border: 1px solid #e2e8f0;
        }
        table.items-table th {
          background: #0f172a;
          color: #ffffff;
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 6px;
          border: 1px solid #1e293b;
        }
        table.items-table td {
          border-bottom: 1px solid #e2e8f0;
          border-right: 1px solid #f1f5f9;
        }
        table.items-table tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        .calc-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .words-box {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          background: #f8fafc;
        }
        .totals-table {
          width: 100%;
          border-collapse: collapse;
        }
        .totals-table td {
          padding: 5px 8px;
          font-size: 11px;
        }
        .grand-total-row td {
          font-size: 13px;
          font-weight: 900;
          border-top: 2px solid #0f172a;
          border-bottom: 2px solid #0f172a;
          color: #0f172a;
          padding-top: 8px;
          padding-bottom: 8px;
        }
        .footer-terms {
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-top: 12px;
        }
        .terms-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 4px;
          color: #0f172a;
        }
        .terms-list {
          font-size: 9.5px;
          color: #64748b;
          line-height: 1.4;
          padding-left: 14px;
        }
        .sign-box {
          text-align: right;
        }
        .sign-title {
          font-size: 10px;
          font-weight: 800;
          margin-top: 24px;
          color: #0f172a;
        }
        .sign-sub {
          font-size: 9px;
          color: #64748b;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            font-size: 10px !important;
          }
          .quotation-sheet {
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          table.items-table th, table.items-table td {
            padding: 5px 4px !important;
            font-size: 9.5px !important;
          }
        }
        @media (max-width: 600px) {
          .quotation-sheet {
            padding: 12px;
            overflow-x: auto;
          }
          .meta-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .parties-grid {
            grid-template-columns: 1fr;
          }
          .calc-grid {
            grid-template-columns: 1fr;
          }
          table.items-table {
            font-size: 10px;
            min-width: 540px;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background: #1e3a8a; color: #ffffff; padding: 12px 24px; text-align: center; font-size: 13px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
        <span>Official Proforma Quotation & Estimate generated from Urbanico Direct Supply</span>
        <button onclick="window.print()" style="background: #ffffff; color: #1e3a8a; border: none; padding: 6px 16px; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 12px;">Print / Save as PDF</button>
      </div>

      <div class="quotation-sheet">
        <div class="top-header">
          <div>
            <div class="brand-title">URBANICO TECHNOLOGIES PRIVATE LIMITED</div>
            <div class="brand-sub">Direct Quarry Aggregate, TMT Steel & Building Materials Distribution</div>
            <div class="brand-sub">Plot 42, Hardware Park, Hitec City, Hyderabad - 500081 | GSTIN: 36AAACU9812A1Z4</div>
            <div class="brand-sub">Support: +91 98480 22341 | Email: accounts@urbanico.in | Web: urbanico.in</div>
          </div>
          <div style="text-align: right;">
            <div class="doc-heading">PROFORMA QUOTATION</div>
            <div class="quote-badge">PRE-DISPATCH ESTIMATE</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Valid for Purchase Orders</div>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <div class="meta-label">Quotation Ref No</div>
            <div class="meta-val" style="font-family: monospace;">${quoteId}</div>
          </div>
          <div>
            <div class="meta-label">Date of Issue</div>
            <div class="meta-val">${dateStr}</div>
          </div>
          <div>
            <div class="meta-label">Validity Period</div>
            <div class="meta-val" style="color: #b45309;">7 Days (${validUntil})</div>
          </div>
          <div>
            <div class="meta-label">Allocated Logistics</div>
            <div class="meta-val" style="font-size: 10.5px;">${freightVehicleName}</div>
          </div>
        </div>

        <div class="parties-grid">
          <div class="party-card">
            <div class="party-role">SUPPLIER / YARD DISPATCH</div>
            <div class="party-name">Urbanico Regional Logistics Yard #04</div>
            <div class="party-detail">Bollaram Industrial Zone, Hyderabad - 502325</div>
            <div class="party-detail">State: Telangana (Code: 36)</div>
            <div class="party-detail">GSTIN: 36AAACU9812A1Z4</div>
            <div class="party-detail">Quality Certification: ISO 9001:2015 Approved Batch</div>
          </div>

          <div class="party-card">
            <div class="party-role">CONSIGNEE / SITE DESTINATION</div>
            <div class="party-name">${customerName}</div>
            <div class="party-detail">Site Address: ${deliveryAddress}</div>
            <div class="party-detail">Phone: ${customerPhone} | Email: ${customerEmail}</div>
            <div class="party-detail">Client GSTIN: ${customerGstin ? customerGstin : 'Unregistered / B2C (No ITC)'}</div>
            <div class="party-detail" style="color: #1e40af; font-weight: 600;">Delivery Service Area: Telangana State</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 25px;">#</th>
              <th>Material Description & Grade</th>
              <th style="width: 55px;">HSN</th>
              <th style="width: 75px;">Qty/Unit</th>
              <th style="width: 80px; text-align: right;">Unit Rate (₹)</th>
              <th style="width: 85px; text-align: right;">Taxable (₹)</th>
              <th style="width: 80px; text-align: right;">CGST</th>
              <th style="width: 80px; text-align: right;">SGST</th>
              <th style="width: 95px; text-align: right;">Total Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHtml}
          </tbody>
        </table>

        <div class="calc-grid">
          <div class="words-box">
            <div class="meta-label">Total Amount in Words</div>
            <div style="font-weight: 800; font-size: 11px; margin-top: 4px; color: #0f172a;">${amountInWords}</div>
            <div style="margin-top: 12px; font-size: 9.5px; color: #475569; line-height: 1.4;">
              <strong>Bank Transfer Details for Direct Payment:</strong><br>
              Account Name: Urbanico Technologies Pvt Ltd<br>
              Bank: HDFC Bank Ltd, Jubilee Hills Branch, Hyderabad<br>
              Account No: 50200084920194 (Current Account)<br>
              IFSC: HDFC0000521 | Virtual UPI: urbanico.orders@hdfcbank
            </div>
          </div>

          <div>
            <table class="totals-table">
              <tr>
                <td style="color: #64748b;">Subtotal Supply Value</td>
                <td style="text-align: right; font-weight: 600;">₹${subtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">Direct Yard Freight Logistics</td>
                <td style="text-align: right; font-weight: 600;">${freightCharge === 0 ? 'FREE' : `₹${freightCharge.toLocaleString('en-IN')}`}</td>
              </tr>
              <tr class="grand-total-row">
                <td>Total Quotation Value</td>
                <td style="text-align: right;">₹${totalPayable.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="footer-terms">
          <div>
            <div class="terms-title">Terms & Purchase Order Conditions</div>
            <ol class="terms-list">
              <li>Direct quarry pricing with transparent logistics and yard loading included.</li>
              <li>Rates are guaranteed for 7 calendar days from issue date subject to steel/cement commodity market indexes.</li>
              <li>Delivery will be dispatched within 4 hours of payment confirmation or purchase order receipt.</li>
              <li>Unloading at the customer site can be arranged by the site supervisor or requested with order.</li>
              <li>Authorized delivery challan and batch quality test certificates accompany the transport vehicle.</li>
            </ol>
          </div>
          <div class="sign-box">
            <div class="sign-title">For Urbanico Technologies Pvt Ltd</div>
            <div style="font-size: 10px; color: #1e40af; font-weight: 700; margin-top: 18px;">Digitally Authorized Quotation</div>
            <div class="sign-sub">Logistics & Yard Dispatch Manager</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { title: `Proforma_Quotation_${quoteId}`, html };
}

export function openProformaQuotationPrint(options: ProformaQuotationOptions): boolean {
  if (typeof window === 'undefined') return false;

  const { title, html } = generateProformaQuotationHtml(options);

  const printWindow = window.open('', '_blank', 'width=900,height=800,scrollbars=yes,resizable=yes');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        // Fallback handled by browser
      }
    }, 400);
    return true;
  } else {
    // If popup blocked, create hidden iframe to trigger print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1500);
      }, 400);
      return true;
    }
    return false;
  }
}
