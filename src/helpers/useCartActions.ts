import { useState } from "react";
import { useAuth, useCart, useGames, useTransactions, useUserGames } from "../contexts/AppDataContext";
import { removeCartItem, clearCart, updateUserBalance, addTransaction, addUserGame, addCartItem, getCouponByCode, addTransactionGame } from "../services/dataService";
import type { Game, CartItem } from "../services/entities";
import { getGame, getDiscountedPrice } from "./uiHelpers";

export function useCartActions({ onSuccess }: { onSuccess?: () => void } = {}) {
  const { currentUser } = useAuth();
  const { reloadTransactions } = useTransactions();
  const { cart, reloadCart } = useCart();
  const { games } = useGames();
  const { reloadUserGames } = useUserGames();
  const [coupon, setCoupon] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Helper para obter os itens do carrinho
  const cartItems: CartItem[] = (cart as any)?.items || [];

  // Remove um item do carrinho
  async function removeFromCart(itemId: number) {
    if (!currentUser) return;
    await removeCartItem(currentUser.id, itemId);
    await reloadCart();
  }

  // Aplica cupom de desconto
  async function applyCoupon(code: string) {
    setCoupon(code);
    setCouponError(null);
    if (!code.trim()) {
      setDiscount(0);
      return;
    }
    const couponData = await getCouponByCode(code);
    if (couponData && couponData.discount > 0) {
      setDiscount(Number(couponData.discount));
    } else {
      setDiscount(0);
      setCouponError("Cupom inválido ou expirado.");
    }
  }

  // Finaliza compra (real)
  async function checkout() {
    if (!currentUser || !cart) return;
    // Total com descontos individuais
    const totalComDescontos = (cartItems || []).reduce((sum: number, item: CartItem) => {
      const game = getGame(games, item.game_id);
      if (!game) return sum;
      return sum + getDiscountedPrice({ price: game.price, discount: game.discount ?? undefined });
    }, 0);
    const discountValue = totalComDescontos * discount;
    const total = totalComDescontos - discountValue;
    if (currentUser.balance < total) {
      throw new Error("Saldo insuficiente para finalizar a compra.");
    }
    // Atualiza saldo
    await updateUserBalance(currentUser.id, currentUser.balance - total);
    // Adiciona transação
    const tx = await addTransaction({
      type: "compra",
      user_id: currentUser.id,
      value: total,
      status: "concluida",
      other_user_id: null,
      completed_at: new Date().toISOString()
    });
    // Adiciona jogos à biblioteca e à tabela transaction_games
    for (const item of cartItems || []) {
      try {
        await addUserGame(currentUser.id, item.game_id, false);
        
        const game = getGame(games, item.game_id);
        await addTransactionGame({
          transaction_id: tx.id,
          game_id: item.game_id,
          price_at_purchase: getDiscountedPrice({
            price: game?.price ?? 0,
            discount: game?.discount ?? 0
          }),
          direction: "received"
        });
      } catch {}
    }

    // Limpa carrinho
    await clearCart(currentUser.id);
    await reloadUserGames();
    await reloadTransactions();
    setCoupon("");
    setDiscount(0);
    if (onSuccess) onSuccess();
  }

  // Subtotal: soma dos preços originais
  const subtotal = (cartItems || []).reduce((sum: number, item: CartItem) => {
    const game = getGame(games, item.game_id);
    if (!game) return sum;
    return sum + game.price;
  }, 0);
  // Total com descontos individuais
  const totalComDescontos = (cartItems || []).reduce((sum: number, item: CartItem) => {
    const game = getGame(games, item.game_id);
    if (!game) return sum;
    return sum + getDiscountedPrice({ price: game.price, discount: game.discount ?? undefined });
  }, 0);
  const discountValue = totalComDescontos * discount;
  const total = totalComDescontos - discountValue;

  async function clearCartAction() {
    if (!currentUser) return;
    await clearCart(currentUser.id);
    await reloadCart();
  }

  async function addToCart(game: Game) {
    if (!currentUser) return;
    await addCartItem(currentUser.id, game.id);
    await reloadCart();
  }

  return {
    addToCart,
    removeFromCart,
    applyCoupon,
    checkout,
    coupon,
    discount,
    subtotal,
    discountValue,
    total,
    setCoupon,
    clearCart: clearCartAction,
    couponError,
  };
} 