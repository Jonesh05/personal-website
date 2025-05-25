import Hero from "../components/Hero/Hero";
import About from "../components/About/About";
import Projects from "../components/Projects/Projects";
import Skills from "../components/Skills/Skills";
import Timeline from "../components/Timeline/Timeline";
import BlogList from "../components/BlogList/BlogList";
import Contact from "../components/Contact/Contact";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Hero />
      <About />
      <Projects />
      <Skills />
      <Timeline />
      <BlogList />
      <Contact />
    </main>
  );
}
