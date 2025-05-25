import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-r from-primary-500 to-primary-600">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Jhonny Pimiento
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 mb-8">
            Web3 & Blockchain Developer | Colombian Entrepreneur
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href="#contact"
              className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Get in Touch
            </Link>
            <Link
              href="#projects"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              View My Work
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
