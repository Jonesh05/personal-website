/**
 * Footer data — source of truth for every link that appears in the site footer.
 *
 * Rules we follow here:
 *   1. Every internal href in this file MUST resolve to a real route inside
 *      `src/app`. We don't link to placeholder pages because broken links
 *      erode trust and hurt SEO.
 *   2. External links live at their canonical URLs with https:// and no
 *      trailing slash.
 *   3. Contact uses the on-page anchor (`/#contact`) so visitors jump
 *      directly to the form without a full navigation.
 */

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
