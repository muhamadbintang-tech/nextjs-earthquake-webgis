'use client';

import { useEffect, useState } from 'react';
import DynamicMap from '@/components/map/DynamicMap';
import { fetchEarthquakes } from '@/services/usgsApi';
import { fetchMonitoringAreas } from '@/services/monitoringService';
import { EarthquakeFeature } from '@/types/earthquake';
import { MonitoringArea } from '@/types/monitoring';
import { Activity, RefreshCw, AlertTriangle, Layers } from 'lucide-react';

export default function HomePage() {
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [monitoringAreas, setMonitoringAreas] = useState<MonitoringArea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eqData, areaData] = await Promise.all([
        fetchEarthquakes(),
        fetchMonitoringAreas(),
      ]);
      setEarthquakes(eqData.features);
      setMonitoringAreas(areaData);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data WebGIS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-4">
      {/* Header Aplikasi */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-emerald-600 w-7 h-7" />
            Earthquake Monitoring WebGIS
          </h1>
          <p className="text-sm text-slate-500">
            Pemantauan gempa real-time publik & Digitasi Area Pantauan Supabase
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </header>

      {/* Kartu Ringkasan Informasi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Gempa Terdeteksi</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {loading ? '...' : earthquakes.length} <span className="text-sm font-normal text-slate-500">kejadian</span>
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Area Pantauan Tersimpan</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1 flex items-center gap-2">
            <Layers className="w-6 h-6" />
            {loading ? '...' : monitoringAreas.length} <span className="text-sm font-normal text-slate-500">zona</span>
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Status Sistem</p>
          <p className="text-sm font-bold mt-2 flex items-center gap-1.5">
            {error ? (
              <span className="text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Kendala Sistem
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                USGS & Supabase Aktif
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Area Peta Utama */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm h-[600px] relative">
        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-red-500 gap-2">
            <AlertTriangle className="w-10 h-10" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-md transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <DynamicMap
            earthquakes={earthquakes}
            monitoringAreas={monitoringAreas}
            onAreaSaved={loadData}
          />
        )}
      </div>
    </main>
  );
}