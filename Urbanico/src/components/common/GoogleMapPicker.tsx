import React from 'react';
import { OpenStreetMapPicker } from './OpenStreetMapPicker';

export interface LatLng {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  center: LatLng;
  zoom?: number;
  markerPosition?: LatLng;
  markerTitle?: string;
  onLocationSelect?: (pos: LatLng, address?: string) => void;
  height?: number | string;
  interactive?: boolean;
  routeOrigin?: LatLng;
  routeDestination?: LatLng;
}

/**
 * SiteMapPicker / GoogleMapPicker
 * Uses free, production-ready Leaflet + OpenStreetMap & Nominatim reverse geocoding
 * Zero API keys, zero billing, zero network bundle blockers.
 */
export const GoogleMapPicker: React.FC<MapPickerProps> = (props) => {
  return <OpenStreetMapPicker {...props} />;
};

export const SiteMapPicker = GoogleMapPicker;
