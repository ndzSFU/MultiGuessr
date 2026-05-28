const { httpServer, fetchMapillaryImageIds, getMapillaryCacheKey, mapillaryImageCache } = require('./index');
require('dotenv').config({ path: '.env', override: true });

let final_failures = [];

const cities = [
  { name: 'Vancouver', lat: 49.2827, long: -123.1207 },
  { name: 'Burnaby', lat: 49.2488, long: -122.9805 },
  { name: 'Surrey', lat: 49.1948, long: -122.8530 },
  { name: 'Richmond', lat: 49.1666, long: -123.1336 },
  { name: 'Coquitlam', lat: 49.2838, long: -122.7932 },
  { name: 'Port Coquitlam', lat: 49.2628, long: -122.7811 },
  { name: 'North Vancouver', lat: 49.3200, long: -123.0724 },
  { name: 'West Vancouver', lat: 49.3286, long: -123.1620 },
  
  { name: 'Toronto', lat: 43.6532, long: -79.3832 },
  { name: 'Mississauga', lat: 43.5890, long: -79.6441 },
  { name: 'Brampton', lat: 43.7315, long: -79.7624 },
  { name: 'Markham', lat: 43.8561, long: -79.3370 },
  { name: 'Vaughan', lat: 43.8372, long: -79.5083 },
  { name: 'Oakville', lat: 43.4675, long: -79.6877 },
  { name: 'Burlington', lat: 43.3255, long: -79.7990 },
  { name: 'Hamilton', lat: 43.2557, long: -79.8711 },
  { name: 'Kitchener', lat: 43.4516, long: -80.4925 },
  { name: 'Waterloo', lat: 43.4643, long: -80.5204 },
  { name: 'London', lat: 42.9849, long: -81.2453 },
  { name: 'Windsor', lat: 42.3149, long: -83.0364 },
  { name: 'St. Catharines', lat: 43.1594, long: -79.2469 },
  { name: 'Ottawa', lat: 45.4215, long: -75.6972 },
  { name: 'Montreal', lat: 45.5017, long: -73.5673 },
  { name: 'Quebec City', lat: 46.8139, long: -71.2080 },
  { name: 'Sherbrooke', lat: 45.4042, long: -71.8929 },
  { name: 'Trois-Rivieres', lat: 46.3431, long: -72.5430 },
  { name: 'Calgary', lat: 51.0447, long: -114.0719 },
  { name: 'Edmonton', lat: 53.5461, long: -113.4938 },
  { name: 'Winnipeg', lat: 49.8951, long: -97.1384 },
  { name: 'Victoria', lat: 48.4284, long: -123.3656 },
  { name: 'Red Deer', lat: 52.2681, long: -113.8112 },
  { name: 'Medicine Hat', lat: 50.0012, long: -110.6478 },
  { name: 'Kamloops', lat: 50.6745, long: -120.3273 },
  { name: 'Kelowna', lat: 49.8880, long: -119.4960 },
  { name: 'Nanaimo', lat: 49.1659, long: -123.9401 },
  { name: 'Abbotsford', lat: 49.0504, long: -122.3045 },
  { name: 'Saskatoon', lat: 52.1579, long: -106.6702 },
  { name: 'Regina', lat: 50.4452, long: -104.6189 },
  { name: 'Halifax', lat: 44.6488, long: -63.5752 },
  { name: 'Moncton', lat: 46.0878, long: -64.7782 },
  { name: 'Fredericton', lat: 45.9636, long: -66.6431 },
  { name: 'Charlottetown', lat: 46.2382, long: -63.1311 },
  { name: "St. John's", lat: 47.5615, long: -52.7126 },

  // USA
  { name: 'Seattle', lat: 47.6064, long: -122.3319 },
  { name: 'Anchorage', lat: 61.2181, long: -149.9003 },
  { name: 'New York', lat: 40.7128, long: -74.0060 },
  { name: 'Brooklyn', lat: 40.6782, long: -73.9442 }, // suburb/borough
  { name: 'Queens', lat: 40.7282, long: -73.7949 }, // suburb/borough
  { name: 'Jersey City', lat: 40.7178, long: -74.0431 }, // suburb
  { name: 'Newark', lat: 40.7357, long: -74.1724 }, // suburb
  { name: 'Los Angeles', lat: 34.0522, long: -118.2437 },
  { name: 'Long Beach', lat: 33.7701, long: -118.1937 }, // suburb
  { name: 'Anaheim', lat: 33.8366, long: -117.9143 }, // suburb
  { name: 'Santa Ana', lat: 33.7455, long: -117.8677 }, // suburb
  { name: 'San Diego', lat: 32.7157, long: -117.1611 },
  { name: 'San Jose', lat: 37.3382, long: -121.8863 },
  { name: 'San Francisco', lat: 37.7749, long: -122.4194 },
  { name: 'Oakland', lat: 37.8044, long: -122.2711 }, // suburb
  { name: 'Fremont', lat: 37.5483, long: -121.9886 }, // suburb
  { name: 'Sacramento', lat: 38.5816, long: -121.4944 },
  { name: 'Fresno', lat: 36.7378, long: -119.7871 },
  { name: 'Phoenix', lat: 33.4484, long: -112.0740 },
  { name: 'Mesa', lat: 33.4152, long: -111.8315 }, // suburb
  { name: 'Chandler', lat: 33.3062, long: -111.8413 }, // suburb
  { name: 'Tucson', lat: 32.2226, long: -110.9747 },
  { name: 'Houston', lat: 29.7604, long: -95.3698 },
  { name: 'Pasadena TX', lat: 29.6911, long: -95.2091 }, // suburb
  { name: 'Sugar Land', lat: 29.6197, long: -95.6349 }, // suburb
  { name: 'San Antonio', lat: 29.4241, long: -98.4936 },
  { name: 'Dallas', lat: 32.7767, long: -96.7970 },
  { name: 'Fort Worth', lat: 32.7555, long: -97.3308 },
  { name: 'Austin', lat: 30.2672, long: -97.7431 },
  { name: 'El Paso', lat: 31.7619, long: -106.4850 },
  { name: 'Jacksonville', lat: 30.3322, long: -81.6557 },
  { name: 'Miami', lat: 25.7617, long: -80.1918 },
  { name: 'Hialeah', lat: 25.8576, long: -80.2781 }, // suburb
  { name: 'Tampa', lat: 27.9506, long: -82.4572 },
  { name: 'Orlando', lat: 28.5383, long: -81.3792 },
  { name: 'Atlanta', lat: 33.7490, long: -84.3880 },
  { name: 'Charlotte', lat: 35.2271, long: -80.8431 },
  { name: 'Raleigh', lat: 35.7796, long: -78.6382 },
  { name: 'Nashville', lat: 36.1627, long: -86.7816 },
  { name: 'Louisville', lat: 38.2527, long: -85.7585 },
  { name: 'Indianapolis', lat: 39.7684, long: -86.1581 },
  { name: 'Columbus', lat: 39.9612, long: -82.9988 },
  { name: 'Cleveland', lat: 41.4993, long: -81.6944 },
  { name: 'Cincinnati', lat: 39.1031, long: -84.5120 },
  { name: 'Chicago', lat: 41.8781, long: -87.6298 },
  { name: 'Aurora IL', lat: 41.7606, long: -88.3201 }, // suburb
  { name: 'Naperville', lat: 41.7508, long: -88.1535 }, // suburb
  { name: 'Milwaukee', lat: 43.0389, long: -87.9065 },
  { name: 'Minneapolis', lat: 44.9778, long: -93.2650 },
  { name: 'St Paul', lat: 44.9537, long: -93.0900 }, // suburb/twin city
  { name: 'Kansas City', lat: 39.0997, long: -94.5786 },
  { name: 'Oklahoma City', lat: 35.4634, long: -97.5151 },
  { name: 'Tulsa', lat: 36.1539, long: -95.9928 },
  { name: 'Denver', lat: 39.7392, long: -104.9903 },
  { name: 'Aurora CO', lat: 39.707, long: -104.8234 }, // suburb
  
  { name: 'Bellevue', lat: 47.6101, long: -122.2015 }, // suburb
  { name: 'Portland', lat: 45.5152, long: -122.6784 },
  { name: 'Las Vegas', lat: 36.1699, long: -115.1398 },
  { name: 'Henderson', lat: 36.0395, long: -114.9817 }, // suburb
  { name: 'San Bernardino', lat: 34.1083, long: -117.2898 }, // suburb
  { name: 'Riverside', lat: 33.9806, long: -117.3755 }, // suburb
  { name: 'San Juan', lat: 18.4655, long: -66.1057 }, // Puerto Rico, large US city
  { name: 'Honolulu', lat: 21.3069, long: -157.8583 },

  // Europe
  { name: 'London', lat: 51.5074, long: -0.1278 },
  { name: 'Manchester', lat: 53.4808, long: -2.2426 },
  { name: 'Birmingham', lat: 52.4862, long: -1.8904 },
  { name: 'Liverpool', lat: 53.4084, long: -2.9916 },
  { name: 'Leeds', lat: 53.8008, long: -1.5491 },
  { name: 'Sheffield', lat: 53.3811, long: -1.4701 },
  { name: 'Edinburgh', lat: 55.9533, long: -3.1883 },
  { name: 'Glasgow', lat: 55.8642, long: -4.2518 },
  { name: 'Belfast', lat: 54.5973, long: -5.9301 },
  { name: 'Dublin', lat: 53.3498, long: -6.2603 },
  { name: 'Cork', lat: 51.8985, long: -8.4756 },
  { name: 'Paris', lat: 48.8566, long: 2.3522 },
  { name: 'Lyon', lat: 45.7640, long: 4.8357 },
  { name: 'Marseille', lat: 43.2965, long: 5.3698 },
  { name: 'Toulouse', lat: 43.6047, long: 1.4442 },
  { name: 'Nice', lat: 43.7102, long: 7.2620 },
  { name: 'Bordeaux', lat: 44.8378, long: -0.5792 },
  { name: 'Strasbourg', lat: 48.5734, long: 7.7521 },
  { name: 'Berlin', lat: 52.5200, long: 13.4050 },
  { name: 'Hamburg', lat: 53.5511, long: 9.9937 },
  { name: 'Munich', lat: 48.1351, long: 11.5820 },
  { name: 'Frankfurt', lat: 50.1109, long: 8.6821 },
  { name: 'Cologne', lat: 50.9375, long: 6.9603 },
  { name: 'Stuttgart', lat: 48.7758, long: 9.1829 },
  { name: 'Düsseldorf', lat: 51.2277, long: 6.7735 },
  { name: 'Leipzig', lat: 51.3397, long: 12.3731 },
  { name: 'Amsterdam', lat: 52.3676, long: 4.9041 },
  { name: 'Rotterdam', lat: 51.9244, long: 4.4777 },
  { name: 'The Hague', lat: 52.0705, long: 4.3007 },
  { name: 'Utrecht', lat: 52.0907, long: 5.1214 },
  { name: 'Brussels', lat: 50.8503, long: 4.3517 },
  { name: 'Antwerp', lat: 51.2194, long: 4.4025 },
  { name: 'Ghent', lat: 51.0543, long: 3.7174 },
  { name: 'Vienna', lat: 48.2082, long: 16.3738 },
  { name: 'Graz', lat: 47.0707, long: 15.4395 },
  { name: 'Zurich', lat: 47.3769, long: 8.5417 },
  { name: 'Geneva', lat: 46.2044, long: 6.1432 },
  { name: 'Basel', lat: 47.5596, long: 7.5886 },
  { name: 'Madrid', lat: 40.4168, long: -3.7038 },
  { name: 'Barcelona', lat: 41.3851, long: 2.1734 },
  { name: 'Valencia', lat: 39.4699, long: -0.3763 },
  { name: 'Seville', lat: 37.3891, long: -5.9845 },
  { name: 'Zaragoza', lat: 41.6488, long: -0.8891 },
  { name: 'Málaga', lat: 36.7213, long: -4.4214 },
  { name: 'Lisbon', lat: 38.7223, long: -9.1393 },
  { name: 'Porto', lat: 41.1579, long: -8.6291 },
  { name: 'Rome', lat: 41.9028, long: 12.4964 },
  { name: 'Milan', lat: 45.4642, long: 9.1900 },
  { name: 'Naples', lat: 40.8518, long: 14.2681 },
  { name: 'Turin', lat: 45.0703, long: 7.6869 },
  { name: 'Florence', lat: 43.7696, long: 11.2558 },
  { name: 'Venice', lat: 45.4408, long: 12.3155 },
  { name: 'Stockholm', lat: 59.3293, long: 18.0686 },
  { name: 'Gothenburg', lat: 57.7089, long: 11.9746 },
  { name: 'Copenhagen', lat: 55.6761, long: 12.5683 },
  { name: 'Aarhus', lat: 56.1567, long: 10.2108 },
  { name: 'Oslo', lat: 59.9139, long: 10.7522 },
  { name: 'Bergen', lat: 60.3913, long: 5.3221 },
  { name: 'Helsinki', lat: 60.1695, long: 24.9354 },
  { name: 'Tampere', lat: 61.4978, long: 23.7609 },
  { name: 'Prague', lat: 50.0755, long: 14.4378 },
  { name: 'Brno', lat: 49.1951, long: 16.6068 },
  { name: 'Warsaw', lat: 52.2297, long: 21.0122 },
  { name: 'Kraków', lat: 50.0647, long: 19.9450 },
  { name: 'Budapest', lat: 47.4968, long: 19.0511 },
  { name: 'Debrecen', lat: 47.5316, long: 21.6273 },
  { name: 'Bucharest', lat: 44.4268, long: 26.1025 },
  { name: 'Cluj-Napoca', lat: 46.7712, long: 23.6236 },
  { name: 'Athens', lat: 37.9838, long: 23.7275 },
  { name: 'Thessaloniki', lat: 40.6401, long: 22.9444 },  
];

// Additional global cities to improve coverage in underrepresented regions
// South America
cities.push(
  { name: 'Bogotá', lat: 4.7110, long: -74.0721 },
  { name: 'Medellín', lat: 6.2442, long: -75.5812 },
  { name: 'Barranquilla', lat: 10.9685, long: -74.7810 },
  { name: 'Bucaramanga', lat: 7.1193, long: -73.1227 },
  { name: 'Cali', lat: 3.4516, long: -76.5320 },
  { name: 'Quito', lat: -0.2161, long: -78.5098 },
  { name: 'Guayaquil', lat: -2.170998, long: -79.922359 },
  { name: 'Lima', lat: -12.0464, long: -77.0428 },
  { name: 'Trujillo', lat: -8.1083, long: -79.0215 },
  { name: 'Cusco', lat: -13.5319, long: -71.9675 },
  { name: 'Santiago', lat: -33.4489, long: -70.6693 },
  { name: 'Valparaíso', lat: -33.0472, long: -71.6127 },
  { name: 'Concepción', lat: -36.8201, long: -73.0444 },
  { name: 'Buenos Aires', lat: -34.6037, long: -58.3816 },
  { name: 'Córdoba', lat: -31.4201, long: -64.1888 },
  { name: 'Rosario', lat: -32.9442, long: -60.6505 },
  { name: 'Mendoza', lat: -32.8895, long: -68.8458 },
  { name: 'Salta', lat: -24.7821, long: -65.4232 },
  { name: 'São Paulo', lat: -23.5505, long: -46.6333 },
  { name: 'Rio de Janeiro', lat: -22.9068, long: -43.1729 },
  { name: 'Belo Horizonte', lat: -19.9167, long: -43.9345 },
  { name: 'Brasilia', lat: -15.7939, long: -47.8828 },
  { name: 'Curitiba', lat: -25.4284, long: -49.2733 },
  { name: 'Porto Alegre', lat: -30.0277, long: -51.2287 },
  { name: 'Recife', lat: -8.0476, long: -34.8770 },
  { name: 'Salvador', lat: -12.9777, long: -38.5016 },
  { name: 'Fortaleza', lat: -3.7319, long: -38.5267 },
  { name: 'Belém', lat: -1.4558, long: -48.5044 },
  { name: 'Manaus', lat: -3.1190, long: -60.0217 },
  { name: 'Santa Cruz', lat: -17.7833, long: -63.1821 },
  { name: 'La Paz', lat: -16.4897, long: -68.1193 },
  { name: 'Asunción', lat: -25.2637, long: -57.5759 },
  { name: 'Montevideo', lat: -34.9011, long: -56.1645 }
);

// Mexico, Central America, and the Caribbean
cities.push(
  // Mexico
  { name: 'Mexico City', lat: 19.4326, long: -99.1332 },
  { name: 'Guadalajara', lat: 20.6597, long: -103.3496 },
  { name: 'Monterrey', lat: 25.6866, long: -100.3161 },
  { name: 'Merida', lat: 20.9674, long: -89.5926 },
  { name: 'Cancun', lat: 21.1619, long: -86.8515 },
  // Central America
  { name: 'Guatemala City', lat: 14.6349, long: -90.5069 },
  { name: 'San Salvador', lat: 13.6929, long: -89.2182 },
  { name: 'Tegucigalpa', lat: 14.0723, long: -87.1921 },
  { name: 'Managua', lat: 12.1140, long: -86.2362 },
  { name: 'San Jose CR', lat: 9.9281, long: -84.0907 },
  { name: 'Panama City', lat: 8.9824, long: -79.5199 },
  { name: 'Belize City', lat: 17.5046, long: -88.1962 },
  // Caribbean
  { name: 'Havana', lat: 23.1136, long: -82.3666 },
  { name: 'Santo Domingo', lat: 18.4861, long: -69.9312 },
  { name: 'Santiago de los Caballeros', lat: 19.4517, long: -70.6970 },
  { name: 'Kingston', lat: 17.9712, long: -76.7936 },
  { name: 'Nassau', lat: 25.0443, long: -77.3504 },
  { name: 'Port-au-Prince', lat: 18.5444, long: -72.3151 }
);

// Africa (single city per country unless large or well-covered)
cities.push(
  { name: 'Lagos', lat: 6.5244, long: 3.3792 },
  { name: 'Abuja', lat: 9.0765, long: 7.3986 },
  { name: 'Kano', lat: 12.0126, long: 8.5264 },
  { name: 'Port Harcourt', lat: 4.8156, long: 7.0498 },
  { name: 'Nairobi', lat: -1.2864, long: 36.8172 },
  { name: 'Mombasa', lat: -4.0619, long: 39.6657 },
  { name: 'Johannesburg', lat: -26.2041, long: 28.0473 },
  { name: 'Cape Town', lat: -33.9249, long: 18.4241 },
  { name: 'Durban', lat: -29.8587, long: 31.0218 },
  { name: 'Cairo', lat: 30.0444, long: 31.2357 },
  { name: 'Alexandria', lat: 31.2001, long: 29.9187 },
  { name: 'Algiers', lat: 36.7698, long: 3.0570 },
  { name: 'Oran', lat: 35.6971, long: -0.6308 },
  { name: 'Tunis', lat: 36.8065, long: 10.1815 },
  { name: 'Rabat', lat: 33.9716, long: -6.8498 },
  { name: 'Casablanca', lat: 33.5731, long: -7.5898 },
  { name: 'Addis Ababa', lat: 8.9806, long: 38.7578 },
  { name: 'Kigali', lat: -1.9579, long: 30.1127 },
  { name: 'Kampala', lat: 0.3476, long: 32.5825 },
  { name: 'Dar es Salaam', lat: -6.7924, long: 39.2083 },
  { name: 'Lusaka', lat: -15.3875, long: 28.3228 },
  { name: 'Harare', lat: -17.8252, long: 31.0335 },
  { name: 'Maputo', lat: -25.9692, long: 32.5732 },
  { name: 'Windhoek', lat: -22.5685, long: 17.0841 },
  { name: 'Gaborone', lat: -24.6282, long: 25.9231 },
  { name: 'Lilongwe', lat: -13.9626, long: 33.7741 },
  { name: 'Antananarivo', lat: -18.8792, long: 47.5079 },
  { name: 'Dakar', lat: 14.7167, long: -17.4677 },
  { name: 'Accra', lat: 5.6037, long: -0.1870 },
  { name: 'Kinshasa', lat: -4.4419, long: 15.2663 }
);

// Asia (expanded — add more large cities across regions)
cities.push(
  // China
  { name: 'Beijing', lat: 39.8955, long: 116.3919 },
  { name: 'Shanghai', lat: 31.2304, long: 121.4737 },
  { name: 'Guangzhou', lat: 23.1291, long: 113.2644 },
  { name: 'Shenzhen', lat: 22.5431, long: 114.0579 },
  { name: 'Chengdu', lat: 30.5728, long: 104.0668 },
  { name: 'Xi\'an', lat: 34.2662, long: 108.9335 },
  { name: 'Puyang', lat: 35.7893, long: 115.0845 },
  // Japan
  { name: 'Tokyo', lat: 35.6762, long: 139.6503 },
  { name: 'Osaka', lat: 34.6937, long: 135.5023 },
  { name: 'Yokohama', lat: 35.4437, long: 139.6380 },
  { name: 'Sapporo', lat: 43.0618, long: 141.3545 },
  { name: 'Fukuoka', lat: 33.5904, long: 130.4017 },
  // Korea
  { name: 'Busan', lat: 35.1746, long: 128.9560 },
  { name: 'Seoul', lat: 37.5706, long: 126.9737 },
  { name: 'Daegu', lat: 35.8607, long: 128.6376 },
  // Taiwan
  { name: 'Taipei', lat: 25.0330, long: 121.5654 },
  { name: 'Taichung', lat: 24.1477, long: 120.6736 },
  { name: 'Kaohsiung', lat: 22.6273, long: 120.3014 },
  // India (additional)
  { name: 'Hyderabad', lat: 17.3850, long: 78.4867 },
  { name: 'Pune', lat: 18.5204, long: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, long: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, long: 75.7873 },
  // Pakistan
  { name: 'Islamabad', lat: 33.6844, long: 73.0479 },
  { name: 'Peshawar', lat: 34.0122, long: 71.5838 },
  // Bangladesh
  { name: 'Dhaka', lat: 23.8103, long: 90.4125 },
  { name: 'Chittagong', lat: 22.3713, long: 91.7827 },
  // Southeast Asia additions
  { name: 'Surabaya', lat: -7.2575, long: 112.7521 },
  { name: 'Bandung', lat: -6.9175, long: 107.6191 },
  { name: 'Medan', lat: 3.5952, long: 98.6722 },
  { name: 'Cebu', lat: 10.3157, long: 123.8854 },
  { name: 'Davao', lat: 7.1907, long: 125.4553 },
  { name: 'Penang', lat: 5.4164, long: 100.3327 },
  { name: 'Kuala Lumpur', lat: 3.1390, long: 101.6869 },
  { name: 'Chiang Mai', lat: 18.7877, long: 98.9931 },
  { name: 'Bangkok', lat: 13.7563, long: 100.5018 },
  { name: 'Da Nang', lat: 16.0544, long: 108.2022 },
  { name: 'Hanoi', lat: 21.0278, long: 105.8342 },
  { name: 'Phnom Penh', lat: 11.5564, long: 104.9282 },
  { name: 'Siem Reap', lat: 13.3671, long: 103.8448 },
  { name: 'Vientiane', lat: 17.9757, long: 102.6331 },
  // Central Asia + Mongolia
  { name: 'Almaty', lat: 43.2220, long: 76.8512 },
  { name: 'Nur-Sultan', lat: 51.1605, long: 71.4704 },
  { name: 'Tashkent', lat: 41.2995, long: 69.2401 },
  { name: 'Samarkand', lat: 39.6542, long: 66.9597 },
  { name: 'Ulaanbaatar', lat: 47.8864, long: 106.9057 },
  { name: 'Astana', lat: 51.1360, long: 71.4168 },
);

// Middle East & Russia (expanded)
cities.push(
  { name: 'Istanbul', lat: 41.0082, long: 28.9784 },
  { name: 'Ankara', lat: 39.9334, long: 32.8597 },
  { name: 'Izmir', lat: 38.4237, long: 27.1428 },
  { name: 'Riyadh', lat: 24.7136, long: 46.6753 },
  { name: 'Jeddah', lat: 21.4858, long: 39.1925 },
  { name: 'Mecca', lat: 21.3891, long: 39.8579 },
  { name: 'Dubai', lat: 25.2048, long: 55.2708 },
  { name: 'Abu Dhabi', lat: 24.4539, long: 54.3773 },
  { name: 'Sharjah', lat: 25.3463, long: 55.4209 },
  { name: 'Doha', lat: 25.2854, long: 51.5310 },
  { name: 'Manama', lat: 26.2235, long: 50.5876 },
  { name: 'Kuwait City', lat: 29.3759, long: 47.9774 },
  { name: 'Muscat', lat: 23.5859, long: 58.4059 },
  { name: 'Beirut', lat: 33.8938, long: 35.5018 },
  { name: 'Amman', lat: 31.9454, long: 35.9284 },
  { name: 'Zarqa', lat: 32.0728, long: 36.0880 },
  { name: 'Baghdad', lat: 33.3147, long: 44.3445 },
  { name: 'Basra', lat: 30.5260, long: 47.7740 },
  { name: 'Tehran', lat: 35.7271, long: 51.3731 },
  { name: 'Mashhad', lat: 36.2605, long: 59.6168 },
  { name: 'Tel Aviv', lat: 32.0853, long: 34.7818 },
  { name: 'Jerusalem', lat: 31.7683, long: 35.2137 },
  // Russia large-city additions
  { name: 'Moscow', lat: 55.7558, long: 37.6173 },
  { name: 'Saint Petersburg', lat: 59.9343, long: 30.3351 },
  { name: 'Novosibirsk', lat: 55.0084, long: 82.9357 },
  { name: 'Yekaterinburg', lat: 56.8389, long: 60.6057 }
);

// Oceania (add a few more Australian / Pacific cities)
cities.push(
  { name: 'Sydney', lat: -33.8688, long: 151.2093 },
  { name: 'Melbourne', lat: -37.8136, long: 144.9631 },
  { name: 'Brisbane', lat: -27.4698, long: 153.0251 },
  { name: 'Perth', lat: -31.9505, long: 115.8605 },
  { name: 'Adelaide', lat: -34.9285, long: 138.6007 },
  { name: 'Hobart', lat: -42.8821, long: 147.3272 },
  { name: 'Darwin', lat: -12.4634, long: 130.8456 },
  { name: 'Auckland', lat: -36.8485, long: 174.7633 },
  { name: 'Wellington', lat: -41.2865, long: 174.7762 },
  { name: 'Suva', lat: -18.1248, long: 178.4501 },
  { name: 'Port Moresby', lat: -9.4438, long: 147.1803 },
  { name: 'Lae', lat: -6.7221, long: 146.9847 }
);

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper: parse a JS-style object string into a city object.
function parseCityArg(arg) {
  if (!arg) throw new Error('Empty city argument');

  // Try plain JSON first
  try {
    return JSON.parse(arg);
  } catch (e) {}

  // Try to massage common JS object literal into JSON:
  // - convert single quotes to double quotes
  // - quote unquoted keys
  // - remove trailing commas
  try {
    let s = arg.replace(/'/g, '"');
    s = s.replace(/([{,]\s*)([a-zA-Z0-9_\-]+)\s*:/g, '$1"$2":');
    s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    return JSON.parse(s);
  } catch (e) {}

  // Last resort: evaluate as JS literal in a safe Function context
  try {
    // eslint-disable-next-line no-new-func
    return Function('"use strict"; return (' + arg + ')')();
  } catch (err) {
    throw new Error('Could not parse city object: ' + err.message);
  }
}

async function fetchAndCacheCity(city, accessToken) {
  try {
    const cacheKey = getMapillaryCacheKey(city.lat, city.long);
    console.log(`Fetching Mapillary images for ${city.name}...`);
    const fetchResults = await fetchMapillaryImageIds(city.lat, city.long, accessToken);
    mapillaryImageCache.set(cacheKey, fetchResults);
    console.log(`Cached ${city.name} (${fetchResults.length} image ids)`);
    return fetchResults;
  } catch (error) {
    console.error(`Failed to fetch Mapillary images for ${city.name}:`, error);
    throw error;
  }
}

rl.on('line', async (input) => {
  const raw = input.trim();
  if (!raw) return;

  const command = raw.toLowerCase();

  if (command === 'warmup') {
    console.log('Cache warmup triggered!');
    void warmMapillaryCache().catch((error) => {
      console.error('Manual cache warmup failed:', error);
    });
    return;
  }

  if (command.startsWith('warmup ')) {
    // allow: warmup <times>
    const parts = raw.split(/\s+/);
    const times = Math.max(1, parseInt(parts[1], 10) || 1);
    console.log(`Cache warmup triggered ${times} time(s)`);
    (async () => {
      try {
        for (let i = 0; i < times; i++) await warmMapillaryCache();
      } catch (err) {
        console.error('Manual cache warmup failed:', err);
      }
    })();
    return;
  }

  if (command.startsWith('remove ')) {
    const arg = raw.slice(7).trim();
    const cityIndex = cities.findIndex((city) => city.name.toLowerCase() === arg.toLowerCase());

    if (cityIndex === -1) {
      console.log(`Could not find city to remove: ${arg}`);
      return;
    }

    const [removedCity] = cities.splice(cityIndex, 1);
    console.log(`Removed city ${removedCity.name}`);
    return;
  }

  if (command.startsWith('retry ')) {
    const [cityName, bboxOffsetStr] = raw.slice(6).trim().split(/\s+/);
    const bboxOffset = bboxOffsetStr ? Number(bboxOffsetStr) : 0.003;

    if (!cityName || Number.isNaN(bboxOffset)) {
      console.log("Usage: retry <cityName> <bboxOffset>");
      return;
    }
    try {
      const accessToken = process.env.MAPILLARY_ACCESS_TOKEN;
      if (!accessToken) throw new Error('MAPILLARY_ACCESS_TOKEN is missing');

      const city = cities.find((entry) => entry.name.toLowerCase() === cityName.toLowerCase());
      if (!city) throw new Error(`Could not find city: ${arg}`);

      await fetchAndCacheCity(city, accessToken, bboxOffset);
      return;
    } catch (err) {
      console.error(`Failed to retry cache fill for ${arg}:`, err.message || err);
      return;
    }

    
  }

  if (command.startsWith('add ')) {
    const arg = raw.slice(4).trim();
    try {
      const city = parseCityArg(arg);

      if (!city || typeof city.name !== 'string'){
        console.log('city.name must be a string');
        return;

      } 
      const lat = Number(city.lat);
      const lon = Number(city.long ?? city.lng ?? city.lon ?? city.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lon)){
        console.log('lat and long must be numbers');
        return;
      }

      const objectified_city = { name: city.name, lat, long: lon };

      const accessToken = process.env.MAPILLARY_ACCESS_TOKEN;
      try {
        await fetchAndCacheCity(objectified_city, accessToken);
        if(cities.includes(objectified_city)){

        }
        cities.push(objectified_city);
        console.log(`Added city ${objectified_city.name} to list (${objectified_city.lat}, ${objectified_city.long})`);
      } catch (err) {
        console.error(`Failed to fetch/cache Mapillary images for ${objectified_city.name}:`, err);
      }
    } catch (err) {
      console.error('Failed to parse/add city:', err.message || err);
    }

    return;
  }

  if(command.startsWith("check ")){
    const arg = raw.slice(6).trim();
    let failCnt = 0;
    let lowIamgeCnt = 0;

    if(arg.toLowerCase() === "all"){
      for(i = 0; i < cities.length; i++){
        const city = cities[i];
        const cacheKey = getMapillaryCacheKey(city.lat, city.long);
        let imageIds = mapillaryImageCache.get(cacheKey);
        if(!imageIds){
          console.log("Nothing got returned!");
          failCnt++;
        } else if(!Array.isArray(imageIds)){
          console.log("Mapillary cache did not return an array");
          failCnt++;
        } else if(imageIds.length === 0){
          console.log(city.name + " Had 0 image ids")
          failCnt++;
        } else if(imageIds.length < 10){
          console.log(city.name + " Had sub " + imageIds.length + " image ids");

          lowIamgeCnt++;
        }

      }

      console.log("Low img cnt: " + lowIamgeCnt);
      console.log("Faill cnt: " + failCnt);
      return;
    }

    const cityIndex = cities.findIndex((city) => city.name.toLowerCase() === arg.toLowerCase());

    if (cityIndex === -1) {
      console.log(`Could not find city to remove: ${arg}`);
      return;
    }

    const city = cities[cityIndex];
    const cacheKey = getMapillaryCacheKey(city.lat, city.long);



    if (mapillaryImageCache.has(cacheKey)){
      console.log(mapillaryImageCache.get(cacheKey));

      if(final_failures.includes(city.name)){
        final_failures = final_failures.filter(
          (failure_city_name) => failure_city_name.toLowerCase() !== city.name.toLowerCase()
        );
      }
    } else{
      console.log("Invalid city name or city is not in list");
    }

  }

  if(command.startsWith("debug ")){
    const arg = raw.slice(6).trim();
    try {
      const accessToken = process.env.MAPILLARY_ACCESS_TOKEN;
      if (!accessToken) throw new Error('MAPILLARY_ACCESS_TOKEN is missing');

      const city = cities.find((entry) => entry.name.toLowerCase() === arg.toLowerCase());
      if (!city) throw new Error(`Could not find city: ${arg}`);

      console.log(`\n=== DEBUG: ${city.name} (${city.lat}, ${city.long}) ===`);

      const minLon = city.long - 0.003;
      const maxLon = city.long + 0.003;
      const minLat = city.lat - 0.003;
      const maxLat = city.lat + 0.003;
      const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;

      const url = `https://graph.mapillary.com/images?access_token=${accessToken}&fields=id&bbox=${bbox}&limit=600`;
      console.log(`URL: ${url}`);

      const response = await fetch(url);
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Headers:`, Object.fromEntries(response.headers));

      const body = await response.text();
      console.log(`Body: ${body}`);
      console.log(`=== END DEBUG ===\n`);
    } catch (err) {
      console.error(`Debug failed for ${arg}:`, err.message || err);
    }
    return;
  }

  console.log('Unknown command. Supported: warmup, warmup <n>, add { name:, lat:, long: }, remove <city name>, retry <city name>, check <city name>, debug <city name>');
});



async function warmMapillaryCache() {
  console.log('warmMapillaryCache entered');
  const accessToken = process.env.MAPILLARY_ACCESS_TOKEN;

  

  if (!accessToken) {
    console.log('Skipping Mapillary cache warmup: missing access token');
    process.exit(1);
  }

  async function checkCities(){
    let random_failures = [];
    let zero_len_failures = []
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
        if(error.message === 'Mapillary response array had 0 image ids'){
          console.log("Empty Array: ")
            zero_len_failures.push(city.name);
        }
        cities.splice(cur_idx, 1);
        cur_idx--;
        miss_count++;

        random_failures.push(city.name);
        
      }
      cur_idx++;
    }

    console.log("Maybe random failues: ")
    console.log(random_failures);
    console.log("___________________________________");
    console.log("Zero length array returns: ")
    console.log(zero_len_failures)

    console.log("Miss count: ", miss_count)

    final_failures = random_failures;
  }

  await checkCities();
  await checkCities();
  
  console.log("Cache warms done!");
}

const PORT = 9090;
httpServer.listen(PORT, "127.0.0.1", async () => {
  console.log(`Server is listening on port ${PORT}`);
  await warmMapillaryCache();
});
