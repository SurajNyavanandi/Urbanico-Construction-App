import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SAVED_LOCATIONS } from '../data/materialsData';

interface LocationContextType {
  selectedLocation: string;
  savedLocations: string[];
  setSelectedLocation: (location: string) => void;
  addLocation: (newLocation: string) => void;
  editLocation: (oldLocation: string, newLocation: string) => void;
  deleteLocation: (locationToDelete: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedLocations, setSavedLocations] = useState<string[]>(SAVED_LOCATIONS);
  const [selectedLocation, setSelectedLocationState] = useState<string>(SAVED_LOCATIONS[0]);

  const setSelectedLocation = (location: string) => {
    if (!location) return;
    const trimmed = location.trim();
    setSelectedLocationState(trimmed);
  };

  const addLocation = (newLocation: string) => {
    if (!newLocation || !newLocation.trim()) return;
    const trimmed = newLocation.trim();
    setSavedLocations((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [trimmed, ...prev];
    });
    setSelectedLocationState(trimmed);
  };

  const editLocation = (oldLocation: string, newLocation: string) => {
    if (!newLocation || !newLocation.trim()) return;
    const trimmed = newLocation.trim();
    setSavedLocations((prev) =>
      prev.map((loc) => (loc === oldLocation ? trimmed : loc))
    );
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
        setSelectedLocation,
        addLocation,
        editLocation,
        deleteLocation,
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
