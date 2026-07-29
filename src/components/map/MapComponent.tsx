'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { EarthquakeFeature } from '@/types/earthquake';

interface MapComponentProps {
  earthquakes: EarthquakeFeature[];
}

// Helper untuk menentukan warna titik berdasarkan magnitudo gempa
function getMarkerColor(mag: number): string {
  if (mag >= 5.0) return '#ef4444'; // Merah (Gempa Kuat)
  if (mag >= 3.0) return '#f59e0b'; // Oranye/Kuning (Gempa Sedang)
  return '#10b981';                // Hijau (Gempa Kecil)
}

export default function MapComponent({ earthquakes }: MapComponentProps) {
  // Posisi Awal Peta: Tengah Wilayah Indonesia (Lat: -2.5489, Lng: 118.0148), Zoom Level 5
  const indonesiaCenter: [number, number] = [-2.548926, 118.014863];

  return (
    <MapContainer
      center={indonesiaCenter}
      zoom={5}
      scrollWheelZoom={true}
      className="w-full h-full min-h-[500px] z-0 rounded-lg shadow-inner"
    >
      {/* Basemap dari OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render Setiap Titik Gempa dari API USGS */}
      {earthquakes.map((item) => {
        // PERHATIKAN: GeoJSON menyusun [Longitude, Latitude, Depth].
        // Leaflet membutuhkan urutan [Latitude, Longitude]!
        const [lng, lat, depth] = item.geometry.coordinates;
        const color = getMarkerColor(item.properties.mag);

        return (
          <CircleMarker
            key={item.id}
            center={[lat, lng]}
            radius={Math.max(item.properties.mag * 2.5, 4)} // Radius membesar sesuai magnitudo
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            {/* Popup Detail Informasi Gempa Saat Titik Diklik */}
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
                <p className="text-gray-500 text-xs mt-1">
                  {item.properties.place}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}