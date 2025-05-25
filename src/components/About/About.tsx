import Image from 'next/image';



const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">About Me</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-xl text-gray-600">
              I'm Jhonny Pimiento, a 32-year-old Colombian entrepreneur with a passion for Web3 and blockchain technology. 
              With a background in full-stack development, I specialize in creating innovative solutions that leverage 
              the power of decentralized technologies.
            </p>
            <p className="text-xl text-gray-600">
              My journey in tech started with traditional web development, but I quickly found my passion in the 
              decentralized space. I'm constantly exploring new possibilities in Web3, from DeFi applications to 
              NFTs and beyond.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="px-4 py-2 bg-primary-50 text-primary-600 rounded-full">32 Years Old</span>
              <span className="px-4 py-2 bg-primary-50 text-primary-600 rounded-full">Colombian</span>
              <span className="px-4 py-2 bg-primary-50 text-primary-600 rounded-full">Web3 Enthusiast</span>
            </div>
          </div>
          <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl">
            <img src="/images/profile.png" alt="Image test"  />
            <div className="w-full h-full bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
