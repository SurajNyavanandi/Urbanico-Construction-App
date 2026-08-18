import React, { useEffect, useState, createElement } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { MapPin, Navigation, Compass, ExternalLink, Layers } from 'lucide-react-native';
import { LatLng } from './GoogleMapPicker';

interface OpenStreetMapPickerProps {
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

export const OpenStreetMapPicker: React.FC<OpenStreetMapPickerProps> = ({
  center,
  zoom = 13,
  markerPosition,
  markerTitle = 'Selected Delivery Site',
  onLocationSelect,
  height = 280,
  interactive = true,
  routeOrigin,
  routeDestination,
}) => {
  const selectedPos = markerPosition || center;
  const [loading, setLoading] = useState(true);
  const [nativeAddress, setNativeAddress] = useState<string>('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  const originLat = routeOrigin ? routeOrigin.lat : null;
  const originLng = routeOrigin ? routeOrigin.lng : null;
  const destLat = routeDestination ? routeDestination.lat : selectedPos.lat;
  const destLng = routeDestination ? routeDestination.lng : selectedPos.lng;

  // Handle postMessage from Leaflet iframe on Web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'LOCATION_SELECTED') {
        const { lat, lng, address } = event.data;
        if (onLocationSelect) {
          onLocationSelect({ lat, lng }, address);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onLocationSelect]);

  // Native reverse geocode lookup
  useEffect(() => {
    if (Platform.OS !== 'web') {
      setIsResolvingAddress(true);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedPos.lat}&lon=${selectedPos.lng}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name) {
            setNativeAddress(data.display_name);
          } else {
            setNativeAddress(`${selectedPos.lat.toFixed(4)}° N, ${selectedPos.lng.toFixed(4)}° E`);
          }
        })
        .catch(() => {
          setNativeAddress(`${selectedPos.lat.toFixed(4)}° N, ${selectedPos.lng.toFixed(4)}° E`);
        })
        .finally(() => {
          setIsResolvingAddress(false);
          setLoading(false);
        });
    }
  }, [selectedPos.lat, selectedPos.lng]);

  const handleOpenExternalMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${selectedPos.lat},${selectedPos.lng}`,
      android: `geo:0,0?q=${selectedPos.lat},${selectedPos.lng}(${encodeURIComponent(markerTitle)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${selectedPos.lat},${selectedPos.lng}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${selectedPos.lat},${selectedPos.lng}`);
    });
  };

  // Build standalone Leaflet HTML for web iframe
  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .popup-title {
          font-weight: 700;
          font-size: 13px;
          color: #0F172A;
          margin-bottom: 4px;
        }
        .popup-sub {
          font-size: 11px;
          color: #64748B;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          var centerLat = ${selectedPos.lat};
          var centerLng = ${selectedPos.lng};
          var isInteractive = ${interactive};
          var title = "${markerTitle.replace(/"/g, '\\"')}";

          var map = L.map('map', {
            zoomControl: isInteractive,
            dragging: isInteractive,
            touchZoom: isInteractive,
            scrollWheelZoom: isInteractive,
            doubleClickZoom: isInteractive
          }).setView([centerLat, centerLng], ${zoom});

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          var primaryIcon = L.divIcon({
            className: 'custom-pin',
            html: '<div style="background-color: #0EA5E9; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(14,165,233,0.5); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          var marker = L.marker([centerLat, centerLng], { icon: primaryIcon }).addTo(map);
          marker.bindPopup('<div class="popup-title">' + title + '</div><div class="popup-sub">' + centerLat.toFixed(4) + ', ' + centerLng.toFixed(4) + '</div>').openPopup();

          ${
            routeOrigin
              ? `
            var depotIcon = L.divIcon({
              className: 'depot-pin',
              html: '<div style="background-color: #10B981; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(16,185,129,0.5); display: flex; align-items: center; justify-content: center;"><div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div></div>',
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            });
            var depotMarker = L.marker([${originLat}, ${originLng}], { icon: depotIcon }).addTo(map);
            depotMarker.bindPopup('<div class="popup-title">Depot Warehouse</div><div class="popup-sub">Dispatch Station</div>');

            var polyline = L.polyline([
              [${originLat}, ${originLng}],
              [${destLat}, ${destLng}]
            ], {
              color: '#0EA5E9',
              weight: 4,
              opacity: 0.85,
              dashArray: '8, 8'
            }).addTo(map);

            map.fitBounds([
              [${originLat}, ${originLng}],
              [${destLat}, ${destLng}]
            ], { padding: [30, 30] });
          `
              : ''
          }

          if (isInteractive) {
            map.on('click', function(e) {
              var lat = e.latlng.lat;
              var lng = e.latlng.lng;
              marker.setLatLng([lat, lng]);

              marker.bindPopup('<div class="popup-title">' + title + '</div><div class="popup-sub">Locating address...</div>').openPopup();

              fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng)
                .then(function(res) { return res.json(); })
                .then(function(data) {
                  var address = data.display_name || (lat.toFixed(4) + ', ' + lng.toFixed(4));
                  marker.bindPopup('<div class="popup-title">' + title + '</div><div class="popup-sub">' + address + '</div>').openPopup();
                  window.parent.postMessage({ type: 'LOCATION_SELECTED', lat: lat, lng: lng, address: address }, '*');
                })
                .catch(function() {
                  window.parent.postMessage({ type: 'LOCATION_SELECTED', lat: lat, lng: lng }, '*');
                });
            });
          }
        });
      </script>
    </body>
    </html>
  `;

  // On Web: use createElement to avoid React Native JSX NativeRegistry registration
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }]}>
        {createElement('iframe', {
          title: 'OpenStreetMap Picker',
          srcDoc: leafletHtml,
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '16px',
          },
          onLoad: () => setLoading(false),
        })}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#0EA5E9" />
            <Text style={styles.loadingText}>Loading Map (OpenStreetMap)...</Text>
          </View>
        )}
      </View>
    );
  }

  // On Native Android & iOS: Render pure React Native Interactive Location & Map Card
  return (
    <View style={[styles.container, { height }]}>
      {/* Visual Blueprint / Satellite Background Canvas */}
      <View style={styles.nativeMapCanvas}>
        {/* Grid lines */}
        <View style={styles.mapGridRow}>
          <View style={styles.mapGridCell} />
          <View style={styles.mapGridCell} />
          <View style={styles.mapGridCell} />
        </View>
        <View style={styles.mapGridRow}>
          <View style={styles.mapGridCell} />
          <View style={styles.mapGridCell} />
          <View style={styles.mapGridCell} />
        </View>

        {/* Depot Node (if route active) */}
        {routeOrigin && (
          <View style={styles.depotNode}>
            <View style={styles.depotDot} />
            <Text style={styles.depotLabel}>Depot Warehouse</Text>
          </View>
        )}

        {/* Trajectory Route Line (if route active) */}
        {routeOrigin && <View style={styles.routeLine} />}

        {/* Destination / Selected Site Pin */}
        <View style={styles.siteMarkerContainer}>
          <View style={styles.pulseRing} />
          <View style={styles.markerBadge}>
            <MapPin size={18} color="#FFFFFF" />
          </View>
          <View style={styles.markerCallout}>
            <Text style={styles.markerCalloutTitle} numberOfLines={1}>
              {markerTitle}
            </Text>
            <Text style={styles.markerCalloutCoords}>
              {selectedPos.lat.toFixed(4)}, {selectedPos.lng.toFixed(4)}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Floating Control Bar */}
      <View style={styles.nativeBottomBar}>
        <View style={styles.addressContainer}>
          <View style={styles.addressHeaderRow}>
            <Compass size={12} color="#0EA5E9" />
            <Text style={styles.addressHeaderLabel}>Site GPS Coordinates</Text>
          </View>
          <Text style={styles.addressText} numberOfLines={1}>
            {isResolvingAddress
              ? 'Locating address via GPS...'
              : nativeAddress || `${selectedPos.lat.toFixed(5)}, ${selectedPos.lng.toFixed(5)}`}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleOpenExternalMaps}
          style={styles.openMapsButton}
          activeOpacity={0.8}
        >
          <Navigation size={14} color="#FFFFFF" />
          <Text style={styles.openMapsButtonText}>Navigate</Text>
          <ExternalLink size={12} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  // Native React Native Mobile Styles
  nativeMapCanvas: {
    flex: 1,
    backgroundColor: '#0F172A',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapGridRow: {
    flexDirection: 'row',
    width: '100%',
    flex: 1,
  },
  mapGridCell: {
    flex: 1,
    borderColor: '#1E293B',
    borderWidth: 0.5,
  },
  depotNode: {
    position: 'absolute',
    top: 24,
    left: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  depotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  depotLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  routeLine: {
    position: 'absolute',
    top: 48,
    left: 45,
    width: 120,
    height: 2,
    backgroundColor: '#0EA5E9',
    transform: [{ rotate: '35deg' }],
    borderStyle: 'dashed',
  },
  siteMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.25)',
  },
  markerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0EA5E9',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  markerCallout: {
    marginTop: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  markerCalloutTitle: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  markerCalloutCoords: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 1,
  },
  nativeBottomBar: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  addressContainer: {
    flex: 1,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  addressHeaderLabel: {
    color: '#0EA5E9',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  addressText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '500',
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  openMapsButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
