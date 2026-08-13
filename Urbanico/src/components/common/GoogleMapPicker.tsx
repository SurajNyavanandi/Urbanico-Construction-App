import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { OpenStreetMapPicker } from './OpenStreetMapPicker';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

export const hasValidGoogleMapsKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export interface LatLng {
  lat: number;
  lng: number;
}

interface GoogleMapPickerProps {
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

// Inner Component that uses hooks from @vis.gl/react-google-maps
const MapController: React.FC<{
  center: LatLng;
  markerPosition?: LatLng;
  markerTitle?: string;
  onLocationSelect?: (pos: LatLng, address?: string) => void;
  interactive?: boolean;
  routeOrigin?: LatLng;
  routeDestination?: LatLng;
}> = ({
  center,
  markerPosition,
  markerTitle,
  onLocationSelect,
  interactive = true,
  routeOrigin,
  routeDestination,
}) => {
  const map = useMap();
  const geocodingLib = useMapsLibrary('geocoding');
  const routesLib = useMapsLibrary('routes');
  const [selectedPos, setSelectedPos] = useState<LatLng>(markerPosition || center);
  const [addressText, setAddressText] = useState<string>(markerTitle || '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);

  // Update center when props change
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center.lat, center.lng]);

  useEffect(() => {
    if (markerPosition) {
      setSelectedPos(markerPosition);
    }
  }, [markerPosition?.lat, markerPosition?.lng]);

  // Handle map click to pick location
  const handleMapClick = async (e: MapMouseEvent) => {
    if (!interactive || !e.detail.latLng) return;
    const newPos = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
    setSelectedPos(newPos);
    setInfoOpen(true);

    if (geocodingLib) {
      setIsGeocoding(true);
      try {
        const geocoder = new geocodingLib.Geocoder();
        const res = await geocoder.geocode({ location: newPos });
        if (res.results && res.results[0]) {
          const formatted = res.results[0].formatted_address;
          setAddressText(formatted);
          if (onLocationSelect) {
            onLocationSelect(newPos, formatted);
          }
        } else {
          if (onLocationSelect) onLocationSelect(newPos);
        }
      } catch (err) {
        console.warn('Geocoding error:', err);
        if (onLocationSelect) onLocationSelect(newPos);
      } finally {
        setIsGeocoding(false);
      }
    } else if (onLocationSelect) {
      onLocationSelect(newPos);
    }
  };

  // Render polyline route if origin and destination provided
  useEffect(() => {
    if (!routesLib || !map || !routeOrigin || !routeDestination) return;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#0EA5E9',
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    });

    directionsService.route(
      {
        origin: routeOrigin,
        destination: routeDestination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        }
      }
    );

    return () => {
      directionsRenderer.setMap(null);
    };
  }, [routesLib, map, routeOrigin?.lat, routeOrigin?.lng, routeDestination?.lat, routeDestination?.lng]);

  return (
    <>
      <AdvancedMarker
        position={selectedPos}
        onClick={() => setInfoOpen(!infoOpen)}
      >
        <Pin background="#0EA5E9" glyphColor="#FFFFFF" borderColor="#0284C7" />
      </AdvancedMarker>

      {routeOrigin && (
        <AdvancedMarker position={routeOrigin} title="Depot Warehouse">
          <Pin background="#10B981" glyphColor="#FFFFFF" />
        </AdvancedMarker>
      )}

      {infoOpen && (
        <InfoWindow
          position={selectedPos}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div style={{ padding: '6px', maxWidth: '220px', fontFamily: 'sans-serif' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', marginBottom: '4px' }}>
              {markerTitle || 'Selected Delivery Site'}
            </div>
            {isGeocoding ? (
              <div style={{ fontSize: '11px', color: '#64748B' }}>Finding address...</div>
            ) : (
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.3' }}>
                {addressText || `${selectedPos.lat.toFixed(4)}, ${selectedPos.lng.toFixed(4)}`}
              </div>
            )}
            {interactive && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#0EA5E9', fontWeight: '600' }}>
                Tap map to move pin
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const GoogleMapPicker: React.FC<GoogleMapPickerProps> = (props) => {
  const {
    center,
    zoom = 13,
    markerPosition,
    markerTitle,
    onLocationSelect,
    height = 280,
    interactive = true,
    routeOrigin,
    routeDestination,
  } = props;

  // If no valid Google Maps key is present, fallback to free OpenStreetMap Leaflet map
  if (!hasValidGoogleMapsKey) {
    return (
      <OpenStreetMapPicker
        center={center}
        zoom={zoom}
        markerPosition={markerPosition}
        markerTitle={markerTitle}
        onLocationSelect={onLocationSelect}
        height={height}
        interactive={interactive}
        routeOrigin={routeOrigin}
        routeDestination={routeDestination}
      />
    );
  }

  return (
    <View style={[styles.mapContainer, { height }]}>
      <APIProvider apiKey={API_KEY} version="weekly" libraries={['places', 'geocoding', 'routes']}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="URBANICO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%', borderRadius: 16 }}
          gestureHandling={interactive ? 'greedy' : 'none'}
          disableDefaultUI={!interactive}
        >
          <MapController
            center={center}
            markerPosition={markerPosition}
            markerTitle={markerTitle}
            onLocationSelect={onLocationSelect}
            interactive={interactive}
            routeOrigin={routeOrigin}
            routeDestination={routeDestination}
          />
        </Map>
      </APIProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});

