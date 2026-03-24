export const footerData = {
    brand: {
        name: "Jhonny Pimiento",
        logo: "✦",
        tagline:
            "Crafting thoughtful digital experiences at the intersection of design, code, and curiosity.",
    },

    social: [
        { label: "GitHub", href: "https://github.com/jonesh05" },
        { label: "X", href: "https://x.com/jonesh5_" },
        { label: "LinkedIn", href: "https://linkedin.com/in/jhonny-pimiento" },
    ],

    columns: [
        {
            heading: "Quick Navigation",
            links: [
                { label: "Work", href: "/work" },
                { label: "Case Studies", href: "/cases" },
                { label: "Open Source", href: "/oss" },
                { label: "Stack", href: "/stack" },
            ],
        },
        {
            heading: "Blog",
            links: [
                { label: "Articles", href: "/blog" },
                { label: "Tutorials", href: "/blog/tutorials" },
                { label: "Notes", href: "/blog/notes" },
                { label: "RSS Feed", href: "/feed.xml" },
            ],
        },
        {
            heading: "Connect",
            links: [
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "Resume", href: "/resume.pdf" },
                { label: "Newsletter", href: "/newsletter" },
            ],
        },
    ],

    legal: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms & Disclaimer", href: "/terms" },
    ],
} as const;