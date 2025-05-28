import { Repeat, X, Loader2 } from "lucide-react";
import type { Game, UserGame } from "../../services/entities";
import { getGame } from "../../helpers/uiHelpers";

interface TradeProposeModalProps {
  open: boolean;
  otherGame: Game;
  userGames: UserGame[];
  games: Game[];
  selectedForProposal: number[];
  setSelectedForProposal: React.Dispatch<React.SetStateAction<number[]>>;
  onSend: () => void;
  onClose: () => void;
  proposeLoading?: boolean;
}

export default function TradeProposeModal({
  open,
  otherGame,
  userGames,
  games,
  selectedForProposal,
  setSelectedForProposal,
  onSend,
  onClose,
  proposeLoading = false,
}: TradeProposeModalProps) {
  if (!open) return null;
  const tradableGames = userGames.filter((ug) => ug.in_trade);

  const handleSelect = (gameId: number) => {
    setSelectedForProposal((prev) =>
      prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg p-6 max-w-[90vw] md:max-w-md w-full border border-cyan-700 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={onClose}>
          <X size={20} />
        </button>
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-cyan-400">
          <Repeat size={18} /> Propor Troca
        </h4>
        <div className="mb-4">
          <div className="flex flex-col items-center mb-2">
            <img src={otherGame.image} alt={otherGame.title} className="w-16 h-16 object-cover rounded mb-1" />
            <span className="text-xs text-pink-300">Jogo do usuário</span>
            <span className="text-xs text-gray-200 font-semibold">{otherGame.title}</span>
            <span className="text-xs text-cyan-400 font-semibold">R$ {otherGame.price}</span>
          </div>
          <div className="mb-2 text-xs text-gray-300 text-center">Selecione um ou mais dos seus jogos para propor a troca:</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {tradableGames.length === 0 ? (
              <span className="text-xs text-gray-400">Nenhum jogo seu disponível para troca.</span>
            ) : (
              tradableGames.map((userGame) => {
                const game = getGame(games, userGame.game_id);
              if (!game) return null;
                const selected = selectedForProposal.includes(game.id);
              return (
                <button
                  key={game.id}
                    className={`flex flex-col items-center border rounded p-2 w-25 ${selected ? "border-cyan-400 bg-cyan-900/40" : "border-gray-700 bg-gray-800"}`}
                    onClick={() => handleSelect(game.id)}
                >
                  <img src={game.image} alt={game.title} className="w-10 h-10 object-cover rounded mb-1" />
                  <span className="text-xs text-gray-200 text-center line-clamp-3">{game.title}</span>
                  <span className="text-xs text-cyan-400 font-semibold">R$ {game.price}</span>
                </button>
              );
              })
            )}
          </div>
        </div>
        <button
          className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          onClick={onSend}
          disabled={selectedForProposal.length === 0 || proposeLoading}
        >
          {proposeLoading ? (
            <Loader2 size={16} className="animate-spin mr-1" />
          ) : (
            <Repeat size={16} className="mr-1" />
          )}
          Enviar Proposta
        </button>
      </div>
    </div>
  );
} 