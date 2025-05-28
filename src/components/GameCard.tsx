import React from "react";
import { CheckCircle, Clock, Heart, HeartOff } from "lucide-react";
import type { Game } from "../services/entities";
import GameDetailModal from "./GameDetailModal";
import { useState } from "react";

interface GameCardProps {
  game: Game;
  onPrimaryAction?: (game: Game) => void;
  onSecondaryAction?: (game: Game) => void;
  primaryLabel?: React.ReactNode;
  secondaryLabel?: React.ReactNode;
  onRemove?: (game: Game) => void;
  onToggleWishlist?: (game: Game) => void;
  inWishlist?: boolean;
  showTags?: boolean;
  showPrice?: boolean;
  showDiscount?: boolean;
  secondaryButtonClass?: string;
}

function isAvailable(releaseDate?: string | null) {
  if (!releaseDate) return true;
  const date = new Date(releaseDate);
  return date <= new Date();
}

function getDiscountedPrice(game: Game): number {
  if (!game.discount) return game.price;
  return Math.round(game.price * (1 - game.discount / 100));
}

export default function GameCard({
  game,
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
  secondaryLabel,
  onRemove,
  onToggleWishlist,
  inWishlist,
  showTags = true,
  showPrice = true,
  showDiscount = true,
  secondaryButtonClass,
}: GameCardProps) {
  const available = isAvailable(game.releaseDate);
  const [showDetail, setShowDetail] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Evita abrir o modal se clicar em um botão de ação
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("[role=button]")
    ) {
      return;
    }
    setShowDetail(true);
  };

  return (
    <>
      <div
        className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-5px] flex flex-col cursor-pointer"
        tabIndex={0}
        aria-label={`Abrir detalhes de ${game.title}`}
        onClick={handleCardClick}
      >
        <div className="relative aspect-[16/9] w-full">
          <img
            src={game.image}
            alt={game.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-30 hover:opacity-0 transition-opacity"></div>
          {showDiscount && game.discount && (
            <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-2 py-1 m-2 rounded">
              -{game.discount}%
            </div>
          )}
          {onToggleWishlist && (
            <button
              className="absolute top-2 left-2 bg-gray-800/80 rounded-full p-1 text-cyan-300 hover:text-pink-400 transition"
              onClick={e => { e.stopPropagation(); onToggleWishlist(game); }}
              aria-label={inWishlist ? "Remover da lista de desejos" : "Adicionar à lista de desejos"}
            >
              {inWishlist ? <HeartOff size={18} /> : <Heart size={18} />}
            </button>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col justify-between">
          <div>
            <h4 className="font-medium text-sm md:text-base mb-1 flex items-center gap-2">
              {game.title}
              {!available && <Clock size={16} className="text-yellow-400" />}
              {available && inWishlist && <CheckCircle size={16} className="text-green-400" />}
            </h4>
            {showTags && game.tags && (
              <div className="flex flex-wrap gap-1 mb-2">
                {game.tags.map((tag) => (
                  <span key={tag.id} className="bg-gray-800 text-xs px-2 py-0.5 rounded mb-1 text-cyan-300">{tag.name}</span>
                ))}
              </div>
            )}
            {game.releaseDate && !available && (
              <div className="text-xs text-yellow-400 mb-1">Lançamento: {new Date(game.releaseDate).toLocaleDateString()}</div>
            )}
          </div>
          {showPrice && (
            <div className="flex flex-col gap-2 mt-2">
              {game.discount ? (
                <span className="text-cyan-400 font-bold text-base mb-1 flex items-center gap-2">
                  <span className="line-through text-gray-400 text-sm">R$ {game.price}</span>
                  <span>R$ {getDiscountedPrice(game)}</span>
                </span>
              ) : (
                <span className="text-cyan-400 font-bold text-base mb-1">R$ {game.price}</span>
              )}
            </div>
          )}
          {(primaryLabel || secondaryLabel) && (
            <div className="flex flex-col gap-2 mt-2">
              {primaryLabel && (
                <button
                  className="w-full py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                  onClick={e => { e.stopPropagation(); if (onPrimaryAction) onPrimaryAction(game); }}
                >
                  {primaryLabel}
                </button>
              )}
              {secondaryLabel && (
                <button
                  className={secondaryButtonClass || "w-full py-1 rounded bg-blue-900/80 hover:bg-blue-800 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 border border-cyan-700 transition"}
                  onClick={e => { e.stopPropagation(); if (onSecondaryAction) onSecondaryAction(game); }}
                >
                  {secondaryLabel}
                </button>
              )}
            </div>
          )}
          {onRemove && (
            <button
              className="w-full py-1 rounded bg-red-700 hover:bg-red-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
              onClick={e => { e.stopPropagation(); onRemove(game); }}
            >
              Remover da Lista
            </button>
          )}
        </div>
      </div>
      <GameDetailModal game={game} open={showDetail} onClose={() => setShowDetail(false)} />
    </>
  );
} 