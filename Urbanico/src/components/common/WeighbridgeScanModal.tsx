import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Pressable } from 'react-native';
import { Camera, FileText, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, UploadCloud } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

interface WeighbridgeScanModalProps {
  visible?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  orderNumber?: string;
  expectedTons?: number;
  delivery?: any;
  onVerified?: (netWeight: number, slipId: string) => void;
}

export const WeighbridgeScanModal: React.FC<WeighbridgeScanModalProps> = ({
  visible,
  isOpen,
  onClose,
  orderNumber,
  expectedTons = 10.0,
  delivery,
  onVerified,
}) => {
  const isVisible = visible !== undefined ? visible : !!isOpen;
  const activeOrderNum = orderNumber || delivery?.orderNumber || 'URB-HYD-9821';
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'parsed'>('idle');
  const [extractedData, setExtractedData] = useState<{
    slipNumber: string;
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
    weighbridgeName: string;
    variancePercent: number;
    matchStatus: 'MATCHED' | 'DISCREPANCY';
  } | null>(null);

  const handleSimulateScan = () => {
    setScanState('scanning');
    setTimeout(() => {
      const gross = Math.round((expectedTons + 4.85) * 100) / 100;
      const tare = 4.85;
      const net = Math.round((gross - tare) * 100) / 100;
      const variance = Math.abs(Math.round(((net - expectedTons) / expectedTons) * 1000) / 10);

      setExtractedData({
        slipNumber: `WB-TS-${Math.floor(10000 + Math.random() * 90000)}`,
        grossWeight: gross,
        tareWeight: tare,
        netWeight: net,
        weighbridgeName: 'Patancheru Central Certified Weighbridge #4',
        variancePercent: variance,
        matchStatus: variance <= 1.0 ? 'MATCHED' : 'DISCREPANCY',
      });
      setScanState('parsed');
      showToast('Weighbridge Slip OCR scanned successfully!', 'success');
    }, 1200);
  };

  const handleConfirmAcceptance = () => {
    if (extractedData) {
      if (onVerified) onVerified(extractedData.netWeight, extractedData.slipNumber);
      showToast(`Weighment verified: ${extractedData.netWeight} MT attached to Order #${activeOrderNum}`, 'success');
      onClose();
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleRow}>
              <Camera size={18} color="#111111" />
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Weighbridge OCR Scan
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {scanState === 'idle' && (
              <View style={styles.idleContainer}>
                <View style={[styles.cameraPlaceholder, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                  <Camera size={36} color={theme.textSecondary} />
                  <Text style={[styles.cameraHelpText, { color: theme.textPrimary }]}>
                    Scan or Upload Physical Weighbridge Slip
                  </Text>
                  <Text style={[styles.cameraSubText, { color: theme.textSecondary }]}>
                    Hold slip flat under good lighting to auto-extract Gross, Tare, and Net Tonnage.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleSimulateScan}
                  style={styles.scanBtn}
                  activeOpacity={0.85}
                >
                  <UploadCloud size={16} color="#FFFFFF" />
                  <Text style={styles.scanBtnText}>Capture & Run OCR Extraction</Text>
                </TouchableOpacity>
              </View>
            )}

            {scanState === 'scanning' && (
              <View style={styles.scanningContainer}>
                <RefreshCw size={28} color="#111111" style={{ marginBottom: 12 }} />
                <Text style={[styles.scanningTitle, { color: theme.textPrimary }]}>
                  Analyzing Optical Weight Data...
                </Text>
                <Text style={[styles.scanningSub, { color: theme.textSecondary }]}>
                  Extracting weighment coordinates and IS certified tare seals
                </Text>
              </View>
            )}

            {Boolean(scanState === 'parsed' && extractedData) && (
              <View style={styles.parsedContainer}>
                {/* Status Badge */}
                <View
                  style={[
                    styles.matchBanner,
                    extractedData.matchStatus === 'MATCHED'
                      ? { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }
                      : { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
                  ]}
                >
                  {extractedData.matchStatus === 'MATCHED' ? (
                    <CheckCircle2 size={16} color="#16A34A" />
                  ) : (
                    <AlertCircle size={16} color="#DC2626" />
                  )}
                  <Text
                    style={[
                      styles.matchBannerText,
                      { color: extractedData.matchStatus === 'MATCHED' ? '#15803D' : '#991B1B' },
                    ]}
                  >
                    {extractedData.matchStatus === 'MATCHED'
                      ? `Weight Verified: 100% Match with Order Manifest (Variance: ${extractedData.variancePercent}%)`
                      : `Discrepancy Detected (${extractedData.variancePercent}% variance)`}
                  </Text>
                </View>

                {/* Extracted Details Grid */}
                <View style={[styles.dataGrid, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Weighbridge Slip ID</Text>
                    <Text style={[styles.dataVal, { color: theme.textPrimary }]}>{extractedData.slipNumber}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Station Name</Text>
                    <Text style={[styles.dataVal, { color: theme.textPrimary }]}>{extractedData.weighbridgeName}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Gross Loaded Weight</Text>
                    <Text style={[styles.dataVal, { color: theme.textPrimary }]}>{extractedData.grossWeight} MT</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Vehicle Tare (Empty)</Text>
                    <Text style={[styles.dataVal, { color: theme.textPrimary }]}>{extractedData.tareWeight} MT</Text>
                  </View>
                  <View style={[styles.dataRow, styles.netRow]}>
                    <Text style={styles.netLabel}>NET DELIVERED WEIGHT</Text>
                    <Text style={styles.netVal}>{extractedData.netWeight} Metric Tons</Text>
                  </View>
                </View>

                <View style={styles.certBadge}>
                  <ShieldCheck size={14} color="#059669" />
                  <Text style={styles.certBadgeText}>Certified Weighment Audit Log Recorded</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {scanState === 'parsed' && (
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                onPress={handleSimulateScan}
                style={[styles.reScanBtn, { borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.reScanText, { color: theme.textPrimary }]}>Rescan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmAcceptance}
                style={styles.confirmBtn}
                activeOpacity={0.85}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Accept & Attach to Delivery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    padding: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
    maxHeight: 380,
  },
  idleContainer: {
    alignItems: 'center',
    gap: 14,
  },
  cameraPlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  cameraHelpText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  cameraSubText: {
    fontSize: 11,
    textAlign: 'center',
  },
  scanBtn: {
    width: '100%',
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scanningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  scanningTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  scanningSub: {
    fontSize: 11.5,
    marginTop: 4,
  },
  parsedContainer: {
    gap: 12,
  },
  matchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  matchBannerText: {
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  dataGrid: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 11.5,
    color: '#64748B',
  },
  dataVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  netRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 4,
  },
  netLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  netVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  certBadgeText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
  },
  reScanBtn: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  reScanText: {
    fontSize: 12,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
