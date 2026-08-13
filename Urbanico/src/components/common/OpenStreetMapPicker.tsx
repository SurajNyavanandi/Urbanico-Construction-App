import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
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

  // Handle postMessage from Leaflet iframe
  useEffect(() => {
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

  const originLat = routeOrigin ? routeOrigin.lat : null;
  const originLng = routeOrigin ? routeOrigin.lng : null;
  const destLat = routeDestination ? routeDestination.lat : selectedPos.lat;
  const destLng = routeDestination ? routeDestination.lng : selectedPos.lng;

  // Build standalone Leaflet HTML for iframe
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
        .popup-badge {
          margin-top: 6px;
          font-size: 10px;
          font-weight: 600;
          color: #0EA5E9;
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

              // Free OpenStreetMap Nominatim reverse geocoding
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

  return (
    <View style={[styles.container, { height }]}>
      <iframe
        title="OpenStreetMap Picker"
        srcDoc={leafletHtml}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '16px',
        }}
        onLoad={() => setLoading(false)}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#0EA5E9" />
          <Text style={styles.loadingText}>Loading Free Map (OpenStreetMap)...</Text>
        </View>
      )}
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
    backgroundColor: '#F8FAFC',
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
});
