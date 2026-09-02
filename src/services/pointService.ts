import { supabase } from '../lib/supabaseClient';
import { MonitoringPoint } from '@/types/point';

// Mengambil semua titik pantauan dari Supabase
export async function getMonitoringPoints(): Promise<MonitoringPoint[]> {
  const { data, error } = await supabase
    .from('monitoring_points')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

// Menyimpan titik pantauan baru ke Supabase
export async function createMonitoringPoint(pointData: {
  name: string;
  category: string;
  notes?: string;
  latitude: number;
  longitude: number;
}): Promise<MonitoringPoint> {
  const { data, error } = await supabase
    .from('monitoring_points')
    .insert([pointData])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Menghapus titik pantauan
export async function deleteMonitoringPoint(id: string): Promise<void> {
  const { error } = await supabase
    .from('monitoring_points')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}