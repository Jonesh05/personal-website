export interface FooterLink {
    readonly label: string;
    readonly href: string;
}

export interface FooterColumn {
    readonly heading: string;
    readonly links: readonly FooterLink[];
}

export interface SocialLink {
    readonly label: string;
    readonly href: string;
    readonly icon: React.FC<{ className?: string }>;
}

export interface FooterBrand {
    readonly name: string;
    readonly logo: string;
    readonly tagline: string;
}

export interface FooterConfig {
    readonly brand: FooterBrand;
    readonly social: readonly SocialLink[];
    readonly columns: readonly FooterColumn[];
    readonly legal: readonly FooterLink[];
}

export type FooterVariant = "default" | "portfolio" | "blog";