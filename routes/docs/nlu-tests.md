# Live NLU cases

Each case calls OpenRouter once, then resolves against local Postgres. This is a live integration check, not a mocked parser test.

Run `npx tsx scripts/test-nlu.ts` with the app and Docker running.

| Request | Origin | Destination | Language | Live result |
| --- | --- | --- | --- | --- |
| I need to go to Banadir Hospital from Liido | liido-beach | banadir-hospital | en | PASS |
| I need to go to Medina hospital from Bakaara | bakaara-market | madina-hospital | en | PASS |
| Take me to Liido Beach from KM4 | km4 | liido-beach | en | PASS |
| Drive from Madina Hospital to Bakaara Market | madina-hospital | bakaara-market | en | PASS |
| How do I get to the Turkish Hospital? | Current map centre | erdogan-hospital | en | PASS |
| I want to visit Villa Somalia | Current map centre | villa-somalia | en | PASS |
| Go to the National Theatre | Current map centre | national-theatre | en | PASS |
| From Peace Garden to Mogadishu Port | peace-garden | port | en | PASS |
| From SOS Hospital to Keysane Hospital | sos-hospital | keysane-hospital | en | PASS |
| Take me to Kalkaal Hospital from Aden Adde Airport | airport | ambiguous | en | PASS |
| I am at Bakaara Market and need to reach Somali Parliament | bakaara-market | parliament | en | PASS |
| Route from SIMAD University to Somali National University | simad-university | national-university | en | PASS |
| Take me to Mogadishu Cathedral | Current map centre | cathedral | en | PASS |
| I want to go to Daljirka Dahsoon | Current map centre | daljirka | en | PASS |
| Directions to Arba Rukun Mosque | Current map centre | arbaa-rukun | en | PASS |
| Take me to Madina district | Current map centre | wadajir | en | PASS |
| waxaan rabaa inaan tago Isbitaalka Banaadir | Current map centre | banadir-hospital | so | PASS |
| sidee ku tagaa isbitaalka madiina | Current map centre | madina-hospital | so | PASS |
| Waxaan rabaa inaan tago Xeebta Liido | Current map centre | liido-beach | so | PASS |
| I gee Suuqa Bakaaraha | Current map centre | bakaara-market | so | PASS |
| Waxaan joogaa KM4, waxaan rabaa inaan tago Isbitaalka Kalkaal | km4 | ambiguous | so | PASS |
| Ka tag Liido ilaa Isbitaalka Banaadir | liido-beach | banadir-hospital | so | PASS |
| Waxaan rabaa inaan tago Isbitaalka Turkiga | Current map centre | erdogan-hospital | so | PASS |
| I gee Beerta Nabadda | Current map centre | peace-garden | so | PASS |
| Sidee ku tagaa Tiyaatarka Qaranka? | Current map centre | national-theatre | so | PASS |
| Waxaan rabaa inaan tago Jaamacadda Ummadda | Current map centre | national-university | so | PASS |
| Sidee ku tagaa Dekedda Muqdisho? | Current map centre | port | so | PASS |
| Waxaan joogaa Isbitaalka SOS, waxaan rabaa inaan tago Isbitaalka Keysane | sos-hospital | keysane-hospital | so | PASS |
| I gee Madaxtooyada Soomaaliya | Current map centre | villa-somalia | so | PASS |
| Waxaan rabaa inaan tago Garoonka Aadan Cadde | Current map centre | airport | so | PASS |
| Take me to Madina | Current map centre | ambiguous | en | PASS |
| Take me to مستشفى المدينة | Current map centre | madina-hospital | en | PASS |

Detailed timings and returned intents: `data/reports/nlu-live.json`.
