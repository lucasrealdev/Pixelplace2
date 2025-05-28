import { Repeat, ShoppingCart, XCircle, Clock, CheckCircle } from "lucide-react";
import type { Game } from "../services/entities";

const TYPE_INFO = {
  compra: { icon: <ShoppingCart size={16} className="text-cyan-300" />, label: "Compra" },
  troca: { icon: <Repeat size={16} className="text-cyan-300" />, label: "Troca" },
};

const STATUS_INFO: Record<string, { icon: React.ReactNode; className: string }> = {
  concluida: { icon: <CheckCircle size={15} className="text-green-400" />, className: 'text-green-400 font-bold' },
  pendente: { icon: <Clock size={15} className="text-yellow-400" />, className: 'text-yellow-400 font-bold' },
  cancelada: { icon: <XCircle size={15} className="text-red-400" />, className: 'text-red-400 font-bold' },
};

interface TransactionCardProps {
  type: 'compra' | 'troca';
  status: string;
  value?: number;
  createdAt: string;
  otherUserName?: string;
  sentGames: Game[];
  receivedGames: Game[];
  onClick: () => void;
}

function GameList({ items, label, color }: { items: Game[]; label: string; color: string }) {
  if (!items || items.length === 0) return null;
  const maxToShow = 3;
  const gamesToShow = items.slice(0, maxToShow);
  const extraCount = items.length - maxToShow;
  return (
    <div className="mb-1">
      <span className={`text-xs font-semibold ${color}`}>{label}</span>
      <div className="flex flex-row flex-wrap gap-2">
        {gamesToShow.map((game, idx) => (
          <div key={idx} className="flex flex-col items-center w-full bg-gray-800 rounded-lg p-2 border border-cyan-700">
            <img src={game.image} alt={game.title} className="w-20 h-20 object-cover rounded mb-1" />
            <span className="text-xs text-gray-200 text-center mb-1 truncate w-full">{game.title}</span>
            {(game.price ?? 0) > 0 && (
              <span className={`text-xs font-semibold ${color}`}>R$ {game.price}</span>
            )}
          </div>
        ))}
        {extraCount > 0 && (
          <div className="flex flex-col items-center justify-center w-full max-w-[150px] bg-gray-700 rounded-lg p-2 border border-cyan-700 min-h-[110px]">
            <span className="text-lg font-bold text-cyan-300">+{extraCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TransactionCard({ type, status, value, createdAt, otherUserName, sentGames, receivedGames, onClick }: TransactionCardProps) {
  const typeInfo = TYPE_INFO[type] || { icon: null, label: type };
  const statusInfo = STATUS_INFO[status] || { icon: null, className: '' };
  return (
    <button
      className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex flex-col gap-1 text-left cursor-pointer hover:border-cyan-400 hover:translate-y-[-3px] hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 flex-1 min-w-[200px] max-w-[400px]"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 font-semibold text-cyan-300 mb-1">
        {typeInfo.icon} {typeInfo.label}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
        <span>Status:</span>
        {statusInfo.icon}
        <span className={statusInfo.className}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </div>
      <div className="text-xs text-gray-400 mb-1">Data: {new Date(createdAt).toLocaleString()}</div>
      {otherUserName && (
        <div className="text-xs text-gray-400 mb-1">Com: <span className="text-cyan-200 font-semibold">{otherUserName}</span></div>
      )}
      {(value ?? 0) > 0 && (
        <div className="flex items-center gap-1 text-xs text-cyan-400 font-bold mb-1">
          <span>Valor:</span>
          <span className="text-xs font-bold">R$ {value}</span>
        </div>
      )}
      <GameList items={sentGames} label="Você enviou:" color="text-cyan-300" />
      <GameList items={receivedGames} label="Você recebeu:" color="text-pink-300" />
    </button>
  );
}