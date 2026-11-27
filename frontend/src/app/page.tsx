import Hero from "@/components/Hero/Hero";
import About from "@/components/About/About";
import Projects from "@/components/Projects/Projects";
//import Skills from "../components/Skills/Skills";
import { Suspense } from 'react';
import Timeline from "@/components/Timeline/Timeline";
import BlogSection from '@/components/Blog/BlogSection';
import BlogSectionSkeleton from '@/components/Blog/BlogSectionSkeleton';
import Contact from "@/components/Contact/Contact";
import {
  buildPersonJsonLd,
  buildProfilePageJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd,
  type JsonLdGraph,
} from '@/lib/seo/jsonLd';

export default function Home() {
  const jsonLd: JsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      buildProfilePageJsonLd(),
      buildPersonJsonLd(),
      buildWebSiteJsonLd(),
    ],
  };

  return (
    <main id="main-content" className="min-h-screen bg-white dark:bg-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Hero />
      <About />
      <Projects />
    
      <Timeline />
      <Suspense fallback={<BlogSectionSkeleton />}>
      <BlogSection />
      </Suspense>
      <Contact />
    </main>
  );
}
