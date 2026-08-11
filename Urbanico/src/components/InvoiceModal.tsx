import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import {
  X,
  Printer,
  Download,
  FileText,
  ShieldCheck,
  Scale,
} from 'lucide-react-native';
import { UserProfile, ActivityDelivery } from '../types';
import { useTheme } from '../context/ThemeContext';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: ActivityDelivery | null;
  user: UserProfile;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  delivery,
  user,
}) => {
  const { theme, typography } = useTheme();

  if (!isOpen || !delivery) return null;

  const invoiceNum = `INV-2026-${delivery.orderNumber || '88412'}`;
  const invoiceDate = delivery.timestamp || '28 July 2026, 09:30 AM';
  const hsnCode = delivery.materialName.toLowerCase().includes('sand')
    ? '2505'
    : delivery.materialName.toLowerCase().includes('cement')
    ? '2523'
    : delivery.materialName.toLowerCase().includes('rebar') ||
      delivery.materialName.toLowerCase().includes('iron')
    ? '7214'
    : '2517';

  // Calculate tax breakdown
  const totalAmount = delivery.totalAmount || 45000;
  const taxableAmount = Math.round(totalAmount / 1.18);
  const totalGst = totalAmount - taxableAmount;
  const cgst = Math.round(totalGst / 2);
  const sgst = totalGst - cgst;

  // Print PDF function
  const handlePrintPdf = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${invoiceNum}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${theme.primary}; padding-bottom: 16px; margin-bottom: 20px; }
          .company-name { font-size: 20px; font-weight: 900; color: ${theme.primary}; text-transform: uppercase; letter-spacing: 0.5px; }
          .sub { font-size: 11px; color: #64748b; margin-top: 4px; }
          .badge { background: ${theme.primaryLight}; color: ${theme.primaryDark}; font-weight: 800; padding: 4px 10px; border-radius: 99px; border: 1px solid ${theme.border}; font-size: 11px; display: inline-block; }
          .invoice-title { font-size: 24px; font-weight: 900; color: #0f172a; text-align: right; }
          .meta-grid { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
          .meta-col { width: 48%; }
          .meta-title { font-size: 11px; font-weight: 800; color: ${theme.primary}; text-transform: uppercase; margin-bottom: 6px; }
          .meta-text { font-size: 12px; font-weight: 600; color: #1e293b; line-height: 1.5; }
          .slip-box { background: ${theme.primaryLight}; border: 1px dashed ${theme.primary}; border-radius: 10px; padding: 12px; margin-bottom: 20px; font-size: 12px; }
          .slip-title { font-weight: 800; color: ${theme.primaryDark}; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: ${theme.primary}; color: #fff; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 10px; text-align: left; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px; font-size: 12px; color: #1e293b; }
          .amount-col { text-align: right; }
          .totals-table { width: 320px; margin-left: auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
          .grand-total { background: ${theme.primary}; color: #fff; font-weight: 900; font-size: 14px; }
          .footer-note { font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; }
          .stamp { text-align: right; margin-top: 20px; font-size: 11px; font-weight: 800; color: #059669; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">URBANICO LOGISTICS & INFRASTRUCTURE PVT LTD</div>
            <div class="sub">Corporate Office: Plot 142, HiTech City Phase 2, Hyderabad, TS - 500081</div>
            <div class="sub">GSTIN: <b>36AAACU9812A1Z4</b> | CIN: U45200TG2022PTC168234</div>
            <div class="sub">Email: billing@urbanico.in | Support: +91 1800 200 8829</div>
          </div>
          <div>
            <div class="invoice-title">TAX INVOICE</div>
            <div class="badge">ORIGINAL FOR RECIPIENT</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-col">
            <div class="meta-title">Invoice & Dispatch Reference</div>
            <div class="meta-text">
              <b>Invoice No:</b> ${invoiceNum}<br>
              <b>Date & Time:</b> ${invoiceDate}<br>
              <b>Order Ref:</b> #${delivery.orderNumber}<br>
              <b>Place of Supply:</b> Telangana (Code 36)<br>
              <b>Transport Mode:</b> ${delivery.vehicleType || 'Tipper Heavy Truck'} (${delivery.vehicleNumber})
            </div>
          </div>
          <div class="meta-col">
            <div class="meta-title">Billed & Shipped To (Contractor)</div>
            <div class="meta-text">
              <b>Company:</b> ${user.companyName || 'Kumar Infra & Construction Pvt Ltd'}<br>
              <b>Contact:</b> ${user.name} (${user.phone})<br>
              <b>GSTIN:</b> ${user.gstin || '36AABCU12341ZV'}<br>
              <b>Site Address:</b> ${delivery.siteAddress || user.siteLocation}
            </div>
          </div>
        </div>

        <div class="slip-box">
          <div class="slip-title">⚖ ELECTRONIC WEIGHBRIDGE WEIGHT SLIP VERIFICATION</div>
          <div>Slip No: <b>WB-2026-99120</b> | Weighbridge ID: WB-HYD-04 | Verified Driver: <b>${delivery.driverName}</b></div>
          <div>Gross Vehicle Wt: 28,450 kg | Tare Vehicle Wt: 10,150 kg | <b>Net Material Weight Delivered: 18,300 kg</b></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Material Description</th>
              <th>HSN Code</th>
              <th>Quantity / Unit</th>
              <th>Unit Rate (₹)</th>
              <th class="amount-col">Taxable Value (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><b>${delivery.materialName}</b><br><small style="color:#64748b;">Direct Quarry Dispatch • High Grade Certified</small></td>
              <td>${hsnCode}</td>
              <td>${delivery.quantity}</td>
              <td>₹${Math.round(taxableAmount / 10).toLocaleString('en-IN')}</td>
              <td class="amount-col">₹${taxableAmount.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals-table">
          <div class="totals-row">
            <span>Taxable Amount:</span>
            <span>₹${taxableAmount.toLocaleString('en-IN')}</span>
          </div>
          <div class="totals-row">
            <span>CGST @ 9%:</span>
            <span>₹${cgst.toLocaleString('en-IN')}</span>
          </div>
          <div class="totals-row">
            <span>SGST @ 9%:</span>
            <span>₹${sgst.toLocaleString('en-IN')}</span>
          </div>
          <div class="totals-row">
            <span>Dispatch Freight & Tolls:</span>
            <span style="color:#059669; font-weight:800;">INCLUDED (FREE)</span>
          </div>
          <div class="totals-row grand-total">
            <span>Grand Total:</span>
            <span>₹${totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style="margin-bottom: 20px; font-size: 11px; line-height: 1.6; color: #334155;">
          <b>Bank Payment Details:</b><br>
          Account Name: Urbanico Logistics Pvt Ltd | Bank: Axis Bank Ltd, Hitech City Branch<br>
          Account No: 922020018829102 | IFSC: UTIB0000122 | UPI ID: urbanico@axisbank
        </div>

        <div class="stamp">
          ✓ Digitally Signed & Sealed by Urbanico Authorized Signatory<br>
          <small style="color:#64748b;">This is a computer generated tax invoice. No signature required.</small>
        </div>

        <div class="footer-note" style="margin-top: 30px;">
          Thank you for trusting Urbanico Construction Supplies! • www.urbanico.in
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
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
        {/* Modal Top Toolbar */}
        <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.headerLeftGroup}>
            <FileText size={20} color={theme.primary} />
            <Text style={[styles.modalTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Official GST Tax Invoice
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={handlePrintPdf}
              style={[styles.printActionBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
            >
              <Printer size={15} color="#FFFFFF" />
              <Text style={styles.printActionText}>Print / Save PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Invoice Printable Preview Container */}
        <ScrollView
          style={[styles.invoiceScrollView, { backgroundColor: theme.surfaceSecondary }]}
          contentContainerStyle={styles.invoiceContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Company Branding & Tax Header */}
          <View style={[styles.brandHeaderBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.brandRow}>
              <View>
                <Text style={[styles.companyName, { color: theme.primary, fontFamily: typography.fontFamilyHeading }]}>
                  URBANICO LOGISTICS PVT LTD
                </Text>
                <Text style={[styles.companySub, { color: theme.textSecondary }]}>
                  Plot 142, HiTech City Phase 2, Hyderabad, TS - 500081
                </Text>
                <Text style={[styles.companyMeta, { color: theme.textSecondary }]}>
                  GSTIN: <Text style={[styles.boldMeta, { color: theme.textPrimary }]}>36AAACU9812A1Z4</Text> • CIN: U45200TG2022
                </Text>
              </View>
              <View style={styles.invoiceTagBox}>
                <Text style={[styles.invoiceTagText, { color: theme.textPrimary }]}>TAX INVOICE</Text>
                <Text style={[styles.recipientPill, { backgroundColor: theme.primaryLight, color: theme.primaryDark, borderColor: theme.border }]}>
                  ORIGINAL
                </Text>
              </View>
            </View>
          </View>

          {/* Reference Meta Grid */}
          <View style={[styles.metaGrid, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.metaCol}>
              <Text style={[styles.metaColTitle, { color: theme.primary }]}>INVOICE DETAILS</Text>
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                Invoice No: <Text style={[styles.metaVal, { color: theme.textPrimary }]}>{invoiceNum}</Text>
              </Text>
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                Order Ref: <Text style={[styles.metaVal, { color: theme.textPrimary }]}>#{delivery.orderNumber}</Text>
              </Text>
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                Date: <Text style={[styles.metaVal, { color: theme.textPrimary }]}>{invoiceDate}</Text>
              </Text>
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                Vehicle: <Text style={[styles.metaVal, { color: theme.textPrimary }]}>{delivery.vehicleNumber}</Text>
              </Text>
            </View>

            <View style={[styles.metaColDivider, { backgroundColor: theme.borderLight }]} />

            <View style={styles.metaCol}>
              <Text style={[styles.metaColTitle, { color: theme.primary }]}>BILLED & SHIPPED TO</Text>
              <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>
                {user.companyName || 'Kumar Infra & Construction'}
              </Text>
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                GSTIN: <Text style={[styles.metaVal, { color: theme.textPrimary }]}>{user.gstin || '36AABCU12341ZV'}</Text>
              </Text>
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                Contractor: <Text style={[styles.metaVal, { color: theme.textPrimary }]}>{user.name}</Text>
              </Text>
              <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>
                Site: <Text style={[styles.metaVal, { color: theme.textPrimary }]}>{delivery.siteAddress || user.siteLocation}</Text>
              </Text>
            </View>
          </View>

          {/* Electronic Weighbridge Slip Banner */}
          <View style={[styles.weighbridgeBox, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
            <View style={styles.wbHeaderRow}>
              <Scale size={16} color={theme.primaryDark} />
              <Text style={[styles.wbTitle, { color: theme.primaryDark }]}>ELECTRONIC WEIGHBRIDGE NET WEIGHT SLIP</Text>
            </View>
            <View style={[styles.wbMetricsGrid, { backgroundColor: theme.surface }]}>
              <View style={styles.wbMetricItem}>
                <Text style={[styles.wbLabel, { color: theme.textMuted }]}>Slip No</Text>
                <Text style={[styles.wbVal, { color: theme.textPrimary }]}>WB-2026-99120</Text>
              </View>
              <View style={styles.wbMetricItem}>
                <Text style={[styles.wbLabel, { color: theme.textMuted }]}>Gross Weight</Text>
                <Text style={[styles.wbVal, { color: theme.textPrimary }]}>28.45 Tons</Text>
              </View>
              <View style={styles.wbMetricItem}>
                <Text style={[styles.wbLabel, { color: theme.textMuted }]}>Tare Weight</Text>
                <Text style={[styles.wbVal, { color: theme.textPrimary }]}>10.15 Tons</Text>
              </View>
              <View style={styles.wbMetricItem}>
                <Text style={[styles.wbLabel, { color: theme.textMuted }]}>Net Delivered</Text>
                <Text style={[styles.wbVal, { color: '#059669' }]}>18.30 Tons</Text>
              </View>
            </View>
          </View>

          {/* Itemized Table */}
          <View style={[styles.itemTableCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.tableHeaderRow, { backgroundColor: theme.primary }]}>
              <Text style={[styles.thCell, { flex: 2 }]}>Item Description</Text>
              <Text style={[styles.thCell, { flex: 1 }]}>HSN</Text>
              <Text style={[styles.thCell, { flex: 1 }]}>Qty</Text>
              <Text style={[styles.thCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
            </View>

            <View style={styles.tableBodyRow}>
              <View style={{ flex: 2 }}>
                <Text style={[styles.itemNameText, { color: theme.textPrimary }]}>{delivery.materialName}</Text>
                <Text style={[styles.itemSubText, { color: theme.textSecondary }]}>Direct Quarry Tipper Dispatch</Text>
              </View>
              <Text style={[styles.tdCell, { flex: 1, color: theme.textSecondary }]}>{hsnCode}</Text>
              <Text style={[styles.tdCell, { flex: 1, color: theme.textSecondary }]}>{delivery.quantity}</Text>
              <Text style={[styles.tdCell, { flex: 1, textAlign: 'right', fontWeight: '800', color: theme.textPrimary }]}>
                ₹{taxableAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Tax Breakdown & Grand Total Box */}
          <View style={[styles.totalsBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Taxable Material Amount</Text>
              <Text style={[styles.totalVal, { color: theme.textPrimary }]}>₹{taxableAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>CGST (9%)</Text>
              <Text style={[styles.totalVal, { color: theme.textPrimary }]}>₹{cgst.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>SGST (9%)</Text>
              <Text style={[styles.totalVal, { color: theme.textPrimary }]}>₹{sgst.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Delivery Logistics & Freight</Text>
              <Text style={[styles.totalVal, { color: '#059669', fontWeight: '800' }]}>
                FREE
              </Text>
            </View>

            <View style={[styles.grandTotalDivider, { backgroundColor: theme.borderLight }]} />

            <View style={styles.grandTotalRow}>
              <Text style={[styles.grandTotalLabel, { color: theme.textPrimary }]}>Grand Total Amount</Text>
              <Text style={[styles.grandTotalVal, { color: theme.primaryDark }]}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Verified Stamp */}
          <View style={styles.stampCard}>
            <ShieldCheck size={20} color="#059669" />
            <View style={{ flex: 1 }}>
              <Text style={styles.stampTitle}>Digitally Signed GST Invoice</Text>
              <Text style={styles.stampSub}>
                Verified by Urbanico Automated Billing Engine • Valid for GST Input Tax Credit (ITC)
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Modal Footer CTA */}
        <View style={[styles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            onPress={handlePrintPdf}
            style={[styles.downloadPdfBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
          >
            <Download size={16} color="#FFFFFF" />
            <Text style={styles.downloadPdfBtnText}>
              Download Official PDF Invoice
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  printActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  printActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  invoiceScrollView: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  invoiceContent: {
    gap: 12,
    paddingBottom: 24,
  },
  brandHeaderBox: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyName: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  companySub: {
    fontSize: 10,
    marginTop: 2,
  },
  companyMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  boldMeta: {
    fontWeight: '800',
  },
  invoiceTagBox: {
    alignItems: 'flex-end',
    gap: 4,
  },
  invoiceTagText: {
    fontSize: 14,
    fontWeight: '900',
  },
  recipientPill: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  metaGrid: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
  },
  metaCol: {
    flex: 1,
    gap: 3,
  },
  metaColDivider: {
    width: 1,
    marginHorizontal: 10,
  },
  metaColTitle: {
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  metaText: {
    fontSize: 11,
  },
  metaVal: {
    fontWeight: '700',
  },
  weighbridgeBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  wbHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wbTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  wbMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 8,
  },
  wbMetricItem: {
    alignItems: 'center',
  },
  wbLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  wbVal: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  itemTableCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
  },
  thCell: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tableBodyRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemNameText: {
    fontSize: 12,
    fontWeight: '800',
  },
  itemSubText: {
    fontSize: 10,
  },
  tdCell: {
    fontSize: 11,
    fontWeight: '600',
  },
  totalsBox: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 11,
  },
  totalVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  grandTotalDivider: {
    height: 1,
    marginVertical: 4,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  grandTotalVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  stampCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stampTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  stampSub: {
    fontSize: 10,
    color: '#047857',
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
  },
  downloadPdfBtn: {
    paddingVertical: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadPdfBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
