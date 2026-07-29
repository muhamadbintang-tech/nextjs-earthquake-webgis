export interface EarthquakeGeometry {
  type: 'Point';
  coordinates: [number, number, number];
}

export interface EarthquakeProperties {
  mag: number;
  place: string;
  time: number;
  updated: number;
  url: string;
  title: string;
  status: string;
  tsunami: number;
  sig: number;
}

export interface EarthquakeFeature {
  type: 'Feature';
  properties: EarthquakeProperties;
  geometry: EarthquakeGeometry;
  id: string;
}

export interface EarthquakeGeoJSON {
  type: 'FeatureCollection';
  features: EarthquakeFeature[];
}