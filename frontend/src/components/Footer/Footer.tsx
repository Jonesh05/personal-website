
import Link from "next/link";
import type { FooterColumn, FooterConfig, FooterLink, FooterVariant, SocialLink } from "@personal-website/shared/types/footer.types";
import { footerConfig } from "./footer.config";

// Helpers

/**
 * Returns the current year server-side.
 * Because this runs in a RSC, it re-evaluates on every request in dev
 * and is baked in at build time for static pages — either way always correct.
 */
function getCopyrightYear(): number {
    return new Date().getFullYear();
}

function isExternalHref(href: string): boolean {
    return href.startsWith("http") || href.endsWith(".xml") || href.endsWith(".pdf");
}

/**
 * Reorders footer columns based on the active page variant.
 * Portfolio pages lead with Portfolio, blog pages lead with Blog.
 */
function orderColumns(
    columns: FooterConfig["columns"],
    variant: FooterVariant,
): FooterConfig["columns"] {
    const [quickNavigation, blog, connect] = columns;
    const order: Record<FooterVariant, FooterConfig["columns"]> = {
        default: [quickNavigation, blog, connect],
        portfolio: [quickNavigation, connect, blog],
        blog: [blog, quickNavigation, connect],
    };
    return order[variant];
}


function AmbientOrbs() {
    return (
        <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden="true"
        >
            {/* teal — top center */}
            <div className="absolute -top-16 left-[43%] size-72 rounded-full bg-[radial-gradient(ellipse,rgba(56,189,168,0.22)_0%,transparent_70%)] blur-[36px]" />
            {/* purple-pink — top right */}
            <div className="absolute -top-8 right-[8%] size-60 rounded-full bg-[radial-gradient(ellipse,rgba(185,90,215,0.18)_0%,transparent_70%)] blur-[44px]" />
            {/* amber — mid right */}
            <div className="absolute top-[35%] right-[16%] h-44 w-64 rounded-full bg-[radial-gradient(ellipse,rgba(220,150,60,0.15)_0%,transparent_70%)] blur-[38px]" />
            {/* soft blue — bottom left */}
            <div className="absolute bottom-[8%] left-[27%] h-36 w-52 rounded-full bg-[radial-gradient(ellipse,rgba(80,120,220,0.13)_0%,transparent_70%)] blur-[32px]" />
        </div>
    );
}


function Divider() {
    return (
        <div className="my-8 h-px w-full bg-linear-to-r from-transparent via-white/10 to-transparent" />
    );
}



function ColumnHeading({ children }: { children: React.ReactNode }) {
    return (
        <span className="mb-1 font-mono text-[0.67rem] font-medium uppercase tracking-[0.13em] text-white/25">
            {children}
        </span>
    );
}


function NavLink({ label, href }: FooterLink) {
    const sharedClasses =
        "inline-block text-[0.83rem] font-light leading-relaxed tracking-wide text-white/44 transition-all duration-150 ease-out hover:translate-x-1 hover:text-white/88";

    return isExternalHref(href) ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={sharedClasses}>
            {label}
        </a>
    ) : (
        <Link href={href} className={sharedClasses}>
            {label}
        </Link>
    );
}


function SocialButton({ label, href, icon: Icon }: SocialLink) {
    return (
        <a
            href={href}
            aria-label={label}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-9 items-center justify-center rounded-[10px] border border-white/10 bg-white/5 text-white/45 backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.10)]"
        >
            <Icon className="size-15px" />
        </a>
    );
}


function NavColumn({ heading, links }: FooterColumn) {
    return (
        <div className="flex min-w-28 flex-col gap-2.5">
            <ColumnHeading>{heading}</ColumnHeading>
            {links.map((link) => (
                <NavLink key={link.href} {...link} />
            ))}
        </div>
    );
}


function BrandBlock({ config }: { config: FooterConfig }) {
    const { brand, social } = config;

    return (
        <div className="flex max-w-272px flex-col gap-4">
            {/* Logo — ✦ rotates on hover via group-hover, zero JS */}
            <Link href="/" className="group inline-flex w-fit items-center gap-2.5">
                <span className="font-serif text-lg leading-none text-white/75 transition-transform duration-300 group-hover:rotate-45">
                    {brand.logo}
                </span>
                <span className="font-serif text-xl font-semibold tracking-[0.05em] text-white">
                    {brand.name}
                </span>
            </Link>

            <p className="text-[0.8rem] font-light leading-[1.75] tracking-wide text-white/36">
                {brand.tagline}
            </p>

            <div className="mt-1 flex items-center gap-2">
                {social.map((s) => (
                    <SocialButton key={s.label} {...s} />
                ))}
            </div>
        </div>
    );
}


function LegalBar({ config, year }: { config: FooterConfig; year: number }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            {/* Auto-updating year — no hardcoded date */}
            <span className="text-[0.73rem] tracking-wide text-white/25">
                © {year} {config.brand.name}. All rights reserved.
            </span>

            <nav aria-label="Legal links" className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {config.legal.map(({ label, href }) => (
                    <Link
                        key={href}
                        href={href}
                        className="text-[0.73rem] tracking-wide text-white/28 transition-colors duration-150 hover:text-white/65"
                    >
                        {label}
                    </Link>
                ))}
            </nav>
        </div>
    );
}

// Footer 

interface FooterProps {
    config?: FooterConfig;
    variant?: FooterVariant;
}

export default function Footer({
    config = footerConfig,
    variant = "default",
}: FooterProps) {
    const year = getCopyrightYear();
    const columns = orderColumns(config.columns, variant);

    return (
        <footer className="relative w-full overflow-hidden border-t border-white/[0.07]  backdrop-blur-xl shadow-2xl hover:shadow-3xl hover:border-white/20 backdrop-saturate-150 bg-none bg-gray-900">

            <AmbientOrbs />

            {/* Top-edge shimmer */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/[0.07] to-transparent" />

            {/* Frosted glass sheen */}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/[0.016] to-transparent" />

            <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-10 pt-14 sm:px-10">

                {/* Main row: brand left, nav right */}
                <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-20">
                    <BrandBlock config={config} />

                    <nav
                        aria-label="Footer navigation"
                        className="grid grid-cols-2 gap-x-10 gap-y-8 sm:flex sm:gap-12 md:gap-14"
                    >
                        {columns.map((col) => (
                            <NavColumn key={col.heading} {...col} />
                        ))}
                    </nav>
                </div>

                <Divider />

                <LegalBar config={config} year={year} />
            </div>
        </footer>
    );
}
