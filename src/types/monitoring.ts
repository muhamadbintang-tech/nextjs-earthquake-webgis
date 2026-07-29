import { GeoJSON } from 'geojson';

export interface MonitoringArea {
  id?: string;
  name: string;
  description: string;
  category: string;
  geometry: GeoJSON.Geometry;
  created_at?: string;
}