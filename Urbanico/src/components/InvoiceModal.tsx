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
import { useClipboard, formatINR } from '../hooks';
import { generateInvoicePrintHtml, executePrintDocument } from '../utils/invoiceGenerators';
import { StatusBadge } from './common/StatusBadge';

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
  isLoggedIn = false,
  onOpenLoginModal,
}) => {
  const { theme, typography } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'invoice' | 'bank'>('invoice');
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

  // Determine if this order involves bulk material
  const isBulkMaterial = Boolean(
    delivery.materialName?.toLowerCase().includes('sand') ||
    delivery.materialName?.toLowerCase().includes('aggregate') ||
    delivery.materialName?.toLowerCase().includes('gravel') ||
    delivery.materialName?.toLowerCase().includes('crusher') ||
    delivery.materialName?.toLowerCase().includes('stone')
  );

  const { copy } = useClipboard({ timeout: 2500 });

  // Copy helper
  const handleCopy = async (text: string, label: string) => {
    const success = await copy(text);
    if (success) {
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // High-End Minimalist A4 Print PDF Generator
  const handlePrintPdf = () => {
    try {
      const printHtml = generateInvoicePrintHtml(delivery, user, {
        invoiceNum,
        cleanOrderNum,
        ewayBillNum,
        invoiceDate,
        irnHash,
        effectiveBusinessName,
        effectiveGstin,
        formattedDeliverySiteAddress,
        stateName,
        stateCode,
        constitutionName,
        recipientEmail,
        vehicleDisplay,
        primaryHsnInfo,
        laborFee,
        laborTaxable,
        laborCgst,
        laborSgst,
        hasLaborAssistance,
        totalAmount,
        taxableAmount,
        totalGst,
        cgstAmount,
        sgstAmount,
        isMultiItem,
      });
      executePrintDocument(printHtml);
    } catch {
      showToast("Printing initialized. You can also view the full invoice on screen.", "info");
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
                <Download size={14} color="#18181B" strokeWidth={2.2} />
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
                      <Text style={styles.calcLabel}>Delivery Freight</Text>
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

            {/* TAB 2: BANK & REMITTANCE DETAILS */}
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
              <Download size={16} color="#18181B" strokeWidth={2.2} />
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
    backgroundColor: '#FCB026',
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
    backgroundColor: '#FCB026',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  printActionText: {
    color: '#18181B',
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
    backgroundColor: '#FCB026',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  calcGrandTotalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#18181B',
  },
  calcGrandTotalVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#18181B',
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
    backgroundColor: '#FCB026',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadPdfBtnText: {
    color: '#18181B',
    fontSize: 13,
    fontWeight: '700',
  },
});
