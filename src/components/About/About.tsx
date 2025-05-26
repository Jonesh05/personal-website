import Image from 'next/image';

const gradientText = 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-slate-500 bg-clip-text text-transparent';

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
            <div className="flex flex-wrap gap-4 pb-6">
              <span className={`px-4 py-2 rounded-full bg-primary-50 font-semibold transition text-center mb-4 shadow-lg ${gradientText} hover:text-cyan-600`}>Full Stack Developer</span>
              <span className={`px-4 py-2 rounded-full bg-primary-50 font-semibold transition text-center mb-4 shadow-lg ${gradientText} hover:text-cyan-600`}>DevRel</span>
              <span className={`px-4 py-2 rounded-full bg-primary-50 font-semibold transition text-center mb-4 shadow-lg ${gradientText} hover:text-cyan-600`}>Web3 Enthusiast</span>
            </div>
          </div>
          <div className="relative w-52 h-52 rounded-full scale-150 overflow-hidden shadow-2xl ml-24">
            <img src="/images/about.png" alt="Image test"  
            className="w-full h-full object-cover object-[50%_60%] rounded-full border-4 border-white/30 shadow-lg"
            />
          </div>
        </div>
      </div>
    </section> 
  );
};

export default About;
