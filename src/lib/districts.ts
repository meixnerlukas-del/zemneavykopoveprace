// 79 okresov SR podľa číselníka v zadaní (kap. 7).
// `code` = oficiálny kód okresu ŠÚSR (kraj-číslica + poradie).
// `slug` sa generuje z názvu funkciou toSlug().

export type DistrictSeed = {
  name: string;
  code: string;
  region: string;
};

export const REGIONS = [
  "Bratislavský kraj",
  "Trnavský kraj",
  "Trenčiansky kraj",
  "Nitriansky kraj",
  "Žilinský kraj",
  "Banskobystrický kraj",
  "Prešovský kraj",
  "Košický kraj",
] as const;

export const DISTRICTS: DistrictSeed[] = [
  // Bratislavský kraj (8)
  { name: "Bratislava I", code: "101", region: "Bratislavský kraj" },
  { name: "Bratislava II", code: "102", region: "Bratislavský kraj" },
  { name: "Bratislava III", code: "103", region: "Bratislavský kraj" },
  { name: "Bratislava IV", code: "104", region: "Bratislavský kraj" },
  { name: "Bratislava V", code: "105", region: "Bratislavský kraj" },
  { name: "Malacky", code: "106", region: "Bratislavský kraj" },
  { name: "Pezinok", code: "107", region: "Bratislavský kraj" },
  { name: "Senec", code: "108", region: "Bratislavský kraj" },

  // Trnavský kraj (7)
  { name: "Dunajská Streda", code: "201", region: "Trnavský kraj" },
  { name: "Galanta", code: "202", region: "Trnavský kraj" },
  { name: "Hlohovec", code: "203", region: "Trnavský kraj" },
  { name: "Piešťany", code: "204", region: "Trnavský kraj" },
  { name: "Senica", code: "205", region: "Trnavský kraj" },
  { name: "Skalica", code: "206", region: "Trnavský kraj" },
  { name: "Trnava", code: "207", region: "Trnavský kraj" },

  // Trenčiansky kraj (9)
  { name: "Bánovce nad Bebravou", code: "301", region: "Trenčiansky kraj" },
  { name: "Ilava", code: "302", region: "Trenčiansky kraj" },
  { name: "Myjava", code: "303", region: "Trenčiansky kraj" },
  { name: "Nové Mesto nad Váhom", code: "304", region: "Trenčiansky kraj" },
  { name: "Partizánske", code: "305", region: "Trenčiansky kraj" },
  { name: "Považská Bystrica", code: "306", region: "Trenčiansky kraj" },
  { name: "Prievidza", code: "307", region: "Trenčiansky kraj" },
  { name: "Púchov", code: "308", region: "Trenčiansky kraj" },
  { name: "Trenčín", code: "309", region: "Trenčiansky kraj" },

  // Nitriansky kraj (7)
  { name: "Komárno", code: "401", region: "Nitriansky kraj" },
  { name: "Levice", code: "402", region: "Nitriansky kraj" },
  { name: "Nitra", code: "403", region: "Nitriansky kraj" },
  { name: "Nové Zámky", code: "404", region: "Nitriansky kraj" },
  { name: "Šaľa", code: "405", region: "Nitriansky kraj" },
  { name: "Topoľčany", code: "406", region: "Nitriansky kraj" },
  { name: "Zlaté Moravce", code: "407", region: "Nitriansky kraj" },

  // Žilinský kraj (11)
  { name: "Bytča", code: "501", region: "Žilinský kraj" },
  { name: "Čadca", code: "502", region: "Žilinský kraj" },
  { name: "Dolný Kubín", code: "503", region: "Žilinský kraj" },
  { name: "Kysucké Nové Mesto", code: "504", region: "Žilinský kraj" },
  { name: "Liptovský Mikuláš", code: "505", region: "Žilinský kraj" },
  { name: "Martin", code: "506", region: "Žilinský kraj" },
  { name: "Námestovo", code: "507", region: "Žilinský kraj" },
  { name: "Ružomberok", code: "508", region: "Žilinský kraj" },
  { name: "Turčianske Teplice", code: "509", region: "Žilinský kraj" },
  { name: "Tvrdošín", code: "510", region: "Žilinský kraj" },
  { name: "Žilina", code: "511", region: "Žilinský kraj" },

  // Banskobystrický kraj (13)
  { name: "Banská Bystrica", code: "601", region: "Banskobystrický kraj" },
  { name: "Banská Štiavnica", code: "602", region: "Banskobystrický kraj" },
  { name: "Brezno", code: "603", region: "Banskobystrický kraj" },
  { name: "Detva", code: "604", region: "Banskobystrický kraj" },
  { name: "Krupina", code: "605", region: "Banskobystrický kraj" },
  { name: "Lučenec", code: "606", region: "Banskobystrický kraj" },
  { name: "Poltár", code: "607", region: "Banskobystrický kraj" },
  { name: "Revúca", code: "608", region: "Banskobystrický kraj" },
  { name: "Rimavská Sobota", code: "609", region: "Banskobystrický kraj" },
  { name: "Veľký Krtíš", code: "610", region: "Banskobystrický kraj" },
  { name: "Zvolen", code: "611", region: "Banskobystrický kraj" },
  { name: "Žarnovica", code: "612", region: "Banskobystrický kraj" },
  { name: "Žiar nad Hronom", code: "613", region: "Banskobystrický kraj" },

  // Prešovský kraj (13)
  { name: "Bardejov", code: "701", region: "Prešovský kraj" },
  { name: "Humenné", code: "702", region: "Prešovský kraj" },
  { name: "Kežmarok", code: "703", region: "Prešovský kraj" },
  { name: "Levoča", code: "704", region: "Prešovský kraj" },
  { name: "Medzilaborce", code: "705", region: "Prešovský kraj" },
  { name: "Poprad", code: "706", region: "Prešovský kraj" },
  { name: "Prešov", code: "707", region: "Prešovský kraj" },
  { name: "Sabinov", code: "708", region: "Prešovský kraj" },
  { name: "Snina", code: "709", region: "Prešovský kraj" },
  { name: "Stará Ľubovňa", code: "710", region: "Prešovský kraj" },
  { name: "Stropkov", code: "711", region: "Prešovský kraj" },
  { name: "Svidník", code: "712", region: "Prešovský kraj" },
  { name: "Vranov nad Topľou", code: "713", region: "Prešovský kraj" },

  // Košický kraj (11)
  { name: "Gelnica", code: "801", region: "Košický kraj" },
  { name: "Košice I", code: "802", region: "Košický kraj" },
  { name: "Košice II", code: "803", region: "Košický kraj" },
  { name: "Košice III", code: "804", region: "Košický kraj" },
  { name: "Košice IV", code: "805", region: "Košický kraj" },
  { name: "Košice-okolie", code: "806", region: "Košický kraj" },
  { name: "Michalovce", code: "807", region: "Košický kraj" },
  { name: "Rožňava", code: "808", region: "Košický kraj" },
  { name: "Sobrance", code: "809", region: "Košický kraj" },
  { name: "Spišská Nová Ves", code: "810", region: "Košický kraj" },
  { name: "Trebišov", code: "811", region: "Košický kraj" },
];

/** Odstráni diakritiku, malé písmená, medzery a interpunkciu na pomlčky. */
export function toSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diakritika (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Slug profilovej URL, napr. "zemne-a-vykopove-prace-nitra". */
export function districtProfileSlug(districtSlug: string): string {
  return `zemne-a-vykopove-prace-${districtSlug}`;
}
