import Link from "next/link";
import PageFrame from "@/components/site/PageFrame";

const photos = [
  { place: "Sossusvlei dunes", author: "Vicartb", source: "https://commons.wikimedia.org/wiki/File:Sossusvlei_Dunes_Namib.jpg", license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" },
  { place: "Swakopmund pier", author: "Marc HEURTAUT", source: "https://commons.wikimedia.org/wiki/File:Namibie_beach_pier_sunset_(Unsplash).jpg", license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" },
  { place: "Walvis Bay lagoon", author: "Ndatipo1998", source: "https://commons.wikimedia.org/wiki/File:The_sunset_at_the_Walvis_bay_lagoon.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  { place: "Windhoek at night", author: "Hp.Baumeler", source: "https://commons.wikimedia.org/wiki/File:Windhoek_at_night.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  { place: "Windhoek cityscape", author: "Gwasheya", source: "https://commons.wikimedia.org/wiki/File:Cityscape_Chronicles%3B_Windhoek%27s_Architectural_Diversity.jpg", license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" },
  { place: "Dune south of Swakopmund", author: "Daniel Kraft", source: "https://commons.wikimedia.org/wiki/File:Swakopmund_Dune.jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/" },
  { place: "Zoo Park, Windhoek", author: "Mike Krüger", source: "https://commons.wikimedia.org/wiki/File:Zoo_Park%2C_Windhoek_Mike_Kr%C3%BCger_140410_1.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  { place: "Etosha landscape", author: "Sonse", source: "https://commons.wikimedia.org/wiki/File:Scenery_(37712436922).jpg", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/" },
];

export default function PhotoCreditsPage() {
  return <PageFrame><main id="main" className="wrap page-content photo-credits-page"><p className="eyebrow">SITE PHOTOGRAPHY</p><h1>Made of real places.</h1><p className="page-lead">These photographs show Namibian locations. They do not document the example events shown in the preview catalogue. Images are cropped and colour-overlaid by the responsive layout.</p><ul>{photos.map((photo) => <li key={photo.place}><strong>{photo.place}</strong><span>Photograph by {photo.author}</span><div><a href={photo.source} target="_blank" rel="noopener noreferrer">Original photograph ↗</a><a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license} ↗</a></div></li>)}</ul><Link href="/events" className="text-link">Explore events →</Link></main></PageFrame>;
}
