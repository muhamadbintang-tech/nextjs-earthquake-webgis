'use client';

import { useEffect, useState } from 'react';
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

// Sub-Komponen Khusus Pengendali Tools Leaflet Draw
function DrawControl({ onPolygonCreated }: { onPolygonCreated: (geometry: any) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

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
        edit: false,   // Menonaktifkan/menghilangkan tombol edit pensil
        remove: false, // Menonaktifkan/menghilangkan tombol hapus
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
    };
  }, [map, onPolygonCreated]);

  return null;
}

export default function MapComponent({ earthquakes, monitoringAreas, onAreaSaved }: MapComponentProps) {
  const indonesiaCenter: [number, number] = [-2.548926, 118.014863];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGeometry, setCurrentGeometry] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Tangkap polygon yang baru saja digambar pengguna
  const handlePolygonCreated = (geometry: any) => {
    setCurrentGeometry(geometry);
    setIsModalOpen(true);
  };

  // Simpan data ke Supabase saat form disubmit
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

      setIsModalOpen(false);
      setCurrentGeometry(null);
      onAreaSaved(); // Refresh daftar area di halaman utama
      alert('Area Pantauan Berhasil Disimpan ke Supabase!');
    } catch (err: any) {
      alert('Gagal menyimpan area: ' + err.message);
    } finally {
      setSaving(false);
    }
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
        <DrawControl onPolygonCreated={handlePolygonCreated} />

        {/* Render Layer Area Pantauan dari Supabase */}
        {monitoringAreas.map((area) => (
          <GeoJSON
            key={area.id || Math.random().toString()}
            data={area.geometry as any}
            style={{
              color: '#059669',
              fillColor: '#10b981',
              fillOpacity: 0.35,
              weight: 2,
            }}
          >
            <Popup>
              <div className="p-1 space-y-1 text-sm font-sans">
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  {area.category}
                </span>
                <h3 className="font-bold text-gray-900 border-b pb-1 mt-1">{area.name}</h3>
                <p className="text-gray-700 text-xs">{area.description || 'Tidak ada deskripsi.'}</p>
              </div>
            </Popup>
          </GeoJSON>
        ))}

        {/* Render Layer Titik Gempa USGS */}
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
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveArea}
        loading={saving}
      />
    </>
  );
}