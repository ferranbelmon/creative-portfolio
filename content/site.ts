export const site = {
  name: "Ferran Belmon",
  title: "New Media Artist | Creative Coder",
  /** Canonical production origin (used for metadataBase / Open Graph). */
  url: "https://creative-portfolio-chi-five.vercel.app",
  location: "Barcelona - 2025",
  logo: "/images/site/logo.png",
  email: "ferran.belmon@gmail.com",
  bio: [
    "Ferran Belmon is an audiovisual artist, engineer and creative programmer from Barcelona.",
    "Throughout his career he has participated in festivals such as Mostra Festival (Barcelona), Volumens (Valencia), Mira Festival (Barcelona), Lux (Málaga), Intervals Fest (Nizhny Novgorod) and Sonar +D (Barcelona), Boiler Room Primavera Sound (Barcelona) and Bahidorá Festival (Morelos) presenting personal projects or collaborations in various formats.",
    "Through his work, he explores the intersection between space, light and sound, and how this interaction influences our perception. His creations encompass immersive experiences, installations and audiovisual performances in real time.",
    "Always immersed in experimentation, he uses multiple technologies with the aim of giving life to unique and innovative experiences.",
    "If you're interested in collaborating on future projects, feel free to contact.",
  ],
  social: {
    instagram: "https://www.instagram.com/stupe777",
    linkedin: "https://www.linkedin.com/in/ferran-belda-montes-23a22b123",
  },
} as const;

export type Site = typeof site;
