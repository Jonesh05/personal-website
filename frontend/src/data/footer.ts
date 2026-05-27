export const footerData = {
    brand: {
        name: "Jhonny Pimiento",
        logo: "✦",
        tagline:
            "Crafting thoughtful digital experiences at the intersection of design, code, and curiosity.",
    },

    social: [
        { label: "GitHub",   href: "https://github.com/jonesh05" },
        { label: "X",        href: "https://x.com/jonesh5_" },
        { label: "LinkedIn", href: "https://linkedin.com/in/jhonny-pimiento" },
    ],

    columns: [
        {
            heading: "Explore",
            links: [
                { label: "Work",    href: "/work" },
                { label: "About",   href: "/about" },
                { label: "Contact", href: "/#contact" },
            ],
        },
        {
            heading: "Blog",
            links: [
                { label: "Articles", href: "/blog" },
                { label: "RSS Feed", href: "/feed.xml" },
            ],
        },
        {
            heading: "Connect",
            links: [
                { label: "GitHub",   href: "https://github.com/jonesh05" },
                { label: "LinkedIn", href: "https://linkedin.com/in/jhonny-pimiento" },
                { label: "X",        href: "https://x.com/jonesh5_" },
            ],
        },
    ],

    legal: [
        { label: "Privacy",    href: "/privacy" },
        { label: "Terms",      href: "/terms" },
        { label: "Disclaimer", href: "/disclaimer" },
    ],
} as const;
