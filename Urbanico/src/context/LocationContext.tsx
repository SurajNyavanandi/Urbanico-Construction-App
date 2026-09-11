import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SAVED_LOCATIONS } from '../data/materialsData';
import { safeStorage } from '../utils/safeStorage';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export const DEFAULT_LOCATION_COORDS: Record<string, LocationCoords> = {
  'Miyapur Site, Phase 2, Hyderabad': { lat: 17.4948, lng: 78.3578 },
  'Gachibowli Site 4, Hyderabad': { lat: 17.4401, lng: 78.3489 },
  'Hitech City Commercial Tower': { lat: 17.4435, lng: 78.3772 },
  'Jubilee Hills Site 12': { lat: 17.4319, lng: 78.4071 },
  'Kukatpally Housing Board': { lat: 17.4849, lng: 78.3888 },
};

export const DEFAULT_FALLBACK_LOCATION = 'Hyderabad (Telangana)';

interface LocationContextType {
  selectedLocation: string;
  savedLocations: string[];
  currentCoords: LocationCoords;
  setSelectedLocation: (location: string, coords?: LocationCoords) => void;
  addLocation: (newLocation: string, coords?: LocationCoords) => void;
  editLocation: (oldLocation: string, newLocation: string, coords?: LocationCoords) => void;
  deleteLocation: (locationToDelete: string) => void;
  getCoords: (locName: string) => LocationCoords;
  resetLocationsToDefault: () => void;
  loadUserLocations: (userPhone?: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const isDummyAddress = (loc: string) =>
  typeof loc === 'string' && (
    loc.includes('Miyapur Site, Phase 2') ||
    loc.includes('Gachibowli Site 4') ||
    loc.includes('Hitech City Commercial Tower')
  );

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedLocations, setSavedLocations] = useState<string[]>(() => {
    try {
      const authSaved = safeStorage.getItem('urbanico_auth_session');
      const phone = authSaved ? JSON.parse(authSaved).phone : null;
      if (phone) {
        const key = `urbanico_saved_locations_${phone.replace(/\D/g, '')}`;
        const stored = safeStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed.filter((l) => !isDummyAddress(l));
        }
      } else {
        const guestStored = safeStorage.getItem('urbanico_saved_locations_guest');
        if (guestStored) {
          const parsed = JSON.parse(guestStored);
          if (Array.isArray(parsed)) return parsed.filter((l) => !isDummyAddress(l));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [selectedLocation, setSelectedLocationState] = useState<string>(() => {
    try {
      const authSaved = safeStorage.getItem('urbanico_auth_session');
      const phone = authSaved ? JSON.parse(authSaved).phone : null;
      const key = phone ? `urbanico_selected_location_${phone.replace(/\D/g, '')}` : 'urbanico_selected_location_guest';
      const stored = safeStorage.getItem(key);
      if (stored) return stored;
      const universalSel = safeStorage.getItem('urbanico_universal_selected_location');
      if (universalSel) return universalSel;
    } catch {
      // ignore
    }
    return DEFAULT_FALLBACK_LOCATION;
  });

  const [coordsMap, setCoordsMap] = useState<Record<string, LocationCoords>>(() => {
    try {
      const stored = safeStorage.getItem('urbanico_coords_map');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return DEFAULT_LOCATION_COORDS;
  });

  const resetLocationsToDefault = () => {
    setSavedLocations([]);
    setSelectedLocationState(DEFAULT_FALLBACK_LOCATION);
  };

  const loadUserLocations = (userPhone?: string) => {
    if (!userPhone) {
      return;
    }
    try {
      const cleanPhone = userPhone.replace(/\D/g, '');
      const key = `urbanico_saved_locations_${cleanPhone}`;
      const selKey = `urbanico_selected_location_${cleanPhone}`;
      const stored = safeStorage.getItem(key);
      const storedSel = safeStorage.getItem(selKey);

      // Preserve guest or checkout addresses added before login
      const guestKey = 'urbanico_saved_locations_guest';
      const guestStored = safeStorage.getItem(guestKey);
      const guestList: string[] = guestStored ? JSON.parse(guestStored) : [];
      let userList: string[] = stored ? JSON.parse(stored) : [];

      const merged = Array.from(new Set([...userList, ...guestList, ...savedLocations]))
        .filter((l) => Boolean(l) && !isDummyAddress(l));
      setSavedLocations(merged);
      safeStorage.setItem(key, JSON.stringify(merged));
      safeStorage.setItem('urbanico_universal_saved_locations', JSON.stringify(merged));

      if (storedSel) {
        setSelectedLocationState(storedSel);
      } else if (selectedLocation && selectedLocation !== DEFAULT_FALLBACK_LOCATION) {
        setSelectedLocationState(selectedLocation);
        safeStorage.setItem(selKey, selectedLocation);
      }
    } catch {
      // ignore
    }
  };

  // Persist changes with user partition and universal backup
  useEffect(() => {
    try {
      const authSaved = safeStorage.getItem('urbanico_auth_session');
      const phone = authSaved ? JSON.parse(authSaved).phone : null;
      const key = phone ? `urbanico_saved_locations_${phone.replace(/\D/g, '')}` : 'urbanico_saved_locations_guest';
      safeStorage.setItem(key, JSON.stringify(savedLocations));
      safeStorage.setItem('urbanico_universal_saved_locations', JSON.stringify(savedLocations));
    } catch {
      // ignore
    }
  }, [savedLocations]);

  useEffect(() => {
    try {
      const authSaved = safeStorage.getItem('urbanico_auth_session');
      const phone = authSaved ? JSON.parse(authSaved).phone : null;
      const key = phone ? `urbanico_selected_location_${phone.replace(/\D/g, '')}` : 'urbanico_selected_location_guest';
      safeStorage.setItem(key, selectedLocation);
      safeStorage.setItem('urbanico_universal_selected_location', selectedLocation);
    } catch {
      // ignore
    }
  }, [selectedLocation]);

  useEffect(() => {
    try {
      safeStorage.setItem('urbanico_coords_map', JSON.stringify(coordsMap));
    } catch {
      // ignore
    }
  }, [coordsMap]);

  const getCoords = (locName: string): LocationCoords => {
    return coordsMap[locName] || DEFAULT_LOCATION_COORDS[locName] || { lat: 17.4948, lng: 78.3578 };
  };

  const currentCoords = getCoords(selectedLocation);

  const setSelectedLocation = (location: string, coords?: LocationCoords) => {
    if (!location) return;
    const trimmed = location.trim();
    if (coords) {
      setCoordsMap((prev) => ({ ...prev, [trimmed]: coords }));
    }
    setSelectedLocationState(trimmed);
  };

  const addLocation = (newLocation: string, coords?: LocationCoords) => {
    if (!newLocation || !newLocation.trim()) return;
    const trimmed = newLocation.trim();
    if (coords) {
      setCoordsMap((prev) => ({ ...prev, [trimmed]: coords }));
    }
    setSavedLocations((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [trimmed, ...prev];
    });
    setSelectedLocationState(trimmed);
  };

  const editLocation = (oldLocation: string, newLocation: string, coords?: LocationCoords) => {
    if (!newLocation || !newLocation.trim()) return;
    const trimmed = newLocation.trim();
    setSavedLocations((prev) =>
      prev.map((loc) => (loc === oldLocation ? trimmed : loc))
    );
    if (coords) {
      setCoordsMap((prev) => ({ ...prev, [trimmed]: coords }));
    }
    if (selectedLocation === oldLocation) {
      setSelectedLocationState(trimmed);
    }
  };

  const deleteLocation = (locationToDelete: string) => {
    setSavedLocations((prev) => {
      const filtered = prev.filter((loc) => loc !== locationToDelete);
      if (selectedLocation === locationToDelete) {
        const nextLoc = filtered.length > 0 ? filtered[0] : DEFAULT_FALLBACK_LOCATION;
        setSelectedLocationState(nextLoc);
      }
      return filtered;
    });
  };

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        savedLocations,
        currentCoords,
        setSelectedLocation,
        addLocation,
        editLocation,
        deleteLocation,
        getCoords,
        resetLocationsToDefault,
        loadUserLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
