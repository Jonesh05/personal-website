import { useMemo } from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';

export interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactElement;
}

export interface HeroData {
  name: string;
  description: string;
  avatar: string;
  social: SocialLink[];
}

export const useHeroData = (): HeroData => {
  return useMemo(
    () => ({
      name: 'Jhonny Pimiento',
      description:
        'Web3 builder, blockchain enthusiast & full-stack developer creating decentralized solutions.',
      avatar: '/avatar.png',
      social: [
        {
          name: 'GitHub',
          url: 'https://github.com/jhonnypimiento',
          icon: <Github className="w-5 h-5" />,
        },
        {
          name: 'Twitter',
          url: 'https://twitter.com/jhonnypimiento',
          icon: <Twitter className="w-5 h-5" />,
        },
        {
          name: 'LinkedIn',
          url: 'https://linkedin.com/in/jhonnypimiento',
          icon: <Linkedin className="w-5 h-5" />,
        },
      ],
    }),
    []
  );
};