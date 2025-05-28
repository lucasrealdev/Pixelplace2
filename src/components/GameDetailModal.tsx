import React, { useMemo, useRef, useEffect, useState } from "react";
import { X, ShoppingCart, Heart, Repeat, Play, Tag, Clock, CheckCircle, Loader2 } from "lucide-react";
import { useAuth, useUserGames, useWishlist } from "../contexts/AppDataContext";
import { useStoreActions } from "../helpers/useStoreActions";
import { useCartActions } from "../helpers/useCartActions";
import type { Game } from "../services/entities";
import { toast } from "react-toastify";

interface GameDetailModalProps {
  game: Game;
  open: boolean;
  onClose: () => void;
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

const GameDetailModal: React.FC<GameDetailModalProps> = ({ game, open, onClose }) => {
  const { currentUser } = useAuth();
  const { userGames } = useUserGames();
  const { wishlistGames } = useWishlist();
  const { addToWishlist, removeFromWishlist, addToTrade, removeFromTrade } = useStoreActions();
  const { addToCart } = useCartActions();
  const modalRef = useRef<HTMLDivElement>(null);

  // Loading states
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [loadingRemoveWishlist, setLoadingRemoveWishlist] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingTrade, setLoadingTrade] = useState(false);
  const [loadingRemoveTrade, setLoadingRemoveTrade] = useState(false);

  // Estado do usuário em relação ao jogo
  const userGame = useMemo(() => userGames.find(ug => ug.game_id === game.id), [userGames, game.id]);
  const inWishlist = useMemo(() => wishlistGames.some(g => g.id === game.id), [wishlistGames, game.id]);
  const inTrade = userGame?.in_trade;
  const available = isAvailable(game.releaseDate);
  const isUpcoming = !!game.releaseDate && !available;
  const hasDiscount = !!game.discount;

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  // Foco inicial
  useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus();
    }
  }, [open]);

  // Ações
  const handleAddToWishlist = async () => {
    if (!currentUser) {
      toast.info("Você precisa estar logado para adicionar à lista de desejos.");
      return;
    }
    setLoadingWishlist(true);
    try {
      await addToWishlist(game.id);
      toast.success("Adicionado à lista de desejos!");
    } finally {
      setLoadingWishlist(false);
    }
  };
  const handleRemoveFromWishlist = async () => {
    setLoadingRemoveWishlist(true);
    try {
      await removeFromWishlist(game.id);
      toast.info("Removido da lista de desejos.");
    } finally {
      setLoadingRemoveWishlist(false);
    }
  };
  const handleAddToCart = async () => {
    if (!currentUser) {
      toast.info("Você precisa estar logado para adicionar ao carrinho.");
      return;
    }
    setLoadingCart(true);
    try {
      await addToCart(game);
      toast.success("Jogo adicionado ao carrinho!");
    } finally {
      setLoadingCart(false);
    }
  };
  const handleAddToTrade = async () => {
    if (!userGame) return;
    setLoadingTrade(true);
    try {
      await addToTrade(userGame);
      toast.success("Jogo adicionado para troca!");
    } finally {
      setLoadingTrade(false);
    }
  };
  const handleRemoveFromTrade = async () => {
    if (!userGame) return;
    setLoadingRemoveTrade(true);
    try {
      await removeFromTrade(userGame);
      toast.info("Jogo removido da troca.");
    } finally {
      setLoadingRemoveTrade(false);
    }
  };
  const handlePlay = () => {
    // Redirecionar ou abrir modal de jogar (ajustar conforme sua lógica)
    toast.info("Função de jogar não implementada.");
  };
  const handleTrade = () => {
    // Redirecionar para tela de troca já filtrando pelo jogo
    window.location.href = `/trade?search=${encodeURIComponent(game.title)}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-gray-900 rounded-lg p-6 max-w-lg w-full border border-cyan-700 shadow-xl relative max-h-[90vh] overflow-y-auto animate-fadeIn"
        aria-modal="true"
        role="dialog"
      >
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          onClick={onClose}
          aria-label="Fechar detalhes do jogo"
        >
          <X size={22} />
        </button>
        {/* Banner */}
        {game.banner && (
          <img src={game.banner} alt="Banner" className="w-full h-28 object-cover rounded mb-3" />
        )}
        {/* Capa */}
        <div className="flex flex-col items-center mb-2">
          <img src={game.image} alt={game.title} className="w-32 h-32 object-cover rounded shadow-lg mb-2 border-2 border-cyan-700" />
          <h2 className="text-xl font-bold text-cyan-300 mb-2 flex items-center gap-2">
            {game.title}
            {!available && <Clock size={18} className="text-yellow-400" />}
            {available && userGame && <CheckCircle size={18} className="text-green-400" />}
          </h2>
          {/* Lançamento futuro */}
          {game.releaseDate && !available && (
            <div className="text-xs text-yellow-400 mb-2">Lançamento: {new Date(game.releaseDate).toLocaleDateString()}</div>
          )}
          {/* Tags */}
          {game.tags && (
            <div className="flex flex-wrap gap-1 mb-2">
              {game.tags.map((tag) => (
                <span key={tag.id} className="bg-gray-800 text-xs px-2 py-0.5 rounded text-cyan-300 flex items-center gap-1"><Tag size={12} />{tag.name}</span>
              ))}
            </div>
          )}
          {/* Preço e desconto */}
          <div className="flex items-center gap-2 mt-1">
            {hasDiscount && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">-{game.discount}%</span>
            )}
            {hasDiscount ? (
              <span className="text-cyan-400 font-bold text-base flex items-center gap-2">
                <span className="line-through text-gray-400 text-sm">R$ {game.price}</span>
                <span>R$ {getDiscountedPrice(game)}</span>
              </span>
            ) : (
              <span className="text-cyan-400 font-bold text-base">R$ {game.price}</span>
            )}
          </div>
        </div>
        {/* Ações dinâmicas */}
        <div className="flex flex-col gap-2 mt-4">
          {isUpcoming ? (
            inWishlist ? (
              <button
                className="w-full py-2 rounded bg-red-700 hover:bg-red-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                onClick={handleRemoveFromWishlist}
                disabled={loadingRemoveWishlist}
              >
                {loadingRemoveWishlist ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />} Remover da lista de desejos
              </button>
            ) : (
              <button
                className="w-full py-2 rounded bg-pink-600 hover:bg-pink-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                onClick={handleAddToWishlist}
                disabled={loadingWishlist}
              >
                {loadingWishlist ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} />} Adicionar à lista de desejos
              </button>
            )
          ) : userGame ? (
            <>
              <button
                className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                onClick={handlePlay}
              >
                <Play size={18} /> Jogar
              </button>
              <button
                className={inTrade ? "w-full py-2 rounded bg-red-700 hover:bg-red-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition" : "w-full py-2 rounded bg-blue-900/80 hover:bg-blue-800 text-cyan-300 font-semibold text-sm flex items-center justify-center gap-2 border border-cyan-700 transition"}
                onClick={inTrade ? handleRemoveFromTrade : handleAddToTrade}
                disabled={inTrade ? loadingRemoveTrade : loadingTrade}
              >
                {inTrade
                  ? loadingRemoveTrade ? <Loader2 size={18} className="animate-spin" /> : <Repeat size={18} />
                  : loadingTrade ? <Loader2 size={18} className="animate-spin" /> : <Repeat size={18} />
                }
                {inTrade ? "Remover da troca" : "Adicionar para troca"}
              </button>
              {inWishlist && (
                <button
                  className="w-full py-2 rounded bg-red-700 hover:bg-red-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                  onClick={handleRemoveFromWishlist}
                  disabled={loadingRemoveWishlist}
                >
                  {loadingRemoveWishlist ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />} Remover da lista de desejos
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                onClick={handleAddToCart}
                disabled={loadingCart}
              >
                {loadingCart ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />} Adicionar ao carrinho
              </button>
              <button
                className="w-full py-2 rounded bg-blue-900/80 hover:bg-blue-800 text-cyan-300 font-semibold text-sm flex items-center justify-center gap-2 border border-cyan-700 transition"
                onClick={handleTrade}
              >
                <Repeat size={18} /> Trocar por outro jogo
              </button>
              {inWishlist ? (
                <button
                  className="w-full py-2 rounded bg-red-700 hover:bg-red-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                  onClick={handleRemoveFromWishlist}
                  disabled={loadingRemoveWishlist}
                >
                  {loadingRemoveWishlist ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />} Remover da lista de desejos
                </button>
              ) : (
                <button
                  className="w-full py-2 rounded bg-pink-600 hover:bg-pink-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                  onClick={handleAddToWishlist}
                  disabled={loadingWishlist}
                >
                  {loadingWishlist ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} />} Adicionar à lista de desejos
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetailModal; 