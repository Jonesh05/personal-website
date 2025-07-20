interface TimelineItem {
  year: number;
  title: string;
  description: string;
}

const Timeline = () => {
  const timeline: TimelineItem[] = [
    {
      year: 2022,
      title: "Blockchain Developer",
      description: "Started my journey in blockchain development with a focus on DeFi and NFTs"
    },
    {
      year: 2023,
      title: "Web3 Entrepreneur",
      description: "Launched multiple Web3 projects and participated in hackathons"
    },
    {
      year: 2024,
      title: "Quantum Computing Research",
      description: "Began research in quantum computing and its applications in blockchain"
    },
    {
      year: 2025,
      title: "Current",
      description: "Continuing to explore Web3, blockchain, and quantum computing technologies"
    }
  ];

  return (
    <section id="timeline" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">My Journey</h2>
        <div className="max-w-4xl mx-auto">
          {timeline.map((item: TimelineItem, index: number) => (
            <div
              key={index}
              className={`flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} mb-12`}
            >
              <div className="w-1/5 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-white font-bold">{item.year}</span>
                </div>
              </div>
              <div className="w-4/5">
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Timeline;
