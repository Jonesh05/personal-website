import Head from 'next/head';

interface SeoProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

export const SeoHelper = ({ title, description, image, url }: SeoProps) => (
  <Head>
    <title>{title}</title>
    <meta name="description" content={description} />
    {image && <meta property="og:image" content={image} />}
    {url && <meta property="og:url" content={url} />}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    {image && <meta name="twitter:image" content={image} />}
  </Head>
);
