import { HeroPresentational } from './HeroPresentational';
import { useHeroData } from '@/hooks/useHeroData';

const HeroContainer = () => {
  const data = useHeroData();
  return <HeroPresentational data={data} />;
};

export default HeroContainer;
