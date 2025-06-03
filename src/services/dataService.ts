import type {
  Game,
  User,
  UserGame,
  Wishlist,
  Trade,
  Transaction,
  Tag,
  Cart,
  TransactionGame,
  TradeUserGame,
} from './entities';
import supabase from './supabaseClient';
import bcrypt from 'bcryptjs';

// ================= USUÁRIO =================
export async function getUserById(userId: number): Promise<User | null> {
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
  return data;
}

export async function updateUserBalance(userId: number, newBalance: number): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({ balance: newBalance })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAvailableAccounts(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').eq('is_account_in_trade', true);
  if (error) throw error;
  return data || [];
}

export async function updateUserAccountTradeStatus(userId: number, inTrade: boolean): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({ is_account_in_trade: inTrade })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
}

// ================= JOGOS =================
// Função base para buscar jogos com filtros dinâmicos
async function fetchGames({
  filter = {},
  ids,
  tagName,
  hasBanner = false,
  limit,
}: {
  filter?: Record<string, any>;
  ids?: number[];
  tagName?: string;
  hasBanner?: boolean;
  limit?: number;
} = {}): Promise<Game[]> {
  let query = supabase
    .from('games')
    .select('id, title, image, price, created_at, discount, banner, releaseDate, tags:game_tags(tags(id, name))');

  // Filtros dinâmicos
  Object.entries(filter).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  if (ids) query = query.in('id', ids);
  if (hasBanner) query = query.not('banner', 'is', null);
  if (limit) query = query.limit(limit);

  // Filtro por tag
  if (tagName) {
    const { data: tagData } = await supabase.from('tags').select('id').eq('name', tagName).single();
    if (!tagData) return [];
    const { data: gameTags } = await supabase.from('game_tags').select('game_id').eq('tag_id', tagData.id);
    const tagGameIds = (gameTags || []).map((gt: any) => gt.game_id);
    if (!tagGameIds.length) return [];
    query = query.in('id', tagGameIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  // Mapeia para garantir que tags seja sempre um array simples de {id, name}
  return (data || []).map((game: any) => ({
    ...game,
    tags: Array.isArray(game.tags) ? game.tags.map((t: any) => t.tags || t) : [],
  }));
}

// Funções públicas de jogos
export async function getAllGames(): Promise<Game[]> {
  return fetchGames();
}

export async function getGameById(gameId: number): Promise<Game | null> {
  const games = await fetchGames({ ids: [gameId] });
  return games[0] || null;
}

export async function getAvailableGames(limit: number = 0): Promise<Game[]> {
  // Busca jogos com releaseDate nula ou releaseDate <= agora
  const now = new Date();
  const { data, error } = await supabase
    .from('games')
    .select('id, title, image, price, created_at, discount, banner, releaseDate, tags:game_tags(tags(id, name))')
    .or(`releaseDate.is.null,releaseDate.lte.${now.toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(limit > 0 ? limit : 1000);
  if (error) throw error;
  return (data || []).map((game: any) => ({
    ...game,
    tags: Array.isArray(game.tags) ? game.tags.map((t: any) => t.tags || t) : [],
  }));
}

export async function getGamesByCategory(category: string): Promise<Game[]> {
  return fetchGames({ tagName: category });
}

// ================= USERGAMES =================
export async function getUserGames(userId: number): Promise<UserGame[]> {
  const { data } = await supabase.from('user_games').select('*').eq('user_id', userId);
  return data || [];
}

export async function getAllUserGames(): Promise<UserGame[]> {
  const { data } = await supabase.from('user_games').select('*');
  return data || [];
}

export async function getUserGameById(userGameId: number): Promise<UserGame | null> {
  const { data, error } = await supabase.from('user_games').select('*').eq('id', userGameId).single();
  if (error) throw error;
  return data;
}

export async function addUserGame(userId: number, gameId: number, inTrade = false): Promise<UserGame> {
  const { data } = await supabase
    .from('user_games')
    .insert([{ user_id: userId, game_id: gameId, in_trade: inTrade, acquired_at: new Date().toISOString() }])
    .select()
    .single();
  return data;
}

export async function removeUserGame(userGameId: number): Promise<boolean> {
  const { error } = await supabase.from('user_games').delete().eq('id', userGameId);
  if (error) throw error;
  return true;
}

export async function toggleUserGameTradeStatus(userGameId: number): Promise<UserGame | null> {
  const { data: current } = await supabase.from('user_games').select('in_trade').eq('id', userGameId).single();
  if (!current) return null;
  const { data } = await supabase
    .from('user_games')
    .update({ in_trade: !current.in_trade })
    .eq('id', userGameId)
    .select()
    .single();
  return data;
}

export async function getAvailableTradeGames(userId?: number): Promise<UserGame[]> {
  let query = supabase.from('user_games').select('*').eq('in_trade', true);
  if (userId) {
    query = query.neq('user_id', userId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ================= WISHLIST =================
export async function getWishlistGames(userId: number): Promise<Game[]> {
  // Busca todos os games da wishlist do usuário, retornando jogos completos (sem swfUrl)
  const { data, error } = await supabase
    .from('wishlists')
    .select('game:games(id, title, image, price, created_at, discount, banner, releaseDate, tags:game_tags(tags(id, name)))')
    .eq('user_id', userId);
  if (error) throw error;
  if (!data || !Array.isArray(data)) return [];
  return data.map((w: any) => ({
    ...w.game,
    tags: Array.isArray(w.game.tags) ? w.game.tags.map((t: any) => t.tags || t) : [],
  }));
}

export async function addWishlistItem(userId: number, gameId: number): Promise<Wishlist> {
  const { data } = await supabase
    .from('wishlists')
    .insert([{ user_id: userId, game_id: gameId }])
    .select()
    .single();
  return data;
}

export async function removeWishlistItem(userId: number, gameId: number): Promise<boolean> {
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('game_id', gameId);
  if (error) throw error;
  return true;
}

// ================= TAGS =================
export async function getAllTags(): Promise<Tag[]> {
  const { data } = await supabase.from('tags').select('id, name');
  return data || [];
}

export async function createTagIfNotExists(name: string): Promise<number> {
  const { data: existing } = await supabase.from('tags').select('id').eq('name', name).single();
  if (existing) return existing.id;
  const { data } = await supabase.from('tags').insert([{ name }]).select('id').single();
  return data?.id;
}

export async function addTagsToGame(gameId: number, tagIds: number[]): Promise<void> {
  if (!tagIds.length) return;
  const inserts = tagIds.map(tagId => ({ game_id: gameId, tag_id: tagId }));
  const { error } = await supabase.from('game_tags').insert(inserts);
  if (error) throw error;
}

export async function getTagsForGame(gameId: number): Promise<Tag[]> {
  const { data } = await supabase
    .from('game_tags')
    .select('tag_id, tags(name)')
    .eq('game_id', gameId);
  return (data || []).map((row: any) => ({ id: row.tag_id, name: row.tags.name }));
}

// ================= CARRINHO =================
// Busca ou cria o carrinho do usuário
export async function getOrCreateCartByUserId(userId: number): Promise<{ id: number }> {
  // Tenta buscar o carrinho
  let { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).single();
  if (cart) return cart;

  // Tenta criar o carrinho
  const { data: newCart, error } = await supabase.from('carts').insert([{ user_id: userId }]).select('id').single();

  if (newCart) return newCart;

  // Se erro for de duplicidade, busca novamente (concorrência)
  if (error && error.code === '23505') {
    const { data: cartAgain } = await supabase.from('carts').select('id').eq('user_id', userId).single();
    if (cartAgain) return cartAgain;
  }

  throw new Error('Não foi possível criar ou obter o carrinho para o usuário');
}

// Busca os itens do carrinho do usuário
export async function getCartByUserId(userId: number): Promise<Cart> {
  // Tenta buscar carrinho + itens
  let { data: cart } = await supabase
    .from('carts')
    .select('*, cart_items(*)')
    .eq('user_id', userId)
    .maybeSingle();

  if (cart) {
    return {
      ...cart,
      items: cart.cart_items || []
    };
  }

  // Tenta criar carrinho e retornar já com id
  const { data: newCart, error: insertErr } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select('*, cart_items(*)')
    .single();

  if (newCart) {
    return {
      ...newCart,
      items: newCart.cart_items || []
    };
  }

  // Se erro for por conflito (concorrência), tenta buscar novamente
  if (insertErr?.code === '23505') {
    const { data: fallbackCart } = await supabase
      .from('carts')
      .select('*, cart_items(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (fallbackCart) {
      return {
        ...fallbackCart,
        items: fallbackCart.cart_items || []
      };
    }
  }

  throw new Error('Não foi possível obter ou criar o carrinho');
}

// Adiciona um item ao carrinho
export async function addCartItem(userId: number, gameId: number): Promise<void> {
  const cart = await getOrCreateCartByUserId(userId);
  await supabase.from('cart_items').insert([{ cart_id: cart.id, game_id: gameId }]);
}

// Remove um item do carrinho
export async function removeCartItem(userId: number, itemId: number): Promise<boolean> {
  const cart = await getOrCreateCartByUserId(userId);
  const { error } = await supabase.from('cart_items').delete().eq('cart_id', cart.id).eq('id', itemId);
  if (error) throw error;
  return true;
}

// Limpa o carrinho
export async function clearCart(userId: number): Promise<void> {
  const cart = await getOrCreateCartByUserId(userId);
  await supabase.from('cart_items').delete().eq('cart_id', cart.id);
}

// ================= TRANSAÇÕES =================
export async function addTransaction(tx: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
  const { data } = await supabase
    .from('transactions')
    .insert([tx])
    .select()
    .single();
  return data;
}

export async function getTransactionsForUser(userId: number): Promise<Transaction[]> {
  const { data: t1 } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  const { data: t2 } = await supabase
    .from('transactions')
    .select('*')
    .eq('other_user_id', userId);

  const all = [...(t1 || []), ...(t2 || [])];
  const seen = new Set();
  const uniqueTransactions = all.filter(tx => {
    if (seen.has(tx.id)) return false;
    seen.add(tx.id);
    return true;
  });

  const transactionIds = uniqueTransactions.map(tx => tx.id);

  const { data: transactionGames } = await supabase
    .from('transaction_games')
    .select('*')
    .in('transaction_id', transactionIds);

  const gamesByTransaction = new Map<number, { sent: TransactionGame[], received: TransactionGame[] }>();

  for (const game of transactionGames || []) {
    if (!gamesByTransaction.has(game.transaction_id)) {
      gamesByTransaction.set(game.transaction_id, { sent: [], received: [] });
    }
    const entry = gamesByTransaction.get(game.transaction_id)!;
    if (game.direction === 'sent') {
      entry.sent.push(game);
    } else {
      entry.received.push(game);
    }
  }

  return uniqueTransactions.map(tx => ({
    ...tx,
    sentGames: gamesByTransaction.get(tx.id)?.sent || [],
    receivedGames: gamesByTransaction.get(tx.id)?.received || [],
  }));
}

export async function addTransactionGame({
  transaction_id,
  game_id,
  price_at_purchase,
  direction = "received"
}: {
  transaction_id: number,
  game_id: number,
  price_at_purchase: number,
  direction?: string
}) {
  await supabase.from("transaction_games").insert([
    { transaction_id, game_id, price_at_purchase, direction }
  ]);
}

// ================= TRADE =================
// (Funções de trade podem ser simplificadas conforme uso real nas telas)
export async function addTrade(trade: Omit<Trade, 'id' | 'created_at'>): Promise<Trade> {
  const { data } = await supabase
    .from('trades')
    .insert([trade])
    .select()
    .single();
  return data;
}

export async function updateTradeStatus(tradeId: number, status: string, respondedAt?: string): Promise<Trade | null> {
  const updateObj: any = { status };
  if (respondedAt) updateObj.responded_at = respondedAt;
  const { data } = await supabase
    .from('trades')
    .update(updateObj)
    .eq('id', tradeId)
    .select()
    .single();
  return data;
}

export async function acceptTrade(tradeId: number): Promise<Trade | null> {
  const respondedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('trades')
    .update({ status: 'accepted', responded_at: respondedAt })
    .eq('id', tradeId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function rejectTrade(tradeId: number): Promise<Trade | null> {
  const respondedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('trades')
    .update({ status: 'rejected', responded_at: respondedAt })
    .eq('id', tradeId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTradeById(tradeId: number): Promise<Trade | null> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .single();
  if (error) throw error;
  return data;
}

// Nova função: areTradeGamesAvailable
/**
 * Verifica se todos os user_games envolvidos em uma trade ainda estão disponíveis para troca.
 * Retorna { ok: true } se todos disponíveis, ou { ok: false, reason } se algum não estiver.
 */
export async function areTradeGamesAvailable(trade: Trade): Promise<{ ok: true } | { ok: false; reason: string }> {
  // Busca todos os user_game_ids envolvidos na trade
  const { data: tradeUserGames, error } = await supabase
    .from('trade_user_games')
    .select('user_game_id, type')
    .eq('trade_id', trade.id);
  if (error) throw error;
  if (!tradeUserGames || tradeUserGames.length === 0) {
    return { ok: false, reason: 'Nenhum jogo associado à troca.' };
  }
  // Busca os user_games no banco
  const userGameIds = tradeUserGames.map((tug: any) => tug.user_game_id);
  const { data: userGames, error: ugError } = await supabase
    .from('user_games')
    .select('id, in_trade')
    .in('id', userGameIds);
  if (ugError) throw ugError;
  // Verifica se todos existem e estão disponíveis para troca
  for (const tug of tradeUserGames) {
    const ug = (userGames || []).find((u: any) => u.id === tug.user_game_id);
    if (!ug) {
      return { ok: false, reason: 'Um ou mais jogos não existem mais.' };
    }
    if (!ug.in_trade) {
      return { ok: false, reason: 'Um ou mais jogos não estão mais disponíveis para troca.' };
    }
  }
  return { ok: true };
}

// ================= SWF (JOGOS PROTEGIDOS) =================
export async function getGameSwfUrl(gameId: number, userId: number): Promise<string | null> {
  const { data: userGame } = await supabase
    .from('user_games')
    .select('id')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .single();
  if (!userGame) return null;
  const { data: game } = await supabase
    .from('games')
    .select('swfUrl')
    .eq('id', gameId)
    .single();
  return game?.swfUrl || null;
}

export async function registerUser(userName: string, password: string): Promise<User | null> {
  if (userName.length < 5 || userName.length > 25) throw new Error('Nome de usuário deve ter entre 5 e 25 caracteres');
  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!strongPassword.test(password)) {
    throw new Error('A senha deve ter no mínimo 8 caracteres, incluindo números, letras maiúsculas, minúsculas e caracteres especiais.');
  }
  const { data: existing } = await supabase.from('users').select('id').eq('userName', userName).single();
  if (existing) throw new Error('Nome de usuário já está em uso');
  const password_hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('users').insert([{
    userName,
    password_hash,
    balance: 10000,
    avatar: 'https://www.shareicon.net/data/512x512/2016/05/24/770117_people_512x512.png',
    is_account_in_trade: false
  }]).select().single();
  if (error) throw error;
  return data;
}

export async function loginUser(userName: string, password: string): Promise<User | null> {
  const { data: user } = await supabase.from('users').select('*').eq('userName', userName).single();
  if (!user) throw new Error('Usuário ou senha inválidos');
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Usuário ou senha inválidos');
  return user;
}

// ================= CUPONS =================
// Busca cupom pelo código
export async function getCouponByCode(code: string) {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data;
}

// Busca os user_game_ids de uma trade
export async function getTradeUserGameIds(tradeId: number): Promise<{ offered: number[]; wanted: number[] }> {
  const { data, error } = await supabase
    .from('trade_user_games')
    .select('user_game_id, type')
    .eq('trade_id', tradeId);
  if (error) throw error;
  return {
    offered: (data || []).filter((t: any) => t.type === 'offered').map((t: any) => t.user_game_id),
    wanted: (data || []).filter((t: any) => t.type === 'wanted').map((t: any) => t.user_game_id),
  };
}

// Busca os jogos de uma transação
export async function getTransactionGames(transactionId: number): Promise<TransactionGame[]> {
  const { data, error } = await supabase
    .from('transaction_games')
    .select('*')
    .eq('transaction_id', transactionId);
  if (error) throw error;
  return data || [];
}

// Busca trades do usuário (como requester ou responder)
export async function getTradesForUser(userId: number): Promise<Trade[]> {
  const { data: t1 } = await supabase
    .from('trades')
    .select('*')
    .eq('requester_id', userId);
  const { data: t2 } = await supabase
    .from('trades')
    .select('*')
    .eq('responder_id', userId);
  const all = [...(t1 || []), ...(t2 || [])];
  // Remover duplicatas (caso requester_id == responder_id)
  const seen = new Set();
  return all.filter(trade => {
    if (seen.has(trade.id)) return false;
    seen.add(trade.id);
    return true;
  });
}

// Busca todos os trade_user_games para uma lista de trades
export async function getTradeUserGamesByTradeIds(tradeIds: number[]): Promise<TradeUserGame[]> {
  if (!tradeIds.length) return [];
  const { data, error } = await supabase
    .from('trade_user_games')
    .select('*')
    .in('trade_id', tradeIds);
  if (error) throw error;
  return data || [];
}

// Deleta uma trade e todos os registros relacionados em trade_user_games
export async function deleteTradeAndGames(tradeId: number): Promise<void> {
  // Deleta trade_user_games primeiro (por FK)
  const { error: tugError } = await supabase.from('trade_user_games').delete().eq('trade_id', tradeId);
  if (tugError) throw tugError;
  // Depois deleta a trade
  const { error: tradeError } = await supabase.from('trades').delete().eq('id', tradeId);
  if (tradeError) throw tradeError;
}

// Transfere a propriedade de um user_game para outro usuário
export async function transferUserGameOwnership(userGameId: number, newUserId: number): Promise<void> {
  await supabase.from('user_games').update({ user_id: newUserId, in_trade: false }).eq('id', userGameId);
}

// Transfere vários user_games para outro usuário
export async function transferMultipleUserGames(userGameIds: number[], newUserId: number): Promise<void> {
  if (!userGameIds.length) return;
  await supabase.from('user_games').update({ user_id: newUserId, in_trade: false }).in('id', userGameIds);
}

// Adiciona os jogos à tabela trade_user_games para uma trade
export async function addTradeUserGames(tradeId: number, offeredUserGameIds: number[], wantedUserGameIds: number[]): Promise<void> {
  const offered = offeredUserGameIds.map(user_game_id => ({ trade_id: tradeId, user_game_id, type: 'offered' }));
  const wanted = wantedUserGameIds.map(user_game_id => ({ trade_id: tradeId, user_game_id, type: 'wanted' }));
  const inserts = [...offered, ...wanted];
  if (inserts.length > 0) {
    await supabase.from('trade_user_games').insert(inserts);
  }
}