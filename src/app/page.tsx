'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { getEarthquakes } from '@/services/earthquakeService';
import { getMonitoringAreas } from '@/services/monitoringService';
import { EarthquakeFeature } from '@/types/earthquake';
import { MonitoringArea } from '@/types/monitoring';
import FilterBar from '@/components/dashboard/FilterBar';

// Import peta secara dinamis (karena Leaflet butuh objek window di browser)
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-medium">
      Memuat Peta WebGIS...
    </div>
  ),
});

export default function HomePage() {
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [monitoringAreas, setMonitoringAreas] = useState<MonitoringArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Fitur Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [minMagnitude, setMinMagnitude] = useState(0);
  const [timeRange, setTimeRange] = useState('all');

  // Ambil data gempa & data area dari Supabase
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eqData, areasData] = await Promise.all([
        getEarthquakes(),
        getMonitoringAreas(),
      ]);
      setEarthquakes(eqData.features || []);
      setMonitoringAreas(areasData || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengambil data sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Logika Filter Data Gempa secara Real-Time
  const filteredEarthquakes = useMemo(() => {
    const now = Date.now();

    return earthquakes.filter((eq) => {
      // 1. Filter Pencarian Lokasi
      const placeName = eq.properties.place ? eq.properties.place.toLowerCase() : '';
      const titleName = eq.properties.title ? eq.properties.title.toLowerCase() : '';
      const matchesSearch =
        placeName.includes(searchQuery.toLowerCase()) ||
        titleName.includes(searchQuery.toLowerCase());

      // 2. Filter Magnitudo Minimal
      const matchesMag = eq.properties.mag >= minMagnitude;

      // 3. Filter Rentang Waktu Kejadian
      let matchesTime = true;
      const eqTime = eq.properties.time;
      if (timeRange === '24h') {
        matchesTime = now - eqTime <= 24 * 60 * 60 * 1000;
      } else if (timeRange === '7d') {
        matchesTime = now - eqTime <= 7 * 24 * 60 * 60 * 1000;
      } else if (timeRange === '30d') {
        matchesTime = now - eqTime <= 30 * 24 * 60 * 60 * 1000;
      }

      return matchesSearch && matchesMag && matchesTime;
    });
  }, [earthquakes, searchQuery, minMagnitude, timeRange]);

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* 1. Header Aplikasi */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌐</span>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Earthquake Monitoring WebGIS
            </h1>
            <p className="text-xs md:text-sm text-gray-500">
              Pemantauan gempa real-time USGS & Digitasi Area Pantauan Supabase
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <span>🔄</span>
          <span>{loading ? 'Menyinkronkan...' : 'Refresh Data'}</span>
        </button>
      </header>

      {/* 2. Kartu Metrik Ringkasan */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">
            Total Gempa Tampil
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900">
              {filteredEarthquakes.length}
            </span>
            <span className="text-xs text-gray-400">
              dari {earthquakes.length} kejadian
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">
            Area Pantauan Tersimpan
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600">
              {monitoringAreas.length}
            </span>
            <span className="text-xs text-gray-400">zona polygon</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">
            Status Sistem
          </p>
          <div className="flex items-center gap-2 mt-1">
            {error ? (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                ⚠️ Kendala: {error}
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Terhubung Normal
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 3. Komponen Filter & Pencarian */}
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        minMagnitude={minMagnitude}
        setMinMagnitude={setMinMagnitude}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        totalFiltered={filteredEarthquakes.length}
        totalOriginal={earthquakes.length}
      />

      {/* 4. Tampilan Peta WebGIS */}
      <section className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
        <MapComponent
          earthquakes={filteredEarthquakes}
          monitoringAreas={monitoringAreas}
          onAreaSaved={fetchData}
        />
      </section>
    </main>
  );
}