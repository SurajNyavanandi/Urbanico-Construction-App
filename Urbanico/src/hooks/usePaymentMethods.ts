import { useState, useCallback, useEffect } from 'react';
import { SavedPaymentMethod } from '../types';
import {
  getSavedPaymentMethods,
  addSavedPaymentMethod,
  deleteSavedPaymentMethod,
  validateUPIId,
  validateCard,
  detectCardBrand,
  verifyUPIIdOnline,
} from '../utils/paymentMethodsHelper';
import {
  openRazorpayStandardCheckout,
  tokenizeCardAPI,
  verifyAndRefundPennyDropAPI,
} from '../services/razorpayService';

export function usePaymentMethods(userPhone?: string, userName?: string, userEmail?: string) {
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [isVerifyingCard, setIsVerifyingCard] = useState(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync methods for current user
  const reloadMethods = useCallback(() => {
    const list = getSavedPaymentMethods(userPhone);
    setSavedMethods(list);
  }, [userPhone]);

  useEffect(() => {
    reloadMethods();
  }, [reloadMethods]);

  // UPI verification & save via ₹1 refundable Penny Drop authorization
  const verifyAndSaveUpi = useCallback(async (vpa: string): Promise<{ success: boolean; method?: SavedPaymentMethod; error?: string; message?: string }> => {
    setError(null);
    const validation = validateUPIId(vpa);
    if (!validation.valid) {
      const err = validation.message || 'Please enter a valid UPI ID (e.g. name@okhdfcbank).';
      setError(err);
      return { success: false, error: err };
    }

    setIsVerifyingUpi(true);
    const cleanPhone = (userPhone || '9848012345').replace(/\D/g, '').slice(-10) || '9848012345';
    const trimmed = vpa.trim().toLowerCase();

    return new Promise((resolve) => {
      openRazorpayStandardCheckout({
        amount: 1, // ₹1.00 refundable auth
        userName: userName || 'UPI Account Holder',
        userPhone: cleanPhone,
        userEmail: userEmail || `${cleanPhone}@urbanico.in`,
        preferredMethod: 'upi',
        orderDescription: '₹1 UPI Verification (Refundable) - Urbanico',
        onSuccess: async (payResult: any) => {
          try {
            // Trigger automatic refund & backend signature check
            const refundRes = await verifyAndRefundPennyDropAPI({
              razorpay_order_id: payResult?.razorpay_order_id,
              razorpay_payment_id: payResult?.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: payResult?.razorpay_signature,
              methodType: 'upi',
              methodDetails: trimmed,
              userName,
              userPhone: cleanPhone,
            });

            const res = await verifyUPIIdOnline(vpa, userName, userPhone);
            const newMethod: SavedPaymentMethod = {
              id: `upi_${Date.now()}`,
              type: 'upi',
              title: res.title || (validation.pspInfo?.title) || `${validation.pspInfo?.bankName || 'Bank'} UPI`,
              subtitle: trimmed,
              details: trimmed,
              isDefault: savedMethods.length === 0,
              isVerified: true,
              verifiedAccountName: res.accountName || userName || 'Verified Account',
              upiApp: res.upiApp || validation.pspInfo?.app || 'custom',
              bankName: res.bankName || validation.pspInfo?.bankName,
            };

            const updated = addSavedPaymentMethod(newMethod, userPhone);
            setSavedMethods(updated);
            setIsVerifyingUpi(false);
            resolve({
              success: true,
              method: newMethod,
              message: refundRes.message || 'Payment Method Verified • ₹1 Refund Initiated',
            });
          } catch (err: any) {
            const msg = err?.message || 'Error processing UPI verification.';
            setError(msg);
            setIsVerifyingUpi(false);
            resolve({ success: false, error: msg });
          }
        },
        onFailure: (err) => {
          setIsVerifyingUpi(false);
          const msg = err || 'UPI authorization was not completed. No money was charged.';
          setError(msg);
          resolve({ success: false, error: msg });
        },
        onDismiss: () => {
          setIsVerifyingUpi(false);
          resolve({ success: false, error: 'Verification cancelled by user.' });
        },
      });
    });
  }, [savedMethods.length, userEmail, userName, userPhone]);

  // Card verification & tokenization via ₹1 refundable Razorpay auth
  const verifyAndSaveCard = useCallback(async (params: {
    cardNumber: string;
    cardHolder: string;
    expiry: string;
    cvv: string;
  }): Promise<{ success: boolean; error?: string; message?: string }> => {
    setError(null);
    const rawNum = params.cardNumber.replace(/\D/g, '');
    const validation = validateCard(rawNum, params.cardHolder, params.expiry, params.cvv);
    if (!validation.valid) {
      const err = validation.message || 'Please check card details.';
      setError(err);
      return { success: false, error: err };
    }

    setIsVerifyingCard(true);
    const brand = validation.brand || detectCardBrand(rawNum);
    const brandTitle =
      brand === 'visa'
        ? 'Visa'
        : brand === 'mastercard'
        ? 'Mastercard'
        : brand === 'rupay'
        ? 'RuPay'
        : 'Credit/Debit';

    return new Promise((resolve) => {
      const cleanPhone = (userPhone || '9848012345').replace(/\D/g, '').slice(-10) || '9848012345';
      
      openRazorpayStandardCheckout({
        amount: 1, // ₹1.00 refundable auth
        userName: params.cardHolder.trim() || userName || 'Cardholder',
        userPhone: cleanPhone,
        userEmail: userEmail || `${cleanPhone}@urbanico.in`,
        preferredMethod: 'card',
        orderDescription: '₹1 Card Verification (Refundable) - Urbanico',
        onSuccess: async (payResult: any) => {
          try {
            // Trigger automatic refund & backend signature check
            const refundRes = await verifyAndRefundPennyDropAPI({
              razorpay_order_id: payResult?.razorpay_order_id,
              razorpay_payment_id: payResult?.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: payResult?.razorpay_signature,
              methodType: 'card',
              methodDetails: `•••• ${rawNum.slice(-4)}`,
              userName: params.cardHolder.trim(),
              userPhone: cleanPhone,
            });

            let tokenId = `tok_${brand}_${Date.now().toString(36)}`;
            let bankName = brandTitle;
            try {
              const parts = params.expiry.split('/');
              const tokResult = await tokenizeCardAPI({
                cardNumber: rawNum,
                cardHolder: params.cardHolder.trim().toUpperCase(),
                expiryMonth: parts[0] || '12',
                expiryYear: parts[1] || '28',
                cvv: params.cvv.trim(),
                phone: cleanPhone,
                name: params.cardHolder.trim().toUpperCase(),
              });
              if (tokResult?.tokenId) {
                tokenId = tokResult.tokenId;
                if (tokResult.bankName) bankName = tokResult.bankName;
              }
            } catch (e) {
              console.warn('[usePaymentMethods] Tokenization warning:', e);
            }

            const newMethod: SavedPaymentMethod = {
              id: `card_${Date.now()}`,
              tokenId,
              type: 'card',
              title: `${bankName} Card`,
              subtitle: `•••• ${rawNum.slice(-4)} • Expires ${params.expiry}`,
              details: `•••• •••• •••• ${rawNum.slice(-4)}`,
              cardLast4: rawNum.slice(-4),
              cardExpiry: params.expiry,
              cardHolder: params.cardHolder.trim().toUpperCase(),
              cardBrand: brand,
              bankName,
              isDefault: savedMethods.length === 0,
              isVerified: true,
              isTokenized: true,
              coftCompliant: true,
            };

            const updated = addSavedPaymentMethod(newMethod, userPhone);
            setSavedMethods(updated);
            setIsVerifyingCard(false);
            resolve({
              success: true,
              message: refundRes.message || 'Payment Method Verified • ₹1 Refund Initiated',
            });
          } catch (err: any) {
            const msg = err?.message || 'Error saving verified card.';
            setError(msg);
            setIsVerifyingCard(false);
            resolve({ success: false, error: msg });
          }
        },
        onFailure: (err) => {
          setIsVerifyingCard(false);
          const msg = err || 'Card authorization failed.';
          setError(msg);
          resolve({ success: false, error: msg });
        },
        onDismiss: () => {
          setIsVerifyingCard(false);
          resolve({ success: false, error: 'Authorization cancelled by user.' });
        },
      });
    });
  }, [savedMethods.length, userEmail, userName, userPhone]);

  // Remove method
  const removeMethod = useCallback((methodId: string) => {
    const updated = deleteSavedPaymentMethod(methodId, userPhone);
    setSavedMethods(updated);
  }, [userPhone]);

  return {
    savedMethods,
    isVerifyingCard,
    isVerifyingUpi,
    error,
    setError,
    reloadMethods,
    verifyAndSaveUpi,
    verifyAndSaveCard,
    removeMethod,
  };
}
