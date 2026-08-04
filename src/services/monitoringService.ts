import { supabase } from '@/lib/supabase';
import { MonitoringArea } from '@/types/monitoring';

// 1. Fungsi Mengambil Seluruh Area Pantauan dari Supabase
export async function fetchMonitoringAreas(): Promise<MonitoringArea[]> {
  const { data, error } = await supabase
    .from('monitoring_areas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error mengambil area pantauan:', error.message);
    throw new Error('Gagal mengambil data area pantauan');
  }

  return data || [];
}

// 2. Fungsi Menyimpan Area Pantauan Baru ke Supabase
export async function createMonitoringArea(area: MonitoringArea): Promise<MonitoringArea> {
  const { data, error } = await supabase
    .from('monitoring_areas')
    .insert([
      {
        name: area.name,
        description: area.description,
        category: area.category,
        geometry: area.geometry, // GeoJSON Polygon
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error menyimpan area pantauan:', error.message);
    throw new Error('Gagal menyimpan area pantauan ke database');
  }

  return data;
}