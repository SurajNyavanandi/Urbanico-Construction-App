import { useState, useCallback } from 'react';
import { lookupCityStateFromPincode } from '../utils/addressHelper';
import { validateName, validatePhone } from '../utils/sanitizationHelper';

export interface AddressFormData {
  fullName: string;
  mobile: string;
  altPhone?: string;
  pincode: string;
  flatBuilding: string;
  areaStreet: string;
  landmark?: string;
  city: string;
  state: string;
  addressType: 'Site' | 'Home' | 'Office' | 'Warehouse';
  deliveryInstructions?: string;
}

export interface AddressFormErrors {
  fullName?: string;
  mobile?: string;
  pincode?: string;
  flatBuilding?: string;
  areaStreet?: string;
  general?: string;
}

export function useAddressForm(initialData?: Partial<AddressFormData>) {
  const [formData, setFormData] = useState<AddressFormData>({
    fullName: initialData?.fullName || '',
    mobile: initialData?.mobile || '',
    altPhone: initialData?.altPhone || '',
    pincode: initialData?.pincode || '',
    flatBuilding: initialData?.flatBuilding || '',
    areaStreet: initialData?.areaStreet || '',
    landmark: initialData?.landmark || '',
    city: initialData?.city || 'Hyderabad',
    state: initialData?.state || 'Telangana',
    addressType: initialData?.addressType || 'Site',
    deliveryInstructions: initialData?.deliveryInstructions || '',
  });

  const [errors, setErrors] = useState<AddressFormErrors>({});

  const updateField = useCallback(<K extends keyof AddressFormData>(field: K, value: AddressFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  }, []);

  const handlePincodeChange = useCallback((text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 6);
    setFormData((prev) => {
      const next = { ...prev, pincode: clean };
      if (clean.length >= 3) {
        const lookup = lookupCityStateFromPincode(clean);
        if (lookup.city) next.city = lookup.city;
        if (lookup.state) next.state = lookup.state;
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, pincode: undefined, general: undefined }));
  }, []);

  const validate = useCallback((): { isValid: boolean; fullAddress: string; error?: string } => {
    const newErrors: AddressFormErrors = {};

    const nameVal = validateName(formData.fullName, 'Full Name / Site Incharge');
    if (!nameVal.isValid) {
      newErrors.fullName = nameVal.error || 'Please enter full name or site incharge';
    }

    const phoneVal = validatePhone(formData.mobile, 'Mobile Number');
    if (!phoneVal.isValid) {
      newErrors.mobile = phoneVal.error || 'Please enter a valid 10-digit mobile number';
    }

    const cleanPin = formData.pincode.trim();
    if (!cleanPin || cleanPin.length !== 6) {
      newErrors.pincode = 'Please enter a valid 6-digit Indian pincode';
    } else {
      const pinPrefix = parseInt(cleanPin.slice(0, 3), 10);
      if (isNaN(pinPrefix) || pinPrefix < 500 || pinPrefix > 509) {
        newErrors.pincode = 'Currently delivering exclusively across Hyderabad & Telangana (PIN: 500xxx - 509xxx)';
      }
    }

    if (!formData.flatBuilding.trim() || formData.flatBuilding.trim().length < 2) {
      newErrors.flatBuilding = 'Please enter flat/plot/building or site name (min 2 chars)';
    }

    if (!formData.areaStreet.trim() || formData.areaStreet.trim().length < 3) {
      newErrors.areaStreet = 'Please enter street or area name (min 3 chars)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErr = Object.values(newErrors)[0];
      return { isValid: false, fullAddress: '', error: firstErr };
    }

    setErrors({});
    const landmarkPart = formData.landmark?.trim() ? `, Near ${formData.landmark.trim()}` : '';
    const fullAddress = `${formData.flatBuilding.trim()}, ${formData.areaStreet.trim()}${landmarkPart}, ${formData.city.trim()} - ${formData.pincode.trim()}, ${formData.state.trim()}`;

    return { isValid: true, fullAddress };
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      fullName: '',
      mobile: '',
      altPhone: '',
      pincode: '',
      flatBuilding: '',
      areaStreet: '',
      landmark: '',
      city: 'Hyderabad',
      state: 'Telangana',
      addressType: 'Site',
      deliveryInstructions: '',
    });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    updateField,
    handlePincodeChange,
    validate,
    resetForm,
    setFormData,
  };
}
