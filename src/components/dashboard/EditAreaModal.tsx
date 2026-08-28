'use client';

import React, { useState, useEffect } from 'react';
import { MonitoringArea } from '@/types/monitoring';

interface EditAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  area: MonitoringArea | null;
  onSave: (id: string, updatedData: { name: string; category: string; description: string }) => Promise<void>;
  loading: boolean;
}

export default function EditAreaModal({
  isOpen,
  onClose,
  area,
  onSave,
  loading,
}: EditAreaModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Zona Rawan Gempa');
  const [description, setDescription] = useState('');

  // Sinkronkan data area yang dipilih saat modal terbuka
  useEffect(() => {
    if (area) {
      setName(area.name || '');
      setCategory(area.category || 'Zona Rawan Gempa');
      setDescription(area.description || '');
    }
  }, [area]);

  if (!isOpen || !area) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama area pantauan tidak boleh kosong');
      return;
    }
    await onSave(String(area.id), { name, category, description });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <span>✏️</span> Edit Area Pantauan
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Wilayah / Area
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Sesar Lembang, Zona Megathrust..."
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Kategori Pantauan
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white"
            >
              <option value="Zona Rawan Gempa">Zona Rawan Gempa</option>
              <option value="Zona Evakuasi">Zona Evakuasi</option>
              <option value="Infrastruktur Kritis">Infrastruktur Kritis</option>
              <option value="Pemukiman Padat">Pemukiman Padat</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Deskripsi & Catatan
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan catatan khusus terkait wilayah ini..."
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}