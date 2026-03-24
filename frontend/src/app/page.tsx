import Hero from "@/components/Hero/Hero";
import About from "@/components/About/About";
import Projects from "@/components/Projects/Projects";
//import Skills from "../components/Skills/Skills";
import { Suspense } from 'react';
import Timeline from "@/components/Timeline/Timeline";
import BlogSection from '@/components/Blog/BlogSection';
import BlogSectionSkeleton from '@/components/Blog/BlogSectionSkeleton';
import Contact from "@/components/Contact/Contact";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900">
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
