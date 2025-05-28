import {
  toggleUserGameTradeStatus,
  updateTradeStatus,
  addTrade,
  updateUserAccountTradeStatus,
  deleteTradeAndGames,
  addTransaction,
  addTransactionGame,
  transferMultipleUserGames,
  addTradeUserGames,
} from "../services/dataService";
import {
  useUserGames,
  useTrades,
  usePublicTradeGames,
  useAuth,
  useTransactions,
} from "../contexts/AppDataContext";

export function useTradeActions() {
  const { trades, tradeUserGameMap, reloadTrades } = useTrades();
  const { reloadUserGames } = useUserGames();
  const { allUserGames, reloadPublicTrades } = usePublicTradeGames();
  const { reloadUser } = useAuth();
  const { reloadTransactions } = useTransactions();

  const toggleAccountTrade = async (userId: number, inTrade: boolean) => {
    await updateUserAccountTradeStatus(userId, inTrade);
    reloadUser();
  };

  const toggleGameTrade = async (userGameId: number) => {
    await toggleUserGameTradeStatus(userGameId);
    await reloadUserGames();
  };

  const proposeGameTrade = async ({
    requesterId,
    responderId,
    offeredUserGameIds,
    wantedUserGameIds,
    isAccount,
  }: {
    requesterId: number;
    responderId: number;
    offeredUserGameIds: number[];
    wantedUserGameIds: number[];
    isAccount: boolean;
  }) => {
    // Impedir propostas duplicadas
    if (isAccount) {
      // Não permitir mais de uma proposta pendente de conta entre os mesmos usuários
      const hasDuplicate = trades.some(
        (t) =>
          t.status === "pendente" &&
          t.type === "conta" &&
          ((t.requester_id === requesterId && t.responder_id === responderId) ||
            (t.requester_id === responderId && t.responder_id === requesterId))
      );
      if (hasDuplicate) {
        throw new Error("Já existe uma proposta de troca de conta pendente entre esses usuários.");
      }
    } else {
      // Não permitir mais de uma proposta pendente de jogo entre os mesmos usuários para os mesmos jogos
      const hasDuplicate = trades.some((t) => {
        if (
          t.status !== "pendente" ||
          t.type !== "jogo" ||
          !(
            (t.requester_id === requesterId && t.responder_id === responderId) ||
            (t.requester_id === responderId && t.responder_id === requesterId)
          )
        ) {
          return false;
        }
        const map = tradeUserGameMap[t.id];
        if (!map) return false;
        // Checa se os jogos oferecidos e/ou desejados batem (em qualquer ordem)
        const offeredSet = new Set(map.offered);
        const wantedSet = new Set(map.wanted);
        const offeredEqual =
          offeredSet.size === offeredUserGameIds.length &&
          offeredUserGameIds.every((id) => offeredSet.has(id));
        const wantedEqual =
          wantedSet.size === wantedUserGameIds.length &&
          wantedUserGameIds.every((id) => wantedSet.has(id));
        // Considera duplicada se os dois lados batem
        return offeredEqual && wantedEqual;
      });
      if (hasDuplicate) {
        throw new Error("Já existe uma proposta de troca pendente para esses jogos entre esses usuários.");
      }
    }

    if (!isAccount) {
      const allIds = [...offeredUserGameIds, ...wantedUserGameIds];

      // 🎯 LOGS CURTOS E PRECISOS
      const invalids = allIds.filter((id) => {
        const ug = allUserGames.find((g) => g.id === id);
        return !ug || !ug.in_trade;
      });

      if (invalids.length) {
        throw new Error("Um ou mais jogos não estão disponíveis para troca.");
      }
    }

    const trade = await addTrade({
      requester_id: requesterId,
      responder_id: responderId,
      status: "pendente",
      type: isAccount ? "conta" : "jogo",
      responded_at: null,
    });

    await addTradeUserGames(trade.id, offeredUserGameIds, wantedUserGameIds);
    await reloadTrades();
  };

  const acceptTrade = async (tradeId: number) => {
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) throw new Error("Troca não encontrada.");

    const { offered = [], wanted = [] } = tradeUserGameMap[tradeId] || {};

    // Buscar os itens (jogos ou contas)
    const offeredItems = offered
      .map((id) => allUserGames.find((g) => g.id === id))
      .filter(Boolean);
    const wantedItems = wanted
      .map((id) => allUserGames.find((g) => g.id === id))
      .filter(Boolean);

    // Validação de existência
    if (
      offeredItems.length !== offered.length ||
      wantedItems.length !== wanted.length
    ) {
      rejectTrade(tradeId);
      throw new Error("Um ou mais itens da troca não foram encontrados. (Troca Removida)");
    }

    // Validação adicional apenas para troca de jogos
    if (trade.type === "jogo") {
      const allValid = [...offeredItems, ...wantedItems].every(
        (g) => g && g.in_trade
      );
      if (!allValid) {
        rejectTrade(tradeId);
        throw new Error("Um ou mais jogos não estão disponíveis para troca. (Troca Removida)");
      }
    }

    // Transferência dos itens
    const offeredIds = offeredItems.map((g) => g!.id);
    const wantedIds = wantedItems.map((g) => g!.id);
    await transferMultipleUserGames(offeredIds, trade.responder_id);
    await transferMultipleUserGames(wantedIds, trade.requester_id);

    // Atualizar status da troca
    const completedAt = new Date().toISOString();
    await updateTradeStatus(tradeId, "aceita", completedAt);

    // Criar transação
    const tx = await addTransaction({
      user_id: trade.requester_id,
      other_user_id: trade.responder_id,
      type: "troca",
      status: "concluida",
      value: 0,
      completed_at: completedAt,
    });

    // Adicionar itens à transação
    for (const g of wantedItems) {
      if (g)
        await addTransactionGame({
          transaction_id: tx.id,
          game_id: g.game_id,
          price_at_purchase: 0,
          direction: "received",
        });
    }
    for (const g of offeredItems) {
      if (g)
        await addTransactionGame({
          transaction_id: tx.id,
          game_id: g.game_id,
          price_at_purchase: 0,
          direction: "sent",
        });
    }

    // Recarregar dados
    await reloadTrades();
    await reloadUserGames();
    await reloadPublicTrades();
    await reloadTransactions();
  };

  const rejectTrade = async (tradeId: number) => {
    await deleteTradeAndGames(tradeId);
    await reloadTrades();
    await reloadUserGames();
  };

  return {
    toggleAccountTrade,
    toggleGameTrade,
    proposeGameTrade,
    acceptTrade,
    rejectTrade,
  };
}
