'use client';

import React, { useState } from 'react';

interface PointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; category: string; notes: string }) => Promise<void>;
  loading: boolean;
  coords: { lat: number; lng: number } | null;
}

export default function PointModal({
  isOpen,
  onClose,
  onSave,
  loading,
  coords,
}: PointModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Posko Evakuasi');
  const [notes, setNotes] = useState('');

  if (!isOpen || !coords) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama titik pantauan tidak boleh kosong');
      return;
    }
    await onSave({ name, category, notes });
    setName('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800 transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📍</span> Simpan Titik Pantauan Baru
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700 text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Lat: {coords.lat.toFixed(5)}</span>
            <span>Lng: {coords.lng.toFixed(5)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Nama Titik / Lokasi
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Posko Tanggap Bencana Garut..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Kategori Titik
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all"
            >
              <option value="Posko Evakuasi">Posko Evakuasi</option>
              <option value="Sensor Seismik BMKG">Sensor Seismik BMKG</option>
              <option value="Fasilitas Medis Darurat">Fasilitas Medis Darurat</option>
              <option value="Stasiun Logistik">Stasiun Logistik</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Catatan Tambahan
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Kapasitas, penanggung jawab, kontak darurat..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Titik'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}