export type Bucket = "liked" | "fine" | "disliked";

export type Vendor = {
  id: string;
  name: string;
  shortName: string;
  accent: string;
  accentSoft: string;
  glyph: string;
  image: string;
};

export const vendors: Vendor[] = [
  {
    id: "forno-pizza-co",
    name: "Forno Pizza Co.",
    shortName: "FORNO",
    accent: "#D84531",
    accentSoft: "#F8C9B9",
    glyph: "◒",
    image: "/vendors/cards/forno-pizza-co.webp",
  },
  {
    id: "buen-dia",
    name: "Buen Dia",
    shortName: "BUEN",
    accent: "#E58A19",
    accentSoft: "#F9DCA7",
    glyph: "✺",
    image: "/vendors/cards/buen-dia.webp",
  },
  {
    id: "wildcat-deli",
    name: "Wildcat Deli",
    shortName: "DELI",
    accent: "#4E2A84",
    accentSoft: "#D8CAEE",
    glyph: "▤",
    image: "/vendors/cards/wildcat-deli.webp",
  },
  {
    id: "847-burger",
    name: "847 Burger",
    shortName: "847",
    accent: "#9C3827",
    accentSoft: "#EDC3B6",
    glyph: "≋",
    image: "/vendors/cards/847-burger.webp",
  },
  {
    id: "shake-smart",
    name: "Shake Smart",
    shortName: "SHAKE",
    accent: "#276E61",
    accentSoft: "#BCE0D5",
    glyph: "◗",
    image: "/vendors/cards/shake-smart.webp",
  },
  {
    id: "frans-cafe",
    name: "Fran's Cafe",
    shortName: "FRAN'S",
    accent: "#315B8A",
    accentSoft: "#C6D8EC",
    glyph: "✦",
    image: "/vendors/cards/frans-cafe.webp",
  },
  {
    id: "lisas-cafe",
    name: "Lisa's Cafe",
    shortName: "LISA'S",
    accent: "#A15E79",
    accentSoft: "#EBCBD7",
    glyph: "☕",
    image: "/vendors/cards/lisas-cafe.webp",
  },
  {
    id: "starbucks",
    name: "Starbucks",
    shortName: "SBUX",
    accent: "#15745A",
    accentSoft: "#B9DED3",
    glyph: "✳",
    image: "/vendors/cards/starbucks.webp",
  },
  {
    id: "tech-express",
    name: "Tech Express",
    shortName: "TECH",
    accent: "#584176",
    accentSoft: "#D9CDE6",
    glyph: "↗",
    image: "/vendors/cards/tech-express.webp",
  },
  {
    id: "chicken-and-boba",
    name: "Chicken & Boba",
    shortName: "C&B",
    accent: "#B0445A",
    accentSoft: "#F0C9D2",
    glyph: "◉",
    image: "/vendors/cards/chicken-and-boba.webp",
  },
  {
    id: "lunas-pub-and-grill",
    name: "Luna's Pub & Grill",
    shortName: "LUNA'S",
    accent: "#7A4D2D",
    accentSoft: "#E5D0BC",
    glyph: "☾",
    image: "/vendors/cards/lunas-pub-and-grill.webp",
  },
];

export const vendorById = Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor]));
