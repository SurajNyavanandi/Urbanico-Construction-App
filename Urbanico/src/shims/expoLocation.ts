export const Accuracy = {
  Balanced: 3,
  High: 4,
};

export const requestForegroundPermissionsAsync = async () => ({ status: 'denied' });
export const getCurrentPositionAsync = async () => null;
export const reverseGeocodeAsync = async () => [];

export default {
  Accuracy,
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  reverseGeocodeAsync,
};
