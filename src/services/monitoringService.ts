import { supabase } from '@/lib/supabase';
import { MonitoringArea } from '@/types/monitoring';

// 1. Ambil Semua Data Area dari Supabase
export async function fetchMonitoringAreas(): Promise<MonitoringArea[]> {
  const { data, error } = await supabase
    .from('monitoring_areas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil data area: ${error.message}`);
  }

  return data || [];
}

// 2. Simpan Area Baru ke Supabase
export async function createMonitoringArea(area: Omit<MonitoringArea, 'id' | 'created_at'>): Promise<MonitoringArea> {
  const { data, error } = await supabase
    .from('monitoring_areas')
    .insert([area])
    .select()
    .single();

  if (error) {
    throw new Error(`Gagal menyimpan area: ${error.message}`);
  }

  return data;
}

// 3. Hapus Area Berdasarkan ID dari Supabase
export async function deleteMonitoringArea(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('monitoring_areas')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Gagal menghapus area: ${error.message}`);
  }

  return true;
}