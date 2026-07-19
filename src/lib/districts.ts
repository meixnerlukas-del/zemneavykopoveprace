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

// Približné centroidy (súradnice okresného mesta) kľúčované ŠÚSR kódom.
// Stačia na umiestnenie pinu a výpočet najbližšieho okresu; nie sú katastrálne presné.
export const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  "101": [48.145, 17.11], // Bratislava I
  "102": [48.155, 17.17], // Bratislava II
  "103": [48.18, 17.13], // Bratislava III
  "104": [48.17, 17.05], // Bratislava IV
  "105": [48.11, 17.11], // Bratislava V
  "106": [48.436, 17.021], // Malacky
  "107": [48.289, 17.267], // Pezinok
  "108": [48.219, 17.4], // Senec
  "201": [47.992, 17.612], // Dunajská Streda
  "202": [48.19, 17.727], // Galanta
  "203": [48.431, 17.802], // Hlohovec
  "204": [48.591, 17.826], // Piešťany
  "205": [48.68, 17.366], // Senica
  "206": [48.845, 17.227], // Skalica
  "207": [48.377, 17.588], // Trnava
  "301": [48.72, 18.257], // Bánovce nad Bebravou
  "302": [48.997, 18.233], // Ilava
  "303": [48.752, 17.567], // Myjava
  "304": [48.757, 17.831], // Nové Mesto nad Váhom
  "305": [48.628, 18.379], // Partizánske
  "306": [49.116, 18.427], // Považská Bystrica
  "307": [48.774, 18.627], // Prievidza
  "308": [49.124, 18.328], // Púchov
  "309": [48.894, 18.041], // Trenčín
  "401": [47.764, 18.129], // Komárno
  "402": [48.216, 18.606], // Levice
  "403": [48.308, 18.087], // Nitra
  "404": [47.985, 18.161], // Nové Zámky
  "405": [48.153, 17.881], // Šaľa
  "406": [48.556, 18.176], // Topoľčany
  "407": [48.383, 18.398], // Zlaté Moravce
  "501": [49.223, 18.558], // Bytča
  "502": [49.436, 18.789], // Čadca
  "503": [49.209, 19.297], // Dolný Kubín
  "504": [49.301, 18.784], // Kysucké Nové Mesto
  "505": [49.083, 19.611], // Liptovský Mikuláš
  "506": [49.065, 18.921], // Martin
  "507": [49.407, 19.482], // Námestovo
  "508": [49.078, 19.308], // Ružomberok
  "509": [48.861, 18.864], // Turčianske Teplice
  "510": [49.336, 19.556], // Tvrdošín
  "511": [49.223, 18.74], // Žilina
  "601": [48.736, 19.146], // Banská Bystrica
  "602": [48.448, 18.896], // Banská Štiavnica
  "603": [48.804, 19.64], // Brezno
  "604": [48.56, 19.418], // Detva
  "605": [48.355, 19.066], // Krupina
  "606": [48.332, 19.667], // Lučenec
  "607": [48.43, 19.795], // Poltár
  "608": [48.683, 20.117], // Revúca
  "609": [48.383, 20.022], // Rimavská Sobota
  "610": [48.209, 19.351], // Veľký Krtíš
  "611": [48.575, 19.126], // Zvolen
  "612": [48.483, 18.716], // Žarnovica
  "613": [48.59, 18.851], // Žiar nad Hronom
  "701": [49.292, 21.276], // Bardejov
  "702": [48.933, 21.911], // Humenné
  "703": [49.135, 20.428], // Kežmarok
  "704": [49.024, 20.589], // Levoča
  "705": [49.271, 21.905], // Medzilaborce
  "706": [49.056, 20.298], // Poprad
  "707": [48.998, 21.239], // Prešov
  "708": [49.101, 21.099], // Sabinov
  "709": [48.988, 22.153], // Snina
  "710": [49.298, 20.688], // Stará Ľubovňa
  "711": [49.204, 21.651], // Stropkov
  "712": [49.307, 21.567], // Svidník
  "713": [48.888, 21.683], // Vranov nad Topľou
  "801": [48.856, 20.937], // Gelnica
  "802": [48.73, 21.25], // Košice I
  "803": [48.7, 21.23], // Košice II
  "804": [48.735, 21.29], // Košice III
  "805": [48.7, 21.27], // Košice IV
  "806": [48.75, 21.1], // Košice-okolie
  "807": [48.754, 21.919], // Michalovce
  "808": [48.661, 20.532], // Rožňava
  "809": [48.745, 22.18], // Sobrance
  "810": [48.944, 20.563], // Spišská Nová Ves
  "811": [48.626, 21.719], // Trebišov
};

/** Odstráni diakritiku, malé písmená, medzery a interpunkciu na pomlčky. */
export function toSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diakritika (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const PROFILE_SLUG_PREFIX = "zemne-a-vykopove-prace-";

/** Slug profilovej URL, napr. "zemne-a-vykopove-prace-nitra". */
export function districtProfileSlug(districtSlug: string): string {
  return `${PROFILE_SLUG_PREFIX}${districtSlug}`;
}

/** Z profilového slugu vytiahne slug okresu, alebo null ak nezodpovedá vzoru. */
export function districtSlugFromProfileSlug(fullSlug: string): string | null {
  if (!fullSlug.startsWith(PROFILE_SLUG_PREFIX)) return null;
  const rest = fullSlug.slice(PROFILE_SLUG_PREFIX.length);
  return rest.length > 0 ? rest : null;
}

/** Extrahuje YouTube video ID z rôznych foriem URL. */
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}
