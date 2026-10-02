export interface ImageCredit {
  localPath: `/images/${string}.jpg`;
  photographer: string;
  pexelsUrl: `https://www.pexels.com/photo/${string}/`;
  licenseUrl: "https://www.pexels.com/license/";
  illustrative: true;
}

const pexelsLicenseUrl = "https://www.pexels.com/license/";

// Stock reference photos do not document the salon, its team, or its results.
// Credits follow each local file, independently of its position in the interface.
export const imageCredits: readonly ImageCredit[] = [
  {
    localPath: "/images/hero-salon.jpg",
    photographer: "Ph Belu Jurado",
    pexelsUrl: "https://www.pexels.com/photo/brunette-woman-portrait-17561665/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/salon-interior-01.jpg",
    photographer: "Max Vakhtbovych",
    pexelsUrl:
      "https://www.pexels.com/photo/photo-of-the-interior-of-a-salon-7750098/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/salon-interior-02.jpg",
    photographer: "Max Vakhtbovych",
    pexelsUrl:
      "https://www.pexels.com/photo/beauty-salon-interior-design-7750099/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/service-haircut.jpg",
    photographer: "cottonbro studio",
    pexelsUrl: "https://www.pexels.com/photo/woman-getting-a-haircut-3992873/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/service-color.jpg",
    photographer: "cottonbro studio",
    pexelsUrl: "https://www.pexels.com/photo/woman-at-the-salon-3993312/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/service-balayage.jpg",
    photographer: "Heber Vazquez",
    pexelsUrl:
      "https://www.pexels.com/photo/portrait-of-a-pretty-brunette-16153366/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/service-treatment.jpg",
    photographer: "cottonbro studio",
    pexelsUrl:
      "https://www.pexels.com/photo/woman-having-her-hair-rinse-3993451/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/service-styling.jpg",
    photographer: "cottonbro studio",
    pexelsUrl:
      "https://www.pexels.com/photo/photo-of-a-woman-getting-her-hair-styled-7440055/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/service-extensions.jpg",
    photographer: "Alina Skazka",
    pexelsUrl:
      "https://www.pexels.com/photo/bundles-of-natural-colored-hair-14730878/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/stylist-01.jpg",
    photographer: "Fernando Capetillo",
    pexelsUrl:
      "https://www.pexels.com/photo/smiling-woman-in-black-outfit-on-grey-background-29847702/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/stylist-02.jpg",
    photographer: "Cláudio Emanuel",
    pexelsUrl:
      "https://www.pexels.com/photo/portrait-of-a-man-wearing-black-shirt-18935840/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/stylist-03.jpg",
    photographer: "Abdulkadir muhammad sani",
    pexelsUrl:
      "https://www.pexels.com/photo/confident-woman-in-black-outfit-studio-portrait-32809130/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/stylist-04.jpg",
    photographer: "Aliaksei Smalenski",
    pexelsUrl:
      "https://www.pexels.com/photo/attractive-caucasian-woman-in-white-outfit-portrait-30576237/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/result-before-01.jpg",
    photographer: "cottonbro studio",
    pexelsUrl:
      "https://www.pexels.com/photo/woman-getting-hair-treatment-3993290/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/result-after-01.jpg",
    photographer: "cottonbro studio",
    pexelsUrl:
      "https://www.pexels.com/photo/satisfied-woman-with-her-new-hairstyle-3993463/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/gallery-01.jpg",
    photographer: "cottonbro studio",
    pexelsUrl: "https://www.pexels.com/photo/woman-getting-a-haircut-3992873/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/gallery-02.jpg",
    photographer: "cottonbro studio",
    pexelsUrl:
      "https://www.pexels.com/photo/photo-of-a-woman-getting-her-hair-styled-7440055/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/gallery-03.jpg",
    photographer: "Heber Vazquez",
    pexelsUrl:
      "https://www.pexels.com/photo/portrait-of-a-pretty-brunette-16153366/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/gallery-04.jpg",
    photographer: "cottonbro studio",
    pexelsUrl:
      "https://www.pexels.com/photo/satisfied-woman-with-her-new-hairstyle-3993463/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/gallery-05.jpg",
    photographer: "Alina Skazka",
    pexelsUrl:
      "https://www.pexels.com/photo/bundles-of-natural-colored-hair-14730878/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/gallery-06.jpg",
    photographer: "cottonbro studio",
    pexelsUrl: "https://www.pexels.com/photo/woman-at-the-salon-3993312/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/gallery-07.jpg",
    photographer: "Max Vakhtbovych",
    pexelsUrl:
      "https://www.pexels.com/photo/photo-of-the-interior-of-a-salon-7750098/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
  {
    localPath: "/images/gallery-08.jpg",
    photographer: "Octavian Popa",
    pexelsUrl:
      "https://www.pexels.com/photo/woman-posing-with-her-hair-blowing-in-the-wind-5385584/",
    licenseUrl: pexelsLicenseUrl,
    illustrative: true,
  },
];
