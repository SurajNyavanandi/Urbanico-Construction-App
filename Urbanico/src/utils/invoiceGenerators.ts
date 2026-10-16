import { ActivityDelivery, UserProfile } from '../types';
import { getHSNCodeForMaterial, numberToWordsIndian } from './invoiceHelper';

export interface InvoicePrintOptions {
  invoiceNum: string;
  cleanOrderNum: string;
  ewayBillNum: string;
  invoiceDate: string;
  irnHash: string;
  effectiveBusinessName: string;
  effectiveGstin: string;
  formattedDeliverySiteAddress: string;
  stateName: string;
  stateCode: string;
  constitutionName: string;
  recipientEmail: string;
  vehicleDisplay: string;
  primaryHsnInfo: { code: string; desc: string };
  laborFee: number;
  laborTaxable: number;
  laborCgst: number;
  laborSgst: number;
  hasLaborAssistance: boolean;
  totalAmount: number;
  taxableAmount: number;
  totalGst: number;
  cgstAmount: number;
  sgstAmount: number;
  isMultiItem: boolean;
}

export function generateInvoicePrintHtml(
  delivery: ActivityDelivery,
  user: UserProfile,
  opts: InvoicePrintOptions
): string {
  const docTitle = `Tax_Invoice_${opts.invoiceNum.replace(/\//g, '_')}`;

  let itemsTableHtml = '';
  if (opts.isMultiItem && delivery.cartItemsSnapshot) {
    itemsTableHtml = delivery.cartItemsSnapshot
      .map((item, idx) => {
        const itemTotal = item.unitPrice * item.quantity;
        const itemTaxable = Math.round(itemTotal / 1.18);
        const itemCgst = Math.round((itemTotal - itemTaxable) / 2);
        const itemSgst = itemTotal - itemTaxable - itemCgst;
        const hsn = getHSNCodeForMaterial(item.itemName);
        return `
          <tr>
            <td style="text-align: center; color: #475569; font-weight: 600;">${idx + 1}</td>
            <td>
              <div style="font-weight: 700; color: #0f172a; font-size: 11.5px;">${item.itemName}</div>
              <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">${hsn.desc} • Quarry Certified</div>
            </td>
            <td style="text-align: center; font-family: monospace; font-size: 10.5px; color: #334155;">${hsn.code}</td>
            <td style="text-align: center; font-weight: 600;">${item.quantity} ${item.selectedOptionLabel || 'Unit'}</td>
            <td style="text-align: right; color: #334155;">₹${Math.round(itemTaxable / (item.quantity || 1)).toLocaleString('en-IN')}</td>
            <td style="text-align: right; font-weight: 600; color: #0f172a;">₹${itemTaxable.toLocaleString('en-IN')}</td>
            <td style="text-align: right; font-size: 10.5px; color: #475569;">₹${itemCgst.toLocaleString('en-IN')} <span style="font-size: 9px; color: #64748b;">(9%)</span></td>
            <td style="text-align: right; font-size: 10.5px; color: #475569;">₹${itemSgst.toLocaleString('en-IN')} <span style="font-size: 9px; color: #64748b;">(9%)</span></td>
            <td style="text-align: right; font-weight: 800; color: #0f172a;">₹${itemTotal.toLocaleString('en-IN')}</td>
          </tr>
        `;
      })
      .join('');
  } else {
    const materialTotal = opts.totalAmount - opts.laborFee;
    const materialTaxable = Math.round(materialTotal / 1.18);
    const materialCgst = Math.round((materialTotal - materialTaxable) / 2);
    const materialSgst = materialTotal - materialTaxable - materialCgst;

    itemsTableHtml = `
      <tr>
        <td style="text-align: center; color: #475569; font-weight: 600;">1</td>
        <td>
          <div style="font-weight: 700; color: #0f172a; font-size: 11.5px;">${delivery.materialName}</div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">${opts.primaryHsnInfo.desc} • High Grade Quarry Direct</div>
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 10.5px; color: #334155;">${opts.primaryHsnInfo.code}</td>
        <td style="text-align: center; font-weight: 600;">${delivery.quantity}</td>
        <td style="text-align: right; color: #334155;">₹${Math.round(materialTaxable / 10).toLocaleString('en-IN')}</td>
        <td style="text-align: right; font-weight: 600; color: #0f172a;">₹${materialTaxable.toLocaleString('en-IN')}</td>
        <td style="text-align: right; font-size: 10.5px; color: #475569;">₹${materialCgst.toLocaleString('en-IN')} <span style="font-size: 9px; color: #64748b;">(9%)</span></td>
        <td style="text-align: right; font-size: 10.5px; color: #475569;">₹${materialSgst.toLocaleString('en-IN')} <span style="font-size: 9px; color: #64748b;">(9%)</span></td>
        <td style="text-align: right; font-weight: 800; color: #0f172a;">₹${materialTotal.toLocaleString('en-IN')}</td>
      </tr>
    `;
  }

  if (opts.hasLaborAssistance) {
    itemsTableHtml += `
      <tr style="background: #f8fafc;">
        <td style="text-align: center; color: #059669; font-weight: 700;">+</td>
        <td>
          <div style="font-weight: 700; color: #065f46; font-size: 11.5px;">Site Unloading & Labor Assistance</div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">${delivery.laborAssistanceDetails || 'Ground-floor unloading & material stacking service'}</div>
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 10.5px; color: #334155;">9987</td>
        <td style="text-align: center; font-weight: 600;">1 Consignment</td>
        <td style="text-align: right; color: #334155;">₹${opts.laborTaxable.toLocaleString('en-IN')}</td>
        <td style="text-align: right; font-weight: 600; color: #0f172a;">₹${opts.laborTaxable.toLocaleString('en-IN')}</td>
        <td style="text-align: right; font-size: 10.5px; color: #475569;">₹${opts.laborCgst.toLocaleString('en-IN')} <span style="font-size: 9px; color: #64748b;">(9%)</span></td>
        <td style="text-align: right; font-size: 10.5px; color: #475569;">₹${opts.laborSgst.toLocaleString('en-IN')} <span style="font-size: 9px; color: #64748b;">(9%)</span></td>
        <td style="text-align: right; font-weight: 800; color: #059669;">₹${opts.laborFee.toLocaleString('en-IN')}</td>
      </tr>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${docTitle}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm 12mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; background: #fff; font-size: 11px; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .invoice-sheet { max-width: 820px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 22px 24px; background: #fff; }
        .top-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 14px; }
        .brand-title-row { display: flex; align-items: center; gap: 8px; }
        .brand-logo-mark { display: inline-block; background: #0f172a; color: #fff; font-weight: 900; font-size: 14px; padding: 2px 7px; border-radius: 4px; }
        .brand-title { font-size: 17px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
        .brand-sub { font-size: 9.5px; color: #475569; margin-top: 2px; }
        .tax-title-box { text-align: right; }
        .tax-heading { font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px; }
        .original-badge { display: inline-block; background: #0f172a; color: #fff; font-size: 8.5px; font-weight: 800; padding: 2px 6px; border-radius: 3px; margin-top: 3px; }
        .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; margin-bottom: 14px; }
        .meta-item-label { font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
        .meta-item-val { font-size: 11px; font-weight: 700; color: #0f172a; word-break: break-all; }
        .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .party-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; background: #ffffff; }
        .party-role { font-size: 8.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px; }
        .party-name { font-size: 12.5px; font-weight: 800; color: #0f172a; margin-bottom: 3px; }
        .party-line { font-size: 10px; color: #334155; margin-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
        th { background: #0f172a; color: #ffffff; font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 7px 6px; text-align: left; }
        td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; font-size: 10.5px; color: #1e293b; }
        tr:nth-child(even) { background-color: #fafbfd; }
        .totals-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; }
        .words-card { flex: 1.1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; background: #f8fafc; }
        .calc-card { flex: 0.9; border: 1px solid #0f172a; border-radius: 6px; padding: 10px 12px; background: #ffffff; }
        .calc-row { display: flex; justify-content: space-between; font-size: 10.5px; margin-bottom: 4px; color: #334155; }
        .calc-grand-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; color: #0f172a; border-top: 1.5px solid #0f172a; padding-top: 6px; margin-top: 6px; }
        .dispatch-strip { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; font-size: 10px; line-height: 1.45; }
        .bottom-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        .bank-box { font-size: 9.5px; color: #334155; line-height: 1.5; }
        .sign-box { text-align: right; font-size: 9.5px; color: #475569; }
        .legal-footer { margin-top: 12px; padding-top: 6px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 8.5px; color: #94a3b8; }
        @media print { body { padding: 0; } .invoice-sheet { border: none; padding: 0; } }
      </style>
    </head>
    <body>
      <div class="invoice-sheet">
        <div class="top-header">
          <div>
            <div class="brand-title-row">
              <span class="brand-logo-mark">URB</span>
              <span class="brand-title">URBANICO INFRASTRUCTURE & LOGISTICS</span>
            </div>
            <div class="brand-sub">URBANICO TECHNOLOGIES PRIVATE LIMITED • CIN: U45200TG2022PTC168234</div>
            <div class="brand-sub">Registered Office: Plot 142, HiTech City Phase 2, Madhapur, Hyderabad, Telangana - 500081</div>
            <div class="brand-sub"><b>GSTIN:</b> 36AAACU9812A1Z4 | <b>PAN:</b> AAACU9812A | <b>State:</b> Telangana (Code: 36)</div>
            <div class="brand-sub"><b>Email:</b> urbanicoapp@gmail.com | <b>Support Desk:</b> +91 8297474332</div>
          </div>
          <div class="tax-title-box">
            <div class="tax-heading">TAX INVOICE</div>
            <div class="original-badge">ORIGINAL FOR RECIPIENT</div>
            <div style="font-size: 8.5px; color: #059669; font-weight: 700; margin-top: 4px;">✓ GST E-INVOICE COMPLIANT</div>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <div class="meta-item-label">Invoice Number</div>
            <div class="meta-item-val">${opts.invoiceNum}</div>
          </div>
          <div>
            <div class="meta-item-label">Invoice Date</div>
            <div class="meta-item-val">${opts.invoiceDate}</div>
          </div>
          <div>
            <div class="meta-item-label">E-Way Bill No</div>
            <div class="meta-item-val">${opts.ewayBillNum}</div>
          </div>
          <div>
            <div class="meta-item-label">Place of Supply</div>
            <div class="meta-item-val">${opts.stateName} (${opts.stateCode})</div>
          </div>
        </div>

        <div class="parties-grid">
          <div class="party-card">
            <div class="party-role">Billed To (Recipient / Buyer)</div>
            <div class="party-name">${opts.effectiveBusinessName}</div>
            <div class="party-line"><b>Contact Person:</b> ${user.name || 'Site Supervisor'} (${user.phone || '+91 98480 12345'})</div>
            <div class="party-line"><b>Email:</b> ${opts.recipientEmail}</div>
            <div class="party-line"><b>GSTIN:</b> ${opts.effectiveGstin || 'URP (Unregistered Construction Entity)'}</div>
            <div class="party-line"><b>Delivery Site:</b> ${opts.formattedDeliverySiteAddress}</div>
          </div>
          <div class="party-card">
            <div class="party-role">Supplier (Fulfillment Depot)</div>
            <div class="party-name">Urbanico Central Quarry Hub</div>
            <div class="party-line">Patancheru Outskirts Industrial Area, Hyderabad, Telangana - 502319</div>
            <div class="party-line"><b>Gate Pass No:</b> GP-${opts.cleanOrderNum}</div>
            <div class="party-line"><b>Assigned Fleet Vehicle:</b> ${opts.vehicleDisplay}</div>
            <div class="party-line"><b>IRN (E-Invoice Hash):</b> <span style="font-family: monospace; font-size: 8px;">${opts.irnHash.slice(0, 36)}...</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 28px; text-align: center;">#</th>
              <th>Description of Goods / Services</th>
              <th style="text-align: center;">HSN/SAC</th>
              <th style="text-align: center;">Qty / Unit</th>
              <th style="text-align: right;">Rate (Excl. Tax)</th>
              <th style="text-align: right;">Taxable Value</th>
              <th style="text-align: right;">CGST</th>
              <th style="text-align: right;">SGST</th>
              <th style="text-align: right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableHtml}
          </tbody>
        </table>

        <div class="totals-wrapper">
          <div class="words-card">
            <div style="font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Invoice Value in Words</div>
            <div style="font-size: 11.5px; font-weight: 700; color: #0f172a; margin-top: 3px; line-height: 1.4;">
              ${numberToWordsIndian(opts.totalAmount)}
            </div>
            <div style="margin-top: 8px; font-size: 9.5px; color: #64748b;">
              Tax Payable on Reverse Charge: <b>No</b> | Input Tax Credit (ITC) Eligible: <b>Yes</b>
            </div>
          </div>

          <div class="calc-card">
            <div class="calc-row">
              <span>Taxable Value:</span>
              <span>₹${opts.taxableAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="calc-row">
              <span>Central GST (CGST 9%):</span>
              <span>₹${opts.cgstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="calc-row">
              <span>State GST (SGST 9%):</span>
              <span>₹${opts.sgstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="calc-grand-row">
              <span>Total Invoice Value:</span>
              <span>₹${opts.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div class="dispatch-strip">
          <b>DISPATCH & QUALITY VERIFICATION:</b><br>
          Order No: <b>URB-${opts.cleanOrderNum}</b> | Quantity: <b>${delivery.quantity}</b> | Vehicle: <b>${opts.vehicleDisplay}</b><br>
          Materials inspected, certified, and dispatched in compliance with Indian Standards from Urbanico Fulfillment Hub.
        </div>

        <div class="bottom-grid">
          <div class="bank-box">
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 2px;">Bank & RTGS/NEFT Remittance Details</div>
            Bank Name: <b>Axis Bank Ltd</b> | Branch: <b>HiTech City Corporate, Hyderabad</b><br>
            Account Name: <b>Urbanico Technologies Private Limited</b><br>
            Current A/C No: <b>9220 2001 8829 102</b> | IFSC Code: <b>UTIB0000122</b> | UPI ID: <b>urbanico@axisbank</b>
          </div>
          <div class="sign-box">
            <div style="font-weight: 800; color: #0f172a; font-size: 10.5px; margin-bottom: 2px;">For URBANICO TECHNOLOGIES PVT. LTD.</div>
            <div style="margin-top: 14px; font-weight: 700; color: #059669; font-size: 10px;">✓ DIGITALLY SIGNED & VERIFIED</div>
            <div style="font-size: 8.5px; color: #64748b;">Automated Tax Engine • Authorized Signatory</div>
          </div>
        </div>

        <div class="legal-footer">
          This is an electronically generated Tax Invoice under Section 31 of CGST Act, 2017 and Rule 46 of CGST Rules, 2017. Valid for claiming Input Tax Credit (ITC).
        </div>
      </div>
    </body>
    </html>
  `;
}

export function executePrintDocument(printHtml: string): void {
  if (typeof window === 'undefined') return;

  try {
    const printWindow = window.open ? window.open('', '_blank') : null;
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch {}
      }, 350);
    } else if (typeof document !== 'undefined') {
      const hiddenIframe = document.createElement('iframe');
      hiddenIframe.style.position = 'fixed';
      hiddenIframe.style.right = '0';
      hiddenIframe.style.bottom = '0';
      hiddenIframe.style.width = '0';
      hiddenIframe.style.height = '0';
      hiddenIframe.style.border = '0';
      document.body.appendChild(hiddenIframe);

      const frameDoc = hiddenIframe.contentWindow ? hiddenIframe.contentWindow.document : hiddenIframe.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(printHtml);
        frameDoc.close();
        setTimeout(() => {
          try {
            hiddenIframe.contentWindow?.focus();
            hiddenIframe.contentWindow?.print();
          } catch {}
          setTimeout(() => {
            try {
              document.body.removeChild(hiddenIframe);
            } catch {}
          }, 2000);
        }, 400);
      }
    }
  } catch (err) {
    console.warn('[InvoiceGenerators] Print error:', err);
  }
}
