import { useCartActions } from "../helpers/useCartActions";
import { useCart, useGames, useAuth } from "../contexts/AppDataContext";
import { getGame, getDiscountedPrice } from "../helpers/uiHelpers";
import { Trash2, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserGames } from "../contexts/AppDataContext";
import { toast } from "react-toastify";

export default function Cart() {
  const { games } = useGames();
  const { cart, reloadCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const {
    removeFromCart,
    applyCoupon,
    checkout,
    coupon,
    discount,
    subtotal,
    discountValue,
    total,
    setCoupon,
    clearCart,
    couponError
  } = useCartActions({
    onSuccess: () => {
      toast.success("Compra realizada com sucesso!", {
        theme: "dark",
        className: "bg-gray-900 text-green-400 border border-cyan-700",
      });
      navigate("/library");
    },
  });
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const { userGames } = useUserGames();
  const [reloading, setReloading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Helper para obter os itens do carrinho
  const cartItems = (cart as any)?.items || [];
  const isCartEmpty = !cart || cartItems.length === 0;

  // Função para "atualizar" o carrinho (resetar para o estado inicial)
  async function handleReloadCart() {
    setReloading(true);
    await reloadCart();
    setReloading(false);
  }

  // Remover item do carrinho
  function handleRemove(itemId: number) {
    setRemovingItemId(itemId);
    removeFromCart(itemId).then(() => {
      reloadCart();
      setRemovingItemId(null);
    });
  }

  function handleClearCart() {
    toast(
      ({ closeToast }) => (
        <div className="flex flex-col items-center gap-2">
          <span className="text-white">Tem certeza que deseja remover todos os jogos do carrinho?</span>
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 rounded bg-red-700 hover:bg-red-800 text-white font-semibold border border-red-900 text-xs"
              onClick={async () => {
                await clearCart();
                await reloadCart();
                closeToast && closeToast();
              }}
            >
              Remover todos
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-gray-200 font-semibold border border-cyan-900 text-xs"
              onClick={closeToast}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        theme: "dark",
        className: "bg-gray-900 border border-cyan-700",
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        position: "top-center"
      }
    );
  }

  async function handleCheckout() {
    if (!currentUser) return;
    const ownedGameIds = userGames.map((ug) => ug.game_id);
    const alreadyOwned = cartItems.find((item: any) => ownedGameIds.includes(item.game_id));
    if (alreadyOwned) {
      await removeFromCart(alreadyOwned.id);
      await reloadCart();
      toast.error(
        `Você já possui o jogo "${getGame(games, alreadyOwned.game_id)?.title ?? "(Jogo)"}". Ele foi removido do carrinho.`,
        {
          theme: "dark",
          className: "bg-gray-900 text-red-400 border border-cyan-700",
          autoClose: 3000,
          position: "top-center"
        }
      );
      return;
    }
    setCheckingOut(true);
    try {
      await checkout();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao finalizar compra.", {
        theme: "dark",
        className: "bg-gray-900 text-red-400 border border-cyan-700",
        autoClose: 3000,
        position: "top-center"
      });
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-800 flex flex-col items-center py-6 px-2 md:px-0">
      <div className="w-full max-w-3xl bg-gray-900 rounded-lg shadow-lg p-4 md:p-8 border border-cyan-700 flex flex-col gap-4">
        {isCartEmpty ? (
          <>
            <div className="flex items-center w-full">
              <div className="flex justify-start">
                <button
                  className="p-1 rounded-full bg-gray-700 hover:bg-gray-800 text-cyan-400 transition border border-cyan-900"
                  aria-label="Voltar"
                  onClick={() => navigate(-1)}>
                  <ArrowLeft size={18} />
                </button>
              </div>
              <div className="flex-1 flex-col items-center justify-center">
                <div className="text-center text-gray-400 text-">
                  Seu carrinho está vazio.
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center mb-2 w-full relative">
              <button
                className="p-1 rounded-full bg-gray-700 hover:bg-gray-800 text-cyan-400 transition border border-cyan-900 absolute left-0"
                aria-label="Voltar"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1 flex justify-center items-center gap-1">
                <h2 className="text-2xl md:text-3xl font-bold text-cyan-400 text-center">
                  Seu Carrinho
                </h2>
                <button
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-cyan-700 hover:bg-cyan-800 text-white transition border border-cyan-900"
                  aria-label="Atualizar carrinho"
                  onClick={handleReloadCart}
                >
                  <RefreshCw size={14} className={reloading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
            {/* Saldo de créditos do usuário */}
            {currentUser && (
              <div className="flex items-center justify-center mb-2">
                <span
                  className="bg-gray-700 border border-cyan-700 rounded px-2 py-1 text-cyan-300 font-semibold text-sm"
                  title="Seus créditos"
                >
                  Créditos: R${" "}
                  {currentUser.balance.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-4">
              {cartItems.map((item: any) => {
                const game = getGame(games, item.game_id);
                if (!game) return null;
                const hasDiscount = !!game.discount;
                const priceWithDiscount = getDiscountedPrice({
                  price: game.price,
                  discount: game.discount ?? undefined,
                });
                return (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row items-center gap-4 bg-gray-800 rounded-lg p-3 border border-gray-700"
                  >
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-full max-w-[120px] h-28 object-cover rounded shadow-md border border-cyan-700"
                    />
                    <div className="flex-1 flex flex-col items-center md:items-start gap-1">
                      <span className="text-base md:text-lg font-semibold text-gray-100 text-center md:text-left">
                        {game.title}
                      </span>
                      {/* Categorias do jogo */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {game.tags &&
                          game.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="bg-cyan-900 text-cyan-300 text-xs px-2 py-0.5 rounded-full"
                            >
                              {tag.name}
                            </span>
                          ))}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {hasDiscount ? (
                          <>
                            <span className="text-lg font-bold text-pink-400">
                              R$ {priceWithDiscount}
                            </span>
                            <span className="text-xs line-through text-gray-400">
                              R$ {game.price}
                            </span>
                            <span className="text-xs bg-pink-700 text-white rounded px-2 py-0.5 ml-2">
                              -{game.discount}%
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-cyan-400">
                            R$ {game.price}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="p-2 rounded-full bg-red-700 hover:bg-red-800 text-white transition border border-red-900 ml-0 md:ml-4 mt-2 md:mt-0 flex items-center justify-center"
                      aria-label="Remover do carrinho"
                      onClick={() => handleRemove(item.id)}
                      disabled={removingItemId === item.id}
                    >
                      {removingItemId === item.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end w-full">
              <button
                className="text-red-700 text-xs font-semibold hover:text-red-800"
                onClick={handleClearCart}
              >
                Remover todos
              </button>
            </div>
            {/* Cupom de desconto */}
            <div className="flex flex-col md:flex-row items-center gap-3 mt-6">
              <input
                type="text"
                placeholder="Cupom de desconto"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="flex-1 px-3 py-2 rounded bg-gray-700 border border-cyan-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                aria-label="Cupom de desconto"
              />
              <button
                className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition mt-2 md:mt-0"
                onClick={() => applyCoupon(coupon)}
              >
                Aplicar Cupom
              </button>
            </div>
            {couponError && (
              <div className="text-red-400 text-xs mt-1">{couponError}</div>
            )}
            {/* Resumo do pedido */}
            <div className="bg-gray-800 rounded-lg p-4 border border-cyan-700 mt-6 flex flex-col gap-2 w-full mx-auto">
              <div className="flex justify-between text-gray-300 text-sm">
                <span>Subtotal</span>
                <span>
                  R${" "}
                  {subtotal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-pink-400 text-sm">
                  <span>Desconto</span>
                  <span>
                    - R${" "}
                    {discountValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-cyan-400 text-lg font-bold border-t border-cyan-700 pt-2 mt-2">
                <span>Total</span>
                <span>
                  R${" "}
                  {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            {/* Botão de finalizar compra */}
            <button
              className="w-full mt-6 py-3 rounded bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg transition"
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
            >
              {checkingOut ? <Loader2 size={24} className="animate-spin mx-auto" /> : "Finalizar Compra"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}