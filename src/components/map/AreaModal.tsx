'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; category: string; description: string }) => void;
  loading: boolean;
}

export default function AreaModal({ isOpen, onClose, onSave, loading }: AreaModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bencana Alam');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, category, description });
    setName('');
    setDescription('');
    setCategory('Bencana Alam');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">Simpan Area Pantauan Baru</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Nama Area Pantauan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Zona Rawan Longsor Garut"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm outline-none bg-white"
            >
              <option value="Bencana Alam">Bencana Alam</option>
              <option value="Zona Bahaya Gempa">Zona Bahaya Gempa</option>
              <option value="Infrastruktur Kritis">Infrastruktur Kritis</option>
              <option value="Posko Evakuasi">Posko Evakuasi</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Deskripsi / Catatan
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan informasi detail area..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm outline-none resize-none"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Area'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}