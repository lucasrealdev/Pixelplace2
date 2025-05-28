import { useState } from "react";
import { Loader2, X } from "lucide-react";
import Sidebar from "../components/menu/Sidebar";
import Topbar from "../components/menu/Topbar";
import GameCard from "../components/GameCard";
import { useAuth, useWishlist } from "../contexts/AppDataContext";
import { useStoreActions } from "../helpers/useStoreActions";

export default function Wishlist() {
  // Controle do menu lateral
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  // Busca usuário e wishlist do contexto segmentado
  const { currentUser } = useAuth();
  const { wishlistGames } = useWishlist();
  // Busca local
  const [search, setSearch] = useState<string>("");
  // Estado de loading para remoção
  const [removingId, setRemovingId] = useState<number[]>([]);
  const { removeFromWishlist } = useStoreActions();

  // Remove um jogo da wishlist
  const handleRemoveFromWishlist = async (id: number) => {
    if (!currentUser) return;
    setRemovingId((prev) => [...prev, id]);
    await removeFromWishlist(id);
    setRemovingId((prev) => prev.filter((remId) => remId !== id));
  };

  // Filtro de busca
  const filteredGames = wishlistGames.filter((game: typeof wishlistGames[0]) =>
    game.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-800 text-white overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        active="wishlist"
      />
      <div className="flex-1 flex flex-col lg:ml-0 w-full">
        <Topbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          placeholder="Buscar na Lista de Desejos"
          searchValue={search}
          onSearchChange={setSearch}
        />
        <div className="flex-1 overflow-auto p-3 md:p-4">
          <div className="max-w-8xl mx-auto">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-medium flex items-center">
                  Lista de Desejos
                  <span className="text-pink-400 ml-2">
                    ({filteredGames.length} jogos)
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 md:gap-4">
                {filteredGames.map((game: typeof wishlistGames[0]) => {
                  const isLoading = removingId.includes(game.id);
                  return (
                    <GameCard
                      key={game.id}
                      game={game}
                      showTags={true}
                      showPrice={true}
                      primaryLabel={null}
                      secondaryLabel={
                        <span className="flex items-center gap-2">
                          {isLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <X size={16} />
                          )}
                          Remover da Lista
                        </span>
                      }
                      onSecondaryAction={() => handleRemoveFromWishlist(game.id)}
                      secondaryButtonClass={
                        "w-full py-1 rounded bg-red-700 hover:bg-red-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                      }
                    />
                  );
                })}
                {filteredGames.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-10">
                    Nenhum jogo encontrado na lista de desejos.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}