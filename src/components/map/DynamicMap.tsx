'use client';

import dynamic from 'next/dynamic';
import { EarthquakeFeature } from '@/types/earthquake';
import { MonitoringArea } from '@/types/monitoring';

interface DynamicMapProps {
  earthquakes: EarthquakeFeature[];
  monitoringAreas: MonitoringArea[];
  onAreaSaved: () => void;
}

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-slate-100 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Memuat Peta WebGIS...</p>
      </div>
    </div>
  ),
});

export default function DynamicMap({ earthquakes, monitoringAreas, onAreaSaved }: DynamicMapProps) {
  return (
    <MapComponent
      earthquakes={earthquakes}
      monitoringAreas={monitoringAreas}
      onAreaSaved={onAreaSaved}
    />
  );
}