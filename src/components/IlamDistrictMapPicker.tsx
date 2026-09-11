import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Compass, Check, RefreshCw } from 'lucide-react';
import { PermittedMunicipality } from '../types';

export interface DeliveryLocationData {
  lat: number;
  lng: number;
  municipality: PermittedMunicipality;
  ward?: string;
  toleArea?: string;
  landmark?: string;
  displayName: string;
}

interface IlamDistrictMapPickerProps {
  selectedLocation?: { lat: number; lng: number };
  currentMunicipality?: PermittedMunicipality;
  currentWard?: string;
  currentTole?: string;
  onLocationSelect: (data: DeliveryLocationData) => void;
}

// Major delivery landmarks in Ilam District, Nepal
export const ILAM_MAJOR_LOCATIONS = [
  {
    name: 'Fikkal Bazaar',
    municipality: 'Suryodaya Municipality' as PermittedMunicipality,
    ward: '10',
    lat: 26.8997,
    lng: 88.0844,
    description: 'RTSS HQ / Commercial Hub'
  },
  {
    name: 'Kanyam Tea Estate',
    municipality: 'Suryodaya Municipality' as PermittedMunicipality,
    ward: '7',
    lat: 26.8622,
    lng: 88.0628,
    description: 'Highway / Tea Garden Corridor'
  },
  {
    name: 'Pashupatinagar Border',
    municipality: 'Suryodaya Municipality' as PermittedMunicipality,
    ward: '2',
    lat: 26.9405,
    lng: 88.1255,
    description: 'Border Custom Area'
  },
  {
    name: 'Shree Antu Danda',
    municipality: 'Suryodaya Municipality' as PermittedMunicipality,
    ward: '5',
    lat: 26.9069,
    lng: 88.1633,
    description: 'Antu Tourism / Sunrise Point'
  },
  {
    name: 'Ilam Bazaar (District HQ)',
    municipality: 'Ilam Municipality' as PermittedMunicipality,
    ward: '1',
    lat: 26.9080,
    lng: 87.9284,
    description: 'District Administration / Hospital'
  },
  {
    name: 'Harkatte Bazaar',
    municipality: 'Rong Municipality' as PermittedMunicipality,
    ward: '3',
    lat: 26.8378,
    lng: 88.0289,
    description: 'Rong Highway Market'
  },
  {
    name: 'Kolbung Rong',
    municipality: 'Rong Municipality' as PermittedMunicipality,
    ward: '4',
    lat: 26.8200,
    lng: 88.0500,
    description: 'Rong Rural Hub'
  },
  {
    name: 'Kutidanda',
    municipality: 'Rong Municipality' as PermittedMunicipality,
    ward: '1',
    lat: 26.8050,
    lng: 88.0700,
    description: 'Southern Rong Border'
  },
  {
    name: 'Barbote',
    municipality: 'Ilam Municipality' as PermittedMunicipality,
    ward: '4',
    lat: 26.9250,
    lng: 87.9350,
    description: 'Tea Processing Corridor'
  }
];

// Helper to determine nearest municipality & ward based on lat/lng
function findNearestIlamLocation(lat: number, lng: number) {
  let closest = ILAM_MAJOR_LOCATIONS[0];
  let minDistance = Infinity;

  for (const loc of ILAM_MAJOR_LOCATIONS) {
    const d = Math.sqrt(Math.pow(loc.lat - lat, 2) + Math.pow(loc.lng - lng, 2));
    if (d < minDistance) {
      minDistance = d;
      closest = loc;
    }
  }

  return closest;
}

export const IlamDistrictMapPicker: React.FC<IlamDistrictMapPickerProps> = ({
  selectedLocation,
  currentMunicipality,
  currentWard,
  currentTole,
  onLocationSelect
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [activePin, setActivePin] = useState<{ lat: number; lng: number }>(
    selectedLocation || { lat: 26.8997, lng: 88.0844 } // Default to Fikkal Bazaar, Suryodaya
  );
  const [selectedName, setSelectedName] = useState<string>(
    currentTole ? `${currentTole}, ${currentMunicipality || 'Suryodaya'}` : 'Fikkal Bazaar, Suryodaya Municipality'
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center on Ilam District
    const initialLat = selectedLocation?.lat || 26.8997;
    const initialLng = selectedLocation?.lng || 88.0844;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: true
    });

    mapInstanceRef.current = map;

    // Add OpenStreetMap standard tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Ilam, Nepal',
      maxZoom: 19
    }).addTo(map);

    // Custom pulse marker HTML
    const pinHtml = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 28px; height: 28px; background-color: rgba(2, 132, 199, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 22px; height: 22px; background: #0284c7; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: pinHtml,
      className: 'custom-leaflet-pin',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true
    }).addTo(map);

    markerRef.current = marker;

    // Add static markers for landmark reference in Ilam District
    ILAM_MAJOR_LOCATIONS.forEach((hub) => {
      const hubIcon = L.divIcon({
        html: `
          <div style="background: #ffffff; border: 1.5px solid #0284c7; border-radius: 12px; padding: 2px 6px; font-size: 10px; font-weight: 700; color: #0369a1; box-shadow: 0 2px 6px rgba(0,0,0,0.15); white-space: nowrap; display: inline-flex; align-items: center; gap: 3px;">
            <span style="width: 5px; height: 5px; background: #0284c7; border-radius: 50%;"></span>
            ${hub.name}
          </div>
        `,
        className: 'hub-leaflet-pill',
        iconAnchor: [30, 10]
      });

      const hubMarker = L.marker([hub.lat, hub.lng], { icon: hubIcon }).addTo(map);
      hubMarker.on('click', () => {
        handleCoordinatePicked(hub.lat, hub.lng, hub.name, hub.municipality, hub.ward);
      });
    });

    // Map Click Listener
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      handleCoordinatePicked(lat, lng);
    });

    // Marker Drag Listener
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      handleCoordinatePicked(pos.lat, pos.lng);
    });

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const handleCoordinatePicked = (
    lat: number,
    lng: number,
    presetName?: string,
    presetMunicipality?: PermittedMunicipality,
    presetWard?: string
  ) => {
    setActivePin({ lat, lng });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng], { animate: true });
    }

    const nearest = findNearestIlamLocation(lat, lng);
    const resolvedMunicipality = presetMunicipality || nearest.municipality;
    const resolvedWard = presetWard || nearest.ward;
    const resolvedName = presetName || `${nearest.name} Area (${resolvedMunicipality})`;

    setSelectedName(resolvedName);

    onLocationSelect({
      lat,
      lng,
      municipality: resolvedMunicipality,
      ward: resolvedWard,
      toleArea: presetName || nearest.name,
      landmark: nearest.description,
      displayName: resolvedName
    });
  };

  const handleQuickLocClick = (hub: typeof ILAM_MAJOR_LOCATIONS[0]) => {
    handleCoordinatePicked(hub.lat, hub.lng, hub.name, hub.municipality, hub.ward);
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([26.8997, 88.0844], 12);
    }
  };

  return (
    <div className="space-y-3 font-sans">
      {/* MAP STATUS / HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-sky-50/80 border border-sky-200 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-sky-950">
          <MapPin size={16} className="text-sky-600 shrink-0" />
          <div>
            <span className="font-extrabold">Delivery Location Selected: </span>
            <span className="font-bold text-sky-700">{selectedName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
          <span>{activePin.lat.toFixed(4)}° N, {activePin.lng.toFixed(4)}° E</span>
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1 hover:bg-sky-100 rounded text-sky-700 cursor-pointer transition"
            title="Recenter to Fikkal / Suryodaya"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* QUICK PRESET PILLS FOR ILAM HUBS */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <Navigation size={12} className="text-sky-600" />
          <span>Quick Select Towns &amp; Hubs in Ilam District:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {ILAM_MAJOR_LOCATIONS.map((loc) => {
            const isSelected = Math.abs(activePin.lat - loc.lat) < 0.005 && Math.abs(activePin.lng - loc.lng) < 0.005;
            return (
              <button
                key={loc.name}
                type="button"
                onClick={() => handleQuickLocClick(loc)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50'
                }`}
              >
                {isSelected && <Check size={12} className="text-white" />}
                <span>{loc.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                  (Ward {loc.ward})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LEAFLET MAP CONTAINER */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner">
        <div
          ref={mapContainerRef}
          id="ilam-district-leaflet-canvas"
          className="w-full h-72 sm:h-80 bg-slate-100 z-10"
        />

        {/* MAP OVERLAY INSTRUCTIONS */}
        <div className="absolute top-2 right-2 z-20 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow-sm border border-slate-200 text-[11px] text-slate-600 font-medium flex items-center gap-1.5 pointer-events-none">
          <Compass size={13} className="text-sky-600" />
          <span>Click anywhere to drop delivery pin</span>
        </div>
      </div>
    </div>
  );
};
