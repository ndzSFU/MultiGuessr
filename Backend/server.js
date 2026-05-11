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
  
});

const cities = [
  { name: 'Vancouver', lat: 49.2827, long: -123.1207 },
  { name: 'Burnaby', lat: 49.2488, long: -122.9805 },
  { name: 'Surrey', lat: 49.1913, long: -122.8490 },
  { name: 'Richmond', lat: 49.1666, long: -123.1336 },
  { name: 'Coquitlam', lat: 49.2838, long: -122.7932 },
  { name: 'Port Coquitlam', lat: 49.2628, long: -122.7811 },
  { name: 'North Vancouver', lat: 49.3200, long: -123.0724 },
  { name: 'West Vancouver', lat: 49.3286, long: -123.1620 },
  
  // { name: 'Toronto', lat: 43.6532, long: -79.3832 },
  // { name: 'Mississauga', lat: 43.5890, long: -79.6441 },
  // { name: 'Brampton', lat: 43.7315, long: -79.7624 },
  // { name: 'Markham', lat: 43.8561, long: -79.3370 },
  // { name: 'Vaughan', lat: 43.8372, long: -79.5083 },
  // { name: 'Oakville', lat: 43.4675, long: -79.6877 },
  // { name: 'Burlington', lat: 43.3255, long: -79.7990 },
  // { name: 'Hamilton', lat: 43.2557, long: -79.8711 },
  // { name: 'Kitchener', lat: 43.4516, long: -80.4925 },
  // { name: 'Waterloo', lat: 43.4643, long: -80.5204 },
  // { name: 'London', lat: 42.9849, long: -81.2453 },
  // { name: 'Windsor', lat: 42.3149, long: -83.0364 },
  // { name: 'St. Catharines', lat: 43.1594, long: -79.2469 },
  // { name: 'Ottawa', lat: 45.4215, long: -75.6972 },
  // { name: 'Montreal', lat: 45.5017, long: -73.5673 },
  // { name: 'Quebec City', lat: 46.8139, long: -71.2080 },
  // { name: 'Sherbrooke', lat: 45.4042, long: -71.8929 },
  // { name: 'Trois-Rivieres', lat: 46.3431, long: -72.5430 },
  // { name: 'Calgary', lat: 51.0447, long: -114.0719 },
  // { name: 'Edmonton', lat: 53.5461, long: -113.4938 },
  // { name: 'Winnipeg', lat: 49.8951, long: -97.1384 },
  // { name: 'Victoria', lat: 48.4284, long: -123.3656 },
  // { name: 'Red Deer', lat: 52.2681, long: -113.8112 },
  // { name: 'Lethbridge', lat: 49.6956, long: -112.8451 },
  // { name: 'Kamloops', lat: 50.6745, long: -120.3273 },
  // { name: 'Kelowna', lat: 49.8880, long: -119.4960 },
  // { name: 'Nanaimo', lat: 49.1659, long: -123.9401 },
  // { name: 'Abbotsford', lat: 49.0504, long: -122.3045 },
  // { name: 'Saskatoon', lat: 52.1579, long: -106.6702 },
  // { name: 'Regina', lat: 50.4452, long: -104.6189 },
  // { name: 'Halifax', lat: 44.6488, long: -63.5752 },
  // { name: 'Moncton', lat: 46.0878, long: -64.7782 },
  // { name: 'Fredericton', lat: 45.9636, long: -66.6431 },
  // { name: 'Charlottetown', lat: 46.2382, long: -63.1311 },
  // { name: "St. John's", lat: 47.5615, long: -52.7126 },

  // // // USA
  // { name: 'New York', lat: 40.7128, long: -74.0060 },
  // { name: 'Brooklyn', lat: 40.6782, long: -73.9442 }, // suburb/borough
  // { name: 'Queens', lat: 40.7282, long: -73.7949 }, // suburb/borough
  // { name: 'Jersey City', lat: 40.7178, long: -74.0431 }, // suburb
  // { name: 'Newark', lat: 40.7357, long: -74.1724 }, // suburb
  // { name: 'Los Angeles', lat: 34.0522, long: -118.2437 },
  // { name: 'Long Beach', lat: 33.7701, long: -118.1937 }, // suburb
  // { name: 'Anaheim', lat: 33.8366, long: -117.9143 }, // suburb
  // { name: 'Santa Ana', lat: 33.7455, long: -117.8677 }, // suburb
  // { name: 'San Diego', lat: 32.7157, long: -117.1611 },
  // { name: 'San Jose', lat: 37.3382, long: -121.8863 },
  // { name: 'San Francisco', lat: 37.7749, long: -122.4194 },
  // { name: 'Oakland', lat: 37.8044, long: -122.2711 }, // suburb
  // { name: 'Fremont', lat: 37.5483, long: -121.9886 }, // suburb
  // { name: 'Sacramento', lat: 38.5816, long: -121.4944 },
  // { name: 'Fresno', lat: 36.7378, long: -119.7871 },
  // { name: 'Phoenix', lat: 33.4484, long: -112.0740 },
  // { name: 'Mesa', lat: 33.4152, long: -111.8315 }, // suburb
  // { name: 'Chandler', lat: 33.3062, long: -111.8413 }, // suburb
  // { name: 'Tucson', lat: 32.2226, long: -110.9747 },
  // { name: 'Houston', lat: 29.7604, long: -95.3698 },
  // { name: 'Pasadena TX', lat: 29.6911, long: -95.2091 }, // suburb
  // { name: 'Sugar Land', lat: 29.6197, long: -95.6349 }, // suburb
  // { name: 'San Antonio', lat: 29.4241, long: -98.4936 },
  // { name: 'Dallas', lat: 32.7767, long: -96.7970 },
  // { name: 'Fort Worth', lat: 32.7555, long: -97.3308 },
  // { name: 'Arlington TX', lat: 32.7357, long: -97.1081 }, // suburb
  // { name: 'Austin', lat: 30.2672, long: -97.7431 },
  // { name: 'El Paso', lat: 31.7619, long: -106.4850 },
  // { name: 'Jacksonville', lat: 30.3322, long: -81.6557 },
  // { name: 'Miami', lat: 25.7617, long: -80.1918 },
  // { name: 'Hialeah', lat: 25.8576, long: -80.2781 }, // suburb
  // { name: 'Tampa', lat: 27.9506, long: -82.4572 },
  // { name: 'Orlando', lat: 28.5383, long: -81.3792 },
  // { name: 'Atlanta', lat: 33.7490, long: -84.3880 },
  // { name: 'Charlotte', lat: 35.2271, long: -80.8431 },
  // { name: 'Raleigh', lat: 35.7796, long: -78.6382 },
  // { name: 'Nashville', lat: 36.1627, long: -86.7816 },
  // { name: 'Louisville', lat: 38.2527, long: -85.7585 },
  // { name: 'Indianapolis', lat: 39.7684, long: -86.1581 },
  // { name: 'Columbus', lat: 39.9612, long: -82.9988 },
  // { name: 'Cleveland', lat: 41.4993, long: -81.6944 },
  // { name: 'Cincinnati', lat: 39.1031, long: -84.5120 },
  // { name: 'Chicago', lat: 41.8781, long: -87.6298 },
  // { name: 'Aurora IL', lat: 41.7606, long: -88.3201 }, // suburb
  // { name: 'Naperville', lat: 41.7508, long: -88.1535 }, // suburb
  // { name: 'Milwaukee', lat: 43.0389, long: -87.9065 },
  // { name: 'Minneapolis', lat: 44.9778, long: -93.2650 },
  // { name: 'St Paul', lat: 44.9537, long: -93.0900 }, // suburb/twin city
  // { name: 'Kansas City', lat: 39.0997, long: -94.5786 },
  // { name: 'Oklahoma City', lat: 35.4634, long: -97.5151 },
  // { name: 'Tulsa', lat: 36.1539, long: -95.9928 },
  // { name: 'Denver', lat: 39.7392, long: -104.9903 },
  // { name: 'Aurora CO', lat: 39.7294, long: -104.8319 }, // suburb
  // { name: 'Seattle', lat: 47.6062, long: -122.3321 },
  // { name: 'Bellevue', lat: 47.6101, long: -122.2015 }, // suburb
  // { name: 'Portland', lat: 45.5152, long: -122.6784 },
  // { name: 'Las Vegas', lat: 36.1699, long: -115.1398 },
  // { name: 'Henderson', lat: 36.0395, long: -114.9817 }, // suburb
  // { name: 'San Bernardino', lat: 34.1083, long: -117.2898 }, // suburb
  // { name: 'Riverside', lat: 33.9806, long: -117.3755 }, // suburb
  // { name: 'San Juan', lat: 18.4655, long: -66.1057 }, // Puerto Rico, large US city
  // { name: 'Honolulu', lat: 21.3069, long: -157.8583 },

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
  const accessToken = process.env.MAPILLARY_ACCESS_TOKEN;

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
