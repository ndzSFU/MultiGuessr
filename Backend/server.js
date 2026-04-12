const { httpServer, fetchMapillaryImageIds, getMapillaryCacheKey, mapillaryImageCache } = require('./index');
require("dotenv").config();

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  const command = input.trim().toLowerCase();

  if (command === 'warmup') {
    console.log('Cache warmup triggered!');
    void warmMapillaryCache().catch((error) => {
      console.error('Manual cache warmup failed:', error);
    });
  }
  // Add more commands as needed
});

const cities = [
  { name: 'Vancouver', lat: 49.2827, long: -123.1207 },
  { name: 'Burnaby', lat: 49.2488, long: -122.9805 },
  { name: 'Surrey', lat: 49.1913, long: -122.8490 },
  { name: 'Richmond', lat: 49.1666, long: -123.1336 },
  { name: 'Toronto', lat: 43.6532, long: -79.3832 },
  { name: 'Mississauga', lat: 43.5890, long: -79.6441 },
  { name: 'Brampton', lat: 43.7315, long: -79.7624 },
  { name: 'Ottawa', lat: 45.4215, long: -75.6972 },
  { name: 'Montreal', lat: 45.5017, long: -73.5673 },
  { name: 'Calgary', lat: 51.0447, long: -114.0719 },
  { name: 'Edmonton', lat: 53.5461, long: -113.4938 },
  { name: 'Winnipeg', lat: 49.8951, long: -97.1384 },
  { name: 'Victoria', lat: 48.4284, long: -123.3656 },

  // // USA
  // { name: 'Seattle', lat: 47.6062, long: -122.3321 },
  // { name: 'San Francisco', lat: 37.7749, long: -122.4194 },
  // { name: 'San Jose', lat: 37.3382, long: -121.8863 },
  // { name: 'Los Angeles', lat: 34.0522, long: -118.2437 },
  // { name: 'San Diego', lat: 32.7157, long: -117.1611 },
  // { name: 'Las Vegas', lat: 36.1699, long: -115.1398 },
  // { name: 'Phoenix', lat: 33.4484, long: -112.0740 },
  // { name: 'Denver', lat: 39.7392, long: -104.9903 },
  // { name: 'Dallas', lat: 32.7767, long: -96.7970 },
  // { name: 'Austin', lat: 30.2672, long: -97.7431 },
  // { name: 'Houston', lat: 29.7604, long: -95.3698 },
  // { name: 'Chicago', lat: 41.8781, long: -87.6298 },
  // { name: 'New York', lat: 40.7128, long: -74.0060 },
  // { name: 'Brooklyn', lat: 40.6782, long: -73.9442 },
  // { name: 'Queens', lat: 40.7282, long: -73.7949 },
  // { name: 'Boston', lat: 42.3601, long: -71.0589 },
  // { name: 'Washington DC', lat: 38.9072, long: -77.0369 },
  // { name: 'Philadelphia', lat: 39.9526, long: -75.1652 },
  // { name: 'Miami', lat: 25.7617, long: -80.1918 },
  // { name: 'Orlando', lat: 28.5383, long: -81.3792 },
  // { name: 'Atlanta', lat: 33.7490, long: -84.3880 },
  // { name: 'Nashville', lat: 36.1627, long: -86.7816 },
  // { name: 'Detroit', lat: 42.3314, long: -83.0458 },
  // { name: 'Minneapolis', lat: 44.9778, long: -93.2650 },
  // { name: 'St Louis', lat: 38.6270, long: -90.1994 },
  // { name: 'Kansas City', lat: 39.0997, long: -94.5786 },
  // { name: 'San Antonio', lat: 29.4241, long: -98.4936 },

  // // Europe
  // { name: 'London', lat: 51.5074, long: -0.1278 },
  // { name: 'Manchester', lat: 53.4808, long: -2.2426 },
  // { name: 'Birmingham', lat: 52.4862, long: -1.8904 },
  // { name: 'Paris', lat: 48.8566, long: 2.3522 },
  // { name: 'Lyon', lat: 45.7640, long: 4.8357 },
  // { name: 'Marseille', lat: 43.2965, long: 5.3698 },
  // { name: 'Berlin', lat: 52.5200, long: 13.4050 },
  // { name: 'Hamburg', lat: 53.5511, long: 9.9937 },
  // { name: 'Munich', lat: 48.1351, long: 11.5820 },
  // { name: 'Frankfurt', lat: 50.1109, long: 8.6821 },
  // { name: 'Amsterdam', lat: 52.3676, long: 4.9041 },
  // { name: 'Rotterdam', lat: 51.9244, long: 4.4777 },
  // { name: 'Brussels', lat: 50.8503, long: 4.3517 },
  // { name: 'Vienna', lat: 48.2082, long: 16.3738 },
  // { name: 'Zurich', lat: 47.3769, long: 8.5417 },
  // { name: 'Geneva', lat: 46.2044, long: 6.1432 },
  // { name: 'Madrid', lat: 40.4168, long: -3.7038 },
  // { name: 'Barcelona', lat: 41.3851, long: 2.1734 },
  // { name: 'Valencia', lat: 39.4699, long: -0.3763 },
  // { name: 'Lisbon', lat: 38.7223, long: -9.1393 },
  // { name: 'Rome', lat: 41.9028, long: 12.4964 },
  // { name: 'Milan', lat: 45.4642, long: 9.1900 },
  // { name: 'Florence', lat: 43.7696, long: 11.2558 },
  // { name: 'Venice', lat: 45.4408, long: 12.3155 },
];

async function warmMapillaryCache() {
  console.log('warmMapillaryCache entered');
  const accessToken = process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN;

  if (!accessToken) {
    console.log('Skipping Mapillary cache warmup: missing access token');
    process.exit(1);
  }

  let miss_count = 0;

  let cur_idx = 0;
  for (const city of cities) {
    const cacheKey = getMapillaryCacheKey(city.lat, city.long);

    if (mapillaryImageCache.has(cacheKey)) {
      console.log(city.name + " already in cache");
      continue;
    }

    try {
      console.log(`Adding ${city.name} to the cache`);
      const fetchResults = await fetchMapillaryImageIds(city.lat, city.long, accessToken);
      mapillaryImageCache.set(cacheKey, fetchResults);
    } catch (error) {
      console.error(`Failed to warm cache for ${city.name}:`, error);
      cities.splice(cur_idx, 1);
      cur_idx--;
      miss_count++;
    }
    cur_idx++;
  }
  console.log("Cache warmed");

  console.log("Second cache warm!");

  for (const city of cities) {
    const cacheKey = getMapillaryCacheKey(city.lat, city.long);

    if (mapillaryImageCache.has(cacheKey)) {
      console.log(city.name + " already in cache");
      continue;
    }

    try {
      console.log(`Adding ${city.name} to the cache`);
      const fetchResults = await fetchMapillaryImageIds(city.lat, city.long, accessToken);
      mapillaryImageCache.set(cacheKey, fetchResults);
    } catch (error) {
      console.error(`Failed to warm cache for ${city.name}:`, error);
      cities.splice(cur_idx, 1);
      cur_idx--;
      miss_count++;
    }
    cur_idx++;
  }

  console.log("Second cache warm done!");

  // console.log(mapillaryImageCache);
}

const PORT = 9090;
httpServer.listen(PORT, async () => {
  console.log(`Server is listening on port ${PORT}`);
  await warmMapillaryCache();
});
