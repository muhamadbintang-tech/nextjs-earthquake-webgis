'use client';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  minMagnitude: number;
  setMinMagnitude: (mag: number) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  totalFiltered: number;
  totalOriginal: number;
}

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  minMagnitude,
  setMinMagnitude,
  timeRange,
  setTimeRange,
  totalFiltered,
  totalOriginal,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <h2 className="font-semibold text-gray-800 text-sm md:text-base">
            Filter & Pencarian Gempa
          </h2>
        </div>
        <div className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200 w-fit">
          Menampilkan <span className="font-bold text-emerald-600">{totalFiltered}</span> dari {totalOriginal} gempa
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Input Pencarian Lokasi */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Cari Lokasi / Wilayah
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Contoh: Java, Sumatra, Sulawesi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-gray-800"
            />
            <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">📍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 2. Filter Magnitudo Minimal */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Batas Kekuatan (Magnitudo)
          </label>
          <select
            value={minMagnitude}
            onChange={(e) => setMinMagnitude(Number(e.target.value))}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-gray-800 cursor-pointer"
          >
            <option value={0}>Semua Kekuatan (M ≥ 0)</option>
            <option value={2.5}>Gempa Ringan (M ≥ 2.5)</option>
            <option value={4.5}>Gempa Sedang (M ≥ 4.5)</option>
            <option value={6.0}>Gempa Kuat (M ≥ 6.0)</option>
          </select>
        </div>

        {/* 3. Filter Rentang Waktu */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Rentang Waktu
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-gray-800 cursor-pointer"
          >
            <option value="all">Semua Waktu Tersedia</option>
            <option value="24h">24 Jam Terakhir</option>
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
          </select>
        </div>
      </div>
    </div>
  );
}