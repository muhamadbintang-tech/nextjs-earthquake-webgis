'use client';

import React from 'react';
import * as turf from '@turf/turf';
import { MonitoringArea } from '@/types/monitoring';
import { EarthquakeFeature } from '@/types/earthquake';

interface AreaTableProps {
  areas: MonitoringArea[];
  earthquakes: EarthquakeFeature[];
  onDelete: (id: string, name: string) => void;
  deletingId?: string | null;
}

export default function AreaTable({
  areas,
  earthquakes,
  onDelete,
  deletingId,
}: AreaTableProps) {
  // Fungsi Analisis Spasial Gempa dalam Polygon
  const countEarthquakesInArea = (geometry: any): number => {
    if (!geometry || !earthquakes || earthquakes.length === 0) return 0;

    let count = 0;
    try {
      const polygonFeature = turf.feature(geometry);

      earthquakes.forEach((eq) => {
        const [lng, lat] = eq.geometry.coordinates;
        const point = turf.point([lng, lat]);

        if (turf.booleanPointInPolygon(point, polygonFeature as any)) {
          count++;
        }
      });
    } catch (err) {
      console.error('Gagal menghitung spasial gempa:', err);
    }

    return count;
  };

  // Fungsi Export Polygon Individual ke GeoJSON
  const handleExportSingleGeoJSON = (area: MonitoringArea) => {
    const geojsonData = {
      type: 'Feature',
      properties: {
        id: area.id,
        name: area.name,
        category: area.category,
        description: area.description,
        created_at: area.created_at,
      },
      geometry: area.geometry,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geojsonData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${area.name.toLowerCase().replace(/\s+/g, '-')}-area.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Fungsi Export Semua Area ke GeoJSON
  const handleExportAllGeoJSON = () => {
    if (areas.length === 0) return;

    const featureCollection = {
      type: 'FeatureCollection',
      features: areas.map((area) => ({
        type: 'Feature',
        properties: {
          id: area.id,
          name: area.name,
          category: area.category,
          description: area.description,
          created_at: area.created_at,
        },
        geometry: area.geometry,
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(featureCollection, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `semua-area-pantauan-${new Date().toISOString().split('T')[0]}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>📋</span> Daftar Area Pantauan Tersimpan
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Data zonasi polygon tersimpan di Supabase beserta analisis spasial kejadian gempa.
          </p>
        </div>

        {areas.length > 0 && (
          <button
            onClick={handleExportAllGeoJSON}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors shadow-sm"
          >
            <span>📥</span> Export Semua (GeoJSON)
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
            <tr>
              <th className="py-3 px-4">Nama Area</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Deskripsi / Luas</th>
              <th className="py-3 px-4 text-center">Analisis Gempa</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {areas.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                  Belum ada area pantauan. Gunakan alat gambar polygon di peta untuk menambahkan area baru.
                </td>
              </tr>
            ) : (
              areas.map((area, idx) => {
                const areaId = area.id ? String(area.id) : `area-${idx}`;
                const eqCount = countEarthquakesInArea(area.geometry);

                return (
                  <tr key={areaId} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {area.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {area.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">
                      {area.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                          eqCount > 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {eqCount > 0 ? '⚠️' : '🛡️'} {eqCount} Titik Gempa
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleExportSingleGeoJSON(area)}
                        title="Unduh GeoJSON"
                        className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        Export
                      </button>

                      <button
                        onClick={() => area.id && onDelete(String(area.id), area.name)}
                        disabled={deletingId === area.id}
                        className="px-2.5 py-1 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors disabled:opacity-50"
                      >
                        {deletingId === area.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}