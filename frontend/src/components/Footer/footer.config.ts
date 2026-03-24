import type { FooterConfig } from "@personal-website/shared/types/footer.types";
import { footerData } from "@/data/footer";
import { GitHubIcon, XIcon, LinkedInIcon } from "./footer.icons";

const iconMap = {
    GitHub: GitHubIcon,
    X: XIcon,
    LinkedIn: LinkedInIcon,
} as const;

type SocialEntry = (typeof footerData.social)[number];

export const footerConfig: FooterConfig = {
    ...footerData,
    social: footerData.social.map((s: SocialEntry) => ({
        ...s,
        icon: iconMap[s.label as keyof typeof iconMap],
    })),
};