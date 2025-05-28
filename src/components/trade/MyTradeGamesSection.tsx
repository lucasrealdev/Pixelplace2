import { ChevronLeft, ChevronRight, Repeat, Loader2 } from "lucide-react";
import type { Game } from "../../services/entities";
import { getGame } from "../../helpers/uiHelpers";
import { useState } from "react";

interface MyTradeGamesSectionProps {
  userGames: any[];
  games: Game[];
  myGamesPagination: any;
  toggleGameTrade: (userGameId: number) => Promise<void>;
}

export default function MyTradeGamesSection({ userGames, games, myGamesPagination, toggleGameTrade }: MyTradeGamesSectionProps) {
  // Estado de loading por jogo
  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  const handleToggle = async (userGameId: number) => {
    setLoadingIds((ids) => [...ids, userGameId]);
    await toggleGameTrade(userGameId);
    setLoadingIds((ids) => ids.filter((id) => id !== userGameId));
  };

  return (
    <div className="mb-4">
      <h4 className="text-cyan-400 font-semibold mb-2">Seus jogos disponíveis para troca</h4>
      <div className="flex flex-wrap gap-3">
        {userGames.length === 0 && (
          <span className="text-xs text-gray-400">Nenhum jogo disponível para troca.</span>
        )}
        {myGamesPagination.paginated.map((userGame: any) => {
          const game = getGame(games, userGame.game_id);
          if (!game) return null;
          const isLoading = loadingIds.includes(userGame.id);
          return (
            <div key={game.id} className={`bg-gray-900 rounded-lg p-3 flex flex-col items-center w-39 border ${userGame.in_trade ? "border-cyan-400" : "border-gray-700"}`}>
              <img src={game.image} alt={game.title} className="w-full h-20 object-cover rounded mb-2" />
              <span className="text-xs text-gray-200 text-center mb-1">{game.title}</span>
              <span className="text-xs text-cyan-400 font-semibold mb-2">R$ {game.price}</span>
              <div className="flex-1 flex items-end">
                <button
                  className={`w-full p-1 rounded text-xs font-semibold flex items-center justify-center gap-1 transition ${userGame.in_trade ? "bg-red-700 hover:bg-red-800 text-white" : "bg-cyan-600 hover:bg-cyan-700 text-white"}`}
                  onClick={() => handleToggle(userGame.id)}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Repeat size={14} className="mx-1" />}
                  {userGame.in_trade ? "Remover da troca" : "Adicionar à troca"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Paginação se houver mais de uma página */}
      {myGamesPagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-center mt-4 gap-2">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full border border-cyan-700 bg-gray-800 text-cyan-400 hover:bg-cyan-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed" onClick={myGamesPagination.goToPrev} disabled={myGamesPagination.page === 0} aria-label="Previous page">
              <ChevronLeft size={22} />
            </button>
            <span className="text-xs text-gray-400">Página {myGamesPagination.page + 1} de {Math.max(myGamesPagination.totalPages, 1)}</span>
            <button className="p-2 rounded-full border border-cyan-700 bg-gray-800 text-cyan-400 hover:bg-cyan-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed" onClick={myGamesPagination.goToNext} disabled={myGamesPagination.page >= myGamesPagination.totalPages - 1} aria-label="Next page">
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 