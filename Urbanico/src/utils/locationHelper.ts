import { Platform } from 'react-native';

// Safe module resolver for Expo Location across React Native Metro and Web
let ExpoLocationModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoLocationModule = require('expo-location');
} catch {
  // If not available or running in web bundler without require
}

export interface LocationResult {
  coords: {
    lat: number;
    lng: number;
  };
  address?: string;
  pincode?: string;
  city?: string;
  state?: string;
}

/**
 * Request location permission and obtain real-time GPS coordinates.
 * Operates natively via Expo Location on Android / iOS with fallback to Web Geolocation.
 */
export async function getCurrentDeviceLocation(): Promise<LocationResult> {
  // 1. Mobile Native (Android & iOS via Expo Location)
  if (Platform.OS !== 'web' && ExpoLocationModule) {
    try {
      const { status } = await ExpoLocationModule.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission was denied by user');
      }

      const location = await ExpoLocationModule.getCurrentPositionAsync({
        accuracy: ExpoLocationModule.Accuracy?.Balanced || 3,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      // Reverse geocode via Expo Location
      let address = '';
      let pincode = '';
      let city = '';
      let state = '';

      try {
        if (typeof ExpoLocationModule.reverseGeocodeAsync === 'function') {
          const reverseGeocode = await ExpoLocationModule.reverseGeocodeAsync({
            latitude: lat,
            longitude: lng,
          });

          if (reverseGeocode && reverseGeocode.length > 0) {
            const item = reverseGeocode[0];
            city = item.city || item.subregion || item.district || '';
            state = item.region || '';
            pincode = item.postalCode || '';
            const street = [item.name, item.street, item.district].filter(Boolean).join(', ');
            address = [street, city, state, pincode].filter(Boolean).join(', ');
          }
        }
      } catch {
        // Fallback geocode format
      }

      return {
        coords: { lat, lng },
        address: address || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
        pincode,
        city,
        state,
      };
    } catch (err: any) {
      console.warn('Native Expo location warning:', err?.message || err);
      // Fall through to HTTP/Web/Fallback geocoding
    }
  }

  // 2. Web / Browser / Fallback geolocation
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            const addr = data?.address || {};
            const detectedPincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : '';
            const detectedCity = addr.city || addr.town || addr.village || addr.suburb || 'Hyderabad';
            const detectedState = addr.state || 'Telangana';

            resolve({
              coords: { lat, lng },
              address: data?.display_name || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
              pincode: detectedPincode,
              city: detectedCity,
              state: detectedState,
            });
          } catch {
            resolve({
              coords: { lat, lng },
              address: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
              city: 'Hyderabad',
              state: 'Telangana',
              pincode: '500049',
            });
          }
        },
        () => {
          // Fallback location if permission denied
          resolve({
            coords: { lat: 17.4933, lng: 78.3414 },
            address: 'Miyapur Main Road, Phase 2, Hyderabad',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500049',
          });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      resolve({
        coords: { lat: 17.4933, lng: 78.3414 },
        address: 'Miyapur Main Road, Phase 2, Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500049',
      });
    }
  });
}

