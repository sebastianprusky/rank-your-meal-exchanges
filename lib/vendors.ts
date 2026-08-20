export type Bucket = "liked" | "fine" | "disliked";

export type Vendor = {
  id: string;
  name: string;
  shortName: string;
  eyebrow: string;
  accent: string;
  accentSoft: string;
  glyph: string;
  menuItems: string[];
};

export const vendors: Vendor[] = [
  {
    id: "mod-pizza",
    name: "MOD Pizza",
    shortName: "MOD",
    eyebrow: "Build-your-own pizza",
    accent: "#D84531",
    accentSoft: "#F8C9B9",
    glyph: "◒",
    menuItems: ["Create Your Own Pizza", "Mad Dog", "Tristan", "Caspian", "No Name Cake"],
  },
  {
    id: "buen-dia",
    name: "Buen Dia",
    shortName: "BUEN",
    eyebrow: "Tacos & bowls",
    accent: "#E58A19",
    accentSoft: "#F9DCA7",
    glyph: "✺",
    menuItems: ["Buen Dia Bowl", "Chicken Tacos", "Veggie Tacos", "Chips & Guac", "Horchata"],
  },
  {
    id: "wildcat-deli",
    name: "Wildcat Deli",
    shortName: "DELI",
    eyebrow: "Sandwiches & wraps",
    accent: "#4E2A84",
    accentSoft: "#D8CAEE",
    glyph: "▤",
    menuItems: ["Turkey Club", "Italian Sub", "Veggie Wrap", "Chicken Caesar Wrap", "Grilled Cheese"],
  },
  {
    id: "847-burger",
    name: "847 Burger",
    shortName: "847",
    eyebrow: "Burgers & fries",
    accent: "#9C3827",
    accentSoft: "#EDC3B6",
    glyph: "≋",
    menuItems: ["847 Classic", "Double Burger", "Crispy Chicken Sandwich", "Veggie Burger", "Loaded Fries"],
  },
  {
    id: "shake-smart",
    name: "Shake Smart",
    shortName: "SHAKE",
    eyebrow: "Smoothies & bowls",
    accent: "#276E61",
    accentSoft: "#BCE0D5",
    glyph: "◗",
    menuItems: ["The Classic", "PB Squared", "Acai Bowl", "Green Giant", "Overnight Oats"],
  },
  {
    id: "frans-cafe",
    name: "Fran's Cafe",
    shortName: "FRAN'S",
    eyebrow: "Late-night favorites",
    accent: "#315B8A",
    accentSoft: "#C6D8EC",
    glyph: "✦",
    menuItems: ["Chicken Tenders", "Quesadilla", "Mozzarella Sticks", "Mac & Cheese", "Fries"],
  },
  {
    id: "lisas-cafe",
    name: "Lisa's Cafe",
    shortName: "LISA'S",
    eyebrow: "Coffee & comfort food",
    accent: "#A15E79",
    accentSoft: "#EBCBD7",
    glyph: "☕",
    menuItems: ["Breakfast Sandwich", "Bagel & Cream Cheese", "Chicken Tenders", "Grilled Cheese", "Iced Coffee"],
  },
  {
    id: "starbucks",
    name: "Starbucks",
    shortName: "SBUX",
    eyebrow: "Coffee & quick bites",
    accent: "#15745A",
    accentSoft: "#B9DED3",
    glyph: "✳",
    menuItems: ["Caramel Macchiato", "Pink Drink", "Cold Brew", "Bacon Gouda Sandwich", "Cake Pop"],
  },
  {
    id: "tech-express",
    name: "Tech Express",
    shortName: "TECH",
    eyebrow: "Grab-and-go",
    accent: "#584176",
    accentSoft: "#D9CDE6",
    glyph: "↗",
    menuItems: ["Chicken Sandwich", "Caesar Salad", "Turkey Wrap", "Fruit Cup", "Iced Tea"],
  },
];

export const vendorById = Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor]));
