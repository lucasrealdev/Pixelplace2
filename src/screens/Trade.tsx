import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { LogOut, Mail, Info, Loader2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Topbar from "../components/menu/Topbar";
import Sidebar from "../components/menu/Sidebar";
import TradeProposeModal from "../components/trade/TradeProposeModal";
import TradePreviewList from "../components/trade/TradePreviewList";
import MainAccountCard from "../components/trade/MyTradeAccountCard";
import AvailableTradeGamesSection from "../components/trade/TradeGamesSection";
import MyTradeGamesSection from "../components/trade/MyTradeGamesSection";
import AvailableAccountsSection from "../components/trade/TradeAccountsSection";
import {
  useUserGames,
  usePublicTradeGames,
  useAccounts,
  useTrades,
  useGames,
  useAuth,
} from "../contexts/AppDataContext";
import {
  formatDateToBR,
  getGame,
  usePaginatedList,
} from "../helpers/uiHelpers";
import { useTradeActions } from "../helpers/useTradeActions";
import { toast } from "react-toastify";
import type { Game, User, UserGame } from "../services/entities";

// 🔹 Filtro local
function useTradeFilters(search: string, allUserGames: UserGame[], publicTradeGames: UserGame[], availableAccounts: User[], games: Game[], currentUserId?: number) {
  const userGamesMap = useMemo(() => {
    const map = new Map<number, UserGame[]>();
    allUserGames.forEach(ug => {
      if (!map.has(ug.user_id)) map.set(ug.user_id, []);
      map.get(ug.user_id)!.push(ug);
    });
    return map;
  }, [allUserGames]);

  const filterText = (text: string) => text.toLowerCase().includes(search.toLowerCase());

  const filteredTradeGames = useMemo(() =>
    publicTradeGames
      .filter(ug => ug.user_id !== currentUserId)
      .filter(ug => {
        const game = getGame(games, ug.game_id);
        return game ? filterText(game.title) : false;
      })
      .sort((a, b) => b.id - a.id)
  , [search, publicTradeGames, games, currentUserId]);

  const filteredAccounts = useMemo(() =>
    availableAccounts
      .filter(acc => acc.id !== currentUserId)
      .filter(acc => {
        const gamesList = userGamesMap.get(acc.id) || [];
        return filterText(acc.userName) || gamesList.some(ug => {
          const game = getGame(games, ug.game_id);
          return game && filterText(game.title);
        });
      })
      .sort((a, b) => b.id - a.id)
  , [search, availableAccounts, games, userGamesMap, currentUserId]);

  return {
    filteredTradeGames,
    filteredAccounts,
    getUserGamesByUserId: (id: number) => userGamesMap.get(id) || [],
  };
}

export default function Trade() {
  const { userGames, reloadUserGames } = useUserGames();
  const { allUserGames, publicTradeGames } = usePublicTradeGames();
  const { availableAccounts } = useAccounts();
  const { trades } = useTrades();
  const { games } = useGames();
  const { currentUser } = useAuth();
  const { toggleAccountTrade, toggleGameTrade, proposeGameTrade } = useTradeActions();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGameIds, setSelectedGameIds] = useState<number[]>([]);
  const [activeModal, setActiveModal] = useState<{ type: "propose"; otherGame: Game } | null>(null);
  const [accountDetailModal, setAccountDetailModal] = useState<User | null>(null);
  const [accountDetailLoading, setAccountDetailLoading] = useState(false);
  const [proposeLoading, setProposeLoading] = useState(false);

  const jogosDisponiveisRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const PAGE_SIZE = 4;
  const orderedUserGames = [...userGames].sort((a, b) => a.id - b.id);

  const {
    filteredTradeGames,
    filteredAccounts,
    getUserGamesByUserId,
  } = useTradeFilters(search, allUserGames, publicTradeGames, availableAccounts, games, currentUser?.id);

  const tradeGamesPagination = usePaginatedList(filteredTradeGames, PAGE_SIZE);
  const accountsPagination = usePaginatedList(filteredAccounts, PAGE_SIZE);
  const myGamesPagination = usePaginatedList(orderedUserGames, PAGE_SIZE);

  const onProposeGameTrade = useCallback((game: Game) => {
    setSelectedGameIds([]);
    setActiveModal({ type: "propose", otherGame: game });
  }, []);
  const closeModal = () => setActiveModal(null);
  const showAccountDetailModal = (account: User) => setAccountDetailModal(account);
  const hideAccountDetailModal = () => setAccountDetailModal(null);

  const handleGamePropose = async () => {
    setProposeLoading(true);
    await reloadUserGames();
    const offeredIds = userGames.filter(ug => selectedGameIds.includes(ug.game_id) && ug.in_trade).map(ug => ug.id);
    const otherUG = publicTradeGames.find(ug => ug.game_id === activeModal?.otherGame.id && ug.in_trade);
    if (!otherUG || offeredIds.length !== selectedGameIds.length) {
      toast.error("Um ou mais jogos não estão mais disponíveis.");
      closeModal();
      setProposeLoading(false);
      return;
    }
    try {
      await proposeGameTrade({
        requesterId: currentUser?.id ?? 0,
        responderId: otherUG.user_id,
        offeredUserGameIds: offeredIds,
        wantedUserGameIds: [otherUG.id],
        isAccount: false,
      });
      toast.success("Proposta enviada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar proposta.");
    }
    setSelectedGameIds([]);
    closeModal();
    setProposeLoading(false);
  };

  const handleAccountPropose = async () => {
    setAccountDetailLoading(true);
    try {
      await proposeGameTrade({
        requesterId: currentUser!.id,
        responderId: accountDetailModal!.id,
        offeredUserGameIds: userGames.map(g => g.id),
        wantedUserGameIds: getUserGamesByUserId(accountDetailModal!.id).map(g => g.id),
        isAccount: true,
      });
      toast.success("Proposta enviada!");
      setAccountDetailModal(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar proposta.");
    }
    setAccountDetailLoading(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get("search");
    if (s) {
      setSearch(s);
      setTimeout(() => {
        jogosDisponiveisRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
    params.delete("search");
    navigate({ search: params.toString() }, { replace: true });
  }, [location.search]);

  return (
    <div className="flex h-screen bg-gray-800 text-white overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="trade" />
      <div className="flex-1 flex flex-col">
        <Topbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Pesquisar jogos, contas ou usuários"
        />
        <div className="flex-1 overflow-auto p-3 md:p-4 flex flex-col gap-6">
          <div className="w-full max-w-xs bg-gray-900 border border-cyan-700 p-4 rounded-lg shadow h-fit">
            <h4 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
              <Mail size={18} /> Solicitações de troca
            </h4>
            <TradePreviewList trades={trades} currentUserId={currentUser?.id ?? 0} limit={10} />
          </div>
          <div className="flex-1 flex flex-col items-start">
            <h3 className="text-base md:text-lg font-medium flex items-center gap-2 mb-4">
              <LogOut className="text-pink-400" size={20} />
              Troca de contas e jogos
            </h3>
            <MainAccountCard
              currentUser={currentUser}
              allUserGames={allUserGames}
              games={games}
              accountLoading={accountDetailLoading}
              setAccountLoading={setAccountDetailLoading}
              toggleAccountTrade={toggleAccountTrade}
            />
            <MyTradeGamesSection
              userGames={orderedUserGames}
              games={games}
              myGamesPagination={myGamesPagination}
              toggleGameTrade={toggleGameTrade}
            />
            <AvailableTradeGamesSection
              tradeGamesPagination={tradeGamesPagination}
              filteredTradeGames={filteredTradeGames}
              availableAccounts={availableAccounts}
              games={games}
              onProposeGameTrade={onProposeGameTrade}
              jogosDisponiveisRef={jogosDisponiveisRef}
            />
            <AvailableAccountsSection
              accountsPagination={accountsPagination}
              filteredAccounts={filteredAccounts}
              allUserGames={allUserGames}
              games={games}
              showAccountDetailModal={showAccountDetailModal}
              onProposeAccountTrade={showAccountDetailModal}
            />
          </div>
        </div>

        {activeModal?.type === "propose" && (
          <TradeProposeModal
            open
            otherGame={activeModal.otherGame}
            userGames={userGames}
            games={games}
            selectedForProposal={selectedGameIds}
            setSelectedForProposal={setSelectedGameIds}
            onSend={handleGamePropose}
            onClose={closeModal}
            proposeLoading={proposeLoading}
          />
        )}

        {accountDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full border border-cyan-700 relative max-h-[90vh] overflow-y-auto">
              <button onClick={hideAccountDetailModal} className="absolute top-2 right-2 text-gray-400 hover:text-white">
                <X size={20} />
              </button>
              <h4 className="text-lg font-semibold mb-2 flex items-center gap-2 text-cyan-400">
                <Info size={18} /> Detalhes da Conta
              </h4>
              <div className="text-sm font-semibold text-gray-200 mb-2">{accountDetailModal.userName}</div>
              <div className="text-xs text-gray-400 mb-2">Criado em: {formatDateToBR(accountDetailModal.created_at)}</div>
              <div className="text-xs text-gray-400 mb-2">Jogos: {getUserGamesByUserId(accountDetailModal.id).length}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                {getUserGamesByUserId(accountDetailModal.id).map(ug => {
                  const game = getGame(games, ug.game_id);
                  return game ? (
                    <div key={game.id} className="flex flex-col items-center bg-gray-800 p-2 rounded border border-cyan-700">
                      <img src={game.image} alt={game.title} className="w-20 h-20 object-cover rounded mb-1" />
                      <span className="text-xs text-center text-gray-200 truncate w-full">{game.title}</span>
                      <span className="text-xs text-cyan-400 font-semibold">R$ {game.price}</span>
                    </div>
                  ) : null;
                })}
              </div>
              <button
                className="w-full py-2 mt-4 rounded bg-green-700 hover:bg-green-800 text-white font-semibold text-sm flex items-center justify-center gap-2"
                onClick={handleAccountPropose}
                disabled={accountDetailLoading}
              >
                {accountDetailLoading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                Propor Troca
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
