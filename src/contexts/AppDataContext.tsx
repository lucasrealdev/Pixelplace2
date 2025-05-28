import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { User, Game, Trade, UserGame, Transaction, Cart, Tag, TradeUserGame } from "../services/entities";
import {
  getCurrentUser,
  getAllGames,
  getAllTags,
  getWishlistGames,
  getTransactionsForUser,
  getAvailableAccounts,
  getAvailableTradeGames,
  getAllUserGames,
  getUserGames,
  getCartByUserId,
  getTradesForUser,
  getTradeUserGamesByTradeIds,
  logoutUser,
  getAllUsers
} from "../services/dataService";
import { getRecentlyAddedGames, getFeaturedGames } from '../helpers/uiHelpers';

const CACHE_KEYS = {
  GAMES: 'cache_games',
  TAGS: 'cache_tags',
  ACCOUNTS: 'cache_accounts',
  PUBLIC_TRADES: 'cache_public_trades',
  AUTH: 'cache_auth',
  TRADES: 'cache_trades',
  WISHLIST: 'cache_wishlist',
  TRANSACTIONS: 'cache_transactions',
  CART: 'cache_cart',
  USER_GAMES: 'cache_user_games',
} as const;

const CACHE_EXPIRATION = {
  SHORT: 1 * 60 * 1000,   // 5 minutos
  MEDIUM: 3 * 60 * 1000,  // 15 minutos
  LONG: 7 * 60 * 1000, // 7 minutos
  SUPERLONG: 10.080 * 60 * 1000 // 7 dias
} as const;

interface CacheData<T> {
  data: T;
  timestamp: number;
}

const cacheHelper = {
  get<T>(key: string, maxAge: number): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      const { data, timestamp }: CacheData<T> = JSON.parse(cached);
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  },

  set<T>(key: string, data: T): void {
    try {
      const cacheData: CacheData<T> = { data, timestamp: Date.now() };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch { }
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  }
};

const logApiCall = (functionName: string, context?: string) => {
  console.log(`🔄 API Call${context ? ` [${context}]` : ''}: ${functionName} at ${new Date().toLocaleTimeString()}`);
};

interface AuthContextType {
  currentUser: User | null;
  reloadUser: () => Promise<void>;
  removeUser: () => void;
}
interface GamesContextType {
  games: Game[];
  tags: string[];
  reloadGames: () => Promise<void>;
  recentlyAddedGames: Game[];
  featuredGames: Game[];
}
interface TradesContextType {
  trades: Trade[];
  reloadTrades: () => Promise<void>;
  tradeUserGames: TradeUserGame[];
  tradeUserGameMap: Record<number, { offered: number[]; wanted: number[] }>;
}
interface UserGamesContextType {
  userGames: UserGame[];
  reloadUserGames: () => Promise<void>;
}
interface PublicTradesContextType {
  allUserGames: UserGame[];
  publicTradeGames: UserGame[];
  reloadPublicTrades: () => Promise<void>;
}
interface WishlistContextType {
  wishlistGames: Game[];
  reloadWishlist: () => Promise<void>;
}
interface TransactionsContextType {
  transactions: Transaction[];
  reloadTransactions: () => Promise<void>;
}
interface AccountsContextType {
  availableAccounts: User[];
  reloadAvailableAccounts: () => Promise<void>;
}
interface CartContextType {
  cart: Cart | null;
  reloadCart: () => Promise<void>;
}
interface AllUsersContextType {
  allUsers: User[];
  reloadAllUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const GamesContext = createContext<GamesContextType | undefined>(undefined);
const TradesContext = createContext<TradesContextType | undefined>(undefined);
const UserGamesContext = createContext<UserGamesContextType | undefined>(undefined);
const PublicTradesContext = createContext<PublicTradesContextType | undefined>(undefined);
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);
const AccountsContext = createContext<AccountsContextType | undefined>(undefined);
const CartContext = createContext<CartContextType | undefined>(undefined);
const AllUsersContext = createContext<AllUsersContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [userGames, setUserGames] = useState<UserGame[]>([]);
  const [allUserGames, setAllUserGames] = useState<UserGame[]>([]);
  const [publicTradeGames, setPublicTradeGames] = useState<UserGame[]>([]);
  const [wishlistGames, setWishlistGames] = useState<Game[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<User[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [tradeUserGames, setTradeUserGames] = useState<TradeUserGame[]>([]);
  const [tradeUserGameMap, setTradeUserGameMap] = useState<Record<number, { offered: number[]; wanted: number[] }>>({});
  const [isInitializing, setIsInitializing] = useState(true);
  const initializedRef = useRef(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  async function safeLoad(fromCache: () => boolean, reload: () => Promise<void>) {
    if (!fromCache()) {
      await reload();
    }
  }

  // ================ CACHE ================
  const loadAuthFromCache = useCallback(() => {
    const cached = cacheHelper.get<User | null>(CACHE_KEYS.AUTH, CACHE_EXPIRATION.SUPERLONG);
    if (cached) setCurrentUser(cached);
    return !!cached;
  }, []);

  const loadGamesFromCache = useCallback(() => {
    const cachedGames = cacheHelper.get<Game[]>(CACHE_KEYS.GAMES, CACHE_EXPIRATION.LONG);
    const cachedTags = cacheHelper.get<Tag[]>(CACHE_KEYS.TAGS, CACHE_EXPIRATION.LONG);
    if (cachedGames) {
      setGames(cachedGames);
      setTags(cachedTags?.map(t => t.name) || []);
      return true;
    }
    return false;
  }, []);

  const loadTradesFromCache = useCallback(() => {
    const cached = cacheHelper.get<{ trades: Trade[]; tradeUserGames: TradeUserGame[]; tradeUserGameMap: Record<number, any> }>(
      CACHE_KEYS.TRADES, CACHE_EXPIRATION.SHORT
    );
    if (cached) {
      setTrades(cached.trades);
      setTradeUserGames(cached.tradeUserGames);
      setTradeUserGameMap(cached.tradeUserGameMap);
      return true;
    }
    return false;
  }, []);

  const loadUserGamesFromCache = useCallback(() => {
    const cached = cacheHelper.get<{ userGames: UserGame[] }>(CACHE_KEYS.USER_GAMES, CACHE_EXPIRATION.MEDIUM);
    if (cached) {
      setUserGames(cached.userGames);
      return true;
    }
    return false;
  }, []);

  const loadPublicTradesFromCache = useCallback(() => {
    const cached = cacheHelper.get<{ allUserGames: UserGame[]; publicTradeGames: UserGame[] }>(
      CACHE_KEYS.PUBLIC_TRADES, CACHE_EXPIRATION.MEDIUM
    );
    if (cached) {
      setAllUserGames(cached.allUserGames);
      setPublicTradeGames(cached.publicTradeGames);
      return true;
    }
    return false;
  }, []);

  const loadWishlistFromCache = useCallback(() => {
    const cached = cacheHelper.get<Game[]>(CACHE_KEYS.WISHLIST, CACHE_EXPIRATION.LONG);
    if (cached) setWishlistGames(cached);
    return !!cached;
  }, []);

  const loadTransactionsFromCache = useCallback(() => {
    const cached = cacheHelper.get<Transaction[]>(CACHE_KEYS.TRANSACTIONS, CACHE_EXPIRATION.MEDIUM);
    if (cached) setTransactions(cached);
    return !!cached;
  }, []);

  const loadAccountsFromCache = useCallback(() => {
    const cached = cacheHelper.get<User[]>(CACHE_KEYS.ACCOUNTS, CACHE_EXPIRATION.MEDIUM);
    if (cached) setAvailableAccounts(cached);
    return !!cached;
  }, []);

  const loadCartFromCache = useCallback(() => {
    const cached = cacheHelper.get<Cart | null>(CACHE_KEYS.CART, CACHE_EXPIRATION.LONG);
    if (cached !== null) setCart(cached);
    return cached !== null;
  }, []);

  const loadAllUsersFromCache = useCallback(() => {
    const cached = cacheHelper.get<User[]>("cache_all_users", CACHE_EXPIRATION.LONG);
    if (cached) setAllUsers(cached);
    return !!cached;
  }, []);

  // ================ RELOADS ================

  const reloadUser = useCallback(async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    cacheHelper.set(CACHE_KEYS.AUTH, user);
  }, []);

  const removeUser = useCallback(() => {
    logoutUser();

    setUserGames([]);
    setTrades([]);
    setWishlistGames([]);
    setTransactions([]);
    setCart(null);
    setTradeUserGames([]);
    setTradeUserGameMap({});
    setCurrentUser(null);

    [CACHE_KEYS.TRADES, CACHE_KEYS.WISHLIST, CACHE_KEYS.TRANSACTIONS, CACHE_KEYS.CART, CACHE_KEYS.USER_GAMES, CACHE_KEYS.AUTH, CACHE_KEYS.PUBLIC_TRADES]
      .forEach(cacheHelper.remove);
  }, []);

  const reloadGames = useCallback(async () => {
    logApiCall('getAllGames', 'Games');
    logApiCall('getAllTags', 'Games');

    const [gamesData, tagsData] = await Promise.all([getAllGames(), getAllTags()]);
    setGames(gamesData);
    setTags(tagsData.map(t => t.name));
    cacheHelper.set(CACHE_KEYS.GAMES, gamesData);
    cacheHelper.set(CACHE_KEYS.TAGS, tagsData);
  }, []);

  const reloadPublicTrades = useCallback(async () => {
    logApiCall('getAllUserGames', 'getAvailableTradeGames');

    const [allUserGamesData, publicTradesGameData] = await Promise.all([
      getAllUserGames(), getAvailableTradeGames()
    ]);
    setAllUserGames(allUserGamesData);
    setPublicTradeGames(publicTradesGameData);
    cacheHelper.set(CACHE_KEYS.PUBLIC_TRADES, { allUserGames: allUserGamesData, publicTradeGames: publicTradesGameData });
  }, []);

  const reloadTrades = useCallback(async () => {
    let user = currentUser;
  
    if (!user) {
      user = await getCurrentUser();
      if (!user) {
        setTrades([]);
        setTradeUserGames([]);
        setTradeUserGameMap({});
        cacheHelper.set(CACHE_KEYS.TRADES, {
          trades: [],
          tradeUserGames: [],
          tradeUserGameMap: {}
        });
        return;
      }
    }
  
    logApiCall('getTradesForUser', 'Trades');
    const loadedTrades = await getTradesForUser(user.id);
    setTrades(loadedTrades);
    const tradeIds = loadedTrades.map(t => t.id);
  
    let tradeUserGamesData: TradeUserGame[] = [];
    let tradeUserGameMap: Record<number, any> = {};
  
    if (tradeIds.length > 0) {
      logApiCall('getTradeUserGamesByTradeIds', 'Trades');
      tradeUserGamesData = await getTradeUserGamesByTradeIds(tradeIds) || [];
      tradeUserGameMap = tradeUserGamesData.reduce((acc, tug) => {
        if (!acc[tug.trade_id]) acc[tug.trade_id] = { offered: [], wanted: [] };
        tug.type === 'offered'
          ? acc[tug.trade_id].offered.push(tug.user_game_id)
          : acc[tug.trade_id].wanted.push(tug.user_game_id);
        return acc;
      }, {} as Record<number, any>);
    }

    setTradeUserGames(tradeUserGamesData);
    setTradeUserGameMap(tradeUserGameMap);
    cacheHelper.set(CACHE_KEYS.TRADES, {
      trades: loadedTrades,
      tradeUserGames: tradeUserGamesData,
      tradeUserGameMap: tradeUserGameMap
    });
  }, [currentUser]);  

  const reloadUserGames = useCallback(async () => {
    let user = currentUser;

    if (!user) {
      user = await getCurrentUser();
      if (!user) {
        setUserGames([]);
        return cacheHelper.remove(CACHE_KEYS.USER_GAMES);
      }
    }

    logApiCall('getUserGames', 'UserGames');
    const userGamesData = await getUserGames(user.id);
    setUserGames(userGamesData);
    cacheHelper.set(CACHE_KEYS.USER_GAMES, { userGames: userGamesData });
  }, [currentUser]);

  const reloadWishlist = useCallback(async () => {
    if (!currentUser) {
      setWishlistGames([]);
      return cacheHelper.remove(CACHE_KEYS.WISHLIST);
    }
    logApiCall('getWishlistGames', 'Wishlist');
    const wishlistData = await getWishlistGames(currentUser.id);
    setWishlistGames(wishlistData);
    cacheHelper.set(CACHE_KEYS.WISHLIST, wishlistData);
  }, [currentUser]);

  const reloadTransactions = useCallback(async () => {
    if (!currentUser) {
      setTransactions([]);
      return cacheHelper.remove(CACHE_KEYS.TRANSACTIONS);
    }
    logApiCall('getTransactionsForUser', 'Transactions');
    const transactionsData = await getTransactionsForUser(currentUser.id);
    setTransactions(transactionsData);
    cacheHelper.set(CACHE_KEYS.TRANSACTIONS, transactionsData);
  }, [currentUser]);

  const reloadAvailableAccounts = useCallback(async () => {
    logApiCall('getAvailableAccounts', 'Accounts');
    const accountsData = await getAvailableAccounts();
    setAvailableAccounts(accountsData);
    cacheHelper.set(CACHE_KEYS.ACCOUNTS, accountsData);
  }, []);

  const reloadCart = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      setCart(null);
      return cacheHelper.remove(CACHE_KEYS.CART);
    }
    logApiCall('getCartByUserId', 'Cart');
    const cartData = await getCartByUserId(user.id);
    setCart(cartData);
    cacheHelper.set(CACHE_KEYS.CART, cartData);
  }, []);

  const reloadAllUsers = useCallback(async () => {
    const users = await getAllUsers();
    setAllUsers(users);
    cacheHelper.set("cache_all_users", users);
  }, []);

  // ================ INIT APP ================

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeApp = async () => {
      try {
        loadAuthFromCache();
        await Promise.all([
          safeLoad(loadGamesFromCache, reloadGames),
          safeLoad(loadAccountsFromCache, reloadAvailableAccounts),
          safeLoad(loadPublicTradesFromCache, reloadPublicTrades),
          safeLoad(loadAllUsersFromCache, reloadAllUsers)
        ]);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (isInitializing || !currentUser) return;
    const loadUserData = async () => {
      await Promise.all([
        safeLoad(loadTradesFromCache, reloadTrades),
        safeLoad(loadWishlistFromCache, reloadWishlist),
        safeLoad(loadTransactionsFromCache, reloadTransactions),
        safeLoad(loadCartFromCache, reloadCart),
        safeLoad(loadUserGamesFromCache, reloadUserGames)
      ]);
    };

    loadUserData();
  }, [currentUser, isInitializing]);


  const authValue = useMemo(() => ({ currentUser, reloadUser, removeUser }), [currentUser, reloadUser, removeUser]);
  const gamesValue = useMemo(() => ({
    games, tags, reloadGames,
    recentlyAddedGames: getRecentlyAddedGames(games, 6),
    featuredGames: getFeaturedGames(games, 6)
  }), [games, tags, reloadGames]);
  const tradesValue = useMemo(() => ({ trades, reloadTrades, tradeUserGames, tradeUserGameMap }), [trades, reloadTrades, tradeUserGames, tradeUserGameMap]);
  const userGamesValue = useMemo(() => ({ userGames, reloadUserGames }), [userGames, reloadUserGames]);
  const publicTradesValue = useMemo(() => ({ allUserGames, publicTradeGames, reloadPublicTrades }), [allUserGames, publicTradeGames, reloadPublicTrades]);
  const wishlistValue = useMemo(() => ({ wishlistGames, reloadWishlist }), [wishlistGames, reloadWishlist]);
  const transactionsValue = useMemo(() => ({ transactions, reloadTransactions }), [transactions, reloadTransactions]);
  const accountsValue = useMemo(() => ({ availableAccounts, reloadAvailableAccounts }), [availableAccounts, reloadAvailableAccounts]);
  const cartValue = useMemo(() => ({ cart, reloadCart }), [cart, reloadCart]);
  const allUsersValue = useMemo(() => ({ allUsers, reloadAllUsers }), [allUsers, reloadAllUsers]);

  return (
    <AuthContext.Provider value={authValue}>
      <GamesContext.Provider value={gamesValue}>
        <TradesContext.Provider value={tradesValue}>
          <UserGamesContext.Provider value={userGamesValue}>
            <PublicTradesContext.Provider value={publicTradesValue}>
              <WishlistContext.Provider value={wishlistValue}>
                <TransactionsContext.Provider value={transactionsValue}>
                  <AccountsContext.Provider value={accountsValue}>
                    <AllUsersContext.Provider value={allUsersValue}>
                      <CartContext.Provider value={cartValue}>
                        {children}
                      </CartContext.Provider>
                    </AllUsersContext.Provider>
                  </AccountsContext.Provider>
                </TransactionsContext.Provider>
              </WishlistContext.Provider>
            </PublicTradesContext.Provider>
          </UserGamesContext.Provider>
        </TradesContext.Provider>
      </GamesContext.Provider>
    </AuthContext.Provider>
  );
};

// Hooks
export const useAuth = () => useContextGuard(AuthContext, "useAuth");
export const useGames = () => useContextGuard(GamesContext, "useGames");
export const useTrades = () => useContextGuard(TradesContext, "useTrades");
export const useUserGames = () => useContextGuard(UserGamesContext, "useUserGames");
export const usePublicTradeGames = () => useContextGuard(PublicTradesContext, "usePublicTradeGames");
export const useWishlist = () => useContextGuard(WishlistContext, "useWishlist");
export const useTransactions = () => useContextGuard(TransactionsContext, "useTransactions");
export const useAccounts = () => useContextGuard(AccountsContext, "useAccounts");
export const useCart = () => useContextGuard(CartContext, "useCart");
export const useAllUsers = () => useContextGuard(AllUsersContext, "useAllUsers");

function useContextGuard<T>(context: React.Context<T | undefined>, hookName: string): T {
  const ctx = useContext(context);
  if (!ctx) throw new Error(`${hookName} must be used within AppDataProvider`);
  return ctx;
}