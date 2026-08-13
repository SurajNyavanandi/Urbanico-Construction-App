import React, { createContext, useContext, useState, ReactNode } from 'react';
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
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedLocations, setSavedLocations] = useState<string[]>(SAVED_LOCATIONS);
  const [selectedLocation, setSelectedLocationState] = useState<string>(SAVED_LOCATIONS[0]);
  const [coordsMap, setCoordsMap] = useState<Record<string, LocationCoords>>(DEFAULT_LOCATION_COORDS);

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
      if (selectedLocation === locationToDelete && filtered.length > 0) {
        setSelectedLocationState(filtered[0]);
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
