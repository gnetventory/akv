// ─── Egypt Map City Database & Coordinates ─────────────────────────────────────
// Coordinates are calibrated to fit the custom illustrated Egypt map viewBox (0 0 900 800)

export const EGYPT_CITIES = [
  {
    id: 'cairo',
    name: 'Cairo & Giza',
    nameAr: 'القاهرة والجيزة',
    lat: 30.0444,
    lng: 31.2357,
    x: 475,
    y: 285,
    region: 'Greater Cairo',
    description: 'Capital hub, startup ecosystem & tech center',
    aliases: [
      'cairo',
      'giza',
      'new cairo',
      'maadi',
      'nasr city',
      'dokki',
      'zamalek',
      '6th of october',
      'october',
      'tagamoa',
      'al qahirah',
      'el tagamoa',
      'heliopolis',
      'sheikh zayed',
      'القاهرة',
      'الجيزة',
      'المعادي',
      'التجمع',
      'أكتوبر',
    ],
  },
  {
    id: 'alexandria',
    name: 'Alexandria',
    nameAr: 'الإسكندرية',
    lat: 31.2001,
    lng: 29.9187,
    x: 355,
    y: 165,
    region: 'North Coast',
    description: 'Mediterranean port, commerce & industry center',
    aliases: ['alexandria', 'alex', 'el iskandariya', 'الإسكندرية', 'اسكندرية', 'smoha', 'agami'],
  },
  {
    id: 'mansoura',
    name: 'Mansoura',
    nameAr: 'المنصورة',
    lat: 31.0409,
    lng: 31.3785,
    x: 480,
    y: 180,
    region: 'Delta',
    description: 'Medical, tech & agricultural commerce hub',
    aliases: ['mansoura', 'mansoora', 'mansura', 'dakahlia', 'المنصورة', 'الدقهلية'],
  },
  {
    id: 'tanta',
    name: 'Tanta',
    nameAr: 'طنطا',
    lat: 30.7865,
    lng: 31.0004,
    x: 440,
    y: 215,
    region: 'Delta',
    description: 'Heart of the Nile Delta, trade & logistics hub',
    aliases: ['tanta', 'gharbia', 'طنطا', 'الغربية', 'el mahalla', 'mahalla'],
  },
  {
    id: 'port_said',
    name: 'Port Said',
    nameAr: 'بورسعيد',
    lat: 31.2653,
    lng: 32.3019,
    x: 560,
    y: 170,
    region: 'Suez Canal',
    description: 'Northern gateway to the Suez Canal & shipping hub',
    aliases: ['port said', 'portsaid', 'بورسعيد', 'بور سعيد'],
  },
  {
    id: 'ismailia',
    name: 'Ismailia',
    nameAr: 'الإسماعيلية',
    lat: 30.5965,
    lng: 32.2715,
    x: 565,
    y: 240,
    region: 'Suez Canal',
    description: 'Suez Canal Authority center & agriculture',
    aliases: ['ismailia', 'ismailya', 'الإسماعيلية', 'اسماعيلية'],
  },
  {
    id: 'suez',
    name: 'Suez',
    nameAr: 'السويس',
    lat: 29.9668,
    lng: 32.5498,
    x: 570,
    y: 300,
    region: 'Suez Canal',
    description: 'Industrial zone, logistics & Red Sea port',
    aliases: ['suez', 'السويس', 'ain sokhna', 'sokhna'],
  },
  {
    id: 'damietta',
    name: 'Damietta',
    nameAr: 'دمياط',
    lat: 31.4175,
    lng: 31.8144,
    x: 515,
    y: 155,
    region: 'Delta',
    description: 'Furniture design, port & manufacturing',
    aliases: ['damietta', 'damiette', 'dmyat', 'دمياط', 'ras el bar'],
  },
  {
    id: 'zagazig',
    name: 'Zagazig & Sharqia',
    nameAr: 'الزقازيق والشرقية',
    lat: 30.5877,
    lng: 31.502,
    x: 495,
    y: 235,
    region: 'Delta',
    description: 'Industrial cities (10th of Ramadan) & commerce',
    aliases: [
      'zagazig',
      'sharqia',
      '10th of ramadan',
      'al sharqia',
      'الزقازيق',
      'الشرقية',
      'العاشر من رمضان',
    ],
  },
  {
    id: 'damanhur',
    name: 'Damanhur & Beheira',
    nameAr: 'دمنهور والبحيرة',
    lat: 31.0425,
    lng: 30.47,
    x: 395,
    y: 190,
    region: 'Delta',
    description: 'Western Delta agriculture & trade',
    aliases: ['damanhur', 'damanhour', 'beheira', 'دمنهور', 'البحيرة'],
  },
  {
    id: 'fayoum',
    name: 'Fayoum',
    nameAr: 'الفيوم',
    lat: 29.3084,
    lng: 30.8428,
    x: 440,
    y: 350,
    region: 'Upper Egypt',
    description: 'Eco-tourism, crafts & agriculture',
    aliases: ['fayoum', 'faiyum', 'الفيوم'],
  },
  {
    id: 'beni_suef',
    name: 'Beni Suef',
    nameAr: 'بني سويف',
    lat: 29.0661,
    lng: 31.0994,
    x: 480,
    y: 390,
    region: 'Upper Egypt',
    description: 'Emerging tech parks & heavy industry',
    aliases: ['beni suef', 'beni souef', 'بني سويف'],
  },
  {
    id: 'minya',
    name: 'Minya',
    nameAr: 'المنيا',
    lat: 28.1099,
    lng: 30.7503,
    x: 465,
    y: 460,
    region: 'Upper Egypt',
    description: 'Middle Egypt education & enterprise hub',
    aliases: ['minya', 'menia', 'al minya', 'المنيا'],
  },
  {
    id: 'asyut',
    name: 'Asyut',
    nameAr: 'أسيوط',
    lat: 27.1801,
    lng: 31.1837,
    x: 495,
    y: 530,
    region: 'Upper Egypt',
    description: 'Major Upper Egypt academic & startup center',
    aliases: ['asyut', 'assiut', 'assuot', 'assiout', 'أسيوط'],
  },
  {
    id: 'sohag',
    name: 'Sohag',
    nameAr: 'سوهاج',
    lat: 26.5569,
    lng: 31.6948,
    x: 530,
    y: 595,
    region: 'Upper Egypt',
    description: 'Upper Egypt trade & heritage center',
    aliases: ['sohag', 'souhag', 'سوهاج'],
  },
  {
    id: 'qena',
    name: 'Qena',
    nameAr: 'قنا',
    lat: 26.1551,
    lng: 32.716,
    x: 585,
    y: 635,
    region: 'Upper Egypt',
    description: 'Industrial zones & Upper Egypt transit hub',
    aliases: ['qena', 'qina', 'keneh', 'قنا', 'nag hammadi'],
  },
  {
    id: 'luxor',
    name: 'Luxor',
    nameAr: 'الأقصر',
    lat: 25.6872,
    lng: 32.6396,
    x: 590,
    y: 685,
    region: 'Upper Egypt',
    description: 'World heritage tourism & creative economy',
    aliases: ['luxor', 'الأقصر', 'الاقصر'],
  },
  {
    id: 'aswan',
    name: 'Aswan',
    nameAr: 'أسوان',
    lat: 24.0889,
    lng: 32.8998,
    x: 600,
    y: 755,
    region: 'Upper Egypt',
    description: 'Renewable energy (Benban) & African trade gateway',
    aliases: ['aswan', 'assuan', 'أسوان', 'اسوان'],
  },
  {
    id: 'hurghada',
    name: 'Hurghada & Red Sea',
    nameAr: 'الغردقة والبحر الأحمر',
    lat: 27.2579,
    lng: 33.8116,
    x: 690,
    y: 490,
    region: 'Red Sea',
    description: 'El Gouna tech hub, digital nomads & tourism',
    aliases: [
      'hurghada',
      'gouna',
      'el gouna',
      'red sea',
      'الغردقة',
      'الجونة',
      'البحر الأحمر',
      'safaga',
      'marsa alam',
    ],
  },
  {
    id: 'sharm',
    name: 'Sharm El Sheikh & Sinai',
    nameAr: 'شرم الشيخ وسيناء',
    lat: 27.9158,
    lng: 34.3299,
    x: 670,
    y: 385,
    region: 'Sinai',
    description: 'International events, tourism & digital hub',
    aliases: [
      'sharm',
      'sharm el sheikh',
      'dahab',
      'sinai',
      'south sinai',
      'شرم الشيخ',
      'دهب',
      'سيناء',
    ],
  },
  {
    id: 'matrouh',
    name: 'Matrouh & North Coast',
    nameAr: 'مطروح والساحل الشمالي',
    lat: 31.3543,
    lng: 27.2373,
    x: 200,
    y: 180,
    region: 'Western Desert',
    description: 'North Coast projects & tourism',
    aliases: [
      'matrouh',
      'marsa matrouh',
      'north coast',
      'alamein',
      'el alamein',
      'sahel',
      'مطروح',
      'العلمين',
      'الساحل',
    ],
  },
];

/**
 * Maps a member's location object/strings to a recognized Egyptian city ID,
 * or returns null if not in Egypt / unrecognized.
 */
export function matchEgyptCity(location) {
  if (!location) return null;

  let cityStr = '';
  let countryStr = '';
  let combined = '';

  if (typeof location === 'string') {
    combined = location.toLowerCase().trim();
    cityStr = combined;
  } else if (typeof location === 'object') {
    cityStr = (location.city || '').toLowerCase().trim();
    countryStr = (location.country || '').toLowerCase().trim();
    const district = (location.district || '').toLowerCase().trim();
    const state = (location.state || '').toLowerCase().trim();
    combined = `${cityStr} ${district} ${state} ${countryStr}`.trim();
  }

  // Check if non-Egypt country is specified explicitly
  const abroadCountries = [
    'uae',
    'united arab emirates',
    'dubai',
    'saudi',
    'ksa',
    'riyadh',
    'uk',
    'united kingdom',
    'london',
    'usa',
    'united states',
    'germany',
    'france',
    'canada',
    'netherlands',
  ];
  if (countryStr && abroadCountries.some((c) => countryStr.includes(c) || combined.includes(c))) {
    return null;
  }

  const isEgypt =
    !countryStr ||
    countryStr === 'egypt' ||
    countryStr === 'مصر' ||
    countryStr === 'eg' ||
    combined.includes('egypt') ||
    combined.includes('مصر');

  for (const city of EGYPT_CITIES) {
    for (const alias of city.aliases) {
      if (combined.includes(alias) || cityStr === alias) {
        return city.id;
      }
    }
  }

  // If country is Egypt but city didn't match specific governorate, default to Cairo hub
  if (isEgypt) {
    return 'cairo';
  }

  return null;
}
