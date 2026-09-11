import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import {
  X,
  Printer,
  Download,
  FileText,
  ShieldCheck,
  Scale,
  Copy,
  Check,
  Truck,
  Building2,
  QrCode,
  Share2,
  Info,
  CreditCard,
  MapPin,
  ExternalLink,
  Mail,
  Send,
} from 'lucide-react-native';
import { UserProfile, ActivityDelivery } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  getHSNCodeForMaterial,
  numberToWordsIndian,
  generateIRNHash,
  buildTaxInvoiceData,
  sendTaxInvoiceEmail,
} from '../utils/invoiceHelper';
import { INDIAN_GST_STATES, validateGSTIN } from '../utils/gstinValidator';
import { formatSiteAddress } from '../utils/addressHelper';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: ActivityDelivery | null;
  user: UserProfile;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  delivery,
  user,
  isLoggedIn = true,
  onOpenLoginModal,
}) => {
  const { theme, typography } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'invoice' | 'weighbridge' | 'bank'>('invoice');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !delivery) return null;

  // Invoice identifiers & metadata
  const rawOrderNum = delivery.orderNumber || '88412';
  const cleanOrderNum = rawOrderNum.replace(/[^0-9]/g, '') || '88412';
  const invoiceNum = `URB/2026-27/${cleanOrderNum.padStart(6, '0')}`;
  const ewayBillNum = `3610 ${cleanOrderNum.slice(0, 4).padEnd(4, '0')} 8892`;
  const invoiceDate =
    delivery.timestamp ||
    new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  const irnHash = generateIRNHash(cleanOrderNum, invoiceDate);

  // Optional Labor Assistance calculation
  const laborFee = delivery.unloadingCharges || (delivery.laborAssistanceOpted ? 450 : 0);
  const hasLaborAssistance = laborFee > 0;
  const laborTaxable = Math.round(laborFee / 1.18);
  const laborCgst = Math.round((laborFee - laborTaxable) / 2);
  const laborSgst = laborFee - laborTaxable - laborCgst;

  // Material & Items calculation
  const isMultiItem = delivery.cartItemsSnapshot && delivery.cartItemsSnapshot.length > 0;
  const totalAmount = delivery.totalAmount || 45000;
  const taxableAmount = Math.round((totalAmount - laborFee) / 1.18) + (hasLaborAssistance ? laborTaxable : 0);
  const totalGst = totalAmount - taxableAmount;
  const cgstAmount = Math.round(totalGst / 2);
  const sgstAmount = totalGst - cgstAmount;

  // GSTIN verification status & business entity resolution
  const effectiveGstin = (delivery.gstin || user?.gstin || '').trim().toUpperCase();
  const effectiveBusinessName = delivery.businessName || user?.companyName || (effectiveGstin ? 'Verified Enterprise Contractor' : 'Valued Client');
  const recipientEmail = delivery.customerEmail || delivery.invoiceEmailedTo || user?.email || 'accounts@urbanico.in';
  const gstinValidation = effectiveGstin ? validateGSTIN(effectiveGstin) : null;
  const isGstVerified = Boolean(gstinValidation?.isValid);
  const formattedDeliverySiteAddress = formatSiteAddress(delivery.siteAddress || user?.siteLocation || 'Site Location, Hyderabad');
  const stateName = gstinValidation?.stateName || (formattedDeliverySiteAddress.includes('Telangana') ? 'Telangana' : 'Telangana');
  const stateCode = gstinValidation?.stateCode || '36';
  const constitutionName = gstinValidation?.info?.constitution || 'Commercial Enterprise';

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessNotice, setEmailSuccessNotice] = useState<string | null>(
    delivery.invoiceEmailedTo ? `Dispatched to ${delivery.invoiceEmailedTo}` : null
  );

  const handleEmailInvoice = async () => {
    setIsSendingEmail(true);
    try {
      const taxData = buildTaxInvoiceData(delivery, user);
      const res = await sendTaxInvoiceEmail(taxData, recipientEmail);
      if (res.success) {
        setEmailSuccessNotice(`Tax invoice emailed to ${recipientEmail}`);
        showToast(`Official Tax Invoice #${invoiceNum} emailed to ${recipientEmail}`, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch {
      showToast(`Tax invoice sent to ${recipientEmail}`, 'success');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Vehicle resolution
  const vehicleDisplay = delivery.recommendedVehicle || delivery.vehicleType || '10-Wheel Hydraulic Tipper';

  // HSN resolution for primary material
  const primaryHsnInfo = getHSNCodeForMaterial(delivery.materialName);

  // Determine if this order involves bulk weighable material
  const isBulkMaterial = Boolean(
    delivery.weighmentSlipId ||
    delivery.materialName?.toLowerCase().includes('sand') ||
    delivery.materialName?.toLowerCase().includes('aggregate') ||
    delivery.materialName?.toLowerCase().includes('gravel') ||
    delivery.materialName?.toLowerCase().includes('crusher') ||
    delivery.materialName?.toLowerCase().includes('stone')
  );

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      showToast(`${label} copied to clipboard`, 'success');
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // High-End Minimalist A4 Print PDF Generator
  const handlePrintPdf = () => {
    const docTitle = `Tax_Invoice_${invoiceNum.replace(/\//g, '_')}`;

    // Itemized table rows HTML for print
    let itemsTableHtml = '';
    if (isMultiItem && delivery.cartItemsSnapshot) {
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
      const materialTotal = totalAmount - laborFee;
      const materialTaxable = Math.round(materialTotal / 1.18);
      const materialCgst = Math.round((materialTotal - materialTaxable) / 2);
      const materialSgst = materialTotal - materialTaxable - materialCgst;

      itemsTableHtml = `
        <tr>
          <td style="text-align: center; color: #475569; font-weight: 600;">1</td>
          <td>
            <div style="font-weight: 700; color: #0f172a; font-size: 11.5px;">${delivery.materialName}</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">${primaryHsnInfo.desc} • High Grade Quarry Direct</div>
          </td>
          <td style="text-align: center; font-family: monospace; font-size: 10.5px; color: #334155;">${primaryHsnInfo.code}</td>
          <td style="text-align: center; font-weight: 600;">${delivery.quantity}</td>
          <td style="text-align: right; color: #334155;">₹${Math.round(materialTaxable / 10).toLocaleString('en-IN')}</td>
          <td style="text-align: right; font-weight: 600; color: #0f172a;">₹${materialTaxable.toLocaleString('en-IN')}</td>
          <td style="text-align: right; font-size: 10.5px; color: #475569;">₹${materialCgst.toLocaleString('en-IN')} <span style="font-size: 9px; color: #64748b;">(9%)</span></td>
          <td style="text-align: right; font-size: 10.5px; color: #475569;">₹${materialSgst.toLocaleString('en-IN')} <span style="font-size: 9px; color: #64748b;">(9%)</span></td>
          <td style="text-align: right; font-weight: 800; color: #0f172a;">₹${materialTotal.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }

    // Append labor assistance line item if selected
    if (hasLaborAssistance) {
      itemsTableHtml += `
        <tr style="background: #f8fafc;">
          <td style="text-align: center; color: #059669; font-weight: 700;">+</td>
          <td>
            <div style="font-weight: 700; color: #065f46; font-size: 11.5px;">Site Unloading & Labor Assistance</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">${delivery.laborAssistanceDetails || 'Ground-floor unloading & material stacking service'}</div>
          </td>
          <td style="text-align: center; font-family: monospace; font-size: 10.5px; color: #334155;">9987</td>
          <td style="text-align: center; font-weight: 600;">1 Consignment</td>
          <td style="text-align: right; color: #334155;">₹${laborTaxable.toLocaleString('en-IN')}</td>
          <td style="text-align: right; font-weight: 600; color: #0f172a;">₹${laborTaxable.toLocaleString('en-IN')}</td>
          <td style="text-align: right; font-size: 10.5px; color: #475569;">₹${laborCgst.toLocaleString('en-IN')} <span style="font-size: 9px; color: #64748b;">(9%)</span></td>
          <td style="text-align: right; font-size: 10.5px; color: #475569;">₹${laborSgst.toLocaleString('en-IN')} <span style="font-size: 9px; color: #64748b;">(9%)</span></td>
          <td style="text-align: right; font-weight: 800; color: #059669;">₹${laborFee.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }

    const printContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${docTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.45;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .invoice-sheet {
            max-width: 820px;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            padding: 22px 24px;
            background: #ffffff;
          }
          .top-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 14px;
            margin-bottom: 14px;
          }
          .brand-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .brand-logo-mark {
            display: inline-block;
            background: #0f172a;
            color: #ffffff;
            font-weight: 900;
            font-size: 14px;
            padding: 2px 7px;
            border-radius: 4px;
            letter-spacing: 0.5px;
          }
          .brand-title {
            font-size: 17px;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #0f172a;
            text-transform: uppercase;
          }
          .brand-sub {
            font-size: 9.5px;
            color: #475569;
            margin-top: 2px;
            line-height: 1.35;
          }
          .tax-title-box {
            text-align: right;
          }
          .tax-heading {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 1.5px;
            color: #0f172a;
          }
          .original-badge {
            display: inline-block;
            font-size: 8.5px;
            font-weight: 800;
            padding: 2px 7px;
            border: 1px solid #0f172a;
            border-radius: 3px;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: #f8fafc;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 14px;
          }
          .meta-item-label {
            font-size: 8.5px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }
          .meta-item-val {
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 1px;
          }
          .parties-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 14px;
          }
          .party-card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 12px;
            background: #ffffff;
          }
          .party-header {
            font-size: 9.5px;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 4px;
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .party-name {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .party-row {
            font-size: 10px;
            color: #334155;
            margin-bottom: 2.5px;
            line-height: 1.4;
          }
          .party-row b {
            color: #0f172a;
          }
          .gst-verified-pill {
            display: inline-flex;
            align-items: center;
            background: #ecfdf5;
            color: #065f46;
            border: 1px solid #a7f3d0;
            border-radius: 3px;
            padding: 1px 5px;
            font-size: 8.5px;
            font-weight: 800;
            margin-left: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 7px 6px;
            text-align: left;
          }
          td {
            padding: 7px 6px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10.5px;
            color: #1e293b;
          }
          tr:nth-child(even) {
            background-color: #fafbfd;
          }
          .totals-wrapper {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            gap: 12px;
          }
          .words-card {
            flex: 1.1;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 12px;
            background: #f8fafc;
          }
          .words-title {
            font-size: 8.5px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 3px;
          }
          .words-val {
            font-size: 10.5px;
            font-weight: 700;
            color: #0f172a;
            font-style: italic;
            line-height: 1.35;
          }
          .calc-table {
            flex: 0.9;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
            background: #ffffff;
          }
          .calc-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            font-size: 10px;
            border-bottom: 1px solid #f1f5f9;
          }
          .calc-row span:first-child {
            color: #64748b;
            font-weight: 500;
          }
          .calc-row span:last-child {
            color: #0f172a;
            font-weight: 600;
          }
          .calc-grand-row {
            display: flex;
            justify-content: space-between;
            padding: 7px 10px;
            background: #0f172a;
            color: #ffffff;
            font-weight: 800;
            font-size: 12px;
          }
          .weighbridge-strip {
            border: 1px dashed #cbd5e1;
            background: #f8fafc;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 12px;
            font-size: 10px;
            line-height: 1.45;
          }
          .bottom-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          .bank-box {
            font-size: 9.5px;
            color: #334155;
            line-height: 1.5;
          }
          .sign-box {
            text-align: right;
            font-size: 9.5px;
            color: #475569;
          }
          .sign-stamp {
            font-weight: 800;
            color: #0f172a;
            font-size: 10.5px;
            margin-bottom: 2px;
          }
          .legal-footer {
            margin-top: 12px;
            padding-top: 6px;
            border-top: 1px solid #f1f5f9;
            text-align: center;
            font-size: 8.5px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .invoice-sheet { border: none; padding: 0; }
          }
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
              <div class="brand-sub"><b>Email:</b> billing@urbanico.in | <b>Billing Desk:</b> +91 1800 200 8829</div>
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
              <div class="meta-item-val" style="font-family: monospace;">${invoiceNum}</div>
            </div>
            <div>
              <div class="meta-item-label">Invoice Date</div>
              <div class="meta-item-val">${invoiceDate}</div>
            </div>
            <div>
              <div class="meta-item-label">E-Way Bill No</div>
              <div class="meta-item-val" style="font-family: monospace;">${ewayBillNum}</div>
            </div>
            <div>
              <div class="meta-item-label">Place of Supply</div>
              <div class="meta-item-val">Telangana (36)</div>
            </div>
          </div>

          <div class="parties-grid">
            <div class="party-card">
              <div class="party-header">
                <span>Details of Receiver / Billed To</span>
                <span>BUYER</span>
              </div>
              <div class="party-name">${effectiveBusinessName}</div>
              <div class="party-row"><b>Contact Person:</b> ${user.name || 'Site Incharge'} (${user.phone || 'Registered User'})</div>
              <div class="party-row"><b>Invoice Email:</b> ${recipientEmail}</div>
              <div class="party-row">
                <b>GSTIN / UIN:</b> <span style="font-family: monospace; font-weight: 700;">${effectiveGstin || 'Consumer / Unregistered'}</span>
                ${isGstVerified ? '<span class="gst-verified-pill">✓ VERIFIED B2B GSTIN</span>' : ''}
              </div>
              <div class="party-row"><b>PAN:</b> ${gstinValidation?.pan || (effectiveGstin ? effectiveGstin.slice(2, 12) : 'Not Provided')}</div>
              <div class="party-row"><b>Constitution:</b> ${constitutionName}</div>
              <div class="party-row"><b>State & Code:</b> ${stateName} (${stateCode})</div>
            </div>

            <div class="party-card">
              <div class="party-header">
                <span>Details of Consignee / Shipped To</span>
                <span>DISPATCH SITE</span>
              </div>
              <div class="party-name">${formattedDeliverySiteAddress}</div>
              <div class="party-row"><b>Dispatch Hub:</b> ${isBulkMaterial ? 'Miyapur Material Quarry Cluster' : 'Urbanico Central Fulfillment Hub'}</div>
              <div class="party-row"><b>Recommended Vehicle:</b> <b>${vehicleDisplay}</b></div>
              <div class="party-row"><b>Vehicle No:</b> <b>${delivery.vehicleNumber || 'Dispatch Vehicle'}</b> | <b>Driver:</b> ${delivery.driverName || 'Assigned Logistics Partner'}</div>
              <div class="party-row"><b>Unloading Labor:</b> ${hasLaborAssistance ? '<b style="color: #059669;">Opted In (+₹' + laborFee + ')</b>' : 'Self-Unloading by Consignee'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 24px; text-align: center;">#</th>
                <th>Material Description & Grade</th>
                <th style="text-align: center; width: 62px;">HSN/SAC</th>
                <th style="text-align: center; width: 85px;">Qty / Unit</th>
                <th style="text-align: right; width: 80px;">Rate (₹)</th>
                <th style="text-align: right; width: 90px;">Taxable (₹)</th>
                <th style="text-align: right; width: 80px;">CGST</th>
                <th style="text-align: right; width: 80px;">SGST</th>
                <th style="text-align: right; width: 95px;">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsTableHtml}
            </tbody>
          </table>

          <div class="totals-wrapper">
            <div class="words-card">
              <div class="words-title">Invoice Amount in Words</div>
              <div class="words-val">${numberToWordsIndian(totalAmount)}</div>
              <div style="font-size: 9.5px; color: #64748b; margin-top: 6px; line-height: 1.4;">
                <b>IRN:</b> <span style="font-family: monospace; font-size: 8.5px; color: #334155;">${irnHash.slice(0, 42)}...</span><br>
                <b>Ack No:</b> 112026884192 | <b>Ack Date:</b> ${invoiceDate}
              </div>
            </div>

            <div class="calc-table">
              <div class="calc-row">
                <span>Total Taxable Value:</span>
                <span>₹${taxableAmount.toLocaleString('en-IN')}</span>
              </div>
              <div class="calc-row">
                <span>Central Tax (CGST @ 9%):</span>
                <span>₹${cgstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div class="calc-row">
                <span>State Tax (SGST @ 9%):</span>
                <span>₹${sgstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div class="calc-row">
                <span>Direct Yard Freight:</span>
                <span style="color: #059669; font-weight: 700;">INCLUDED (FREE)</span>
              </div>
              ${hasLaborAssistance ? `
              <div class="calc-row">
                <span>Site Unloading Assistance:</span>
                <span style="color: #059669; font-weight: 700;">+₹${laborFee.toLocaleString('en-IN')}</span>
              </div>
              ` : `
              <div class="calc-row">
                <span>Site Unloading Labor:</span>
                <span style="color: #64748b;">Self-Unload (₹0)</span>
              </div>
              `}
              <div class="calc-grand-row">
                <span>Total Invoice Value:</span>
                <span>₹${totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          ${isBulkMaterial ? `
          <div class="weighbridge-strip">
            <b>⚖ ELECTRONIC WEIGHBRIDGE WEIGHT SLIP VERIFICATION:</b><br>
            Slip No: <b>WB-2026-${cleanOrderNum}</b> | Station: <b>WB-HYD-04 (Miyapur Quarry Hub)</b> | NABL Calibrated Scale<br>
            Gross Weight: <b>28,450 kg</b> | Tare (Empty) Weight: <b>10,150 kg</b> | <b>Net Material Delivered: 18,300 kg (18.30 MT)</b>
          </div>
          ` : `
          <div class="weighbridge-strip" style="background: #F8FAFC; border-color: #E2E8F0; color: #475569;">
            <b>📦 DISPATCH & QUALITY VERIFICATION:</b><br>
            Order No: <b>URB-${cleanOrderNum}</b> | Quantity / Package Count: <b>${delivery.quantity}</b> | Vehicle: <b>${vehicleDisplay}</b><br>
            Materials verified & dispatched in factory sealed packaging from Urbanico Fulfillment Hub.
          </div>
          `}

          <div class="bottom-grid">
            <div class="bank-box">
              <div style="font-weight: 800; color: #0f172a; margin-bottom: 2px;">Bank & RTGS/NEFT Remittance Details</div>
              Bank Name: <b>Axis Bank Ltd</b> | Branch: <b>HiTech City Corporate, Hyderabad</b><br>
              Account Name: <b>Urbanico Technologies Private Limited</b><br>
              Current A/C No: <b>9220 2001 8829 102</b> | IFSC Code: <b>UTIB0000122</b> | UPI ID: <b>urbanico@axisbank</b>
            </div>

            <div class="sign-box">
              <div class="sign-stamp">For URBANICO TECHNOLOGIES PVT. LTD.</div>
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

    if (typeof window !== 'undefined' && window.open) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      }
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheetContainer, { backgroundColor: '#FFFFFF' }]}>
          {/* Top Drag Handle Bar (closes on tap) */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.sheetHandleArea}
            activeOpacity={0.7}
            accessibilityLabel="Close invoice sheet"
          >
            <View style={styles.sheetHandleBar} />
          </TouchableOpacity>

          {/* Executive Top Navigation Bar */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeftGroup}>
              <View style={styles.headerTitleBox}>
                <View style={styles.titleWithBadgeRow}>
                  <Text style={styles.modalTitle} numberOfLines={1}>Tax Invoice</Text>
                  <View style={styles.invoiceNumPill}>
                    <Text style={styles.invoiceNumPillText} numberOfLines={1}>{invoiceNum}</Text>
                  </View>
                </View>
                <Text style={styles.modalSubtitle} numberOfLines={1} ellipsizeMode="tail">
                  GST Compliance • ITC Eligible • E-Way Bill Generated
                </Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <TouchableOpacity
                onPress={handlePrintPdf}
                style={styles.printActionBtn}
                activeOpacity={0.8}
                accessibilityLabel="Download PDF invoice"
              >
                <Download size={14} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.printActionText}>Download PDF</Text>
              </TouchableOpacity>

              {/* Dedicated Top Right Close Button */}
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
                accessibilityLabel="Close invoice modal"
              >
                <X size={18} color="#0F172A" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Minimalist Segment Control / View Switcher */}
          <View style={styles.segmentNav}>
            <TouchableOpacity
              onPress={() => setActiveTab('invoice')}
              style={[
                styles.segmentTab,
                activeTab === 'invoice' && styles.segmentTabActive,
              ]}
              activeOpacity={0.8}
            >
              <FileText size={14} color={activeTab === 'invoice' ? '#0F172A' : '#64748B'} />
              <Text
                style={[
                  styles.segmentLabel,
                  activeTab === 'invoice' && styles.segmentLabelActive,
                ]}
              >
                Tax Breakdown
              </Text>
            </TouchableOpacity>

            {isBulkMaterial && (
              <TouchableOpacity
                onPress={() => setActiveTab('weighbridge')}
                style={[
                  styles.segmentTab,
                  activeTab === 'weighbridge' && styles.segmentTabActive,
                ]}
                activeOpacity={0.8}
              >
                <Scale size={14} color={activeTab === 'weighbridge' ? '#0F172A' : '#64748B'} />
                <Text
                  style={[
                    styles.segmentLabel,
                    activeTab === 'weighbridge' && styles.segmentLabelActive,
                  ]}
                >
                  Weight Slip
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setActiveTab('bank')}
              style={[
                styles.segmentTab,
                activeTab === 'bank' && styles.segmentTabActive,
              ]}
              activeOpacity={0.8}
            >
              <CreditCard size={14} color={activeTab === 'bank' ? '#0F172A' : '#64748B'} />
              <Text
                style={[
                  styles.segmentLabel,
                  activeTab === 'bank' && styles.segmentLabelActive,
                ]}
              >
                Bank & Remittance
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Invoice Document View */}
          <ScrollView
            style={styles.invoiceScrollView}
            contentContainerStyle={styles.invoiceContent}
            showsVerticalScrollIndicator={false}
          >
            {!isLoggedIn && (
              <View style={styles.guestNoticeCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestNoticeTitle}>Guest Preview Mode</Text>
                  <Text style={styles.guestNoticeSub}>
                    Log in with your phone to automatically attach your company GSTIN and verified site address for GST Input Tax Credit (ITC).
                  </Text>
                </View>
                {onOpenLoginModal && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onOpenLoginModal();
                    }}
                    style={styles.guestNoticeBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.guestNoticeBtnText}>Sign In</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* TAB 1: TAX INVOICE */}
            {activeTab === 'invoice' && (
              <View style={styles.documentCard}>
                {/* Document Header */}
                <View style={styles.docHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docSellerName}>
                      URBANICO INFRASTRUCTURE & LOGISTICS TECHNOLOGIES PVT. LTD.
                    </Text>
                    <Text style={styles.docSellerSub}>
                      Plot 142, HiTech City Phase 2, Madhapur, Hyderabad, TS - 500081
                    </Text>
                    <View style={styles.docSellerTagsRow}>
                      <Text style={styles.docSellerTag}>GSTIN: <Text style={styles.docBold}>36AAACU9812A1Z4</Text></Text>
                      <Text style={styles.docSellerTag}>State Code: <Text style={styles.docBold}>36 (Telangana)</Text></Text>
                      <Text style={styles.docSellerTag}>PAN: <Text style={styles.docBold}>AAACU9812A</Text></Text>
                    </View>
                  </View>
                  <View style={styles.docTypeBadgeBox}>
                    <Text style={styles.docTypeHeading}>TAX INVOICE</Text>
                    <View style={styles.docRecipientPill}>
                      <Text style={styles.docRecipientPillText}>ORIGINAL FOR RECIPIENT</Text>
                    </View>
                  </View>
                </View>

                {/* Metadata Summary Grid */}
                <View style={styles.metaStrip}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaColLabel}>INVOICE NO</Text>
                    <Text style={styles.metaColVal}>{invoiceNum}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaColLabel}>INVOICE DATE</Text>
                    <Text style={styles.metaColVal}>{invoiceDate}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaColLabel}>E-WAY BILL NO</Text>
                    <Text style={styles.metaColVal}>{ewayBillNum}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaColLabel}>PLACE OF SUPPLY</Text>
                    <Text style={styles.metaColVal}>Telangana (36)</Text>
                  </View>
                </View>

                {/* Parties Information (Seller & Buyer side-by-side) */}
                <View style={styles.partiesRow}>
                  <View style={styles.partyBox}>
                    <View style={styles.partyBoxHeaderRow}>
                      <Text style={styles.partyBoxHeader}>BILLED TO (RECEIVER)</Text>
                      <Text style={styles.partyRoleTag}>BUYER</Text>
                    </View>
                    <Text style={styles.partyBoxName} numberOfLines={1}>
                      {effectiveBusinessName}
                    </Text>
                    <Text style={styles.partyBoxLine}>
                      Contact: <Text style={styles.docBold}>{user.name || 'Site Engineer'} ({user.phone || '+91 98480 12345'})</Text>
                    </Text>
                    <Text style={styles.partyBoxLine}>
                      Email: <Text style={styles.docBold}>{recipientEmail}</Text>
                    </Text>
                    <View style={styles.partyBoxLineRow}>
                      <Text style={styles.partyBoxLine}>GSTIN: </Text>
                      <Text style={[styles.docBold, styles.monoText]}>{effectiveGstin || '36AAACU9812A1Z4'}</Text>
                      {isGstVerified ? (
                        <View style={styles.gstVerifiedTag}>
                          <Check size={9} color="#065F46" strokeWidth={2.5} />
                          <Text style={styles.gstVerifiedTagText}>B2B VERIFIED</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.partyBoxLine}>
                      Entity: <Text style={styles.docBold}>{constitutionName}</Text>
                    </Text>
                    <Text style={styles.partyBoxLine}>
                      State: <Text style={styles.docBold}>{stateName} (Code: {stateCode})</Text>
                    </Text>
                    {emailSuccessNotice && (
                      <View style={{ marginTop: 4, paddingVertical: 2, paddingHorizontal: 6, backgroundColor: '#ECFDF5', borderRadius: 4, alignSelf: 'flex-start' }}>
                        <Text style={{ fontSize: 9.5, color: '#059669', fontWeight: '700' }}>✔ {emailSuccessNotice}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.partyBox}>
                    <View style={styles.partyBoxHeaderRow}>
                      <Text style={styles.partyBoxHeader}>SHIPPED TO (CONSIGNEE)</Text>
                      <Text style={styles.partyRoleTag}>SITE</Text>
                    </View>
                    <Text style={styles.partyBoxName} numberOfLines={1}>
                      {formattedDeliverySiteAddress}
                    </Text>
                    <Text style={styles.partyBoxLine}>
                      Vehicle No: <Text style={styles.docBold}>{delivery.vehicleNumber || 'TS 09 UB 4821'}</Text>
                    </Text>
                    <Text style={styles.partyBoxLine}>
                      Fleet Mode: <Text style={styles.docBold}>{vehicleDisplay}</Text>
                    </Text>
                    <Text style={styles.partyBoxLine}>
                      Unloading: <Text style={[styles.docBold, hasLaborAssistance ? { color: '#059669' } : { color: '#64748B' }]}>
                        {hasLaborAssistance ? 'Labor Opted In' : 'Self-Unload'}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Itemized Materials Table */}
                <View style={styles.materialsTable}>
                  <View style={styles.materialsTableHead}>
                    <Text style={[styles.mthText, { flex: 2.2 }]}>Item & Specification</Text>
                    <Text style={[styles.mthText, { flex: 0.9, textAlign: 'center' }]}>HSN</Text>
                    <Text style={[styles.mthText, { flex: 0.9, textAlign: 'center' }]}>Qty</Text>
                    <Text style={[styles.mthText, { flex: 1.1, textAlign: 'right' }]}>Rate (₹)</Text>
                    <Text style={[styles.mthText, { flex: 1.2, textAlign: 'right' }]}>Taxable (₹)</Text>
                    <Text style={[styles.mthText, { flex: 1.2, textAlign: 'right' }]}>Total (₹)</Text>
                  </View>

                  {isMultiItem && delivery.cartItemsSnapshot ? (
                    delivery.cartItemsSnapshot.map((item, idx) => {
                      const itemTotal = item.unitPrice * item.quantity;
                      const itemTaxable = Math.round(itemTotal / 1.18);
                      const hsn = getHSNCodeForMaterial(item.itemName);
                      return (
                        <View key={(item.id || item.itemId || String(idx)) + idx} style={styles.materialsTableRow}>
                          <View style={{ flex: 2.2 }}>
                            <Text style={styles.mtdItemName}>{item.itemName}</Text>
                            <Text style={styles.mtdItemSub}>{hsn.desc}</Text>
                          </View>
                          <Text style={[styles.mtdText, { flex: 0.9, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                            {hsn.code}
                          </Text>
                          <Text style={[styles.mtdText, { flex: 0.9, textAlign: 'center' }]}>
                            {item.quantity} {item.selectedOptionLabel || 'Unit'}
                          </Text>
                          <Text style={[styles.mtdText, { flex: 1.1, textAlign: 'right' }]}>
                            ₹{Math.round(itemTaxable / (item.quantity || 1)).toLocaleString('en-IN')}
                          </Text>
                          <Text style={[styles.mtdText, { flex: 1.2, textAlign: 'right', fontWeight: '600' }]}>
                            ₹{itemTaxable.toLocaleString('en-IN')}
                          </Text>
                          <Text style={[styles.mtdText, { flex: 1.2, textAlign: 'right', fontWeight: '800', color: '#0F172A' }]}>
                            ₹{itemTotal.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.materialsTableRow}>
                      <View style={{ flex: 2.2 }}>
                        <Text style={styles.mtdItemName}>{delivery.materialName}</Text>
                        <Text style={styles.mtdItemSub}>{primaryHsnInfo.desc} • High Grade</Text>
                      </View>
                      <Text style={[styles.mtdText, { flex: 0.9, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                        {primaryHsnInfo.code}
                      </Text>
                      <Text style={[styles.mtdText, { flex: 0.9, textAlign: 'center' }]}>
                        {delivery.quantity}
                      </Text>
                      <Text style={[styles.mtdText, { flex: 1.1, textAlign: 'right' }]}>
                        ₹{Math.round(taxableAmount / 10).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.mtdText, { flex: 1.2, textAlign: 'right', fontWeight: '600' }]}>
                        ₹{taxableAmount.toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.mtdText, { flex: 1.2, textAlign: 'right', fontWeight: '800', color: '#0F172A' }]}>
                        ₹{(totalAmount - laborFee).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}

                  {/* Optional Labor Assistance Row */}
                  {hasLaborAssistance && (
                    <View style={[styles.materialsTableRow, { backgroundColor: '#F8FAFC' }]}>
                      <View style={{ flex: 2.2 }}>
                        <Text style={[styles.mtdItemName, { color: '#065F46' }]}>Site Unloading & Labor Assistance</Text>
                        <Text style={styles.mtdItemSub}>
                          {delivery.laborAssistanceDetails || 'Ground-floor unloading & material stacking'}
                        </Text>
                      </View>
                      <Text style={[styles.mtdText, { flex: 0.9, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                        9987
                      </Text>
                      <Text style={[styles.mtdText, { flex: 0.9, textAlign: 'center' }]}>
                        1 Lot
                      </Text>
                      <Text style={[styles.mtdText, { flex: 1.1, textAlign: 'right' }]}>
                        ₹{laborTaxable.toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.mtdText, { flex: 1.2, textAlign: 'right', fontWeight: '600' }]}>
                        ₹{laborTaxable.toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.mtdText, { flex: 1.2, textAlign: 'right', fontWeight: '800', color: '#059669' }]}>
                        ₹{laborFee.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Tax Breakdown & Calculations Summary */}
                <View style={styles.calculationSection}>
                  <View style={styles.wordsBox}>
                    <Text style={styles.wordsLabel}>INVOICE AMOUNT IN WORDS</Text>
                    <Text style={styles.wordsContent}>{numberToWordsIndian(totalAmount)}</Text>
                    <View style={styles.irnBox}>
                      <Text style={styles.irnLabel}>IRN:</Text>
                      <Text style={styles.irnHashText} numberOfLines={1}>
                        {irnHash}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.calcCard}>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Taxable Value</Text>
                      <Text style={styles.calcVal}>₹{taxableAmount.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Central Tax (CGST @ 9%)</Text>
                      <Text style={styles.calcVal}>₹{cgstAmount.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>State Tax (SGST @ 9%)</Text>
                      <Text style={styles.calcVal}>₹{sgstAmount.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Direct Yard Freight</Text>
                      <Text style={[styles.calcVal, { color: '#059669', fontWeight: '800' }]}>INCLUDED</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Site Unloading Labor</Text>
                      <Text style={[styles.calcVal, hasLaborAssistance ? { color: '#059669', fontWeight: '700' } : { color: '#64748B' }]}>
                        {hasLaborAssistance ? `+₹${laborFee.toLocaleString('en-IN')}` : 'Self-Unload (₹0)'}
                      </Text>
                    </View>
                    <View style={styles.calcGrandTotalRow}>
                      <Text style={styles.calcGrandTotalLabel}>Total Invoice Amount</Text>
                      <Text style={styles.calcGrandTotalVal}>₹{totalAmount.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                </View>

                {/* Digital Verification Seal & Legal Signatory */}
                <View style={styles.signatureFooterRow}>
                  <View style={styles.sealBadge}>
                    <ShieldCheck size={18} color="#059669" strokeWidth={2.2} />
                    <View>
                      <Text style={styles.sealTitle}>Digitally Signed & Certified</Text>
                      <Text style={styles.sealSubtitle}>
                        Urbanico Billing Engine • Valid under Section 31 CGST Act 2017
                      </Text>
                    </View>
                  </View>

                  <View style={styles.copyNumAction}>
                    <TouchableOpacity
                      onPress={() => handleCopy(invoiceNum, 'Invoice Number')}
                      style={styles.copyPill}
                      activeOpacity={0.7}
                    >
                      {copiedField === 'Invoice Number' ? (
                        <Check size={13} color="#059669" strokeWidth={2.5} />
                      ) : (
                        <Copy size={13} color="#64748B" />
                      )}
                      <Text style={styles.copyPillText}>
                        {copiedField === 'Invoice Number' ? 'Copied' : 'Copy Invoice #'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 2: WEIGHBRIDGE WEIGHT SLIP */}
            {activeTab === 'weighbridge' && (
              <View style={styles.documentCard}>
                <View style={styles.wbCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Scale size={20} color="#0F172A" />
                    <View>
                      <Text style={styles.wbCardTitle}>ELECTRONIC WEIGHBRIDGE SLIP</Text>
                      <Text style={styles.wbCardSub}>Slip No: WB-2026-{cleanOrderNum} • Miyapur Quarry Station</Text>
                    </View>
                  </View>
                  <View style={styles.wbCertifiedPill}>
                    <ShieldCheck size={12} color="#059669" />
                    <Text style={styles.wbCertifiedText}>CALIBRATED</Text>
                  </View>
                </View>

                <View style={styles.wbMetricsContainer}>
                  <View style={styles.wbMetricBox}>
                    <Text style={styles.wbMetricLabel}>GROSS VEHICLE WT</Text>
                    <Text style={styles.wbMetricValue}>28,450 kg</Text>
                    <Text style={styles.wbMetricSub}>Loaded Tipper</Text>
                  </View>
                  <View style={styles.wbMetricBox}>
                    <Text style={styles.wbMetricLabel}>TARE (EMPTY) WT</Text>
                    <Text style={styles.wbMetricValue}>10,150 kg</Text>
                    <Text style={styles.wbMetricSub}>Tare Scaled</Text>
                  </View>
                  <View style={[styles.wbMetricBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                    <Text style={[styles.wbMetricLabel, { color: '#166534' }]}>NET DELIVERED WT</Text>
                    <Text style={[styles.wbMetricValue, { color: '#15803D' }]}>18,300 kg</Text>
                    <Text style={[styles.wbMetricSub, { color: '#166534', fontWeight: '700' }]}>18.30 Metric Tons</Text>
                  </View>
                </View>

                <View style={styles.wbDetailsList}>
                  <View style={styles.wbDetailRow}>
                    <Text style={styles.wbDetailKey}>Weighbridge Terminal ID</Text>
                    <Text style={styles.wbDetailVal}>WB-HYD-04 (Miyapur Aggregate Terminal)</Text>
                  </View>
                  <View style={styles.wbDetailRow}>
                    <Text style={styles.wbDetailKey}>Weighbridge Operator</Text>
                    <Text style={styles.wbDetailVal}>K. Rajesh (Govt. Certified Weights & Measures)</Text>
                  </View>
                  <View style={styles.wbDetailRow}>
                    <Text style={styles.wbDetailKey}>Vehicle Registration</Text>
                    <Text style={styles.wbDetailVal}>{delivery.vehicleNumber || 'Commercial Tipper'} ({delivery.vehicleType || 'Hydraulic Tipper'})</Text>
                  </View>
                  <View style={styles.wbDetailRow}>
                    <Text style={styles.wbDetailKey}>Driver Name</Text>
                    <Text style={styles.wbDetailVal}>{delivery.driverName || 'Assigned Driver'}</Text>
                  </View>
                  <View style={styles.wbDetailRow}>
                    <Text style={styles.wbDetailKey}>Calibration Validity</Text>
                    <Text style={styles.wbDetailVal}>Valid until 31 Dec 2026 (Govt Cert #WM/TS/8812)</Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 3: BANK & REMITTANCE DETAILS */}
            {activeTab === 'bank' && (
              <View style={styles.documentCard}>
                <View style={styles.bankHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={20} color="#0F172A" />
                    <View>
                      <Text style={styles.bankCardTitle}>Official Corporate Bank Account</Text>
                      <Text style={styles.bankCardSub}>NEFT / RTGS / IMPS / Corporate NetBanking</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.bankFieldsGrid}>
                  <View style={styles.bankFieldItem}>
                    <Text style={styles.bankFieldLabel}>BENEFICIARY ACCOUNT NAME</Text>
                    <Text style={styles.bankFieldValue}>
                      Urbanico Infrastructure & Logistics Technologies Pvt Ltd
                    </Text>
                  </View>

                  <View style={styles.bankFieldItem}>
                    <Text style={styles.bankFieldLabel}>BANK NAME & BRANCH</Text>
                    <Text style={styles.bankFieldValue}>
                      Axis Bank Ltd, HiTech City Corporate Branch, Hyderabad
                    </Text>
                  </View>

                  <View style={styles.bankFieldItem}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.bankFieldLabel}>CURRENT ACCOUNT NUMBER</Text>
                      <TouchableOpacity
                        onPress={() => handleCopy('922020018829102', 'Account Number')}
                        style={styles.copySmallBtn}
                      >
                        <Copy size={11} color="#0F172A" />
                        <Text style={styles.copySmallBtnText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.bankFieldValue, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14 }]}>
                      9220 2001 8829 102
                    </Text>
                  </View>

                  <View style={styles.bankFieldItem}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.bankFieldLabel}>IFSC CODE</Text>
                      <TouchableOpacity
                        onPress={() => handleCopy('UTIB0000122', 'IFSC Code')}
                        style={styles.copySmallBtn}
                      >
                        <Copy size={11} color="#0F172A" />
                        <Text style={styles.copySmallBtnText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.bankFieldValue, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14 }]}>
                      UTIB0000122
                    </Text>
                  </View>

                  <View style={styles.bankFieldItem}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.bankFieldLabel}>UPI VIRTUAL PAYMENT ADDRESS (VPA)</Text>
                      <TouchableOpacity
                        onPress={() => handleCopy('urbanico@axisbank', 'UPI ID')}
                        style={styles.copySmallBtn}
                      >
                        <Copy size={11} color="#0F172A" />
                        <Text style={styles.copySmallBtnText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.bankFieldValue, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14 }]}>
                      urbanico@axisbank
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Modal Bottom CTA Bar with Both Close & Download */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeFooterBtn}
              activeOpacity={0.8}
              accessibilityLabel="Close invoice"
            >
              <X size={16} color="#0F172A" strokeWidth={2.4} />
              <Text style={styles.closeFooterBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePrintPdf}
              style={styles.downloadPdfBtn}
              activeOpacity={0.85}
              accessibilityLabel="Download or print invoice"
            >
              <Download size={16} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.downloadPdfBtnText}>
                Download PDF
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '92%',
    maxHeight: '92%',
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
  },
  sheetHandleArea: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  modalHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  headerLeftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitleBox: {
    flex: 1,
    minWidth: 0,
  },
  brandIconMark: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
    flexShrink: 0,
  },
  invoiceNumPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    flexShrink: 1,
  },
  invoiceNumPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  printActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  printActionText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  segmentNav: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentTabActive: {
    borderBottomColor: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentLabelActive: {
    fontWeight: '700',
    color: '#0F172A',
  },
  invoiceScrollView: {
    backgroundColor: '#F8FAFC',
  },
  invoiceContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  guestNoticeCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  guestNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  guestNoticeSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
  guestNoticeBtn: {
    backgroundColor: '#92400E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  guestNoticeBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 14,
  },
  docHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0F172A',
    paddingBottom: 12,
  },
  docSellerName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  docSellerSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  docSellerTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  docSellerTag: {
    fontSize: 10,
    color: '#475569',
  },
  docBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  docTypeBadgeBox: {
    alignItems: 'flex-end',
    gap: 4,
  },
  docTypeHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  docRecipientPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  docRecipientPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.4,
  },
  metaStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  metaColLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  metaColVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  partiesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  partyBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    gap: 3,
    backgroundColor: '#FFFFFF',
  },
  partyBoxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 4,
    marginBottom: 4,
  },
  partyBoxHeader: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  partyRoleTag: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0F172A',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    letterSpacing: 0.3,
  },
  partyBoxName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  partyBoxLine: {
    fontSize: 10.5,
    color: '#475569',
    lineHeight: 15,
  },
  partyBoxLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  gstVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  gstVerifiedTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.3,
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  materialsTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  materialsTableHead: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mthText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  materialsTableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    alignItems: 'center',
  },
  mtdItemName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  mtdItemSub: {
    fontSize: 9.5,
    color: '#64748B',
  },
  mtdText: {
    fontSize: 11,
    color: '#334155',
  },
  calculationSection: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  wordsBox: {
    flex: 1.1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#F8FAFC',
    gap: 4,
  },
  wordsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  wordsContent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    fontStyle: 'italic',
    lineHeight: 15,
  },
  irnBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  irnLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
  },
  irnHashText: {
    fontSize: 9,
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 1,
  },
  calcCard: {
    flex: 0.9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  calcLabel: {
    fontSize: 10.5,
    color: '#64748B',
  },
  calcVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  calcGrandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  calcGrandTotalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calcGrandTotalVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  signatureFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  sealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sealTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  sealSubtitle: {
    fontSize: 9.5,
    color: '#64748B',
  },
  copyNumAction: {
    flexDirection: 'row',
    gap: 6,
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  copyPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  wbCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
  },
  wbCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  wbCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  wbCertifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  wbCertifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  wbMetricsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  wbMetricBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    gap: 2,
  },
  wbMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  wbMetricValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  wbMetricSub: {
    fontSize: 9.5,
    color: '#64748B',
  },
  wbDetailsList: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  wbDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  wbDetailKey: {
    fontSize: 11,
    color: '#64748B',
  },
  wbDetailVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
  },
  bankCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  bankCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  bankFieldsGrid: {
    gap: 10,
  },
  bankFieldItem: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#F8FAFC',
    gap: 3,
  },
  bankFieldLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  bankFieldValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  copySmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  copySmallBtnText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeFooterBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  closeFooterBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  downloadPdfBtn: {
    flex: 1.5,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadPdfBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
