export interface EarthquakeProperties {
  mag: number;
  place: string;
  time: number;
  updated: number;
  url: string;
  detail: string;
  status: string;
  tsunami: number;
  sig: number;
  title: string;
}

export interface EarthquakeGeometry {
  type: string;
  coordinates: [number, number, number]; // [lng, lat, depth]
}

export interface EarthquakeFeature {
  type: string;
  properties: EarthquakeProperties;
  geometry: EarthquakeGeometry;
  id: string;
}

export interface EarthquakeResponse {
  type: string;
  features: EarthquakeFeature[];
}

// Alias agar kompatibel jika ada file yang menggunakan nama EarthquakeGeoJSON
export type EarthquakeGeoJSON = EarthquakeResponse;