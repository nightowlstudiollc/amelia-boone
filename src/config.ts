export const SITE = {
  website: "https://ameliabooneracing.com/",
  author: "Amelia Boone",
  profile: "https://ameliaboone.substack.com",
  desc: "Obstacle racing champion, ultrarunner, and writer. Essays on sport, suffering, and what comes next.",
  title: "Amelia Boone",
  // Empty on purpose: Layout.astro falls back to the Satori-generated
  // /og.png when this is unset. It previously named a file that was
  // never added to public/, so the homepage advertised a 404. Set this
  // only if a hand-designed card is added alongside it. See issue #53.
  ogImage: "",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 20,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true,
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/nightowlstudiollc/amelia-boone/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr",
  lang: "en",
  timezone: "America/Los_Angeles",
} as const;
