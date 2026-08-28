'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { getEarthquakes } from '../services/earthquakeService';
import {
  getMonitoringAreas,
  deleteMonitoringArea,
  updateMonitoringArea,
} from '../services/monitoringService';
import { EarthquakeFeature } from '@/types/earthquake';
import { MonitoringArea } from '@/types/monitoring';
import AreaTable from '@/components/dashboard/AreaTable';
import EditAreaModal from '@/components/dashboard/EditAreaModal';

// Dynamic import MapComponent
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 gap-2 border border-gray-200 dark:border-slate-700">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium">Memuat Peta WebGIS...</p>
    </div>
  ),
});

export default function Home() {
  // State Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Inisialisasi Tema dari LocalStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const nextMode = !prev;
      localStorage.setItem('theme', nextMode ? 'dark' : 'light');
      return nextMode;
    });
  };

  // State Data
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [monitoringAreas, setMonitoringAreas] = useState<MonitoringArea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // State Edit Modal
  const [editingArea, setEditingArea] = useState<MonitoringArea | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  // State Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minMagnitude, setMinMagnitude] = useState<number>(0);
  const [timeRangeHours, setTimeRangeHours] = useState<number>(0);

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

  const filteredEarthquakes = useMemo(() => {
    const now = Date.now();

    return earthquakes.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.properties.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.properties.place?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchMag = item.properties.mag >= minMagnitude;

      let matchTime = true;
      if (timeRangeHours > 0) {
        const diffInHours = (now - item.properties.time) / (1000 * 60 * 60);
        matchTime = diffInHours <= timeRangeHours;
      }

      return matchSearch && matchMag && matchTime;
    });
  }, [earthquakes, searchQuery, minMagnitude, timeRangeHours]);

  const handleOpenEdit = (area: MonitoringArea) => {
    setEditingArea(area);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (
    id: string,
    updatedData: { name: string; category: string; description: string }
  ) => {
    setUpdating(true);
    try {
      const updated = await updateMonitoringArea(id, updatedData);
      setMonitoringAreas((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
      );
      setIsEditModalOpen(false);
      setEditingArea(null);
      alert(`Informasi area "${updatedData.name}" berhasil diperbarui!`);
    } catch (err: any) {
      alert('Gagal mengubah data: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteArea = async (id: string, name: string) => {
    const isConfirm = window.confirm(
      `Apakah Anda yakin ingin menghapus area pantauan "${name}"?`
    );
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
    <div className={darkMode ? 'dark' : ''}>
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto transition-colors duration-300">
        {/* Header Utama */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 gap-4 transition-colors">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-emerald-500">🌐</span> Earthquake Monitoring WebGIS
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              Pemantauan gempa real-time USGS & Digitasi Area Pantauan Supabase
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Button Dark Mode */}
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-lg border border-gray-200 dark:border-slate-700 transition"
              title="Ganti Tema"
            >
              <span>{darkMode ? '☀️' : '🌙'}</span>
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Tombol Refresh */}
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-lg shadow transition disabled:opacity-50"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              {loading ? 'Memperbarui...' : 'Refresh Data'}
            </button>
          </div>
        </header>

        {/* Kartu Statistik */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Total Gempa Tampil</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {loading ? '...' : filteredEarthquakes.length}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">dari {earthquakes.length} kejadian</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Area Pantauan Tersimpan</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {loading ? '...' : monitoringAreas.length}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">zona polygon</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Status Sistem</p>
            <div className="mt-2 flex items-center gap-2">
              {error ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Kendala Sistem</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Terhubung Normal</span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Filter & Pencarian Lokasi */}
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-5 space-y-4 transition-colors">
          <h2 className="text-sm font-bold text-gray-700 dark:text-slate-200 flex items-center gap-2">
            <span>🔍</span> Filter & Pencarian Gempa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Cari Lokasi / Wilayah</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Contoh: Java, Sumatra, Sulawesi..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Batas Kekuatan (Magnitudo)</label>
              <select
                value={minMagnitude}
                onChange={(e) => setMinMagnitude(Number(e.target.value))}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all"
              >
                <option value={0}>Semua Kekuatan (M ≥ 0)</option>
                <option value={3.0}>Gempa Ringan (M ≥ 3.0)</option>
                <option value={4.5}>Gempa Sedang (M ≥ 4.5)</option>
                <option value={6.0}>Gempa Kuat (M ≥ 6.0)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Rentang Waktu</label>
              <select
                value={timeRangeHours}
                onChange={(e) => setTimeRangeHours(Number(e.target.value))}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all"
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
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-2 sm:p-4 overflow-hidden transition-colors">
          {error ? (
            <div className="w-full h-[500px] flex flex-col items-center justify-center text-center p-6 gap-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg">
              <span className="text-4xl">⚠️</span>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
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

        {/* Tabel Data Area Pantauan */}
        <section>
          <AreaTable
            areas={monitoringAreas}
            earthquakes={filteredEarthquakes}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteArea}
            deletingId={deletingId}
          />
        </section>

        {/* Modal Edit Area */}
        <EditAreaModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          area={editingArea}
          onSave={handleSaveEdit}
          loading={updating}
        />
      </main>
    </div>
  );
}