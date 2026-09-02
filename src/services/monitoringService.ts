import { supabase } from '../lib/supabaseClient';
import { MonitoringArea } from '@/types/monitoring';

// 1. Mengambil seluruh data area pantauan dari Supabase
export async function getMonitoringAreas(): Promise<MonitoringArea[]> {
  const { data, error } = await supabase
    .from('monitoring_areas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export const fetchMonitoringAreas = getMonitoringAreas;

// 2. Menyimpan area pantauan baru ke Supabase (Otomatis memicu trigger PostGIS geom)
export async function createMonitoringArea(areaData: {
  name: string;
  category: string;
  description: string;
  geometry: any;
}): Promise<MonitoringArea> {
  const { data, error } = await supabase
    .from('monitoring_areas')
    .insert([areaData])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// 3. Mengubah / Update area pantauan di Supabase
export async function updateMonitoringArea(
  id: string,
  updates: { name: string; category: string; description: string }
): Promise<MonitoringArea> {
  const { data, error } = await supabase
    .from('monitoring_areas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// 4. Menghapus area pantauan berdasarkan ID
export async function deleteMonitoringArea(id: string): Promise<void> {
  const { error } = await supabase
    .from('monitoring_areas')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

// 5. Fungsi PostGIS Spasial via Supabase RPC (Menghitung Luas Berbasis PostGIS Native)
export async function getPostgisCalculatedArea(areaId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('get_postgis_area_km2', {
      area_id: areaId,
    });

    if (error) {
      console.warn('PostGIS RPC note:', error.message);
      return null;
    }

    return data ? Number(data.toFixed(2)) : null;
  } catch {
    return null;
  }
}