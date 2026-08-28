'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { getEarthquakes } from '../services/earthquakeService';
import { getMonitoringAreas, deleteMonitoringArea } from '@/services/monitoringService';
import { EarthquakeFeature } from '@/types/earthquake';
import { MonitoringArea } from '@/types/monitoring';
import AreaTable from '@/components/dashboard/AreaTable';

// Dynamic import MapComponent untuk menghindari kendala SSR di Next.js
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] bg-gray-100 rounded-lg animate-pulse flex flex-col items-center justify-center text-gray-400 gap-2 border border-gray-200">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium">Memuat Peta WebGIS...</p>
    </div>
  ),
});

export default function Home() {
  // State Data
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [monitoringAreas, setMonitoringAreas] = useState<MonitoringArea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // State Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minMagnitude, setMinMagnitude] = useState<number>(0);
  const [timeRangeHours, setTimeRangeHours] = useState<number>(0); // 0 = Semua Waktu

  // Mengambil data gempa dan area pantauan
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eqResponse, areasResponse] = await Promise.all([
        getEarthquakes(),
        getMonitoringAreas(),
      ]);

      setEarthquakes(eqResponse.features || []);
      setMonitoringAreas(areasResponse || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Gagal mengambil data dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Gempa berdasarkan Input User
  const filteredEarthquakes = useMemo(() => {
    const now = Date.now();

    return earthquakes.filter((item) => {
      // 1. Filter Pencarian Lokasi
      const matchSearch =
        !searchQuery ||
        item.properties.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.properties.place?.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Filter Magnitudo
      const matchMag = item.properties.mag >= minMagnitude;

      // 3. Filter Rentang Waktu
      let matchTime = true;
      if (timeRangeHours > 0) {
        const diffInHours = (now - item.properties.time) / (1000 * 60 * 60);
        matchTime = diffInHours <= timeRangeHours;
      }

      return matchSearch && matchMag && matchTime;
    });
  }, [earthquakes, searchQuery, minMagnitude, timeRangeHours]);

  // Handler Hapus Area
  const handleDeleteArea = async (id: string, name: string) => {
    const isConfirm = window.confirm(`Apakah Anda yakin ingin menghapus area pantauan "${name}"?`);
    if (!isConfirm) return;

    setDeletingId(id);
    try {
      await deleteMonitoringArea(id);
      setMonitoringAreas((prev) => prev.filter((area) => area.id !== id));
    } catch (err: any) {
      alert('Gagal menghapus area: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-gray-800 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Utama */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <span className="text-emerald-600">🌐</span> Earthquake Monitoring WebGIS
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Pemantauan gempa real-time USGS & Digitasi Area Pantauan Supabase
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow transition-all disabled:opacity-50"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          {loading ? 'Memperbarui...' : 'Refresh Data'}
        </button>
      </header>

      {/* Kartu Statistik */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Gempa Tampil</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {loading ? '...' : filteredEarthquakes.length}
            </span>
            <span className="text-xs text-gray-500">dari {earthquakes.length} kejadian</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Area Pantauan Tersimpan</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">
              {loading ? '...' : monitoringAreas.length}
            </span>
            <span className="text-xs text-gray-500">zona polygon</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Status Sistem</p>
          <div className="mt-2 flex items-center gap-2">
            {error ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-bold text-rose-600">Kendala Sistem</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-700">Terhubung Normal</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Filter & Pencarian Lokasi */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <span>🔍</span> Filter & Pencarian Gempa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Input Pencarian Wilayah */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Cari Lokasi / Wilayah</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Contoh: Java, Sumatra, Sulawesi..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Magnitudo */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Batas Kekuatan (Magnitudo)</label>
            <select
              value={minMagnitude}
              onChange={(e) => setMinMagnitude(Number(e.target.value))}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all"
            >
              <option value={0}>Semua Kekuatan (M ≥ 0)</option>
              <option value={3.0}>Gempa Ringan (M ≥ 3.0)</option>
              <option value={4.5}>Gempa Sedang (M ≥ 4.5)</option>
              <option value={6.0}>Gempa Kuat (M ≥ 6.0)</option>
            </select>
          </div>

          {/* Filter Rentang Waktu */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Rentang Waktu</label>
            <select
              value={timeRangeHours}
              onChange={(e) => setTimeRangeHours(Number(e.target.value))}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all"
            >
              <option value={0}>Semua Waktu Tersedia</option>
              <option value={1}>1 Jam Terakhir</option>
              <option value={6}>6 Jam Terakhir</option>
              <option value={12}>12 Jam Terakhir</option>
              <option value={24}>24 Jam Terakhir</option>
            </select>
          </div>
        </div>
      </section>

      {/* Kontainer Peta GIS */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 sm:p-4 overflow-hidden">
        {error ? (
          <div className="w-full h-[500px] flex flex-col items-center justify-center text-center p-6 gap-3 bg-rose-50/50 rounded-lg">
            <span className="text-4xl">⚠️</span>
            <p className="text-sm font-bold text-rose-600">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <MapComponent
            earthquakes={filteredEarthquakes}
            monitoringAreas={monitoringAreas}
            onAreaSaved={loadData}
          />
        )}
      </section>

      {/* Tabel Data Area Pantauan & Analisis Spasial */}
      <section>
        <AreaTable
          areas={monitoringAreas}
          earthquakes={filteredEarthquakes}
          onDelete={handleDeleteArea}
          deletingId={deletingId}
        />
      </section>
    </main>
  );
}