// The Lingkhor circuit around the Tsuglagkhang complex.
//
// Waypoint ORDER is real and is walked clockwise — that direction is
// doctrinal, not a design choice. See MOTION.md.
//
// TODO_CONFIRM: the per-waypoint cumulative minutes below are an even
// distribution across the stated 20–30 minute total, not measured times.
// Confirm the real splits with Rohitash and Ashish before publishing, or
// drop the per-waypoint figures and show only the total.

export type Waypoint = {
  /** Fraction along the circuit, 0..1, clockwise from the temple entrance. */
  at: number;
  name: string;
  /** Approximate cumulative walking time. TODO_CONFIRM. */
  minutes: string;
  note?: string;
  /** The house. Rendered as the climax of the sequence. */
  isHouse?: boolean;
  /**
   * Key into `koraPhotos`. These show what the path looks like along this
   * stretch — they are not portraits of the named landmark. See the note in
   * lib/image-credits.ts before changing a caption.
   */
  photo?: keyof typeof import("./image-credits").koraPhotos;
  /** What the photograph actually shows, said plainly. */
  photoCaption?: string;
};

export const koraWaypoints: Waypoint[] = [
  {
    at: 0.0,
    name: "Tsuglagkhang main entrance",
    minutes: "0 min",
    note: "The circuit starts and ends here.",
    photo: "prayerWheels",
    photoCaption: "The wheel wall at the temple end of the circuit.",
  },
  {
    at: 0.2,
    name: "Tarani Mata Mandir",
    minutes: "~5 min",
    photo: "stupa",
    photoCaption: "A stupa standing on the circuit.",
  },
  {
    at: 0.4,
    name: "Forest path",
    minutes: "~10 min",
    note: "Mani stones and prayer wheels set along the wall.",
    photo: "forestPath",
    photoCaption: "The shaded, pine-lined stretch.",
  },
  {
    // 0.57 is not arbitrary: it is the point on this path where the circuit
    // reaches bottom-centre, so the house marker lands horizontally centred
    // in the diagram, and it falls late enough in the draw to read as the
    // climax. Re-measure if KORA_PATH_D changes.
    at: 0.57,
    name: "Lhagyal Ri · Buddha House Road",
    minutes: "~14 min",
    note: "Kora House sits on the route here.",
    isHouse: true,
    photo: "maniStones",
    photoCaption: "Mani stones along the wall on this stretch.",
  },
  {
    at: 0.82,
    name: "Return to temple entrance",
    minutes: "~21 min",
    note: "The circuit closes.",
    photo: "pilgrims",
    photoCaption: "Walkers completing the circuit.",
  },
];

/** Plain observations about the walk. No spiritual claims — the restraint is the point. */
export const koraNotes = [
  "20–30 minutes at an unhurried pace",
  "Mostly shaded",
  "Prayer wheels along the wall",
  "Mani stones",
  "Langurs in winter",
  "Good for birds",
] as const;

/**
 * The circuit, drawn as one closed loop, clockwise from the temple entrance at
 * the top. Deliberately off-round — struck with a hand, not a compass.
 * `pathLength="1"` is set on the element so the draw animation can run in pure
 * CSS without measuring anything in JS.
 */
export const KORA_PATH_D =
  "M 200,62 C 272,38 374,50 440,110 C 502,166 512,268 470,340 C 430,410 348,452 268,450 C 188,448 118,404 96,330 C 72,250 114,108 200,62 Z";
