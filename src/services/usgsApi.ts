import { EarthquakeGeoJSON } from '@/types/earthquake';

const USGS_EARTHQUAKE_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

export async function fetchEarthquakes(): Promise<EarthquakeGeoJSON> {
  const response = await fetch(USGS_EARTHQUAKE_URL, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil data gempa dari USGS (${response.status})`);
  }

  const data: EarthquakeGeoJSON = await response.json();
  return data;
}