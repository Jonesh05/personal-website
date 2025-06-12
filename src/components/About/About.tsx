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
          <div className="relative w-52 h-52 mx-auto">
            {/* Spinner externo */}
            <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-500 
                  animate-spin-slow z-0 blur-md opacity-70"></div>

            {/* Spinner medio */}
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-pink-500 
                  animate-spin-reverse-slower z-0 blur-sm opacity-60"></div>

            {/* Spinner interno */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-fuchsia-400 to-purple-600 
                  animate-spin-slowest z-0 opacity-40"></div>

            {/* Avatar visible */}
            <div className="relative z-10 w-full h-full rounded-full overflow-hidden shadow-xl shadow-fuchsia-500/30">
              <Image
                src="/images/about.png"
                alt="Avatar"
                width={208}
                height={208}
                className="w-full h-full object-cover object-center rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section> 
  );
};

export default About;
