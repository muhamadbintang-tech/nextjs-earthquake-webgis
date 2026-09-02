'use client';

import { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
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
import AreaModal from './AreaModal';
import { createMonitoringArea } from '@/services/monitoringService';

const { BaseLayer } = LayersControl;

interface MapComponentProps {
  earthquakes: EarthquakeFeature[];
  monitoringAreas: MonitoringArea[];
  onAreaSaved: () => void;
}

// 1. Helper Warna Marker Gempa
function getMarkerColor(mag: number): string {
  if (mag >= 5.0) return '#ef4444'; // Merah
  if (mag >= 3.0) return '#f59e0b'; // Oranye
  return '#10b981'; // Hijau
}

// 2. Kontrol Koordinat Kursor Real-Time
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

// 3. Kontrol Gambar Leaflet Draw + Hitung Luas Otomatis Turf.js
function DrawControl({
  onPolygonCreated,
  drawnItemsRef,
}: {
  onPolygonCreated: (geometry: any, calculatedAreaKm2: number) => void;
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
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
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
    };

    map.on(L.Draw.Event.CREATED, handleCreated);

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, handleCreated);
      drawnItemsRef.current = null;
    };
  }, [map, onPolygonCreated, drawnItemsRef]);

  return null;
}

// 4. Layer Area Tersimpan dari Supabase
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

// 5. Komponen Utama Peta
export default function MapComponent({ earthquakes, monitoringAreas, onAreaSaved }: MapComponentProps) {
  const indonesiaCenter: [number, number] = [-2.548926, 118.014863];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGeometry, setCurrentGeometry] = useState<any>(null);
  const [calculatedArea, setCalculatedArea] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  const handlePolygonCreated = (geometry: any, areaKm2: number) => {
    setCurrentGeometry(geometry);
    setCalculatedArea(areaKm2);
    setIsModalOpen(true);
  };

  const handleSaveArea = async (formData: { name: string; category: string; description: string }) => {
    if (!currentGeometry) return;
    setSaving(true);
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

      setIsModalOpen(false);
      setCurrentGeometry(null);
      onAreaSaved();
      alert(`Area Pantauan "${formData.name}" (Luas: ${calculatedArea} km²) Berhasil Disimpan!`);
    } catch (err: any) {
      alert('Gagal menyimpan area: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleModalClose = () => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
    }
    setIsModalOpen(false);
    setCurrentGeometry(null);
  };

  return (
    <>
      <MapContainer
        center={indonesiaCenter}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[550px] z-0 rounded-lg shadow-inner relative"
      >
        {/* Layer Switcher */}
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
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </BaseLayer>
          <BaseLayer name="🏔️ Topografi (OpenTopoMap)">
            <TileLayer
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
        </LayersControl>

        {/* Pelacak Koordinat */}
        <CursorCoordinatesControl />

        {/* Kontrol Gambar Digitasi Polygon */}
        <DrawControl onPolygonCreated={handlePolygonCreated} drawnItemsRef={drawnItemsRef} />

        {/* Layer GeoJSON Supabase */}
        <MonitoringAreasLayer monitoringAreas={monitoringAreas} drawnItemsRef={drawnItemsRef} />

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

      {/* Modal Input Data Area */}
      <AreaModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveArea}
        loading={saving}
      />
    </>
  );
}