export interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    published: boolean;
    featured?: boolean;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    featuredImage?: string;
    coverImage?: string;
    readingTime?: number;
    authorId: string;
    authorName?: string;
    likes?: number;
    views?: number;
}