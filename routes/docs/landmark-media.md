# Landmark photographs and appearance

On 2026-09-09 the user approved openly licensed photos and models, expanding the original OSM-only source restriction. Geography, routing and search remain local OSM. The images below are bundled under `public/photos`; loading and browsing them makes no remote media requests. Opening a source or licence link is an explicit user action.

## Photographs

| Place | Photographer / credit | Photo date | Licence | Source |
| --- | --- | --- | --- | --- |
| Liido Beach | Uncannystranger | 2024-11-12 | CC0 1.0 | [Liido Beach.jpg](https://commons.wikimedia.org/wiki/File:Liido_Beach.jpg) |
| Daljirka Dahsoon | Ilyas Ahmed / AMISOM Public Information | 2015-06-12 | CC0 1.0 | [2015 New face of Mogadishu, 12](https://commons.wikimedia.org/wiki/File:2015_12_New_face_of_Mogadishu-12_(18262830843).jpg) |
| Mogadishu Cathedral ruins | Mar Sharb | 2022-05-07 | CC BY 2.0 | [Cattedrale di Mogadiscio.jpg](https://commons.wikimedia.org/wiki/File:Cattedrale_di_Mogadiscio.jpg) |
| Villa Somalia | Mustafa6barakat | 2012-12-01 | CC BY-SA 4.0 | [Villa somalia.jpg](https://commons.wikimedia.org/wiki/File:Villa_somalia.jpg) |

Licences: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Commons imageinfo metadata was retrieved and the downloaded photos were visually inspected on 2026-09-09. Exact metadata is preserved in `data/raw/media/*-selected.json`. `config/landmark-media.json` records the full titles, original source pages, download URLs, licences, dates and SHA-256 hashes. Photos are unedited copies of the Commons-served rendition; the list thumbnails are cropped by CSS, and opening the photo displays the full local rendition. The low-resolution Villa Somalia photo is an older recognition reference, not evidence of current appearance.

Visible cards show author, licence, date and a notice that appearance may have changed. References match curated place IDs; a nearby unrelated place does not inherit a photo. The gallery has four verified references, not complete photographic coverage of Mogadishu.

## 3D interpretation

`components/city/referenceLandmarks.ts` contains locally authored visual approximations:

- Daljirka: tapered square stone shaft, capped pedestal, blue panel and white star, steps and garden approach, based on the CC0 2015 photograph.
- Cathedral: roofless masonry facade, broken left tower, lost upper right tower, pointed window and portal, parapet and rubble, based on Mar Sharb's CC BY 2.0 photograph. This is a geometric interpretation of that reference; attribution and source are above and in the app. It does not reproduce the photograph as a texture.

Dimensions, orientation and unseen surfaces are estimates. These are not surveyed reconstructions, photogrammetry or evidence of current condition. Other landmark models remain schematic.

The cathedral's source OSM way `126234890` records `building:levels=22`. This produces a 77 m solid building that contradicts the 2022 photograph of the ruin. Its Planetiler vector-tile feature ID, verified against the local PMTiles, is `1262348902`. The tile worker suppresses only that building mesh in favour of the reference geometry, retaining the OSM footprint as a collision obstacle. The raw OSM tags and archive are unchanged. Revalidate the ID if the tile pipeline changes.

Five real Mogadishu models were inspected through Sketchfab's public model API: National Theatre (`8ca6736cc81c40f48f244c96b06282ee`), Arba'a Rukun (`a1852d1a7b3641f79f6ac2e762900362`), former Parliament (`a1585b623bd440a48a25d9b9a3a6b046`), Lighthouse (`5fcef86d61614cffa1bf1c4c640e6498`) and Central Mosque (`eaa49eecf5474d6aaf46c3fdeee01b1c`). Each returned `isDownloadable: false` with no open licence. No assets were extracted or imported from them.

## Google imagery request

The user asked whether Google imagery of the full city could be extracted. Google satellite imagery is available through the official connected API, which requires an API key and billing. It is not an offline city dump. The [Map Tiles policies](https://developers.google.com/maps/documentation/tile/policies) restrict bulk storage, extraction and offline use. The [coverage table](https://developers.google.com/maps/coverage?hl=en), checked 2026-09-09, lists Somalia with 2D coverage, without the second photorealistic 3D indicator, and with no Maps JavaScript 3D coverage. This does not establish full Street View coverage.

Google Images is a search engine; [Google's guidance](https://support.google.com/websearch/answer/29508) requires checking the source licence before reuse. Random city photos cannot establish accurate 3D geometry for unseen streets. No Google dependency or key was added. The optional satellite-view preference is separate from the already authorized local photographs.
