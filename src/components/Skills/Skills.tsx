const Skills = () => {
  const skills = [
    {
      category: "Frontend",
      items: ["TypeScript", "React", "Tailwind CSS", "Framer Motion"]
    },
    {
      category: "Blockchain",
      items: ["Solidity", "Hardhat", "RainbowKit", "Web3.js"]
    },
    {
      category: "Tools",
      items: ["Next.js", "Vite", "Zustand", "Git"]
    },
    {
      category: "Design",
      items: ["UI/UX Design", "Figma", "Adobe XD"]
    },
    {
      category: "Language",
      items: ["Spanish (Native)", "English (B2)"]
    }
  ];

  return (
    <section id="skills" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Skills</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="bg-primary-50 rounded-2xl p-6 text-center"
            >
              <h3 className="text-xl font-semibold mb-4">{skill.category}</h3>
              <div className="space-y-2">
                {skill.items.map((item, i) => (
                  <span
                    key={i}
                    className="inline-block px-4 py-2 bg-white rounded-full text-primary-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
