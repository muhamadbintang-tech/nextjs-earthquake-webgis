'use client';

import { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  GeoJSON,
  LayersControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';
import * as turf from '@turf/turf';

import { EarthquakeFeature } from '@/types/earthquake';
import { MonitoringArea } from '@/types/monitoring';
import { MonitoringPoint } from '@/types/point';
import AreaModal from './AreaModal';
import PointModal from './PointModal';
import { createMonitoringArea } from '@/services/monitoringService';
import { createMonitoringPoint } from '@/services/pointService';

const { BaseLayer } = LayersControl;

interface MapComponentProps {
  earthquakes: EarthquakeFeature[];
  monitoringAreas: MonitoringArea[];
  monitoringPoints: MonitoringPoint[];
  onAreaSaved: () => void;
  onPointSaved: () => void;
}

// 1. Helper Warna Marker Gempa USGS
function getMarkerColor(mag: number): string {
  if (mag >= 5.0) return '#ef4444'; // Merah
  if (mag >= 3.0) return '#f59e0b'; // Oranye
  return '#10b981'; // Hijau
}

// 2. Helper Icon Kustom untuk Titik Pantauan Supabase (Bebas Masalah Aset Gambar)
function createPointIcon(category: string) {
  let emoji = '📍';
  let bgColor = 'bg-blue-600';

  if (category === 'Posko Evakuasi') {
    emoji = '🏕️';
    bgColor = 'bg-emerald-600';
  } else if (category === 'Sensor Seismik BMKG') {
    emoji = '📡';
    bgColor = 'bg-purple-600';
  } else if (category === 'Fasilitas Medis Darurat') {
    emoji = '🏥';
    bgColor = 'bg-rose-600';
  } else if (category === 'Stasiun Logistik') {
    emoji = '📦';
    bgColor = 'bg-amber-600';
  }

  return L.divIcon({
    html: `<div class="w-8 h-8 rounded-full ${bgColor} text-white flex items-center justify-center shadow-lg border-2 border-white text-base transform hover:scale-125 transition-transform cursor-pointer">${emoji}</div>`,
    className: 'custom-point-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// 3. Kontrol Koordinat Kursor Real-Time
function CursorCoordinatesControl() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useMapEvents({
    mousemove(e) {
      setCoords({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5)),
      });
    },
    mouseout() {
      setCoords(null);
    },
  });

  if (!coords) return null;

  return (
    <div className="leaflet-bottom leaflet-left !mb-2 !ml-2 z-[1000] pointer-events-none">
      <div className="bg-slate-900/90 dark:bg-black/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-md border border-slate-700 text-xs font-mono font-medium text-emerald-400 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Lat: {coords.lat}</span>
        <span className="text-slate-500">|</span>
        <span>Lng: {coords.lng}</span>
      </div>
    </div>
  );
}

// 4. Kontrol Gambar Leaflet Draw (Mendukung Polygon & Titik/Marker)
function DrawControl({
  onPolygonCreated,
  onPointCreated,
  drawnItemsRef,
}: {
  onPolygonCreated: (geometry: any, calculatedAreaKm2: number) => void;
  onPointCreated: (coords: { lat: number; lng: number }) => void;
  drawnItemsRef: React.MutableRefObject<L.FeatureGroup | null>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    const drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
        },
        rectangle: {
          showArea: true,
        },
        marker: true, // Mengaktifkan alat gambar titik/marker
        polyline: false,
        circle: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        edit: false,
        remove: false,
      },
    });

    map.addControl(drawControl);

    const handleCreated = (e: any) => {
      const layer = e.layer;
      const type = e.layerType;

      if (type === 'marker') {
        const latlng = layer.getLatLng();
        onPointCreated({ lat: latlng.lat, lng: latlng.lng });
      } else {
        drawnItems.addLayer(layer);
        const geojson = layer.toGeoJSON();

        let calculatedAreaKm2 = 0;
        try {
          const areaInSqMeters = turf.area(geojson);
          calculatedAreaKm2 = Number((areaInSqMeters / 1_000_000).toFixed(2));
        } catch (err) {
          console.error('Gagal menghitung luas area:', err);
        }

        onPolygonCreated(geojson.geometry, calculatedAreaKm2);
      }
    };

    map.on(L.Draw.Event.CREATED, handleCreated);

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, handleCreated);
      drawnItemsRef.current = null;
    };
  }, [map, onPolygonCreated, onPointCreated, drawnItemsRef]);

  return null;
}

// 5. Layer Area Polygon Tersimpan dari Supabase
function MonitoringAreasLayer({
  monitoringAreas,
  drawnItemsRef,
}: {
  monitoringAreas: MonitoringArea[];
  drawnItemsRef: React.MutableRefObject<L.FeatureGroup | null>;
}) {
  useEffect(() => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
    }
  }, [monitoringAreas, drawnItemsRef]);

  const geojsonFeatureCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: monitoringAreas.map((area) => ({
      type: 'Feature',
      id: area.id,
      geometry: area.geometry as any,
      properties: {
        id: area.id,
        name: area.name,
        category: area.category,
        description: area.description,
      },
    })),
  };

  const layerKey = monitoringAreas.map((a) => a.id).join('-');

  return (
    <GeoJSON
      key={layerKey || 'empty-areas'}
      data={geojsonFeatureCollection}
      style={{
        color: '#10b981',
        fillColor: '#059669',
        fillOpacity: 0.4,
        weight: 2,
      }}
      onEachFeature={(feature, layer) => {
        const props = feature.properties;
        let areaKm2 = '0';
        try {
          const areaInSqMeters = turf.area(feature as any);
          areaKm2 = (areaInSqMeters / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
        } catch {}

        const popupContent = `
          <div class="p-1 space-y-1.5 text-sm font-sans min-w-[180px]">
            <span class="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full inline-block">
              ${props.category}
            </span>
            <h3 class="font-bold text-gray-900 border-b pb-1 mt-1">${props.name}</h3>
            <p class="text-xs text-gray-600">📐 <b>Luas Area:</b> ${areaKm2} km²</p>
            <p class="text-xs text-gray-700">${props.description || 'Tidak ada deskripsi.'}</p>
          </div>
        `;
        layer.bindPopup(popupContent);
      }}
    />
  );
}

// 6. Komponen Utama Peta
export default function MapComponent({
  earthquakes,
  monitoringAreas,
  monitoringPoints,
  onAreaSaved,
  onPointSaved,
}: MapComponentProps) {
  const indonesiaCenter: [number, number] = [-2.548926, 118.014863];

  // State Modal Polygon
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [currentGeometry, setCurrentGeometry] = useState<any>(null);
  const [calculatedArea, setCalculatedArea] = useState<number>(0);
  const [savingArea, setSavingArea] = useState(false);

  // State Modal Titik
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [currentPointCoords, setCurrentPointCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [savingPoint, setSavingPoint] = useState(false);

  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  // Handler Polygon
  const handlePolygonCreated = (geometry: any, areaKm2: number) => {
    setCurrentGeometry(geometry);
    setCalculatedArea(areaKm2);
    setIsAreaModalOpen(true);
  };

  const handleSaveArea = async (formData: { name: string; category: string; description: string }) => {
    if (!currentGeometry) return;
    setSavingArea(true);
    try {
      const enhancedDescription = formData.description
        ? `${formData.description} (Estimasi Luas: ${calculatedArea} km²)`
        : `Estimasi Luas Wilayah: ${calculatedArea} km²`;

      await createMonitoringArea({
        name: formData.name,
        category: formData.category,
        description: enhancedDescription,
        geometry: currentGeometry,
      });

      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
      }

      setIsAreaModalOpen(false);
      setCurrentGeometry(null);
      onAreaSaved();
      alert(`Area Pantauan "${formData.name}" (Luas: ${calculatedArea} km²) Berhasil Disimpan!`);
    } catch (err: any) {
      alert('Gagal menyimpan area: ' + err.message);
    } finally {
      setSavingArea(false);
    }
  };

  // Handler Titik Pantauan
  const handlePointCreated = (coords: { lat: number; lng: number }) => {
    setCurrentPointCoords(coords);
    setIsPointModalOpen(true);
  };

  const handleSavePoint = async (data: { name: string; category: string; notes: string }) => {
    if (!currentPointCoords) return;
    setSavingPoint(true);
    try {
      await createMonitoringPoint({
        name: data.name,
        category: data.category,
        notes: data.notes,
        latitude: currentPointCoords.lat,
        longitude: currentPointCoords.lng,
      });

      setIsPointModalOpen(false);
      setCurrentPointCoords(null);
      onPointSaved();
      alert(`Titik Pantauan "${data.name}" Berhasil Disimpan ke Supabase!`);
    } catch (err: any) {
      alert('Gagal menyimpan titik: ' + err.message);
    } finally {
      setSavingPoint(false);
    }
  };

  return (
    <>
      <MapContainer
        center={indonesiaCenter}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[550px] z-0 rounded-lg shadow-inner relative"
      >
        <LayersControl position="topright">
          <BaseLayer checked name="🌑 CartoDB Dark (Dark Mode)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </BaseLayer>
          <BaseLayer name="🗺️ OpenStreetMap (Default)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
          <BaseLayer name="🛰️ Citra Satelit (ESRI)">
            <TileLayer
              attribution='Tiles &copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </BaseLayer>
          <BaseLayer name="🏔️ Topografi (OpenTopoMap)">
            <TileLayer
              attribution='Map data: &copy; OpenStreetMap contributors, SRTM'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
        </LayersControl>

        {/* Pelacak Koordinat Kursor */}
        <CursorCoordinatesControl />

        {/* Kontrol Gambar (Polygon & Marker Titik) */}
        <DrawControl
          onPolygonCreated={handlePolygonCreated}
          onPointCreated={handlePointCreated}
          drawnItemsRef={drawnItemsRef}
        />

        {/* Layer Area Polygon Supabase */}
        <MonitoringAreasLayer monitoringAreas={monitoringAreas} drawnItemsRef={drawnItemsRef} />

        {/* Layer Titik Pantauan Supabase */}
        {monitoringPoints.map((point) => (
          <Marker
            key={point.id || `${point.latitude}-${point.longitude}`}
            position={[point.latitude, point.longitude]}
            icon={createPointIcon(point.category)}
          >
            <Popup>
              <div className="p-1 space-y-1 text-sm font-sans min-w-[180px]">
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full inline-block">
                  {point.category}
                </span>
                <h3 className="font-bold text-gray-900 border-b pb-1 mt-1">{point.name}</h3>
                <p className="text-xs text-gray-600">
                  📍 <b>Koordinat:</b> {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                </p>
                {point.notes && <p className="text-xs text-gray-700 mt-1">📝 {point.notes}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Titik Gempa USGS */}
        {earthquakes.map((item) => {
          const [lng, lat, depth] = item.geometry.coordinates;
          const color = getMarkerColor(item.properties.mag);

          return (
            <CircleMarker
              key={item.id}
              center={[lat, lng]}
              radius={Math.max(item.properties.mag * 2.5, 4)}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-sm font-sans">
                  <h3 className="font-bold text-gray-900 border-b pb-1">
                    {item.properties.title}
                  </h3>
                  <p className="text-gray-700">
                    <span className="font-semibold">Magnitudo:</span>{' '}
                    <span
                      className="font-bold px-1.5 py-0.5 rounded text-white text-xs"
                      style={{ backgroundColor: color }}
                    >
                      M {item.properties.mag}
                    </span>
                  </p>
                  <p className="text-gray-700 text-xs">
                    <span className="font-semibold">Kedalaman:</span> {depth} km
                  </p>
                  <p className="text-gray-700 text-xs">
                    <span className="font-semibold">Waktu:</span>{' '}
                    {new Date(item.properties.time).toLocaleString('id-ID')}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Modal Input Polygon */}
      <AreaModal
        isOpen={isAreaModalOpen}
        onClose={() => {
          if (drawnItemsRef.current) drawnItemsRef.current.clearLayers();
          setIsAreaModalOpen(false);
          setCurrentGeometry(null);
        }}
        onSave={handleSaveArea}
        loading={savingArea}
      />

      {/* Modal Input Titik Pantauan */}
      <PointModal
        isOpen={isPointModalOpen}
        onClose={() => {
          setIsPointModalOpen(false);
          setCurrentPointCoords(null);
        }}
        onSave={handleSavePoint}
        loading={savingPoint}
        coords={currentPointCoords}
      />
    </>
  );
}