/**
 * The house guidebook.
 *
 * Source: "Kora house local guidebook", supplied by the hosts. This is their
 * own writing about their own town, so it is the most authoritative content on
 * the site — where it conflicts with anything invented earlier, it wins.
 *
 * Three things in the source document are deliberately NOT carried over:
 *
 *  1. An internal note from Ashish about numbering the restaurants against a
 *     map photocopied from a Lonely Planet book. It is a working note, not
 *     guest copy — and reproducing that map would be a copyright problem, so
 *     the site should not depend on it.
 *  2. A block quote lifted from Wikivoyage describing Sidhbari. Paraphrased
 *     here instead, to avoid carrying someone else's licensed text.
 *  3. The taxi drivers' personal mobile numbers are held back from public
 *     rendering — see TAXIS below.
 */

export type Place = {
  name: string;
  /** Shown as a small mono line under the name. */
  meta?: string;
  body: string;
  /** Marked "Guest favourite" in the hosts' own guidebook. */
  favourite?: boolean;
  url?: string;
  /** Distance stated by the hosts. Only present where they gave one. */
  distance?: string;
  amenities?: string[];
};

/* ------------------------------------------------------------------ eating */

export const restaurants: Place[] = [
  {
    name: "Tenyang Restaurant",
    body: "Tasty, traditional Tibetan food very close to the house. Tibetan thali, momos, mothuk (momo soup) and other noodle dishes.",
    distance: "Very close to Kora House",
  },
  {
    name: "Crepe Pancake House",
    meta: "Vegetarian only",
    favourite: true,
    body: "International food, and not only at breakfast — they have avocados. Tibetan owned, with a cosy upstairs dining loft and reading room. Avocado and brown rice salad, vegetable sushi, borscht, chow mein, Tibetan food, omelettes, and crepes in buckwheat, black bean, corn or millet flour. Homemade kombucha, ginger beer, green juice, soy milk smoothies, burritos, vegan quiche.",
    amenities: ["Water filter", "WiFi", "Vegan options"],
  },
  {
    name: "Om Café",
    meta: "Officially Namgyal Restaurant, lower level of Om Hotel",
    body: "Pizzas with goat cheese, salads, sandwiches and good Tibetan food. Entering the main square from Temple Road, take a sharp left and head down until you find the hotel; the café is on the lower level.",
    amenities: ["WiFi"],
  },
  {
    name: "Green Café",
    meta: "In the Green Hotel, connected to Himalaya Herbal",
    body: "A comfortable indoor room and a charming outdoor patio. Soups — the blended spinach is the one — spring rolls, quiche, pancakes, chow mein and omelettes.",
    amenities: ["Water filter", "WiFi"],
  },
  {
    name: "Black Tent Café",
    body: "Cosy, with cushioned seating and low tables with stools. Good chow mein, large salads, sandwiches, omelettes and Tibetan food.",
    amenities: ["WiFi"],
  },
  {
    name: "Moonpeak Café",
    body: "Simple and charming, and relatively close to the house. Porridge, omelettes, unusual sandwiches, salads and a large Indian menu — the Himachal thali is a favourite. Opens around 7.30am for breakfast.",
    distance: "Relatively close to Kora House",
    amenities: ["Water filter", "WiFi"],
  },
  {
    name: "The Other Space",
    body: "Made with a simple idea: to bring art into the mountains. More than a café — a gallery, a dessert corner, a coworking area and a small shop for local makers.",
    distance: "800 m on foot from Kora House",
  },
  {
    name: "Rogpa Café",
    body: "A non-profit café supporting the Tibetan Rogpa charity. Lemonade, coffee, pastries, chocolate balls, and a gift shop of handmade goods from the charity's women's craft centre.",
  },
  {
    name: "Tibet Kitchen",
    body: "Authentic Tibetan food — momos, noodle soup. Try the Bhutanese datse, vegetables or meat in a creamy chilli-cheese sauce.",
  },
  {
    name: "Lung Ta",
    meta: "Vegetarian only",
    body: "A vegetarian Japanese restaurant with a different set meal each day. Sushi day is the one — a multi-course meal with soup, salad and sushi. Normally Tuesday and Friday; check the sign on the door.",
  },
  {
    name: "Common Ground",
    favourite: true,
    body: "A cosy, social café, good for reading and for meeting other travellers. Chinese and Tibetan food, plenty of vegetables, and things you won't find elsewhere — sizzlers, hot pots, decadent desserts. Cardamom white hot chocolate, and a ginger lemon honey with a hint of rum. Sells local fair-trade pottery. On the shortcut to Tushita, up from the main square.",
    amenities: ["Water filter", "WiFi"],
  },
  {
    name: "One Two Café",
    body: "At the Dalai Lama temple entrance. Opens at 7.30am for breakfast, serving Tibetan food alongside omelettes, noodle dishes and pastries.",
    distance: "550 m from Kora House",
  },
];

/* ------------------------------------------------------------- see & do */

export const attractions: Place[] = [
  {
    name: "Dalai Lama Main Temple & Tibet Museum",
    meta: "Tsuglagkhang Complex",
    body: "A monastery, two temple rooms with ornate shrines, a bookstore and the Tibet Museum. Monks debate most afternoons, and there is chanting and ritual to watch. This is where His Holiness teaches when he gives public audiences.",
  },
  {
    name: "Hike to Triund",
    meta: "9 km · 1,105 m ascent · about 3 hours up",
    body: "The most popular trek in McLeodganj, climbing to the base camp at Triund for panoramic views of the whole Dhauladhar range and the Kangra valley. Serene, and full of wildflowers in spring and summer. Average difficulty. Two stops on the way for drinks and snacks. Some people stay the night in tents or in the government guesthouse cabins; with extra ambition you can go a further 5 km to the Lahesh Caves. A guide isn't necessary unless you need help carrying gear.",
  },
  {
    name: "Norbulingka Institute",
    body: "The 'heart of Tibetan culture' — a handicraft campus that is an architectural beauty in itself, with tranquil gardens, a good café, a doll museum, and workshops where you can watch the craftspeople work. A shuttle runs from Chonor House a few times a day, except Sundays when the workshops are closed.",
    url: "https://norbulingka.org",
  },
  {
    name: "Library of Tibetan Works and Archives",
    meta: "About 30 minutes on foot, or a taxi down Jogiwara Road",
    body: "The seat of the Tibetan Government in Exile, a monastery, and buildings painted with Tibetan designs and murals. The public library has an English reading room of books, magazines and newspapers on Buddhism, Tibet and local politics, and a collection of Tibetan artefacts in the museum upstairs. Buddhist philosophy classes are taught here — ask in the library for the schedule. Everything closes for lunch between 1 and 2pm. Illiterati Café is a good halfway stop if you walk.",
    url: "https://tibetanlibrary.org",
  },
  {
    name: "Tushita Meditation Centre",
    meta: "Dharamkot · 40 minutes to an hour on foot from the house",
    body: "Daily drop-in meditation, a Buddhist library, film screenings, talks by well-known teachers, ten-day silent retreats, pujas and residential courses. The shortcut is the uphill road from the main square.",
    url: "https://tushita.info",
  },
  {
    name: "Vipassana Meditation Centre",
    meta: "Dharamkot, next to Tushita",
    body: "One of India's oldest meditation techniques — vipassana means insight, and the practice is observation-based and non-sectarian. The ten-day introductory course is highly recommended and books up quickly.",
    url: "https://www.dhamma.org/en/schedules/schsikhara",
  },
  {
    name: "Bhagsu & Bhagsunag waterfall",
    meta: "About 2 km from McLeodganj",
    body: "A walk through a peaceful, picturesque town, then steps up to the top of the waterfall, with small cafés along the way. The Shiva temple of Bhagsunath has an adjacent pool where locals swim in the cold water, and some shops sell the local dessert, Bhagsu cake.",
  },
  {
    name: "Tibet World",
    body: "A Tibetan charity, hostel and education centre teaching many languages — anyone can enrol, with discounts for locals, Tibetans, monks and nuns. Donation-based yoga, and a Tibetan cultural show of folk songs, stories and dance every Thursday evening. Next to Crepe Pancake House.",
  },
  {
    name: "Sidhbari",
    meta: "About 20 minutes by taxi",
    body: "A town ringed by hamlets of semi-nomadic Gaddi shepherds, who graze their goats on the higher slopes. Terrace farming is the main livelihood, and a growing number of families host visitors who want to see village life directly.",
  },
];

/** Two places worth the trip, both in Sidhbari. */
export const sidhbari: Place[] = [
  {
    name: "Tapovan Ashram",
    meta: "Chinmaya Mission Ashram",
    body: "A serene Hindu ashram with the Shri Rama temple and a 25-foot idol of Lord Hanuman. Gardens and long views over the mountains and valleys make it a good place to sit. The trust runs a small clothing and goods shop across the street.",
    url: "https://www.chinmayamission.com/where-we-are/chinmaya-tapovan-trust/",
  },
  {
    name: "Gyuto Monastery",
    meta: "Home of the 17th Gyalwang Karmapa",
    body: "A Tibetan Buddhist monastery and the seat of the Karmapa. Very beautiful, and a good place for quiet contemplation. The Karmapa and the Dalai Lama give talks here periodically.",
    url: "https://www.gyuto.org/",
  },
];

/* ------------------------------------------------------------ volunteering */

export const volunteering: Place[] = [
  {
    name: "LHA",
    meta: "Pronounced 'lah'",
    body: "English and other classes for Tibetan refugees, plus a range of volunteer projects. A drop-in English conversation hour runs every weekday from 4 to 5pm — no experience needed, and new volunteers are always welcome. They also accept clothing donations.",
    url: "https://www.lhasocialwork.org/",
  },
  {
    name: "Tibet World",
    body: "A community centre and hostel offering language classes to local Tibetans, monks and Indians — English, French, Chinese, German and others, from conversation level to advanced. No experience needed to volunteer.",
  },
  {
    name: "Rogpa Charitable Trust",
    body: "Runs a baby care centre, a women's craft centre, a children's library project and the café. Stop by the café to hear about the work and to buy something made at the craft centre.",
  },
  {
    name: "Active Nonviolence Education Centre",
    meta: "ANEC",
    body: "Directed by a retired political chair for the Tibetan Government in Exile, ANEC teaches nonviolent approaches to the Tibetan political situation, drawing on Gandhi and Martin Luther King Jr. Their Jogiwara Road office hosts Friday gatherings and film screenings.",
  },
];

export const volunteeringIntro =
  "Dharamsala is the seat of the Tibetan Government in Exile and home to the largest Tibetan refugee population, so there are a great many organisations working on education and on preserving Tibetan cultural heritage. Even an hour is useful — the drop-in class at LHA is the easiest way in, and you will get as much out of it as you put in.";

/* -------------------------------------------------------------- teachings */

export const teachings = {
  intro:
    "His Holiness's public teaching schedule is published at dalailama.com. Many of the local Dharamsala teachings never make it onto the website, so the reliable way to find out is to go to the security office and ask.",
  registerAt:
    "From the McLeodganj main square, about 100 m along Bhagsu Road — on your right, before the Green Shop and the Environmental Office. Go down the stairs; there are a few offices, and usually someone who speaks English.",
  bringToRegister: [
    "Passport",
    "A pen, to fill in the form",
    "A passport photo — sometimes needed. There is a digital shop a few metres past the security office that takes them.",
  ],
  bringToTeaching: [
    "An FM radio and headphones — translations are broadcast if the talk isn't in English",
    "A mug, for the butter tea that is handed round",
    "Water, and bread or a snack; there can be a lot of waiting. Tibetan and sweet bread are sold at the main temple gate in the mornings",
    "Something to sit on — a cushion or a blanket",
    "Paper and a pencil if you want to take notes",
  ],
  doNotBring:
    "Leave your phone and any other electronics behind, apart from the radio. You will not be allowed to bring them in.",
  url: "https://www.dalailama.com",
};

/* -------------------------------------------------------------- practical */

/**
 * PRIVACY HOLD. These are three local drivers' personal mobile numbers. They
 * are fine in a printed guidebook handed to a guest inside the house; putting
 * them on a public, search-indexed page is a different thing entirely and
 * needs each driver's agreement first.
 *
 * TODO_CONFIRM: ask Hari, Rahul and Vikas whether they are happy to be listed
 * publicly. Flip `consentToPublish` to true only once they have said yes.
 */
export const TAXIS = {
  consentToPublish: false,
  drivers: [
    { name: "Hari", phone: "+91 98828 05801" },
    { name: "Rahul", phone: "+91 97365 73646" },
    { name: "Vikas", phone: "+91 98168 57299" },
  ],
} as const;

/** Public emergency services — no consent question, publish freely. */
export const emergencyNumbers = [
  { name: "Police", number: "100" },
  { name: "Fire", number: "101" },
  { name: "Ambulance", number: "102" },
] as const;
