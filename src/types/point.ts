export interface MonitoringPoint {
  id?: string;
  name: string;
  category: string;
  notes?: string;
  latitude: number;
  longitude: number;
  created_at?: string;
}