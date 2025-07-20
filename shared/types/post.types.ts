export interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    published: boolean;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    featuredImage?: string;
    authorId: string;
}