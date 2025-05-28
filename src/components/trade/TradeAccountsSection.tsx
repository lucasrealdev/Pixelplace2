import { Info, ChevronRight, ChevronLeft } from "lucide-react";
import type { Game, User } from "../../services/entities";
import { getUserGamesByUser, getGame, formatDateToBR } from "../../helpers/uiHelpers";

interface TradeAccountsSectionProps {
  accountsPagination: any;
  filteredAccounts: User[];
  allUserGames: any[];
  games: Game[];
  showAccountDetailModal: (account: User) => void;
  onProposeAccountTrade: (account: User) => void;
}

export default function TradeAccountsSection({
  accountsPagination,
  filteredAccounts,
  allUserGames,
  games,
  showAccountDetailModal,
  onProposeAccountTrade,
}: TradeAccountsSectionProps) {
  return (
    <div className="mb-4">
      <h4 className="text-pink-400 font-semibold mb-2">
        Contas disponíveis para troca
      </h4>
      <div className="flex flex-wrap gap-3">
        {accountsPagination.paginated.map((account: User) => {
          // Busca os jogos da conta e limita a exibição a 3 jogos
          const userGames = getUserGamesByUser(allUserGames, account.id);
          const maxToShow = 3;
          const gamesToShow = userGames.slice(0, maxToShow);
          const extraGames = userGames.length - maxToShow;
          return (
            <div
              key={account.id}
              className="bg-gray-900 rounded-lg p-3 flex flex-col border border-gray-700 cursor-pointer hover:border-cyan-400 transition min-w-[170px]"
              onClick={() => showAccountDetailModal(account)}
            >
              {/* Nome do usuário e ícone de info */}
              <span className="text-sm font-semibold text-gray-100 mb-2 flex items-center gap-1">
                {account.userName}
              </span>
              {/* Miniaturas dos jogos da conta */}
              <div className="flex flex-wrap gap-1 mb-2">
                {gamesToShow.map((userGame: any) => {
                  const game = getGame(games, userGame.game_id);
                  if (!game) return null;
                  return (
                    <img
                      key={game.id}
                      src={game.image}
                      alt={game.title}
                      className="w-8 h-8 object-cover rounded"
                      title={game.title}
                    />
                  );
                })}
                {/* Exibe +N se houver mais jogos */}
                {extraGames > 0 && (
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded text-cyan-300 text-xs font-semibold">
                    +{extraGames}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-400 mb-2">
                Criado em: {formatDateToBR(account.created_at)}
              </span>
              {/* Botão para propor troca de conta */}
              <button
                className="w-full py-1 rounded bg-green-700 hover:bg-green-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  onProposeAccountTrade(account);
                }}
              >
                <Info size={14} /> Ver Detalhes
              </button>
            </div>
          );
        })}
        {/* Mensagem caso não haja contas disponíveis */}
        {filteredAccounts.length === 0 && (
          <span className="text-xs text-gray-400">
            Nenhuma conta disponível para troca.
          </span>
        )}
      </div>
      {/* Paginação */}
      {accountsPagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-center mt-4 gap-2">
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-full border border-cyan-700 bg-gray-800 text-cyan-400 hover:bg-cyan-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={accountsPagination.goToPrev}
              disabled={accountsPagination.page === 0}
              aria-label="Previous page"
            >
              <ChevronLeft size={22} />
            </button>
            <span className="text-xs text-gray-400">
              Página {accountsPagination.page + 1} of{" "}
              {Math.max(accountsPagination.totalPages, 1)}
            </span>
            <button
              className="p-2 rounded-full border border-cyan-700 bg-gray-800 text-cyan-400 hover:bg-cyan-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={accountsPagination.goToNext}
              disabled={
                accountsPagination.page >= accountsPagination.totalPages - 1
              }
              aria-label="Next page"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}