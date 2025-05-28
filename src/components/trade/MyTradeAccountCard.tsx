import { LogOut, Loader2 } from "lucide-react";
import type { Game, User } from "../../services/entities";
import { getUserGamesByUser, getGame, formatDateToBR } from "../../helpers/uiHelpers";

interface MyTradeAccountCardProps {
  currentUser: User | null;
  allUserGames: any[];
  games: Game[];
  accountLoading: boolean;
  setAccountLoading: (v: boolean) => void;
  toggleAccountTrade: (userId: number, inTrade: boolean) => Promise<void>;
}

export default function MyTradeAccountCard({ currentUser, allUserGames, games, accountLoading, setAccountLoading, toggleAccountTrade }: MyTradeAccountCardProps) {
  if (!currentUser) return null;
  const userGames = getUserGamesByUser(allUserGames, currentUser.id);
  if (userGames.length === 0) return null;
  const maxToShow = 3;
  const gamesToShow = userGames.slice(0, maxToShow);
  const extraGames = userGames.length - maxToShow;
  return (
    <div className="mb-4">
      <h4 className="text-cyan-400 font-semibold mb-2">Sua Conta Principal</h4>
      <div className="bg-gray-900 rounded-lg p-4 flex flex-col w-full max-w-md border border-cyan-400 mb-4">
        <span className="text-sm font-semibold text-gray-100 mb-2">{currentUser.userName}</span>
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
          {extraGames > 0 && (
            <div className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded text-cyan-300 text-xs font-semibold">
              +{extraGames}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400 mb-2">Criada em: {formatDateToBR(currentUser.created_at)}</span>
        <button
          className={`mt-2 w-full py-2 rounded ${currentUser.is_account_in_trade ? 'bg-red-700 hover:bg-red-800' : 'bg-pink-600 hover:bg-pink-700'} text-white font-semibold text-sm flex items-center justify-center gap-2 transition px-2`}
          onClick={async () => {
            setAccountLoading(true);
            await toggleAccountTrade(currentUser.id, !currentUser.is_account_in_trade);
            setAccountLoading(false);
          }}
          disabled={accountLoading}
        >
          {accountLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : <LogOut size={16} />}
          {currentUser.is_account_in_trade ? 'Remover Conta da Troca' : 'Colocar Conta para Troca'}
        </button>
      </div>
    </div>
  );
} 