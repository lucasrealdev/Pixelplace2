import React from "react";
import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import type { Game, User } from "../../services/entities";
import { getGame } from "../../helpers/uiHelpers";

interface TradeGamesSectionProps {
  tradeGamesPagination: any;
  filteredTradeGames: any[];
  availableAccounts: User[];
  games: Game[];
  onProposeGameTrade: (game: Game) => void;
  jogosDisponiveisRef: React.RefObject<HTMLDivElement | null>;
}

export default function TradeGamesSection({
  tradeGamesPagination,
  filteredTradeGames,
  availableAccounts,
  games,
  onProposeGameTrade,
  jogosDisponiveisRef,
}: TradeGamesSectionProps) {
  return (
    <div className="mb-4" ref={jogosDisponiveisRef}>
      <h4 className="text-pink-400 font-semibold mb-2">Jogos disponíveis para troca</h4>
      <div className="flex flex-wrap gap-3">
        {tradeGamesPagination.paginated.map((tradeGame: any) => {
          const game = getGame(games, tradeGame.game_id);
          const user = availableAccounts.find(acc => acc.id === tradeGame.user_id);
          if (!game || !user) return null;
          return (
            <div key={tradeGame.id} className="bg-gray-900 rounded-lg p-3 flex flex-col items-center w-39 border border-gray-700">
              <img src={game.image} alt={game.title} className="w-full h-16 object-cover rounded mb-2" />
              <span className="text-xs text-gray-200 text-center mb-1">{game.title}</span>
              <span className="text-xs text-cyan-400 font-semibold mb-1">R$ {game.price}</span>
              <span className="text-xs text-gray-400 mb-2">de {user.userName}</span>
              <div className="flex items-end w-full">
                <button className="w-full py-1 rounded bg-green-700 hover:bg-green-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition" onClick={() => onProposeGameTrade(game)}>
                  <Repeat size={14} /> Propor Troca
                </button>
              </div>
            </div>
          );
        })}
        {filteredTradeGames.length === 0 && (
          <span className="text-xs text-gray-400">Nenhum jogo disponível para troca.</span>
        )}
      </div>
      {/* Paginação se houver mais de uma página */}
      {tradeGamesPagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-center mt-4 gap-2">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full border border-cyan-700 bg-gray-800 text-cyan-400 hover:bg-cyan-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed" onClick={tradeGamesPagination.goToPrev} disabled={tradeGamesPagination.page === 0} aria-label="Previous page">
              <ChevronLeft size={22} />
            </button>
            <span className="text-xs text-gray-400">Página {tradeGamesPagination.page + 1} de {Math.max(tradeGamesPagination.totalPages, 1)}</span>
            <button className="p-2 rounded-full border border-cyan-700 bg-gray-800 text-cyan-400 hover:bg-cyan-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed" onClick={tradeGamesPagination.goToNext} disabled={tradeGamesPagination.page >= tradeGamesPagination.totalPages - 1} aria-label="Next page">
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 