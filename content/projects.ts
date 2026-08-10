export type ProjectSection = {
  role?: string;
  concept?: string;
  tools?: string;
  credits?: string;
  information?: string;
};

export type GalleryLayout = {
  columns?: 1 | 2 | 3 | 4;
  aspectRatio?: "auto" | "portrait" | "square" | "landscape";
};

export const projectCategories = [
  "practica-artistica",
  "estudio-encargos",
  "colaboraciones",
] as const;

export type ProjectCategory = (typeof projectCategories)[number];

export const projectCategoryLabels: Record<ProjectCategory, string> = {
  "practica-artistica": "Personal projects",
  "estudio-encargos": "Comissions and studios",
  colaboraciones: "Colaborations",
};

/** Reserved for upcoming typology filters (Mapping, Instalación, etc.). */
export type ProjectTypology =
  | "mapping"
  | "instalacion"
  | "live-av"
  | "direccion-artistica"
  | "direccion-tecnica"
  | "nft"
  | "otros";

export type Project = {
  id: string;
  slug: string;
  title: string;
  year: string;
  client?: string;
  event?: string;
  category: ProjectCategory;
  typologies?: ProjectTypology[];
  thumbnail?: string;
  images?: string[];
  externalUrl?: string;
  galleryLayout?: GalleryLayout;
  sections: ProjectSection;
};

export const projects: Project[] = [
  {
    id: "020",
    slug: "torre-glories-content",
    title: "Torre Glories Content",
    year: "2026",
    client: "Protopixel",
    event: "Torre Glòries",
    category: "estudio-encargos",
    images: [
      "/images/projects/020-torre-glories-content/gallery/torreglories_visita_papa.mp4",
    ],
    sections: {
      role: "Content",
      information: "Client - Protopixel\nYear - 2026",
    },
  },
  {
    id: "021",
    slug: "visuales-para-tayhana",
    title: "Tayhana DJset",
    year: "2026",
    client: "Tayhana",
    event: "Sónar Festival",
    category: "colaboraciones",
    sections: {
      role: "Visuals",
      information: "Client - Tayhana\nEvent - Sónar Festival\nYear - 2026",
    },
  },
  {
    id: "019",
    slug: "technical-direction-mwc-congress-hall",
    title: "Landscapes at MWC 2026",
    year: "2026",
    client: "Landscapes",
    event: "Mobile World Congress 2026",
    category: "estudio-encargos",
    externalUrl: "https://landscapes.digital/en/work/landscapes-en-mwc-2026/",
    sections: {
      role: "Artistic content for immersive fog screen",
      concept:
        "Immersive installations for industry, health and research at Mobile World Congress 2026.\n\nAt Mobile World Congress 2026, Landscapes developed and produced a range of interactive installations showcasing innovation across healthcare, food production, industry and scientific research. Through immersive environments and hands-on experiences, visitors were invited to engage with emerging technologies in a direct and accessible way.\n\nThe project included a variety of bespoke installations, from an immersive fog screen featuring artistic content by Ferran Belmon to interactive experiences exploring therapeutic nanobots, artificial intelligence, sustainable agriculture and advanced manufacturing systems. Each proposal translated complex technological processes into intuitive and engaging narratives.",
      tools:
        "Immersive fog screen\nInteractive systems\nExhibition structures\nCustom supports & screens\nSpatial integration",
      credits:
        "Agency - Landscapes\nArtistic content (fog screen) - Ferran Belmon\nTechnical development, physical production & spatial integration - Landscapes",
      information:
        "Client - Landscapes\nEvent - Mobile World Congress 2026\nType - Events / Immersive / Interactive installations\nYear - 2026\nProject page - https://landscapes.digital/en/work/landscapes-en-mwc-2026/",
    },
  },
  {
    id: "016",
    slug: "espurna",
    title: "Espurna",
    year: "2025",
    event: "Turbina by Mira Festival",
    category: "practica-artistica",
    thumbnail: "/images/projects/016-espurna/thumbnail.jpg",
    images: [
      "/images/projects/016-espurna/gallery/01.jpg",
      "/images/projects/016-espurna/gallery/02.jpg",
      "/images/projects/016-espurna/gallery/03.jpg",
      "/images/projects/016-espurna/gallery/04.jpg",
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
    id: "017",
    slug: "light-tunnel-sonar-by-night",
    title: "Light Tunnel at Sónar by Night",
    year: "2025",
    client: "Landscapes",
    event: "Sónar by Night",
    category: "estudio-encargos",
    thumbnail: "/images/projects/017-light-tunnel-sonar-by-night/thumbnail.jpg",
    images: [
      "/images/projects/017-light-tunnel-sonar-by-night/gallery/01.jpg",
      "/images/projects/017-light-tunnel-sonar-by-night/gallery/02.jpg",
      "/images/projects/017-light-tunnel-sonar-by-night/gallery/03.jpg",
      "/images/projects/017-light-tunnel-sonar-by-night/gallery/04.jpg",
      "/images/projects/017-light-tunnel-sonar-by-night/gallery/05.jpg",
      "/images/projects/017-light-tunnel-sonar-by-night/gallery/06.jpg",
      "/images/projects/017-light-tunnel-sonar-by-night/gallery/07.jpg",
    ],
    externalUrl: "https://landscapes.digital/en/work/lasers-at-sonar-festival/",
    sections: {
      role: "Lasers, lighting",
      concept:
        "A hypnotic light tunnel at Sónar by Night.\n\nLandscapes transformed the space with laser installations, blending light, silence, and emotion to create an immersive and contemplative passage. Indoor laser installations reshape how people perceive space through light, silence, and emotion. At Sónar by Night, a key passage at Fira Gran Via 2 became a contemplative corridor of light and mist. Thousands of visitors walked through, many pausing to disconnect from noise and simply observe — a test of spatial storytelling through laser technology for festivals, institutions, and brands.",
      tools: "Lasers\nLighting\nSpatial design\nAtmospheric haze",
      credits: "Agency - Landscapes\nEvent - Sónar by Night\nPhotography - Leafhopper",
      information:
        "Client - Landscapes\nEvent - Sónar by Night 2025\nVenue - Fira Gran Via 2, Barcelona\nType - Events / Immersive\nYear - 2025\nProject page - https://landscapes.digital/en/work/lasers-at-sonar-festival/",
    },
  },
  {
    id: "015",
    slug: "collide",
    title: "Collide",
    year: "2025",
    event: "Bahidorá Festival",
    category: "practica-artistica",
    thumbnail: "/images/projects/015-collide/thumbnail.jpg",
    images: [
      "/images/projects/015-collide/gallery/01.jpg",
      "/images/projects/015-collide/gallery/02.gif",
      "/images/projects/015-collide/gallery/03.gif",
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
    id: "013",
    slug: "ciclic",
    title: "CíCLIC",
    year: "2024–2025",
    event: "Intervals Fest",
    category: "practica-artistica",
    thumbnail: "/images/projects/013-ciclic/thumbnail.jpg",
    images: [
      "/images/projects/013-ciclic/gallery/01.jpg",
      "/images/projects/013-ciclic/gallery/02.jpg",
      "/images/projects/013-ciclic/gallery/03.jpg",
      "/images/projects/013-ciclic/gallery/04.jpg",
      "/images/projects/013-ciclic/gallery/05.jpg",
      "/images/projects/013-ciclic/gallery/06.jpg",
      "/images/projects/013-ciclic/gallery/07.jpg",
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
    id: "014",
    slug: "baddance-with-the-badweeds",
    title: "BADDANCE WITH THE BADWEEDS",
    year: "2025",
    client: "Rocío Berenguer",
    event: "MUDAC Solar Biennale 2",
    category: "colaboraciones",
    thumbnail: "/images/projects/014-baddance-with-the-badweeds/gallery/08.jpg",
    images: [
      "/images/projects/014-baddance-with-the-badweeds/gallery/01.jpg",
      "/images/projects/014-baddance-with-the-badweeds/gallery/07.jpg",
      "/images/projects/014-baddance-with-the-badweeds/gallery/08.jpg",
      "/images/projects/014-baddance-with-the-badweeds/gallery/09.jpg",
      "/images/projects/014-baddance-with-the-badweeds/gallery/10.jpg",
    ],
    externalUrl: "https://badweeds.live/",
    sections: {
      role: "Game design on Unreal Engine",
      concept:
        "MAKE YOUR MUTANT BODY BADDANCE AND EARN SEEDS OF FUTURES.\n\nWith this participatory installation, visitors are invited to mutate, to join THEBADWEEDS — a trans-species music group that is part-human, part-plant. Its hybrid members embody a queer ecological transition: they grow from oblivion, cracks, and the most inhospitable places, humorously demonstrating the resilience and resistance of weeds.\n\nThe immersive experience invites the audience to transform and mutate through dance, offering a festive and playful perspective on ecological transition. The installation offers a three-part journey: discovering the universe of THEBADWEEDS through a video; dancing to mutate as a new plant body forms; and finding one's new mutant body.\n\nA project by Rocio Berenguer commissioned by mudac for Soleil.s / Solar Biennale 2.",
      tools: "Unreal Engine\nMotion detection\nInteractive installation",
      credits:
        "Original work - Rocio Berenguer\nGame design on Unreal Engine - Ferran Belda\nWeb design - Pere Calopa Piedra\n3D motion design - Guillaume Gravier\nMotion detection analysis - Leo Chedin\nMusic - HERBICIDE by Killason; EATTHESUN and TAKOMAK by Baptiste Malgoire, written by Rocio Berenguer",
      information:
        "Client - Rocío Berenguer / mudac\nType - Participatory installation\nDuration - 5 minutes\nPresented at - Soleil.s, Solar Biennale 2, mudac, Lausanne, 2025\nAlso - Milano Design Week 2025; Malta Biennale 2026\nProject site - https://badweeds.live/",
    },
  },
  {
    id: "011",
    slug: "kieli",
    title: "Kieli",
    year: "2024",
    event: "Sónar +D",
    category: "colaboraciones",
    sections: {
      role: "Collaboration",
      information:
        "Sónar+D / Espronceda Art and Culture\nYear - 2024",
    },
  },
  {
    id: "010",
    slug: "cupra-sensorial-capsule",
    title: "Cupra Sensorial Capsule",
    year: "2024",
    client: "Tigrelab",
    event: "Milan Design Week 2024",
    category: "estudio-encargos",
    thumbnail: "/images/projects/010-cupra-sensorial-capsule/thumbnail.jpg",
    images: [
      "/images/projects/010-cupra-sensorial-capsule/gallery/01.jpg",
      "/images/projects/010-cupra-sensorial-capsule/gallery/02.jpg",
      "/images/projects/010-cupra-sensorial-capsule/gallery/03.jpg",
      "/images/projects/010-cupra-sensorial-capsule/gallery/04.jpg",
      "/images/projects/010-cupra-sensorial-capsule/gallery/05.jpg",
      "/images/projects/010-cupra-sensorial-capsule/gallery/06.jpg",
      "/images/projects/010-cupra-sensorial-capsule/gallery/07.jpg",
      "/images/projects/010-cupra-sensorial-capsule/gallery/08.jpg",
    ],
    externalUrl: "https://tigrelab.com/project/cupra-sensorial-capsule/",
    sections: {
      role: "Creative Coder",
      concept:
        "A full-scale immersive capsule that reimagines the car interior as a living, reactive space — presented with CUPRA at Milan Design Week 2024.\n\nCommissioned by CUPRA through Tigrelab, the CUPRA Sensorial Capsule invited visitors in Piazza XXV Aprile to step inside a futuristic concept where space, emotion, and technology converge. Built over the course of a year with the CUPRA design team, the interior reacts in real time to movement, presence, and emotion: light pulses, surfaces breathe, and sound evolves into a fluid dialogue between human and machine.\n\nThe narrative unfolds in four acts — Welcome, an immersive reveal of materials and structure through light trails and mapped projection, Ride (sound, lighting, and Boost Mode), and Meta, an adaptive AI-driven space where the car becomes an evolving companion.",
      tools:
        "Light\nCreative Code\nReal-Time Graphics\nProjection Mapping",
      credits:
        "Client - CUPRA\nAgency - Tigrelab\nCreative Directors - Federico Gonzalez, Mathieu Felix, Javier Pinto\nCreative Coders - Daniel Guillen, Ferran Belda\nNotch & Smode Artist - Antonio Nieto\nSound Design - Jhon Christian Cardenas\nProject Manager - Laura Gómez\nEvent Agency - Dicom Events\nPrototype & Engineering - ÚNIC Works\nProjection & Technical Setup - Custom Projects Vioso GmbH",
      information:
        "Industry - Automobile\nType - Event / Immersive / Installation / Projection Mapping\nPresented at - Milan Design Week 2024, Piazza XXV Aprile\nYear - 2024\nProject page - https://tigrelab.com/project/cupra-sensorial-capsule/",
    },
  },
  {
    id: "018",
    slug: "visuals-for-aitana",
    title: "Aitana Metamorfosis Season",
    year: "May 2025",
    client: "Vampire",
    event: "Metamorfosis Season",
    category: "estudio-encargos",
    thumbnail: "/images/projects/018-visuals-for-aitana/thumbnail.jpg",
    images: [
      "/images/projects/018-visuals-for-aitana/gallery/01.jpg",
      "/images/projects/018-visuals-for-aitana/gallery/02.jpg",
      "/images/projects/018-visuals-for-aitana/gallery/03.jpg",
      "/images/projects/018-visuals-for-aitana/gallery/04.jpg",
      "/images/projects/018-visuals-for-aitana/gallery/05.jpg",
      "/images/projects/018-visuals-for-aitana/gallery/06.mp4",
      "/images/projects/018-visuals-for-aitana/gallery/07.mp4",
      "/images/projects/018-visuals-for-aitana/gallery/08.jpg",
    ],
    galleryLayout: {
      columns: 1,
      aspectRatio: "auto",
    },
    sections: {
      role: "Visual content production for two songs of the concert",
      information: "Client - Vampire\nYear - May 2025",
    },
  },
  {
    id: "012",
    slug: "visuals-for-boiler-room-primavera-sound-2024",
    title: "Boiler Room x Primavera Sound",
    year: "2024",
    client: "Vampire",
    event: "Boiler Room at Primavera Sound",
    category: "estudio-encargos",
    thumbnail: "/images/projects/012-visuals-for-boiler-room-primavera-sound-2024/thumbnail.jpg",
    images: [
      "/images/projects/012-visuals-for-boiler-room-primavera-sound-2024/gallery/01.jpg",
      "/images/projects/012-visuals-for-boiler-room-primavera-sound-2024/gallery/02.jpg",
      "/images/projects/012-visuals-for-boiler-room-primavera-sound-2024/gallery/03.jpg",
      "/images/projects/012-visuals-for-boiler-room-primavera-sound-2024/gallery/05.jpg",
      "/images/projects/012-visuals-for-boiler-room-primavera-sound-2024/gallery/09.mp4",
      "/images/projects/012-visuals-for-boiler-room-primavera-sound-2024/gallery/10.mp4",
      "/images/projects/012-visuals-for-boiler-room-primavera-sound-2024/gallery/11.mp4",
    ],
    sections: {
      role: "Visuals",
      information:
        "Client - Vampire\nEvent - Boiler Room x CUPRA at Primavera Sound\nLocation - Barcelona, Spain\nYear - 2024",
    },
  },
  {
    id: "009",
    slug: "ciclic-live-av",
    title: "CíCLIC Live AV",
    year: "2023–2024",
    client: "Ferran Belmon",
    event: "Volumens Festival",
    category: "practica-artistica",
    thumbnail: "/images/projects/009-ciclic-live-av/thumbnail.jpg",
    images: [
      "/images/projects/009-ciclic-live-av/gallery/01.jpg",
      "/images/projects/009-ciclic-live-av/gallery/02.gif",
      "/images/projects/009-ciclic-live-av/gallery/03.gif",
      "/images/projects/009-ciclic-live-av/gallery/04.gif",
      "/images/projects/009-ciclic-live-av/gallery/05.gif",
      "/images/projects/009-ciclic-live-av/gallery/07.jpg",
      "/images/projects/009-ciclic-live-av/gallery/08.jpeg",
      "/images/projects/009-ciclic-live-av/gallery/09.jpg",
      "/images/projects/009-ciclic-live-av/gallery/10.jpeg",
      "/images/projects/009-ciclic-live-av/gallery/11.jpeg",
      "/images/projects/009-ciclic-live-av/gallery/12.jpeg",
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
    id: "008",
    slug: "moonai-soundwaves-wellness",
    title: "Moonai Soundwaves Wellness",
    year: "2023",
    client: "Moonai",
    event: "Mira Festival",
    category: "colaboraciones",
    thumbnail: "/images/projects/008-moonai-soundwaves-wellness/thumbnail.jpg",
    images: [
      "/images/projects/008-moonai-soundwaves-wellness/gallery/01.jpg",
      "/images/projects/008-moonai-soundwaves-wellness/gallery/02.jpg",
      "/images/projects/008-moonai-soundwaves-wellness/gallery/03.jpg",
      "/images/projects/008-moonai-soundwaves-wellness/gallery/04.jpg",
    ],
    sections: {
      role: "Visuals",
      concept:
        "Moonai is a sound wellness app designed to relieve menstrual pain and enhance mental clarity through frequencies supported by neuroscience and cognitive-behavioral therapy. The platform fuses immersive digital art, psychedelic therapeutic experiences and functional music, creating a technology with a significant social impact. During the event at IDEAL, we will enjoy a stunning audiovisual live show by the artist and functional music Fernanda Aleman. In this performance, Fernanda will use synthesizers, modular instruments and acoustic elements to enhance the feeling of well-being in the public. The sound will be transmitted through wireless Bluetooth headphones, thus creating an immersive environment that fuses sound, visual and atmospheric landscapes, and that establishes connections between nature, welfare science and audiovisual art.",
      tools: "TouchDesigner Software",
      credits:
        "Concept - Laura June Clarke\nMusic - Fernanda Aleman\nVisuals - Ferran Belmon\nSound - Ivan Ferrigno\nProduction - Catalina Joy",
      information: "Mira Festival, Ideal Centre d'Art Digitals,\n\nBarcelona, 2023",
    },
  },
  {
    id: "007",
    slug: "o",
    title: "O",
    year: "2022",
    client: "Landscapes",
    event: "Mira Festival",
    category: "colaboraciones",
    thumbnail: "/images/projects/007-o/thumbnail.jpeg",
    images: [
      "/images/projects/007-o/gallery/01.jpg",
      "/images/projects/007-o/gallery/02.jpg",
      "/images/projects/007-o/gallery/03.jpeg",
    ],
    sections: {
      role: "Sound Design",
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
    id: "006",
    slug: "mostra-festival-2022",
    title: "Mostra Festival 2022",
    year: "2022",
    client: "Mostra Festival",
    event: "Mostra Festival 2022",
    category: "estudio-encargos",
    thumbnail: "/images/projects/006-mostra-festival-2022/thumbnail.jpg",
    images: [
      "/images/projects/006-mostra-festival-2022/gallery/01.jpg",
      "/images/projects/006-mostra-festival-2022/gallery/02.jpg",
      "/images/projects/006-mostra-festival-2022/gallery/03.jpg",
      "/images/projects/006-mostra-festival-2022/gallery/04.jpg",
    ],
    sections: {
      role: "Visuals",
      concept: "Live Visuals.",
      tools:
        "Projection - Projector\nSound System - 2.1\nVisuals - TouchDesigner Software",
      credits: "Visuals - Ferran Belmon",
      information:
        "Mostra Festival, Sala Ricson Hangar\nBarcelona, Spain, 2022",
    },
  },
  {
    id: "005",
    slug: "color-conversations",
    title: "Color Conversations",
    year: "2021",
    client: "Landscapes",
    event: "Llum BCN",
    category: "colaboraciones",
    thumbnail: "/images/projects/005-color-conversations/thumbnail.jpg",
    images: [
      "/images/projects/005-color-conversations/gallery/01.jpg",
      "/images/projects/005-color-conversations/gallery/02.jpg",
      "/images/projects/005-color-conversations/gallery/03.jpg",
      "/images/projects/005-color-conversations/gallery/04.jpg",
      "/images/projects/005-color-conversations/gallery/05.jpg",
      "/images/projects/005-color-conversations/gallery/06.jpg",
      "/images/projects/005-color-conversations/gallery/07.jpg",
      "/images/projects/005-color-conversations/gallery/08.jpg",
      "/images/projects/005-color-conversations/gallery/09.jpg",
      "/images/projects/005-color-conversations/gallery/10.jpg",
      "/images/projects/005-color-conversations/gallery/11.jpg",
    ],
    sections: {
      role: "Sound Design",
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
    id: "004",
    slug: "centrifuge-nft",
    title: "Centrifuge NFT",
    year: "2021",
    client: "Centrifuge",
    category: "estudio-encargos",
    thumbnail: "/images/projects/004-centrifuge-nft/thumbnail.jpg",
    images: [
      "/images/projects/004-centrifuge-nft/gallery/01.jpg",
      "/images/projects/004-centrifuge-nft/gallery/02.jpg",
      "/images/projects/004-centrifuge-nft/gallery/03.jpg",
      "/images/projects/004-centrifuge-nft/gallery/04.jpg",
    ],
    sections: {
      role: "Visuals",
      concept:
        "Collection of generative artworks created for the Centrifuge NFT platform. This series present a neo-kinetik images exploring the sense of depth and movement that emerges from a simple system of color gradients interacting",
      tools: "Visuals - TouchDesigner",
      credits: "Visuals - Ferran Belmon\nClient - Centrifugue",
      information: "Location - Barcelona\nYear - 2021",
    },
  },
  {
    id: "002",
    slug: "planets-mapping-sharjah-light-festival",
    title: "Planets Mapping",
    year: "2020",
    client: "Tigrelab",
    event: "Sharjah Light Festival",
    category: "estudio-encargos",
    thumbnail: "/images/projects/002-planets-mapping-sharjah-light-festival/thumbnail.jpg",
    images: [
      "/images/projects/002-planets-mapping-sharjah-light-festival/gallery/01.jpg",
      "/images/projects/002-planets-mapping-sharjah-light-festival/gallery/02.jpg",
      "/images/projects/002-planets-mapping-sharjah-light-festival/gallery/03.jpg",
      "/images/projects/002-planets-mapping-sharjah-light-festival/gallery/04.jpg",
      "/images/projects/002-planets-mapping-sharjah-light-festival/gallery/05.jpg",
      "/images/projects/002-planets-mapping-sharjah-light-festival/gallery/06.jpg",
      "/images/projects/002-planets-mapping-sharjah-light-festival/gallery/07.jpg",
      "/images/projects/002-planets-mapping-sharjah-light-festival/gallery/08.jpg",
      "/images/projects/002-planets-mapping-sharjah-light-festival/gallery/09.jpg",
      "/images/projects/002-planets-mapping-sharjah-light-festival/gallery/10.jpg",
    ],
    externalUrl: "https://tigrelab.com/project/planets/",
    sections: {
      role: "Creative Coder",
      concept:
        "Embark on an interactive journey of Planets at Sharjah Light Festival with an augmented reality installation.\n\nInvited by Nomada for the 10th Sharjah Light Festival 2020, Planets was presented at University City Hall as a combination of video mapping and AR. Visitors stretched the boundaries of the building beyond its walls, interacting with planets and modifying the characteristics of the show, while the rest of the public enjoyed the uninterrupted augmented experience through a mobile app.",
      tools:
        "Creative Code\nReal-Time Graphics\nNotch\nAbleton\nLeap Motion\nFirebase\nAR mobile app (Android & iOS)\nProjection Mapping",
      credits:
        "Client - Nomada / Sharjah Light Festival\nAgency - Tigrelab\nCreative Direction - Federico Gonzalez, Mathieu Felix, Javier Pinto\nNotch Designer - Dan Garotte, Daniel Guillén, Filip Roca\nProducer - Vanesa Palmeri\nCreative Coder - Ferran Belda, Daniel Guillén\nApp Designer - Daniel Guillén\nAR Developer - Nacho Cosio",
      information:
        "Industry - Arts & Culture\nType - Immersive / Interactive / Installation / Projection Mapping\nFestival - Sharjah Light Festival 2020\nVenue - University City Hall\nYear - 2020\nProject page - https://tigrelab.com/project/planets/",
    },
  },
  {
    id: "003",
    slug: "wonders",
    title: "Wonders",
    year: "2020",
    event: "Inmesiva Residence",
    category: "practica-artistica",
    thumbnail: "/images/projects/003-wonders/thumbnail.jpg",
    images: [
      "/images/projects/003-wonders/gallery/01.jpg",
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
    id: "001",
    slug: "durham-light-festival",
    title: "Stones",
    year: "2019",
    client: "Tigrelab",
    event: "Durham Lumiere",
    category: "estudio-encargos",
    thumbnail: "/images/projects/001-durham-light-festival/thumbnail.jpg",
    images: [
      "/images/projects/001-durham-light-festival/gallery/01.jpg",
      "/images/projects/001-durham-light-festival/gallery/02.jpg",
      "/images/projects/001-durham-light-festival/gallery/03.jpg",
      "/images/projects/001-durham-light-festival/gallery/04.jpg",
      "/images/projects/001-durham-light-festival/gallery/05.jpg",
      "/images/projects/001-durham-light-festival/gallery/06.jpg",
      "/images/projects/001-durham-light-festival/gallery/07.jpg",
      "/images/projects/001-durham-light-festival/gallery/08.jpg",
      "/images/projects/001-durham-light-festival/gallery/09.mp4",
    ],
    externalUrl: "https://tigrelab.com/project/stones/",
    sections: {
      role: "Creative Coder",
      concept:
        "Transforming Durham Cathedral into a contemplative canvas through collaborative interaction with stones.\n\nCommissioned via Artichoke for Durham Lumiere Festival 2019, Stones is an interactive artwork where people generate and control light and sound on the cathedral facade by touching stones. As stones are the main material of the building, visitors feel they are interacting with a part of it — the warm touch of a natural element softens the technology and focuses attention on the experience and the dialogue with the canvas.",
      tools:
        "Notch VFX\nD3 Media Server\nArduino UNO\nRaspberry Pi 3B\nAdafruit Capacitive Sensor\nCreative Code\nReal-Time Graphics\nSet Design",
      credits:
        "Client - Artichoke / Durham Lumiere\nAgency - Tigrelab\nCreative Direction - Federico Gonzalez, Mathieu Felix, Javier Pinto\nNotch Designer - Dan Garote, Antonio Nieto\nProducer - Camila Araujo Vasquez\nCreative Coder - Ferran Belda\nGraphic Design - Daniel Guillén\n3D Modeler - Gerard Foix\nEdit - WeLoveMarta\nSound Design - Mathieu Bosi",
      information:
        "Industry - Arts & Culture\nType - Immersive / Interactive / Installation / Projection Mapping\nFestival - Durham Lumiere 2019\nVenue - Durham Cathedral\nYear - 2019\nProject page - https://tigrelab.com/project/stones/",
    },
  },
  {
    id: "000",
    slug: "dansa-del-cosmos",
    title: "Dansa del Cosmos",
    year: "2019",
    client: "Marina Colell (Graphitons)",
    event: "BAU",
    category: "colaboraciones",
    thumbnail: "/images/projects/000-dansa-del-cosmos/thumbnail.jpg",
    images: [
      "/images/projects/000-dansa-del-cosmos/gallery/01.jpg",
      "/images/projects/000-dansa-del-cosmos/gallery/02.jpg",
      "/images/projects/000-dansa-del-cosmos/gallery/03.jpg",
    ],
    sections: {
      role: "Creative Coding",
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
