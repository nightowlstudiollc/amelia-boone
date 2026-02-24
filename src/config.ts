export const SITE = {
  website: "https://amelia-boone-archive.netlify.app/",
  author: "Amelia Boone",
  profile: "https://ameliaboone.substack.com",
  desc: "Obstacle racing champion, ultrarunner, and writer. Essays on sport, suffering, and what comes next.",
  title: "Amelia Boone",
  ogImage: "og-amelia.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 10,
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
