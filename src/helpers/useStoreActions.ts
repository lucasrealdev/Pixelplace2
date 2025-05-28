import { useAuth, useWishlist, useUserGames } from "../contexts/AppDataContext";
import { addWishlistItem, removeWishlistItem, toggleUserGameTradeStatus } from "../services/dataService";
import type { UserGame } from "../services/entities";

// Hook centralizador de ações da Store (wishlist e troca)
export function useStoreActions() {
  const { currentUser } = useAuth();
  const { reloadWishlist } = useWishlist();
  const { reloadUserGames } = useUserGames();

  // Adiciona jogo à wishlist e atualiza contexto
  const addToWishlist = async (gameId: number) => {
    if (!currentUser) return;
    await addWishlistItem(currentUser.id, gameId);
    await reloadWishlist();
  };

  // Remove jogo da wishlist e atualiza contexto
  const removeFromWishlist = async (gameId: number) => {
    if (!currentUser) return;
    await removeWishlistItem(currentUser.id, gameId);
    await reloadWishlist();
  };

  // Adiciona jogo para troca (se ainda não estiver) e atualiza contexto
  const addToTrade = async (userGame: UserGame) => {
    if (!userGame.in_trade) {
      await toggleUserGameTradeStatus(userGame.id);
      await reloadUserGames();
    }
  };

  // Remove jogo da troca (se estiver) e atualiza contexto
  const removeFromTrade = async (userGame: UserGame) => {
    if (userGame.in_trade) {
      await toggleUserGameTradeStatus(userGame.id);
      await reloadUserGames();
    }
  };

  return {
    addToWishlist,
    removeFromWishlist,
    addToTrade,
    removeFromTrade,
  };
} 