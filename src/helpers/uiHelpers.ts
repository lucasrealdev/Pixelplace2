import { useState } from "react";
import { useMemo } from "react";
import type { Game, User, UserGame, Trade, Tag } from "../services/entities";

// ================= DISPONIBILIDADE E DATAS =================
// Verifica se o jogo já foi lançado
export function isGameAvailable(releaseDate?: string): boolean {
  if (!releaseDate) return true;
  // Suporte a formato ISO (ex: 2025-06-30 00:00:00+00)
  if (/^\d{4}-\d{2}-\d{2}/.test(releaseDate)) {
    const release = new Date(releaseDate);
    return release <= new Date();
  }
  // releaseDate no formato "20/05/2025 12:00"
  const [day, month, rest] = releaseDate.split("/");
  if (!rest) return true;
  const [year, time] = rest.split(" ");
  const [hour, minute] = time ? time.split(":") : ["0", "0"];
  const release = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );
  return release <= new Date();
}

// Verifica se o jogo é uma estreia futura
export function isUpcoming(game: { releaseDate?: string }): boolean {
  if (!game.releaseDate) return false;
  let release: Date;
  if (/^\d{4}-\d{2}-\d{2}/.test(game.releaseDate)) {
    // Formato ISO
    release = new Date(game.releaseDate);
  } else {
    // Formato brasileiro "DD/MM/YYYY HH:mm"
    const [day, month, rest] = game.releaseDate.split("/");
    if (!rest) return false;
    const [year, time] = rest.split(" ");
    const [hour, minute] = time ? time.split(":") : ["0", "0"];
    release = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );
  }
  return release > new Date();
}

// Função utilitária para formatar data ISO para DD/MM/AAAA
export function formatDateToBR(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ================= FILTROS E BUSCAS =================
// Filtra jogos da biblioteca por título e tag (O(n))
export function getFilteredUserGames(
  userGames: UserGame[],
  games: Game[],
  search: string,
  selectedTags: string[]
) {
  const searchLower = search.toLowerCase();
  return userGames.reduce((acc: any[], userGame) => {
    const game = getGame(games, userGame.game_id);
    if (!game) return acc;
    const matchTitle = game.title.toLowerCase().includes(searchLower);
    const matchTag =
      selectedTags.length === 0 ||
      (game.tags?.some((tag) => selectedTags.includes(tag.name)) ?? false);
    if (matchTitle && matchTag) acc.push({ ...userGame, game });
    return acc;
  }, []);
}

// Busca o Game correspondente a um game_id (O(n))
export function getGame(games: Game[], game_id: number): Game | undefined {
  return games.find((g) => g.id === game_id);
}

// Busca todos os UserGame de um usuário (O(n))
export function getUserGamesByUser(
  userGames: UserGame[],
  user_id: number
): UserGame[] {
  return userGames.filter((ug) => ug.user_id === user_id);
}

// Pega os primeiros N itens que batem um filtro (O(n))
export function getFirstNFiltered<T>(
  arr: T[],
  filterFn: (item: T) => boolean,
  n: number
): T[] {
  const result: T[] = [];
  for (const item of arr) {
    if (filterFn(item)) {
      result.push(item);
      if (result.length === n) break;
    }
  }
  return result;
}

// ================= ORDENAÇÃO E PREÇO =================
// Calcula preço com desconto (O(1))
export function getDiscountedPrice(game: {
  price: number;
  discount?: number;
}): number {
  if (!game.discount) return game.price;
  return Math.round(game.price * (1 - game.discount / 100));
}

// Ordena por data de criação desc (O(1) para cada comparação)
export function sortByCreatedAtDesc<T extends { created_at?: string }>(
  a: T,
  b: T
) {
  const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
  const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
  return dateB - dateA;
}

// Preview utilitário
export function getItemPreview(
  item: { type: "game" | "games" | "account"; item: any },
  games: Game[],
  users: User[]
): { image: string; title: string } {
  if (item.type === "game") {
    const game =
      typeof item.item === "number"
        ? games.find((g) => g.id === item.item)
        : item.item;
    return {
      image: game?.image || "",
      title: game?.title || "",
    };
  }
  if (item.type === "games") {
    const gamesArr = Array.isArray(item.item) ? item.item : [];
    const firstGame =
      typeof gamesArr[0] === "number"
        ? games.find((g) => g.id === gamesArr[0])
        : gamesArr[0];
    return {
      image: firstGame?.image || "",
      title: gamesArr
        .map((g: any) =>
          typeof g === "number"
            ? games.find((gg) => gg.id === g)?.title
            : g?.title
        )
        .filter(Boolean)
        .join(", "),
    };
  }
  if (item.type === "account") {
    const user =
      typeof item.item === "number"
        ? users.find((u) => u.id === item.item)
        : item.item;
    return {
      image: user?.avatar || "",
      title: user?.name || "",
    };
  }
  return { image: "", title: "" };
}

// Busca múltiplos jogos por um array de IDs
export function getGamesByIds(
  gameIds: (number | string)[],
  games: Game[]
): Game[] {
  const ids = gameIds.map((id) => (typeof id === "string" ? Number(id) : id));
  return games.filter((g) => ids.includes(g.id));
}

// Mapeia uma lista de objetos com gameId e priceAtPurchase para objetos com image, title e value
export function mapGamesById(
  gamesList: { gameId: number | string; priceAtPurchase: number }[],
  games: Game[]
) {
  const ids = gamesList.map((g) => g.gameId);
  const gamesArr = getGamesByIds(ids, games);
  const gamesMap = gamesArr.reduce((acc, game) => {
    acc[game.id] = game;
    return acc;
  }, {} as Record<number, Game>);

  return gamesList
    .map((g) => {
      const game =
        gamesMap[typeof g.gameId === "string" ? Number(g.gameId) : g.gameId];
      if (!game) return null;
      return { image: game.image, title: game.title, value: g.priceAtPurchase };
    })
    .filter(Boolean) as { image: string; title: string; value: number }[];
}

// Retorna jogos com desconto ordenados pelo maior desconto (%), exclui lançamentos futuros
export function getDiscountedGames(games: Game[], limit: number = 0): Game[] {
  const now = new Date();

  const filtered = games
    .filter(
      (g) => g.discount && (!g.releaseDate || new Date(g.releaseDate) <= now)
    )
    .sort((a, b) => (b.discount || 0) - (a.discount || 0));

  return limit > 0 ? filtered.slice(0, limit) : filtered;
}


// Retorna jogos recentemente adicionados (exclui os que ainda vão lançar)
export function getRecentlyAddedGames(
  games: Game[],
  limit: number = 0
): Game[] {
  const now = new Date();
  const filtered = games
    .filter(
      (g) =>
        !!g.created_at && (!g.releaseDate || new Date(g.releaseDate) <= now)
    )
    .slice()
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  if (limit > 0) return filtered.slice(0, limit);
  return filtered;
}

// Retorna jogos que estreiam em breve (release futura)
export function getUpcomingGames(games: Game[], limit: number = 0): Game[] {
  const filtered = games.filter((g) =>
    isUpcoming({ releaseDate: g.releaseDate ?? undefined })
  );
  if (limit > 0) return filtered.slice(0, limit);
  return filtered;
}

// Estrutura auxiliar para facilitar o render dos dados de cada trade
export interface TradePreview {
  id: number;
  isReceived: boolean;
  otherUserName: string;
  status: string;
  offeredGames: { image: string; title: string }[];
  wantedGames: { image: string; title: string }[];
}

/**
 * Para usar esta função, você deve buscar os IDs dos user_games oferecidos e desejados
 * da trade via trade_user_games e passar como parâmetro.
 */
export function buildTradePreview(
  trade: Trade,
  currentUserId: number,
  games: Game[],
  users: User[],
  userGames: UserGame[],
  offeredUserGameIds: number[],
  wantedUserGameIds: number[]
): TradePreview {
  const isReceived = trade.responder_id === currentUserId;
  const otherUser = isReceived
    ? users.find((u) => u.id === trade.requester_id)
    : users.find((u) => u.id === trade.responder_id);

  const findUserGame = (id: number) => userGames.find((ug) => ug.id === id);
  const findGame = (id: number) => games.find((g) => g.id === id);

  const offeredGames = offeredUserGameIds.map((ugid) => {
    const userGame = findUserGame(ugid);
    const game = userGame ? findGame(userGame.game_id) : undefined;
    return game
      ? { image: game.image, title: game.title }
      : { image: "", title: "" };
  });
  const wantedGames = wantedUserGameIds.map((ugid) => {
    const userGame = findUserGame(ugid);
    const game = userGame ? findGame(userGame.game_id) : undefined;
    return game
      ? { image: game.image, title: game.title }
      : { image: "", title: "" };
  });

  return {
    id: trade.id,
    isReceived,
    otherUserName: otherUser?.userName || "",
    status: trade.status,
    offeredGames,
    wantedGames,
  };
}

/**
 * Para usar esta função, você deve buscar os IDs dos user_games oferecidos e desejados
 * da trade via trade_user_games e passar como parâmetro.
 */
export function tradeToModalData(
  trade: Trade,
  currentUserId: number,
  games: Game[],
  users: User[],
  userGames: UserGame[],
  offeredUserGameIds: number[],
  wantedUserGameIds: number[]
) {
  const isRequester = trade.requester_id === currentUserId;
  const otherUser = isRequester
    ? users.find((u) => u.id === trade.responder_id)
    : users.find((u) => u.id === trade.requester_id);
  const findUserGame = (id: number) => userGames.find((ug) => ug.id === id);
  const findGame = (id: number) => games.find((g) => g.id === id);

  // Sempre: sent = jogos que o usuário está oferecendo, received = jogos que vai receber
  const sentIds = isRequester ? offeredUserGameIds : wantedUserGameIds;
  const receivedIds = isRequester ? wantedUserGameIds : offeredUserGameIds;

  const sentItems = sentIds
    .map((ugid) => {
      const userGame = findUserGame(ugid);
      if (!userGame) return null;
      const game = findGame(userGame.game_id);
      if (!game) return null;
      return { image: game.image, title: game.title, value: game.price };
    })
    .filter(
      (item): item is { image: string; title: string; value: number } => !!item
    );
  const receivedItems = receivedIds
    .map((ugid) => {
      const userGame = findUserGame(ugid);
      if (!userGame) return null;
      const game = findGame(userGame.game_id);
      if (!game) return null;
      return { image: game.image, title: game.title, value: game.price };
    })
    .filter(
      (item): item is { image: string; title: string; value: number } => !!item
    );
  return {
    title: "Troca",
    status: trade.status,
    date: trade.created_at ? new Date(trade.created_at).toLocaleString() : "-",
    participants: otherUser ? otherUser.userName : undefined,
    sentLabel: "Jogos à Enviar:",
    receivedLabel: "Jogos à Receber:",
    sentItems,
    receivedItems,
  };
}

// Utilitário de paginação
export function usePaginatedList<T>(list: T[], pageSize: number) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(list.length / pageSize);
  const paginated = useMemo(() => list.slice(page * pageSize, (page + 1) * pageSize), [list, page, pageSize]);
  return {
    page,
    setPage,
    totalPages,
    paginated,
    goToPrev: () => setPage((p) => Math.max(0, p - 1)),
    goToNext: () => setPage((p) => Math.min(totalPages - 1, p + 1)),
    reset: () => setPage(0),
  };
}

// Retorna jogos em destaque a partir da lista de jogos (exemplo: flag isFeatured ou critério de preço)
export function getFeaturedGames(games: Game[], limit: number = 0): Game[] {
  const filtered = games.filter(
    (game: Game) =>
      Array.isArray(game.tags) &&
      game.tags.some((tag: Tag) => tag.name === "Destaque")
  );
  if (limit > 0) return filtered.slice(0, limit);
  return filtered;
}