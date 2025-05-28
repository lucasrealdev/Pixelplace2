import { useMemo, useState } from "react";
import type { Trade } from "../../services/entities";
import type { TradePreview } from "../../helpers/uiHelpers";
import { Check, ArrowRightLeft, X, Loader2, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { useGames, useTrades, usePublicTradeGames, useAllUsers } from "../../contexts/AppDataContext";
import { buildTradePreview, tradeToModalData } from "../../helpers/uiHelpers";
import { toast } from "react-toastify";
import { useTradeActions } from "../../helpers/useTradeActions";

function renderGames(games: { image: string; title: string }[]) {
  const max = 2;
  return (
    <div className="flex gap-1">
      {games.slice(0, max).map((g) => (
        <img key={g.title} src={g.image} alt={g.title} title={g.title} className="w-7 h-7 object-cover rounded" />
      ))}
      {games.length > max && (
        <div className="w-7 h-7 flex items-center justify-center bg-gray-700 rounded text-cyan-300 text-xs font-semibold">+{games.length - max}</div>
      )}
    </div>
  );
}

interface Props {
  trades: Trade[];
  currentUserId: number;
  limit?: number;
}

export default function TradePreviewList({ trades, currentUserId }: Props) {
  const { games } = useGames();
  const { allUserGames } = usePublicTradeGames();
  const { allUsers } = useAllUsers();
  const { tradeUserGameMap } = useTrades();
  const { acceptTrade, rejectTrade } = useTradeActions();
  const [accepted, setAccepted] = useState<number[]>([]);
  const [rejected, setRejected] = useState<number[]>([]);
  const [modal, setModal] = useState<{ preview: TradePreview; trade: Trade } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const notify = (msg: string, type: "success" | "error") =>
    toast[type](msg, {
      theme: "dark",
      className: `bg-gray-900 text-${type === "success" ? "green" : "red"}-400 border border-cyan-700`,
      autoClose: 3000,
      position: "top-center",
    });

  const handleAccept = async (id: number) => {
    try {
      await acceptTrade(id);
      setAccepted((a) => [...a, id]);
      notify("Troca realizada com sucesso!", "success");
    } catch (err) {
      setRejected((r) => [...r, id]);
      notify((err as Error).message || "Erro ao aceitar troca.", "error");
    }
  };

  const handleReject = async (id: number) => {
    await rejectTrade(id);
    setRejected((r) => [...r, id]);
    notify("Troca recusada.", "success");
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    await rejectTrade(id);
    setRejected((r) => [...r, id]);
    setDeletingId(null);
    notify("Solicitação removida.", "success");
  };

  const tradePreviews = useMemo(() => {
    return trades
      .filter((t) => !rejected.includes(t.id))
      .sort((a, b) => (new Date(b.created_at || "").getTime()) - (new Date(a.created_at || "").getTime()))
      .slice(0, 3)
      .map((t) => {
        const gamesMap = tradeUserGameMap[t.id] || { offered: [], wanted: [] };
        return {
          preview: buildTradePreview(t, currentUserId, games, allUsers, allUserGames, gamesMap.offered, gamesMap.wanted),
          trade: t
        };
      });
  }, [trades, currentUserId, rejected, games, allUsers, allUserGames, tradeUserGameMap]);

  if (!tradePreviews.length) return <div className="p-4 text-xs text-gray-400">Nenhuma solicitação recente.</div>;

  return (
    <>
      <div className="flex flex-col divide-y divide-gray-800">
        {tradePreviews.map(({ preview: p, trade }) => {
          const isAccepted = accepted.includes(p.id) || p.status === "aceita";
          const isReceived = p.isReceived;
          return (
            <div key={p.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setModal({ preview: p, trade })}
                onKeyDown={(e) => e.key === "Enter" && setModal({ preview: p, trade })}
                className="p-3 flex flex-col gap-1 text-left hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition relative w-full"
              >
                <div className="flex items-center gap-2 mb-1">
                  {isReceived ? <ArrowLeft size={16} className="text-yellow-400" /> : <ArrowRight size={16} className="text-cyan-400" />}
                  <span className="text-xs font-semibold text-gray-200">
                    {isReceived ? "Recebida de" : "Enviada para"} {p.otherUserName}
                  </span>
                  {isAccepted && <span className="ml-auto flex items-center gap-1 text-green-400 text-xs"><Check size={14} />Aceita</span>}
                  {!isAccepted && isReceived && (
                    <span className="ml-auto flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleAccept(p.id); }} className="rounded bg-green-700 hover:bg-green-800 flex justify-center items-center" style={{ width: 25, height: 18 }}><Check size={13} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleReject(p.id); }} className="rounded bg-red-700 hover:bg-red-800 flex justify-center items-center" style={{ width: 25, height: 18 }}><X size={13} /></button>
                    </span>
                  )}
                  {!isAccepted && !isReceived && (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="ml-auto rounded bg-red-700 hover:bg-red-800 flex justify-center items-center" style={{ width: 25, height: 18 }} disabled={deletingId === p.id}>
                      {deletingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isReceived ? (
                    <>
                      {renderGames(p.wantedGames)}
                      <ArrowRightLeft size={14} className="text-cyan-400 mx-1" />
                      {renderGames(p.offeredGames)}
                    </>
                  ) : (
                    <>
                      {renderGames(p.offeredGames)}
                      <ArrowRightLeft size={14} className="text-cyan-400 mx-1" />
                      {renderGames(p.wantedGames)}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <span>{(isReceived ? p.wantedGames : p.offeredGames).length > 1 ? "Seus jogos" : "Seu jogo"}</span>
                  <span className="mx-1">→</span>
                  <span>{(isReceived ? p.offeredGames : p.wantedGames).length > 1 ? "Jogos do usuário" : "Jogo do usuário"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-lg p-6 max-w-[90vw] md:max-w-md w-full border border-cyan-700 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setModal(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X size={20} /></button>
            <h4 className="text-lg font-semibold mb-2 flex items-center gap-2 text-cyan-400">Detalhes da Troca</h4>
            {(() => {
              const map = tradeUserGameMap[modal.trade.id] || { offered: [], wanted: [] };
              const { participants, sentItems, receivedItems, sentLabel, receivedLabel } = tradeToModalData(
                modal.trade, currentUserId, games, allUsers, allUserGames, map.offered, map.wanted
              );
              return (
                <>
                  <div className="text-xs text-gray-400 mb-2">Com: <span className="text-cyan-200 font-semibold">{participants}</span></div>
                  {sentItems?.length > 0 && (
                    <>
                      <div className="mb-2 text-xs text-cyan-300 font-semibold">{sentLabel || "Itens Enviados:"}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                        {sentItems.map((i, idx) => (
                          <div key={i.title + idx} className="flex flex-col items-center bg-gray-800 p-2 rounded border border-cyan-700">
                            <img src={i.image} alt={i.title} className="w-20 h-20 object-cover rounded mb-1" />
                            <span className="text-xs text-gray-200 truncate w-full text-center">{i.title}</span>
                            {i.value !== undefined && <span className="text-xs font-semibold text-cyan-400">{typeof i.value === "number" ? `R$ ${i.value}` : i.value}</span>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {receivedItems?.length > 0 && (
                    <>
                      <div className="mb-2 mt-2 text-xs text-pink-300 font-semibold">{receivedLabel || "Itens Recebidos:"}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                        {receivedItems.map((i, idx) => (
                          <div key={i.title + idx} className="flex flex-col items-center bg-gray-800 p-2 rounded border border-cyan-700">
                            <img src={i.image} alt={i.title} className="w-20 h-20 object-cover rounded mb-1" />
                            <span className="text-xs text-gray-200 truncate w-full text-center">{i.title}</span>
                            {i.value !== undefined && <span className="text-xs font-semibold text-pink-300">{typeof i.value === "number" ? `R$ ${i.value}` : i.value}</span>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
