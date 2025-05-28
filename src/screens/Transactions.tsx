import { useState } from "react";
import type { Game, Transaction, TransactionGame, User } from "../services/entities";
import { Repeat, ShoppingCart, XCircle, Clock, CheckCircle } from "lucide-react";
import Sidebar from "../components/menu/Sidebar";
import Topbar from "../components/menu/Topbar";
import TransactionCard from "../components/TransactionCard";
import { useTransactions, useGames, useAccounts } from "../contexts/AppDataContext";
import { getGame, mapGamesById } from "../helpers/uiHelpers";
import { useAuth } from "../contexts/AppDataContext";

const STATUS_ICONS = {
  concluida: <CheckCircle size={12} className="text-green-400" />,
  pendente: <Clock size={15} className="text-yellow-400" />,
  cancelada: <XCircle size={15} className="text-red-400" />,
};

function StatusLabel({ status }: { status: string }) {
  const statusClass =
    status === "concluida"
      ? "text-green-400 font-bold text-sm"
      : status === "pendente"
        ? "text-yellow-400 font-bold text-sm"
        : status === "cancelada"
          ? "text-red-400 font-bold text-sm"
          : "";
  return (
    <span className="flex items-center gap-2">
      {STATUS_ICONS[status as keyof typeof STATUS_ICONS]}
      <span className={statusClass}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </span>
  );
}

function ValueLabel({ value }: { value?: number }) {
  if (!value || value <= 0) return null;
  return (
    <div className="flex items-center gap-1 text-xs text-cyan-400 font-bold">
      <span>Valor:</span>
      <span className="text-xs font-bold">R$ {value}</span>
    </div>
  );
}

function UserName({ userId, users }: { userId?: number; users: User[] }) {
  if (!userId) return null;
  const user = users.find((u) => u.id === userId);
  return user ? <span className="text-cyan-200 font-semibold">{user.userName}</span> : null;
}

function GameList({ items, color }: { items: { image: string; title: string; value?: number }[]; color: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full mb-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center w-full bg-gray-800 rounded-lg p-2 border border-cyan-700"
        >
          <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded mb-1" />
          <span className="text-xs text-gray-200 text-center mb-1 truncate w-full">{item.title}</span>
          {typeof item.value === "number" && item.value > 0 && (
            <span className={`text-xs font-semibold ${color}`}>R$ {item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Transactions() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { transactions } = useTransactions();
  const { games } = useGames();
  const { availableAccounts } = useAccounts();
  const [search, setSearch] = useState("");
  const [modalTx, setModalTx] = useState<Transaction | null>(null);
  const [sentGames, setSentGames] = useState<TransactionGame[]>([]);
  const [receivedGames, setReceivedGames] = useState<TransactionGame[]>([]);
  const { currentUser } = useAuth();

  const sorted = [...transactions].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return db - da;
  });
  const filtered = search.trim() === ""
    ? sorted
    : sorted.filter((t) => String(t.value).includes(search));

  async function openModal(tx: Transaction) {
    setSentGames(tx.sentGames || []);
    setReceivedGames(tx.receivedGames || []);
    setModalTx(tx);
  }

  return (
    <div className="flex h-screen bg-gray-800 text-white overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="transactions" />
      <div className="flex-1 flex flex-col w-full">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} placeholder="Procurar transações" searchValue={search} onSearchChange={setSearch} />
        <div className="flex-1 overflow-auto p-3 md:p-4">
          <div className="max-w-8xl mx-auto">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-medium flex items-center">
                  Suas Transações
                  <span className="text-cyan-400 ml-2">
                    ({filtered.length} transações)
                  </span>
                </h3>
              </div>
              <div className="flex flex-row flex-wrap gap-3">
                {filtered.map((tx) => {
                  const isCurrentUserSender = tx.user_id === currentUser?.id;

                  // Encontra o outro usuário com base no contexto da transação
                  const otherUserId = isCurrentUserSender ? tx.other_user_id : tx.user_id;
                  const otherUser = availableAccounts.find(u => u.id === otherUserId);
                  const otherUserName = otherUser
                    ? otherUser.userName
                    : otherUserId
                      ? `Usuário #${otherUserId}`
                      : undefined;

                  // Corrige tipagem dos games
                  const sentGames = (
                    isCurrentUserSender
                      ? tx.sentGames?.map(g => getGame(games, g.game_id)).filter((g): g is Game => !!g)
                      : tx.receivedGames?.map(g => getGame(games, g.game_id)).filter((g): g is Game => !!g)
                  ) ?? [];

                  const receivedGames = (
                    isCurrentUserSender
                      ? tx.receivedGames?.map(g => getGame(games, g.game_id)).filter((g): g is Game => !!g)
                      : tx.sentGames?.map(g => getGame(games, g.game_id)).filter((g): g is Game => !!g)
                  ) ?? [];

                  return (
                    <TransactionCard
                      key={tx.id}
                      type={tx.type as 'compra' | 'troca'}
                      status={tx.status}
                      value={tx.value}
                      createdAt={tx.created_at}
                      otherUserName={otherUserName}
                      sentGames={sentGames}
                      receivedGames={receivedGames}
                      onClick={() => openModal(tx)}
                    />
                  );
                })}
                {filtered.length === 0 && (
                  <div className="col-span-full text-center text-gray-400">
                    Nenhuma transação encontrada.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {modalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-lg p-6 max-w-[90vw] md:max-w-md w-full border border-cyan-700 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setModalTx(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white"><XCircle size={20} /></button>
            <h4 className="text-lg font-semibold mb-2 flex items-center gap-2 text-cyan-400">
              {modalTx.type === 'troca' ? <Repeat size={16} className="text-cyan-300" /> : <ShoppingCart size={16} className="text-cyan-300" />}
              {modalTx.type === 'troca' ? 'Troca' : 'Compra'}
            </h4>
            <div className="flex flex-col gap-1">
              <StatusLabel status={modalTx.status} />
              <div className="text-xs text-gray-400">Data: {modalTx.created_at ? new Date(modalTx.created_at).toLocaleString() : '-'}</div>
              {modalTx.other_user_id && (
                <div className="text-xs text-gray-400 mb-2">Com: <UserName userId={modalTx.other_user_id} users={availableAccounts} /></div>
              )}
              <ValueLabel value={modalTx.value} />
            </div>
            {sentGames.length > 0 && (
              <>
                <div className="mb-2 text-xs text-cyan-300 font-semibold">Você enviou:</div>
                <GameList items={mapGamesById(sentGames.map(g => ({ gameId: g.game_id, priceAtPurchase: g.price_at_purchase })), games)} color="text-cyan-400" />
              </>
            )}
            {receivedGames.length > 0 && (
              <>
                <div className="mb-2 mt-2 text-xs text-pink-300 font-semibold">Você recebeu:</div>
                <GameList items={mapGamesById(receivedGames.map(g => ({ gameId: g.game_id, priceAtPurchase: g.price_at_purchase })), games)} color="text-pink-300" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}