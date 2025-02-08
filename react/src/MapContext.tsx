// src/MapContext.tsx
import React, { createContext, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface MapContextType {
    map: React.MutableRefObject<maplibregl.Map | null>;
    featuresMap: React.MutableRefObject<{ [key: string]: string[] }>;
    markersMap: React.MutableRefObject<{ [key: string]: maplibregl.Marker[] }>;
    currentFormId: React.MutableRefObject<string | null>;
}

export const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC = ({ children }) => {
    const map = useRef<maplibregl.Map | null>(null);
    const featuresMap = useRef<{ [key: string]: string[] }>({});
    const markersMap = useRef<{ [key: string]: maplibregl.Marker[] }>({});
    const currentFormId = useRef<string | null>(null);

    return (
        <MapContext.Provider value={{ map, featuresMap, markersMap, currentFormId }}>
            {children}
        </MapContext.Provider>
    );
};
