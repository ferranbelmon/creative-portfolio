export type ProjectSection = {
  concept?: string;
  tools?: string;
  credits?: string;
  information?: string;
};

export type GalleryLayout = {
  columns?: 2 | 3 | 4;
  aspectRatio?: "auto" | "portrait" | "square" | "landscape";
};

export type Project = {
  slug: string;
  title: string;
  year: string;
  client: string;
  thumbnail?: string;
  images?: string[];
  externalUrl?: string;
  galleryLayout?: GalleryLayout;
  sections: ProjectSection;
};

export const projects: Project[] = [
  {
    slug: "visuales-para-tayhana",
    title: "Visuales para Tayhana",
    year: "2026",
    client: "Sónar Festival",
    sections: {
      information: "Sónar Festival\nYear - 2026",
    },
  },
  {
    slug: "technical-direction-mwc-congress-hall",
    title: "Technical Direction MWC Congress Hall",
    year: "2026",
    client: "Landscapes",
    sections: {
      information: "Client - Landscapes\nYear - 2026",
    },
  },
  {
    slug: "espurna",
    title: "Espurna",
    year: "2025",
    client: "Turbina (proyecto propio)",
    thumbnail: "/images/projects/espurna/thumbnail.jpg",
    images: [
      "/images/projects/espurna/gallery/01.jpg",
      "/images/projects/espurna/gallery/02.jpg",
      "/images/projects/espurna/gallery/03.jpg",
      "/images/projects/espurna/gallery/04.jpg",
    ],
    sections: {
      concept:
        "Espurna is a site-specific installation that connects with the industrial history of its venue. Located in a small corridor, the installation adapts to and intervenes in the space, transforming an abandoned area into a window to the past of this iconic building. Beyond continuing the exploration of the aesthetics and behavior of frequencies developed in previous works, Espurna also pays tribute to and reconnects with the industrial legacy of Les Tres Xemeneies in Sant Adrià de Besòs.",
      tools:
        "Laser 10W, 40Kpps\n1 x Haze machines\n2 x Strobe Light\n2 x UV Washers\nLED Stripe\nElliptical wood structure",
      credits: "Concept, visuals and sound by Ferran Belmon",
      information: "Presented at:\n\nTurbina, Barcelona 2025",
    },
  },
  {
    slug: "art-direction-sonar-night-vip-corridor",
    title: "Art Direction for Sónar Night VIP Corridor",
    year: "2025",
    client: "Landscapes",
    sections: {
      information: "Client - Landscapes\nYear - 2025",
    },
  },
  {
    slug: "collide",
    title: "Collide",
    year: "2024–2025",
    client: "Bahidorá / Akamba (proyecto propio)",
    thumbnail: "/images/projects/collide/thumbnail.jpg",
    images: [
      "/images/projects/collide/gallery/01.jpg",
      "/images/projects/collide/gallery/02.gif",
      "/images/projects/collide/gallery/03.gif",
    ],
    sections: {
      concept:
        "In line with the previous works, Collide is a audiovisual installation that explores how the interaction between two simple elements can give rise to complex behaviors and emergent systems.\n\nBased on this concept, Collide proposes a generative system that audiovisually explores the different responses arising from the interaction between two elements depending on the characteristics of this interaction.\n\nThrough the modulation of form, color, and movement, multiple responses emerge establishing a dialogue with the audience and the space.",
      tools:
        "Laser 12W\nProjector DLP 13K lumens\n4 Haze machines\nStrobe Light\nFrame Structure",
      credits: "Concept, visuals and sound by Ferran Belmon",
      information:
        "Presented at:\n\nBahidorá, Morelos, Mexico, 2025.\n\nAkamba, Tequila, Mexico, 2024.",
    },
  },
  {
    slug: "ciclic",
    title: "CíCLIC",
    year: "2024–2025",
    client: "Lux / Intervals / Mira (proyecto propio)",
    thumbnail: "/images/projects/ciclic/thumbnail.jpg",
    images: [
      "/images/projects/ciclic/gallery/01.jpg",
      "/images/projects/ciclic/gallery/02.jpg",
      "/images/projects/ciclic/gallery/03.jpg",
      "/images/projects/ciclic/gallery/04.jpg",
      "/images/projects/ciclic/gallery/05.jpg",
      "/images/projects/ciclic/gallery/06.jpg",
      "/images/projects/ciclic/gallery/07.jpg",
    ],
    sections: {
      concept:
        "The idea behind the installation is to reimagine the CICLIC live AV concept as a light sculpture, emphasizing in a distinctive manner how simple waves modulate our perception of our surroundings, altering both the tangible and intangible.\n\nThe concept explores how the interaction of simple frequencies can become complex behaviors, and their ability to transform the space around them.\n\nThe visual research begins with light's particular nature, with a minimalist view through laser light. This narrow monochromatic light beam represents the minimum expression of light, despite its technical complexity: a point and a color.\n\nThe sound emphasizes the same approach by using only pure tones. These synthetic sounds allow us to capture the physical properties of sound and its connection with light and space.\n\nThe sequence and movement of these two elements generates different effects, colors and geometric patterns. Chaos and harmony reflected in space with aesthetic perception and symbolic potential.",
      tools: "2 lasers 10W 40Kpps\nHaze machine\nLED strips\nFrame Structure",
      credits: "Concept, visuals and sound by Ferran Belmon",
      information:
        "Presented at:\n\nLux, Malaga, Spain, 2024.\n\nIntervals Festival, Nizhny Novgorod, Russia, 2024.\n\nMira Festival, Spain, 2025",
    },
  },
  {
    slug: "baddance-with-the-badweeds",
    title: "BADDANCE WITH THE BADWEEDS",
    year: "2024",
    client: "Rocío Berenguer",
    sections: {
      information: "Client - Rocío Berenguer\nYear - 2024",
    },
  },
  {
    slug: "kieli",
    title: "Kieli",
    year: "2024",
    client: "Sónar+D / Espronceda Art and Culture",
    sections: {
      information:
        "Sónar+D / Espronceda Art and Culture\nYear - 2024",
    },
  },
  {
    slug: "cupra-sensorial-capsule",
    title: "Cupra Sensorial Capsule",
    year: "2024",
    client: "Tigrelab",
    sections: {
      information: "Client - Tigrelab\nYear - 2024",
    },
  },
  {
    slug: "ciclic-live-av",
    title: "CíCLIC Live AV",
    year: "2023–2024",
    client: "Espronceda / Volumens / Intervals",
    thumbnail: "/images/projects/ciclic-live-av/thumbnail.jpg",
    images: [
      "/images/projects/ciclic-live-av/gallery/01.jpg",
      "/images/projects/ciclic-live-av/gallery/02.gif",
      "/images/projects/ciclic-live-av/gallery/03.gif",
      "/images/projects/ciclic-live-av/gallery/04.gif",
      "/images/projects/ciclic-live-av/gallery/05.gif",
      "/images/projects/ciclic-live-av/gallery/07.jpg",
      "/images/projects/ciclic-live-av/gallery/08.jpeg",
      "/images/projects/ciclic-live-av/gallery/09.jpg",
      "/images/projects/ciclic-live-av/gallery/10.jpeg",
      "/images/projects/ciclic-live-av/gallery/11.jpeg",
      "/images/projects/ciclic-live-av/gallery/12.jpeg",
    ],
    sections: {
      concept:
        "CICLIC is a generative live audiovisual performance that explores how simple frequencies can interact to create complex behaviors. Through the dialogue between pure tones and laser light, the show becomes an evolving audioreactive experience, a minimal yet powerful expression of how sound and light can transform space.",
      tools:
        "Laser Projector\nLight Fixtures - Led Tubes, Strobo Fixtures\nSound System - 2.1\nAudio Software - Ableton Live\nLight Control - TouchDesigner Custom Software",
      credits:
        "Concept - Ferran Belmon, Joan Sandoval\nSound - Ferran Belmon\nLight Control - Ferran Belmon\nVideo - Catalina Joy",
      information:
        "Theatre in Palm at Espronceda Centre Art&Culture\nBarcelona, Spain, 2023.\n\nVolumens Festival 2023 at La Mutant Valencia\nValencia, Spain, 2023.\n\nIntervals Fest 2024 at La Mutant Valencia\nNizhny Novgorod, Russia, 2024",
    },
  },
  {
    slug: "moonai-soundwaves-wellness",
    title: "Moonai Soundwaves Wellness",
    year: "2023",
    client: "Moonai / Mira Festival (Ideal)",
    thumbnail: "/images/projects/moonai-soundwaves-wellness/thumbnail.jpg",
    images: [
      "/images/projects/moonai-soundwaves-wellness/gallery/01.jpg",
      "/images/projects/moonai-soundwaves-wellness/gallery/02.jpg",
      "/images/projects/moonai-soundwaves-wellness/gallery/03.jpg",
      "/images/projects/moonai-soundwaves-wellness/gallery/04.jpg",
    ],
    sections: {
      concept:
        "Moonai is a sound wellness app designed to relieve menstrual pain and enhance mental clarity through frequencies supported by neuroscience and cognitive-behavioral therapy. The platform fuses immersive digital art, psychedelic therapeutic experiences and functional music, creating a technology with a significant social impact. During the event at IDEAL, we will enjoy a stunning audiovisual live show by the artist and functional music Fernanda Aleman. In this performance, Fernanda will use synthesizers, modular instruments and acoustic elements to enhance the feeling of well-being in the public. The sound will be transmitted through wireless Bluetooth headphones, thus creating an immersive environment that fuses sound, visual and atmospheric landscapes, and that establishes connections between nature, welfare science and audiovisual art.",
      tools: "TouchDesigner Software",
      credits:
        "Concept - Laura June Clarke\nMusic - Fernanda Aleman\nVisuals - Ferran Belmon\nSound - Ivan Ferrigno\nProduction - Catalina Joy",
      information: "Mira Festival, Ideal Centre d'Art Digitals,\n\nBarcelona, 2023",
    },
  },
  {
    slug: "o",
    title: "O",
    year: "2022",
    client: "Mira Festival (concepto Tiler Gab / Landscapes)",
    thumbnail: "/images/projects/o/thumbnail.jpeg",
    images: [
      "/images/projects/o/gallery/01.jpg",
      "/images/projects/o/gallery/02.jpg",
      "/images/projects/o/gallery/03.jpeg",
    ],
    sections: {
      concept:
        "Light installation \"O\" is a laconic designed visual experience.\n\nAn eye-shaped frame that is bathed in a tinted light beam, transforming the space into a dreamlike atmosphere.\n\nThe slow-paced metamorphosis of the space through light, color and sound.",
      tools:
        "Projection - 30K Lumens Projector\nSound System - 2.1\nSound Design Software - Ableton Live\nVisuals - TouchDesigner",
      credits:
        "Concept - Tiler Gab\nDesign - Tiler Gab\nProduction - Landscapes agency\nSound Design - Ferran Bemon\nPhotography - Jean-Marc Joseph",
      information:
        "Venue - Nau Revolució\nLocation - Barcelona\nEvent - Mira Festival\nYear - 2022",
    },
  },
  {
    slug: "mostra-festival-2022",
    title: "Mostra Festival 2022",
    year: "2022",
    client: "Mostra Festival",
    thumbnail: "/images/projects/mostra-festival-2022/thumbnail.jpg",
    images: [
      "/images/projects/mostra-festival-2022/gallery/01.jpg",
      "/images/projects/mostra-festival-2022/gallery/02.jpg",
      "/images/projects/mostra-festival-2022/gallery/03.jpg",
      "/images/projects/mostra-festival-2022/gallery/04.jpg",
    ],
    sections: {
      concept: "Live Visuals.",
      tools:
        "Projection - Projector\nSound System - 2.1\nVisuals - TouchDesigner Software",
      credits: "Visuals - Ferran Belmon",
      information:
        "Mostra Festival, Sala Ricson Hangar\nBarcelona, Spain, 2022",
    },
  },
  {
    slug: "color-conversations",
    title: "Color Conversations",
    year: "2021",
    client: "Llum BCN (concepto Tiler Gab / Landscapes)",
    thumbnail: "/images/projects/color-conversations/thumbnail.jpg",
    images: [
      "/images/projects/color-conversations/gallery/01.jpg",
      "/images/projects/color-conversations/gallery/02.jpg",
      "/images/projects/color-conversations/gallery/03.jpg",
      "/images/projects/color-conversations/gallery/04.jpg",
    ],
    sections: {
      concept:
        "The dialog between light, color, shape and space creates a choreography where each spectator becomes a part of the unconscious dance, following the designed minimalistic pattern. It invites the audience to follow and observe.\n\nThe artwork creates no meanings but perceptions, no explanations but sensations.\n\nRough energy of industrial space confronts the perfect symmetry and simplicity of the piece. Voluminous pulsation of the sound, the heartbeat of the brutalist space, creates tension and strings together both – material and immaterial.",
      tools:
        "Video - LED screen\nSound System - Spatial Audio\nSound - Ableton Live\nVisuals - TouchDesigner",
      credits:
        "Concept - Tiler Gab\nProduction - Landscapes Agency\nSound Design - Ferran Belmon\nPhotography - Jean-Marc Joseph",
      information:
        "Venue - Nau Revolució\nLocation - Barcelona\nEvent - Llum BCN\nYear - 2021",
    },
  },
  {
    slug: "centrifuge-nft",
    title: "Centrifuge NFT",
    year: "2021",
    client: "Centrifuge",
    thumbnail: "/images/projects/centrifuge-nft/thumbnail.jpg",
    images: [
      "/images/projects/centrifuge-nft/gallery/01.jpg",
      "/images/projects/centrifuge-nft/gallery/02.jpg",
      "/images/projects/centrifuge-nft/gallery/03.jpg",
    ],
    sections: {
      concept:
        "Collection of generative artworks created for the Centrifuge NFT platform. This series present a neo-kinetik images exploring the sense of depth and movement that emerges from a simple system of color gradients interacting",
      tools: "Visuals - TouchDesigner",
      credits: "Visuals - Ferran Belmon\nClient - Centrifugue",
      information: "Location - Barcelona\nYear - 2021",
    },
  },
  {
    slug: "planets-mapping-sharjah-light-festival",
    title: "Planets Mapping in Sharjah Light Festival",
    year: "2020",
    client: "Tigrelab",
    sections: {
      information: "Client - Tigrelab\nYear - 2020",
    },
  },
  {
    slug: "wonders",
    title: "Wonders",
    year: "2020",
    client: "Moon Ribas / Felix Schoeller",
    thumbnail: "/images/projects/wonders/thumbnail.jpg",
    images: [
      "/images/projects/wonders/gallery/01.jpg",
    ],
    sections: {
      concept:
        "WONDERS is a journey across natural phenomena beyond human perception aiming to generate primordial aesthetic emotions such as wonder, admiration, awe, and the sublime. Pioneer cyborg artist Moon Ribas is equipped with a system of sensors and actuators allowing her to translate natural events into movement. A system of wearable sensors developed by Felix Schoeller captures Moon Ribas' gestures and transforms them into sounds, which modulate Ferran Belda's interactive visuals projected on the surface of the dome.",
      tools:
        "Projection - Dome System\nSound System - Quadraphonic\nSound - Custom hardware\nVisuals - TouchDesigner",
      credits:
        "Concept - Moon Ribas, Felix Schoeller\nVisuals - Ferran Belmon\nVideo - Felix Schoeller",
      information:
        "Venue - Esprocenda Art&Culture Center\nLocation - Barcelona\nYear - 2020",
    },
  },
  {
    slug: "durham-light-festival",
    title: "Durham Light Festival",
    year: "2019",
    client: "Tigrelab",
    sections: {
      information: "Client - Tigrelab\nYear - 2019",
    },
  },
  {
    slug: "dansa-del-cosmos",
    title: "Dansa del Cosmos",
    year: "2019",
    client: "Marina Colell (Graphitons) / BAU",
    thumbnail: "/images/projects/dansa-del-cosmos/thumbnail.jpg",
    images: [
      "/images/projects/dansa-del-cosmos/gallery/01.jpg",
      "/images/projects/dansa-del-cosmos/gallery/02.jpg",
      "/images/projects/dansa-del-cosmos/gallery/03.jpg",
    ],
    sections: {
      concept:
        "Dance of the cosmos is an interactive audiovisual installation about quantum physics by Marina Colell, Graphitons. It is a poetic and experimental approach to String theory, which states that reality is composed by tiny vibrating strings which produce elementary particles. Combined, they create atoms and molecules, making up all the matter and forces of the universe. Where the strings of an instrument create different sounds when they vibrate, the strings from the theory produce subatomic particles.\n\nIn Dance of the cosmos, seventeen beams of light represent the strings that create each particle. As visitors enter the quantum dimension and dance under the light, their movement activates a sound for each particle, thus originating their own ephemeral cosmos. By touching certain light beams, one can compose the melody of anything that exists, and even invent new realities and multiverses. The song that follows is an interpretation of an oxygen molecule, where each sound represents one of the particles that are necessary to create oxygen molecule.",
      tools:
        "Laser Projector - 3.3W RGB Laser\nSound System - 2.1\nControl - TouchDesigner\nSensors - Arduino",
      credits:
        "Concept - Marina Colell\nDesign - Marina Colell\nArchitecture - Studio Sauras\nCreative Coding - Ferran Bemon, Joan Sandoval\nMusic - Bru Ferri\nChoreography - Elena Tarrats, Marc Vilajuana\nPhotography - Montse Capdevila\nFilmmaking - Montse Capdevila\nText Revision - Sonia Fernández-Vidal\nManagement - Gisela Colell",
      information: "Venue - BAU\nLocation - Barcelona\nYear - 2019",
    },
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getAdjacentProjects(slug: string): {
  prev?: Project;
  next?: Project;
} {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) return {};

  return {
    prev: index > 0 ? projects[index - 1] : undefined,
    next: index < projects.length - 1 ? projects[index + 1] : undefined,
  };
}
