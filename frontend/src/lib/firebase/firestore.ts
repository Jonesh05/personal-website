

// Simulación de datos de posts
const mockPosts = [
    {
      id: '1',
      title: 'Welcome to My Blog',
      slug: 'welcome-to-my-blog',
      excerpt: 'This is a sample post for your blog section.',
      featuredImage: '',
      tags: ['General'],
      createdAt: new Date(),
      author: 'Cascade',
      readTime: 2,
    },
    {
      id: '2',
      title: 'Next.js Tips',
      slug: 'nextjs-tips',
      excerpt: 'Tips and tricks for working with Next.js 13/14.',
      featuredImage: '',
      tags: ['Next.js'],
      createdAt: new Date(),
      author: 'Cascade',
      readTime: 3,
    },
    {
      id: '3',
      title: 'TypeScript Best Practices',
      slug: 'typescript-best-practices',
      excerpt: 'How to write clean TypeScript in your projects.',
      featuredImage: '',
      tags: ['TypeScript'],
      createdAt: new Date(),
      author: 'Cascade',
      readTime: 4,
    },
    {
      id: '4',
      title: 'Deploying to Vercel',
      slug: 'deploying-to-vercel',
      excerpt: 'A quick guide to deploying your Next.js site.',
      featuredImage: '',
      tags: ['Deployment'],
      createdAt: new Date(),
      author: 'Cascade',
      readTime: 2,
    },
  ];
  
  // Simulación de API para obtener posts publicados
  export const postsApi = {
    getPublished: async (limit: number) => {
      // Simula un fetch asíncrono
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simula delay
      return { posts: mockPosts.slice(0, limit) };
    },
  };