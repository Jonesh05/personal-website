const BlogList = () => {
  const posts = [
    {
      title: "Getting Started with Web3 Development",
      date: "May 2025",
      excerpt: "A comprehensive guide to starting your Web3 development journey"
    },
    {
      title: "Building Your First NFT Project",
      date: "April 2025",
      excerpt: "Step-by-step guide to creating and deploying your first NFT smart contract"
    },
    {
      title: "Quantum Computing for Blockchain",
      date: "March 2025",
      excerpt: "Exploring the intersection of quantum computing and blockchain technology"
    }
  ];

  return (
    <section id="blog" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Blog</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <div
              key={index}
              className="bg-primary-50 rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-2xl font-bold mb-2">{post.title}</h3>
              <p className="text-gray-600 mb-4">{post.date}</p>
              <p className="text-gray-600">{post.excerpt}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogList;
