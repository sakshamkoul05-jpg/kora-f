// Real photography of McLeodganj and nearby places, sourced from Wikimedia
// Commons under free licenses. These are LOCATION and CULTURE photos only —
// not the actual Kora House property. Room, balcony and host photos remain
// placeholders until the hosts provide their own (see README).
//
// Attribution kept here as the single source of truth; rendered via
// <PhotoCredit /> wherever an image from this list is used, per license terms.

export type PlaceImage = {
  file: string;
  alt: string;
  title: string;
  author: string;
  license: string;
  sourceUrl: string;
};

/**
 * The house's OWN photographs, supplied by the hosts. These are not Commons
 * images and carry no attribution requirement — they belong to the property.
 * Keep them separate from `placeImages` so the credits page never implies the
 * family's own pictures were licensed from a stranger.
 */
export type HousePhoto = { file: string; alt: string; caption?: string };

export const housePhotos = {
  hostsWithHisHoliness: {
    file: "/images/house/hosts-with-his-holiness.jpg",
    alt: "Rohitash and his mother with His Holiness the Dalai Lama, who is holding both their hands.",
    caption:
      "Rohitash and his mother with His Holiness the Dalai Lama. The family have lived below the temple for a long time.",
  },
} satisfies Record<string, HousePhoto>;

export const placeImages = {
  heroMcLeodganj: {
    file: "/images/place/hero-view-over-mcleodganj.jpg",
    alt: "View over McLeod Ganj with the Dhauladhar range behind",
    title: "View over McLeod Ganj, Himachal Pradesh",
    author: "E. B. (Phnom Penh, Cambodia)",
    license: "CC BY 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:View_over_McLeod_Ganj,_Himachal_Pradesh.jpg",
  },
  monasteryNamgyal: {
    file: "/images/place/monastery-namgyal.jpg",
    alt: "Namgyal Monastery in Dharamshala",
    title: "Namgyal Monastery in Dharamshala",
    author: "Mohdirfaniitmandi",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Namgyal_Monastery_in_Dharamshala.jpg",
  },
  prayerFlagsBhagsu: {
    file: "/images/place/prayer-flags-bhagsu.jpg",
    alt: "Prayer flags in a forest clearing outside Bhagsu, near McLeod Ganj",
    title: "Forest Clearing with Prayer Flags, Outside Bhagsu, Near McLeod Ganj",
    author: "Adam Jones (Kelowna, BC, Canada)",
    license: "CC BY-SA 2.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Forest_Clearing_with_Prayer_Flags_-_Outside_Bhagsu_-_Near_McLeod_Ganj_-_Himachal_Pradesh_-_India_(26539887280).jpg",
  },
  dhauladharView: {
    file: "/images/place/dhauladhar-view.jpg",
    alt: "View of the Dhauladhar range from McLeod Ganj",
    title: "View of Dhauladhar from McLeod Ganj, India",
    author: "Rickard Törnblad",
    license: "CC BY-SA 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:View_of_Dhauladhar_from_McLeod_Ganj,_India_-_September_2014.jpg",
  },
  triundTrek: {
    file: "/images/place/triund-trek.jpg",
    alt: "The Triund trek trail above McLeod Ganj",
    title: "Triund Trek",
    author: "Travelling Slacker (Bangalore, India)",
    license: "CC BY 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Triund_Trek_(13)_(8534183698).jpg",
  },
  dharamkotHouses: {
    file: "/images/place/dharamkot-houses.jpg",
    alt: "Multicoloured houses in Dharamkot village",
    title: "Multicolored Houses at Dharamkot Village",
    author: "Tanvi.sharmaaa",
    license: "CC BY 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Multicolored_Houses_at_Dharamkot_Village.jpg",
  },
  mcleodganjStreet: {
    file: "/images/place/mcleodganj-street.jpg",
    alt: "A street in McLeod Ganj",
    title: "Streets of McLeod Ganj",
    author: "Martijn S.",
    license: "CC BY-SA 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Streets_of_McLeod_Ganj.jpg",
  },
  templeArchitecturalDetail: {
    file: "/images/place/temple-architectural-detail.jpg",
    alt: "Architectural detail at the Tsuglagkhang Complex, McLeod Ganj",
    title: "Architectural Detail, Tsuglagkhang Complex, McLeod Ganj",
    author: "Adam Jones (Kelowna, BC, Canada)",
    license: "CC BY-SA 2.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Architectural_Detail_-_Tsuglagkhang_Complex_-_McLeod_Ganj_-_Himachal_Pradesh_-_India_-_01_-_Copy_(26698795951).jpg",
  },
  dharamshalaHimalayas: {
    file: "/images/place/dharamshala-himalayas.jpg",
    alt: "Dharamshala's neighbourhoods against the Himalayas",
    title: "Residential neighborhoods of Dharamsala on the background of the Himalayas",
    author: "Oleg Bor",
    license: "CC BY-SA 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Residential_neighborhoods_of_Dharamsala_on_the_background_of_the_Himalayas.jpg",
  },
} satisfies Record<string, PlaceImage>;
