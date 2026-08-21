import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SAVED_LOCATIONS } from '../data/materialsData';

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

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedLocations, setSavedLocations] = useState<string[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const authSaved = window.localStorage.getItem('urbanico_auth_session');
        const phone = authSaved ? JSON.parse(authSaved).phone : null;
        const key = phone ? `urbanico_saved_locations_${phone.replace(/\D/g, '')}` : 'urbanico_saved_locations_guest';
        const stored = window.localStorage.getItem(key) || window.localStorage.getItem('urbanico_saved_locations');
        if (stored) return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return SAVED_LOCATIONS;
  });

  const [selectedLocation, setSelectedLocationState] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const authSaved = window.localStorage.getItem('urbanico_auth_session');
        const phone = authSaved ? JSON.parse(authSaved).phone : null;
        const key = phone ? `urbanico_selected_location_${phone.replace(/\D/g, '')}` : 'urbanico_selected_location_guest';
        const stored = window.localStorage.getItem(key) || window.localStorage.getItem('urbanico_selected_location');
        if (stored) return stored;
      }
    } catch {
      // ignore
    }
    return SAVED_LOCATIONS[0];
  });

  const [coordsMap, setCoordsMap] = useState<Record<string, LocationCoords>>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('urbanico_coords_map');
        if (stored) return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return DEFAULT_LOCATION_COORDS;
  });

  const resetLocationsToDefault = () => {
    setSavedLocations(SAVED_LOCATIONS);
    setSelectedLocationState(SAVED_LOCATIONS[0]);
  };

  const loadUserLocations = (userPhone?: string) => {
    if (!userPhone) {
      resetLocationsToDefault();
      return;
    }
    try {
      const cleanPhone = userPhone.replace(/\D/g, '');
      const key = `urbanico_saved_locations_${cleanPhone}`;
      const selKey = `urbanico_selected_location_${cleanPhone}`;
      const stored = window.localStorage.getItem(key);
      const storedSel = window.localStorage.getItem(selKey);
      if (stored) {
        setSavedLocations(JSON.parse(stored));
      } else {
        setSavedLocations(SAVED_LOCATIONS);
      }
      if (storedSel) {
        setSelectedLocationState(storedSel);
      } else {
        setSelectedLocationState(SAVED_LOCATIONS[0]);
      }
    } catch {
      // ignore
    }
  };

  // Persist changes to localStorage with user partition
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const authSaved = window.localStorage.getItem('urbanico_auth_session');
        const phone = authSaved ? JSON.parse(authSaved).phone : null;
        const key = phone ? `urbanico_saved_locations_${phone.replace(/\D/g, '')}` : 'urbanico_saved_locations_guest';
        window.localStorage.setItem(key, JSON.stringify(savedLocations));
      }
    } catch {
      // ignore
    }
  }, [savedLocations]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const authSaved = window.localStorage.getItem('urbanico_auth_session');
        const phone = authSaved ? JSON.parse(authSaved).phone : null;
        const key = phone ? `urbanico_selected_location_${phone.replace(/\D/g, '')}` : 'urbanico_selected_location_guest';
        window.localStorage.setItem(key, selectedLocation);
      }
    } catch {
      // ignore
    }
  }, [selectedLocation]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('urbanico_coords_map', JSON.stringify(coordsMap));
      }
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
        const nextLoc = filtered.length > 0 ? filtered[0] : SAVED_LOCATIONS[0];
        setSelectedLocationState(nextLoc);
      }
      return filtered.length > 0 ? filtered : [SAVED_LOCATIONS[0]];
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
