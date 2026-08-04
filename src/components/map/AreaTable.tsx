'use client';

import { useState } from 'react';
import { MonitoringArea } from '@/types/monitoring';
import { deleteMonitoringArea } from '@/services/monitoringService';
import { Trash2, Layers, Calendar, Tag, AlertCircle } from 'lucide-react';

interface AreaTableProps {
  areas: MonitoringArea[];
  onAreaDeleted: () => void;
}

export default function AreaTable({ areas, onAreaDeleted }: AreaTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    const confirmed = confirm(`Apakah kamu yakin ingin menghapus area "${name}"?`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteMonitoringArea(id);
      onAreaDeleted(); // Refresh data peta dan tabel di halaman utama
      alert('Area berhasil dihapus dari Supabase!');
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus area');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Info */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-800 text-base">Daftar Area Pantauan Tersimpan</h2>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
          {areas.length} Area
        </span>
      </div>

      {/* Table Body */}
      {areas.length === 0 ? (
        <div className="p-8 text-center text-slate-500 space-y-2">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-medium">Belum ada area pantauan yang tersimpan.</p>
          <p className="text-xs text-slate-400">Gunakan alat lukis di peta untuk menambahkan area baru.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="p-3.5">Nama Area</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Deskripsi / Catatan</th>
                <th className="p-3.5">Waktu Dibuat</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {areas.map((area) => (
                <tr key={area.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-slate-800">{area.name}</td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      {area.category}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 max-w-xs truncate">
                    {area.description || '-'}
                  </td>
                  <td className="p-3.5 text-slate-500 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {area.created_at
                        ? new Date(area.created_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '-'}
                    </div>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => area.id && handleDelete(area.id, area.name)}
                      disabled={deletingId === area.id}
                      className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors disabled:opacity-50"
                      title="Hapus Area"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}