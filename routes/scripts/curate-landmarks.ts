import { readFile, writeFile } from "node:fs/promises";
import type { FeatureCollection, Position } from "geojson";
const named: FeatureCollection = JSON.parse(
  await readFile("data/raw/named.geojson", "utf8"),
);
const source = new Map(named.features.map((f) => [String(f.id), f]));
const catalog = [
  [
    "banadir-hospital",
    "a2131448018",
    "Banadir Hospital",
    "hospital",
    "Isbitaalka Banaadir",
    "Benadir Hospital|Banadir|Banaadir Hospital|Isbitaalka Banadir|مستشفى بنادر",
  ],
  [
    "madina-hospital",
    "a440210866",
    "Madina Hospital",
    "hospital",
    "Isbitaalka Madiina",
    "Medina Hospital|Madiina Hospital|Isbitaalka Medina|Madina|Medina|مستشفى المدينة",
  ],
  [
    "erdogan-hospital",
    "a1100850960",
    "Recep Tayyip Erdogan Hospital",
    "hospital",
    "Isbitaalka Turkiga",
    "Turkish Hospital|Erdogan Hospital|Digfer Hospital|Isbitaalka Digfeer|Isbitaalka Erdogan",
  ],
  [
    "sos-hospital",
    "a2747367790",
    "SOS Hospital",
    "hospital",
    "Isbitaalka SOS",
    "SOS|SOS hospital Mogadishu",
  ],
  [
    "kalkaal-hospital",
    "a2743833548",
    "Kalkaal Hospital",
    "hospital",
    "Isbitaalka Kalkaal",
    "Kalkaal",
  ],
  [
    "keysane-hospital",
    "a2747728164",
    "Keysane Hospital",
    "hospital",
    "Isbitaalka Keysane",
    "Keysaney Hospital|Keesaney|Keysane",
  ],
  [
    "airport",
    "a1347697598",
    "Aden Adde International Airport",
    "airport",
    "Garoonka Aadan Cadde",
    "Aden Adde Airport|Aden Adde|Aadan Cadde|Mogadishu Airport|Garoonka diyaaradaha|Airport",
  ],
  [
    "liido-beach",
    "a611514576",
    "Liido Beach",
    "beach",
    "Xeebta Liido",
    "Liido|Lido|Lido Beach|Xeebta Lido|شاطئ ليدو",
  ],
  [
    "bakaara-market",
    "a57976356",
    "Bakaara Market",
    "market",
    "Suuqa Bakaaraha",
    "Bakaara|Bakara|Bakaaraha|Bakara Market|Suuqa Bakaara|سوق البقرة",
  ],
  [
    "villa-somalia",
    "a24652905",
    "Villa Somalia",
    "government",
    "Madaxtooyada Soomaaliya",
    "Villa Soomaaliya|Madaxtooyada|Presidential Palace",
  ],
  [
    "parliament",
    "a27655537",
    "Somali Parliament",
    "government",
    "Baarlamaanka Soomaaliya",
    "Guriga Ummadda|Federal Parliament|Parliament|Golaha Shacabka",
  ],
  [
    "port",
    "a25637819",
    "Mogadishu Port",
    "landmark",
    "Dekedda Muqdisho",
    "Port|Dekedda|Mogadishu International Port|ميناء مقديشو الدولي",
  ],
  [
    "arbaa-rukun",
    "a2024050578",
    "Arba'a Rukun Mosque",
    "mosque",
    "Masaajidka Arbac Rukun",
    "Arba Rukun|Arbac Rukun|Arbaa Rukun Mosque|Wednesday Mosque Rukun",
  ],
  [
    "cathedral",
    "a252469780",
    "Mogadishu Cathedral ruins",
    "landmark",
    "Kaniisaddii Muqdisho",
    "Cathedral|Mogadishu Cathedral|Kaniisadda Muqdisho",
  ],
  [
    "national-theatre",
    "a37839271",
    "National Theatre",
    "landmark",
    "Tiyaatarka Qaranka",
    "Theatre|The National Theatre|Tiyaatarka|Tiyaatarka Qaranka Soomaaliya",
  ],
  [
    "national-university",
    "a790171400",
    "Somali National University",
    "university",
    "Jaamacadda Ummadda Soomaaliyeed",
    "SNU|Jaamacadda Ummadda|National University",
  ],
  [
    "simad-university",
    "a2747491442",
    "SIMAD University",
    "university",
    "Jaamacadda SIMAD",
    "SIMAD|University of Simad|IML SIMAD",
  ],
  [
    "peace-garden",
    "n4236124590",
    "Peace Garden",
    "landmark",
    "Beerta Nabadda",
    "Beerta Nabada|Peace Gardens",
  ],
  [
    "daljirka",
    "n4340149892",
    "Daljirka Dahsoon",
    "landmark",
    "Daljirka Dahsoon",
    "Unknown Soldier|Tomb of the Unknown Soldier",
  ],
  [
    "km4",
    "n4243444189",
    "KM4 junction",
    "landmark",
    "Isgoyska KM4",
    "KM4|KM 4|Kilo 4|Isgoyska KM 4",
  ],
  [
    "abdiaziz-district",
    "n1404227217",
    "Abdiaziz district",
    "district",
    "Cabdulcasiis",
    "Abdiaziz|Abdulaziz|Cabdulcasiis district",
  ],
  [
    "bondhere",
    "n12716664907",
    "Bondhere district",
    "district",
    "Boondheere",
    "Bondhere|Boondheere district|Bondere",
  ],
  [
    "daynile",
    "n319266401",
    "Daynile district",
    "district",
    "Dayniile",
    "Daynile|Dayniile district",
  ],
  [
    "dharkenley",
    "n319263779",
    "Dharkenley district",
    "district",
    "Dharkeynley",
    "Dharkenley|Dharkeynley district",
  ],
  [
    "hamar-jajab",
    "n36847698",
    "Hamar Jajab district",
    "district",
    "Xamar Jajab",
    "Hamar Jajab|Xamar Jajab district",
  ],
  [
    "hamar-weyne",
    "n36847699",
    "Hamar Weyne district",
    "district",
    "Xamar Weyne",
    "Hamar Weyne|Hamarweyne|Xamar Weyne district",
  ],
  [
    "hodan",
    "n36841731",
    "Hodan district",
    "district",
    "Hodan",
    "Hodan district|Degmada Hodan",
  ],
  [
    "howlwadag",
    "n36426437",
    "Howlwadag district",
    "district",
    "Howlwadaag",
    "Howlwadag|Howlwadaag district|Hawl Wadaag",
  ],
  [
    "huriwa",
    "n315100496",
    "Huriwa district",
    "district",
    "Huriwa",
    "Heliwa|Huriwa district|Heliwaa",
  ],
  [
    "kaaraan",
    "n315100657",
    "Kaaraan district",
    "district",
    "Kaaraan",
    "Karan|Karaan|Kaaraan district",
  ],
  [
    "shangani",
    "n315098533",
    "Shangani district",
    "district",
    "Shangaani",
    "Shangani|Shingaani|Shangaani district",
  ],
  [
    "shibis",
    "n1404230404",
    "Shibis district",
    "district",
    "Shibis",
    "Shibis district|Degmada Shibis",
  ],
  [
    "waaberi",
    "n36841732",
    "Waaberi district",
    "district",
    "Waaberi",
    "Waberi|Waaberi district",
  ],
  [
    "wadajir",
    "n36422040",
    "Wadajir (Madina) district",
    "district",
    "Wadajir",
    "Wadajir|Madina district|Medina district|Madina|Medina|Degmada Madiina|Madiina",
  ],
  [
    "warta-nabada",
    "n36848806",
    "Warta Nabada district",
    "district",
    "Warta Nabadda",
    "Wardhigley|Wardhiigley|Warta Nabada|Warta Nabadda district",
  ],
  [
    "yaaqshiid",
    "n36848807",
    "Yaaqshiid district",
    "district",
    "Yaaqshiid",
    "Yaqshid|Yaaqshiid district",
  ],
  [
    "kaxda",
    "a24823975",
    "Kaxda district",
    "district",
    "Kaxda",
    "Kahda|Kaxda district|Kahda district",
  ],
];
function center(ring: Position[]) {
  let a = 0,
    x = 0,
    y = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const p = ring[i],
      q = ring[i + 1],
      k = p[0] * q[1] - q[0] * p[1];
    a += k;
    x += (p[0] + q[0]) * k;
    y += (p[1] + q[1]) * k;
  }
  return [x / (3 * a), y / (3 * a)];
}
const output = catalog.map(
  ([id, featureId, name, category, nameSo, aliases]) => {
    const f = source.get(featureId);
    if (!f?.geometry) throw new Error(`Missing ${id} ${featureId}`);
    const g = f.geometry;
    const [lng, lat] =
      g.type === "Point"
        ? g.coordinates
        : g.type === "MultiPolygon"
          ? center(g.coordinates[0][0])
          : g.type === "Polygon"
            ? center(g.coordinates[0])
            : [NaN, NaN];
    if (!Number.isFinite(lng)) throw new Error(`Bad centroid ${id}`);
    const osm_id =
      featureId[0] === "a"
        ? (BigInt(featureId.slice(1)) % 2n === 0n ? "w" : "r") +
          String(BigInt(featureId.slice(1)) / 2n)
        : featureId;
    return {
      id,
      name,
      aliases: [
        ...new Set(
          [
            nameSo,
            ...aliases.split("|"),
            f.properties?.name,
            ...["name:ar", "name:en", "name:so"].map((k) => f.properties?.[k]),
          ].filter(Boolean),
        ),
      ],
      category,
      district: "",
      lat,
      lng,
      description:
        category === "district"
          ? `A district of Banaadir, Mogadishu.`
          : `${name}, Mogadishu.`,
      source: "manual",
      osm_id,
      name_so: nameSo,
      osm_url: `https://www.openstreetmap.org/${osm_id[0] === "n" ? "node" : osm_id[0] === "w" ? "way" : "relation"}/${osm_id.slice(1)}`,
    };
  },
);
for (const p of output) {
  if (p.category === "district") {
    p.district = p.name_so;
    continue;
  }
  const district = output
    .filter((d) => d.category === "district")
    .sort(
      (a, b) =>
        (p.lat - a.lat) ** 2 +
        (p.lng - a.lng) ** 2 -
        ((p.lat - b.lat) ** 2 + (p.lng - b.lng) ** 2),
    )[0];
  p.district = district.name_so;
}
output.find((p) => p.id === "simad-university")!.description =
  "SIMAD University, Institute of Modern Languages campus. The OSM extract identifies this campus; other campuses may differ.";
output.find((p) => p.id === "cathedral")!.description =
  "The remains of Mogadishu Cathedral in the historic city centre.";
output.find((p) => p.id === "liido-beach")!.description =
  "The Indian Ocean shoreline at Liido, beside Cabdulcasiis.";
await writeFile("data/landmarks.json", JSON.stringify(output, null, 2) + "\n");
console.log(
  `Curated ${output.length} OSM-backed places, including ${output.filter((p) => p.category === "district").length} districts.`,
);
