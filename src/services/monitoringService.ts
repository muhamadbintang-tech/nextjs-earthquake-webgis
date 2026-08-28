import { supabase } from '@/lib/supabaseClient';
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

// Alias agar tidak error jika dipanggil dengan nama fetchMonitoringAreas
export const fetchMonitoringAreas = getMonitoringAreas;

// 2. Menyimpan area pantauan baru ke Supabase
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

// 3. Menghapus area pantauan berdasarkan ID
export async function deleteMonitoringArea(id: string): Promise<void> {
  const { error } = await supabase
    .from('monitoring_areas')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}