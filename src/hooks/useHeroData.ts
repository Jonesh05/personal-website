import { useMemo } from 'react';

export interface SocialLink {
  name: string;
  url: string;
  icon: JSX.Element;
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
          icon: <i className="fab fa-github" />,
        },
        {
          name: 'Twitter',
          url: 'https://twitter.com/jhonnypimiento',
          icon: <i className="fab fa-twitter" />,
        },
        {
          name: 'LinkedIn',
          url: 'https://linkedin.com/in/jhonnypimiento',
          icon: <i className="fab fa-linkedin" />,
        },
      ],
    }),
    []
  );
};
