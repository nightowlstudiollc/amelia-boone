import type { Props } from "astro";
import IconMail from "@/assets/icons/IconMail.svg";
import IconRss from "@/assets/icons/IconRss.svg";
import IconInstagram from "@/assets/icons/IconInstagram.svg";
import { SITE } from "@/config";

interface Social {
  name: string;
  href: string;
  linkTitle: string;
  icon: (_props: Props) => Element;
}

export const SOCIALS: Social[] = [
  {
    name: "Substack",
    href: "https://ameliaboone.substack.com",
    linkTitle: `${SITE.title} on Substack`,
    icon: IconRss,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/arboone11",
    linkTitle: `${SITE.title} on Instagram`,
    icon: IconInstagram,
  },
] as const;

export const SHARE_LINKS: Social[] = [
  {
    name: "X",
    href: "https://x.com/intent/post?url=",
    linkTitle: `Share this post on X`,
    icon: IconBrandX,
  },
  {
    name: "Mail",
    href: "mailto:?subject=See%20this%20post&body=",
    linkTitle: `Share this post via email`,
    icon: IconMail,
  },
] as const;
