import { useEffect, useRef, useState } from 'react';
import type { Game } from '../services/entities';

interface BannerCardProps {
  games: Game[];
  onBannerClick?: (game: Game) => void;
}

export default function BannerCard({ games, onBannerClick }: BannerCardProps) {
  const [current, setCurrent] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const hasMultiple = games.length > 1;

  // Corrige o índice se games.length mudar
  useEffect(() => {
    if (current >= games.length) setCurrent(0);
  }, [games.length]);

  // Avança para o próximo slide
  const nextSlide = () => setCurrent((i) => (i + 1) % games.length);

  // Timer automático
  useEffect(() => {
    if (!hasMultiple) return;
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(nextSlide, 5000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [current, games.length]);

  if (!games.length) return null;
  const currentGame = games[current];

  return (
    <div
      className="rounded-lg overflow-hidden mb-6 md:mb-8 relative hover:shadow-xl transition-all hover:translate-y-[-2px] cursor-pointer"
      onClick={() => onBannerClick && onBannerClick(currentGame)}
      tabIndex={0}
      role="button"
      aria-label={`Abrir detalhes de ${currentGame.title}`}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && onBannerClick) onBannerClick(currentGame); }}
    >
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[28rem] 2xl:h-[32rem] w-full flex flex-col justify-end">
        <img
          src={currentGame.banner || currentGame.image}
          alt={currentGame.title}
          className="absolute inset-0 w-full h-full object-cover z-10"
        />
        <div className="relative z-10 w-full flex flex-row items-end justify-between px-4 pb-2">
          <div>
            <h3 className="text-lg md:text-xl font-medium">{currentGame.title}</h3>
            <div className="flex flex-wrap gap-1 mt-1 md:mt-2">
              {currentGame.tags?.map((tag) => (
                <span key={tag.id} className="bg-gray-700 text-xs px-2 py-1 rounded">{tag.name}</span>
              ))}
            </div>
          </div>
          <p className="font-medium text-nowrap">R$ {currentGame.price}</p>
        </div>
        {hasMultiple && (
          <div className="relative w-full flex justify-center items-center pb-3 z-10">
            {games.map((_, i) => (
              <span
                key={i}
                onClick={e => { e.stopPropagation(); setCurrent(i); timer.current && clearInterval(timer.current); timer.current = setInterval(nextSlide, 5000); }}
                className={`w-2.5 h-2.5 rounded-full mx-1 cursor-pointer transition-all duration-300 ${i === current ? 'bg-cyan-300 opacity-90 scale-110' : 'bg-gray-400 opacity-50'}`}
                aria-label={`Selecionar destaque ${i + 1}`}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setCurrent(i); timer.current && clearInterval(timer.current); timer.current = setInterval(nextSlide, 5000); } }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 