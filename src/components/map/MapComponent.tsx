'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';

import { EarthquakeFeature } from '@/types/earthquake';
import { MonitoringArea } from '@/types/monitoring';
import AreaModal from './AreaModal';
import { createMonitoringArea } from '@/services/monitoringService';

interface MapComponentProps {
  earthquakes: EarthquakeFeature[];
  monitoringAreas: MonitoringArea[];
  onAreaSaved: () => void;
}

// Helper Warna Gempa
function getMarkerColor(mag: number): string {
  if (mag >= 5.0) return '#ef4444';
  if (mag >= 3.0) return '#f59e0b';
  return '#10b981';
}

// Sub-Komponen Pengendali Tools Leaflet Draw
function DrawControl({
  onPolygonCreated,
  drawnItemsRef,
}: {
  onPolygonCreated: (geometry: any) => void;
  drawnItemsRef: React.MutableRefObject<L.FeatureGroup | null>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: {},
        rectangle: {},
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
      onPolygonCreated(geojson.geometry);
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

// Sub-Komponen Pengelola Layer GeoJSON & Pembersih Kanvas Lukis
function MonitoringAreasLayer({
  monitoringAreas,
  drawnItemsRef,
}: {
  monitoringAreas: MonitoringArea[];
  drawnItemsRef: React.MutableRefObject<L.FeatureGroup | null>;
}) {
  // Bersihkan lukisan sementara di kanvas setiap kali daftar area berubah (misal saat hapus/tambah)
  useEffect(() => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
    }
  }, [monitoringAreas, drawnItemsRef]);

  // Bungkus seluruh data Supabase menjadi satu FeatureCollection GeoJSON
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

  // Unique key berdasarkan gabungan ID agar React Leaflet merender ulang secara akurat
  const layerKey = monitoringAreas.map((a) => a.id).join('-');

  return (
    <GeoJSON
      key={layerKey || 'empty-areas'}
      data={geojsonFeatureCollection}
      style={{
        color: '#059669',
        fillColor: '#10b981',
        fillOpacity: 0.35,
        weight: 2,
      }}
      onEachFeature={(feature, layer) => {
        const props = feature.properties;
        const popupContent = `
          <div class="p-1 space-y-1 text-sm font-sans">
            <span class="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
              ${props.category}
            </span>
            <h3 class="font-bold text-gray-900 border-b pb-1 mt-1">${props.name}</h3>
            <p class="text-gray-700 text-xs">${props.description || 'Tidak ada deskripsi.'}</p>
          </div>
        `;
        layer.bindPopup(popupContent);
      }}
    />
  );
}

export default function MapComponent({ earthquakes, monitoringAreas, onAreaSaved }: MapComponentProps) {
  const indonesiaCenter: [number, number] = [-2.548926, 118.014863];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGeometry, setCurrentGeometry] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  const handlePolygonCreated = (geometry: any) => {
    setCurrentGeometry(geometry);
    setIsModalOpen(true);
  };

  const handleSaveArea = async (formData: { name: string; category: string; description: string }) => {
    if (!currentGeometry) return;
    setSaving(true);
    try {
      await createMonitoringArea({
        name: formData.name,
        category: formData.category,
        description: formData.description,
        geometry: currentGeometry,
      });

      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
      }

      setIsModalOpen(false);
      setCurrentGeometry(null);
      onAreaSaved();
      alert('Area Pantauan Berhasil Disimpan ke Supabase!');
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
        className="w-full h-full min-h-[500px] z-0 rounded-lg shadow-inner"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Alat Lukis Digitasi Polygon */}
        <DrawControl onPolygonCreated={handlePolygonCreated} drawnItemsRef={drawnItemsRef} />

        {/* Layer Area Pantauan Supabase & Pembersih Kanvas */}
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
                fillOpacity: 0.7,
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
                      className="font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: color }}
                    >
                      M {item.properties.mag}
                    </span>
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Kedalaman:</span> {depth} km
                  </p>
                  <p className="text-gray-700">
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