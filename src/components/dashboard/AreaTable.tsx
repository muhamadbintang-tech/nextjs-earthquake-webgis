'use client';

import React from 'react';
import * as turf from '@turf/turf';
import { MonitoringArea } from '@/types/monitoring';
import { EarthquakeFeature } from '@/types/earthquake';

interface AreaTableProps {
  areas: MonitoringArea[];
  earthquakes: EarthquakeFeature[];
  onEdit: (area: MonitoringArea) => void;
  onDelete: (id: string, name: string) => void;
  deletingId?: string | null;
}

export default function AreaTable({
  areas,
  earthquakes,
  onEdit,
  onDelete,
  deletingId,
}: AreaTableProps) {
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

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(geojsonData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${area.name.toLowerCase().replace(/\s+/g, '-')}-area.geojson`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

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

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(featureCollection, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `semua-area-pantauan-${new Date().toISOString().split('T')[0]}.geojson`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span>📋</span> Daftar Area Pantauan Tersimpan
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Data zonasi polygon tersimpan di Supabase beserta analisis spasial kejadian gempa.
          </p>
        </div>

        {areas.length > 0 && (
          <button
            onClick={handleExportAllGeoJSON}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors shadow-sm"
          >
            <span>📥</span> Export Semua (GeoJSON)
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
          <thead className="bg-gray-50 dark:bg-slate-800/60 text-xs uppercase text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-100 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Nama Area</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Deskripsi / Luas</th>
              <th className="py-3 px-4 text-center">Analisis Gempa</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {areas.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 dark:text-slate-500 text-sm">
                  Belum ada area pantauan. Gunakan alat gambar polygon di peta untuk menambahkan area baru.
                </td>
              </tr>
            ) : (
              areas.map((area, idx) => {
                const areaId = area.id ? String(area.id) : `area-${idx}`;
                const eqCount = countEarthquakesInArea(area.geometry);

                return (
                  <tr key={areaId} className="hover:bg-gray-50/75 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {area.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {area.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-slate-400 max-w-xs truncate">
                      {area.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                          eqCount > 0
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                        }`}
                      >
                        {eqCount > 0 ? '⚠️' : '🛡️'} {eqCount} Titik Gempa
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => onEdit(area)}
                        title="Edit Informasi Area"
                        className="px-2.5 py-1 text-xs font-medium bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-md transition-colors"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => handleExportSingleGeoJSON(area)}
                        title="Unduh GeoJSON"
                        className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-md transition-colors"
                      >
                        Export
                      </button>

                      <button
                        onClick={() => area.id && onDelete(String(area.id), area.name)}
                        disabled={deletingId === area.id}
                        className="px-2.5 py-1 text-xs font-medium bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 rounded-md transition-colors disabled:opacity-50"
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