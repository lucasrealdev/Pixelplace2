import { useState } from "react";
import { Repeat, Play, Loader2, X } from "lucide-react";
import Sidebar from "../components/menu/Sidebar";
import GameCard from "../components/GameCard";
import TagsFilter from "../components/TagsFilter";
import { useUserGames, useGames } from "../contexts/AppDataContext";
import { getFilteredUserGames } from "../helpers/uiHelpers";
import { useStoreActions } from "../helpers/useStoreActions";
import type { UserGame } from "../services/entities";
import Topbar from "../components/menu/Topbar";
import { usePlayGame } from "../helpers/usePlayGame";

declare global { interface Window { RufflePlayer: any } }

export default function Library() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userGames } = useUserGames();
  const { games, tags } = useGames();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loadingIds, setLoadingIds] = useState<number[]>([]);
  const [loadingGameIds, setLoadingGameIds] = useState<number[]>([]);
  const { playGame, isPlaying, swfUrl, closeEmulator, ruffleContainerRef } = usePlayGame();
  const { addToTrade, removeFromTrade } = useStoreActions();

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleToggleTrade = async (userGame: UserGame) => {
    setLoadingIds((prev) => [...prev, userGame.id]);
    if (userGame.in_trade) {
      await removeFromTrade(userGame);
    } else {
      await addToTrade(userGame);
    }
    setLoadingIds((prev) => prev.filter((id) => id !== userGame.id));
  };

  const handlePlayGame = async (userGame: UserGame) => {
    setLoadingGameIds((prev) => [...prev, userGame.id]);
    await playGame(userGame);
    setTimeout(() => {
      setLoadingGameIds((prev) => prev.filter((id) => id !== userGame.id));
    }, 1000);
  };

  const filteredGames = getFilteredUserGames(userGames, games, search, selectedTags)
    .slice()
    .sort((a, b) => b.id - a.id);

  return (
    <div className="flex h-screen bg-gray-800 text-white overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="library" />
      <div className="flex-1 flex flex-col w-full">
        <Topbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          placeholder="Buscar na Biblioteca"
          searchValue={search}
          onSearchChange={setSearch}
        />
        <div className="flex-1 overflow-auto p-3 md:p-4">
          <TagsFilter
            tags={tags}
            selectedTags={selectedTags}
            onTagsClick={handleTagClick}
            label="Tags"
          />

          <div className="max-w-8xl mx-auto mt-4">
            <h3 className="text-base md:text-lg font-medium flex items-center mb-3">
              Sua Biblioteca
              <span className="text-cyan-400 ml-2">({filteredGames.length} jogos)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 md:gap-4">
              {filteredGames.length > 0 ? (
                filteredGames.map((userGame) => {
                  const isLoading = loadingIds.includes(userGame.id);
                  const isPlayLoading = loadingGameIds.includes(userGame.id);
                  return (
                    <GameCard
                      key={userGame.id}
                      game={userGame.game}
                      showTags
                      showPrice={false}
                      showDiscount={false}
                      onPrimaryAction={() => handlePlayGame(userGame)}
                      primaryLabel={
                        <span className="flex items-center gap-2">
                          {isPlayLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Play size={16} />
                          )} Jogar
                        </span>
                      }
                      onSecondaryAction={() => handleToggleTrade(userGame)}
                      secondaryLabel={
                        <span className="flex items-center gap-2">
                          {isLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Repeat size={16} />
                          )}
                          {userGame.in_trade ? "Remover da troca" : "Adicionar para troca"}
                        </span>
                      }
                      secondaryButtonClass={
                        userGame.in_trade
                          ? "w-full py-1 rounded bg-red-700 hover:bg-red-800 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-cyan-700 transition"
                          : "w-full py-1 rounded bg-blue-900/80 hover:bg-blue-800 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 border border-cyan-700 transition"
                      }
                    />
                  );
                })
              ) : (
                <div className="col-span-full text-center text-gray-400 py-10">
                  Nenhum jogo foi encontrado.
                </div>
              )}
            </div>
          </div>
        </div>

        {isPlaying && swfUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
            <button
              onClick={closeEmulator}
              className="absolute top-4 right-4 text-white bg-red-600 hover:bg-red-700 rounded-full p-2 z-50"
              title="Fechar"
            >
              <X size={20} />
            </button>
            <div className="w-full h-full flex items-center justify-center">
              <div ref={ruffleContainerRef} className="w-full h-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
