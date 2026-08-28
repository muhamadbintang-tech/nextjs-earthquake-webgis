import { EarthquakeResponse } from '@/types/earthquake';

const USGS_API_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

export async function getEarthquakes(): Promise<EarthquakeResponse> {
  const response = await fetch(USGS_API_URL);

  if (!response.ok) {
    throw new Error('Gagal mengambil data gempa bumi dari USGS API');
  }

  const data: EarthquakeResponse = await response.json();
  return data;
}

export const fetchEarthquakes = getEarthquakes;