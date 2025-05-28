export interface User {
  id: number;
  avatar: string;
  created_at: string;
  balance: number;
  is_account_in_trade: boolean;
  userName: string;
  password_hash: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Game {
  id: number;
  title: string;
  image: string;
  price: number;
  created_at: string;
  tags?: Tag[];
  discount: number | null;
  banner: string | null;
  releaseDate: string | null;
  swfUrl?: string | null;
}

export interface UserGame {
  id: number;
  user_id: number;
  game_id: number;
  in_trade: boolean;
  acquired_at: string;
  game: Game;
}

export interface Wishlist {
  id: number;
  user_id: number;
  game_id: number;
}

export type TradeStatus = 'pendente' | 'aceita' | 'recusada';
export type TradeType = 'jogo' | 'conta';

export interface Trade {
  id: number;
  requester_id: number;
  responder_id: number;
  status: TradeStatus;
  type: TradeType;
  created_at: string;
  responded_at: string | null;
}

export type TradeUserGameType = 'offered' | 'wanted';

export interface TradeUserGame {
  id: number;
  trade_id: number;
  user_game_id: number;
  type: TradeUserGameType;
}

export type TransactionType = 'compra' | 'troca';
export type TransactionStatus = 'concluida' | 'pendente' | 'cancelada';

export interface Transaction {
  id: number;
  type: TransactionType;
  user_id: number;
  other_user_id: number | null;
  value: number;
  status: TransactionStatus;
  created_at: string;
  completed_at: string | null;
  sentGames?: TransactionGame[];
  receivedGames?: TransactionGame[];
}

export type TransactionGameDirection = 'sent' | 'received';

export interface TransactionGame {
  id: number;
  transaction_id: number;
  game_id: number;
  price_at_purchase: number;
  direction: TransactionGameDirection;
}

export interface CartItem {
  id: number;
  cart_id: number;
  game_id: number;
}

export interface Cart {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  items: CartItem[];
} 

// Tipos para os modais
interface ProposeModal {
  type: "propose";
  otherGame: Game;
}
interface AccountModal {
  type: "account";
  otherItem: User;
}
interface SuccessModal {
  type: "success";
  message: string;
}
export type ActiveModal = ProposeModal | AccountModal | SuccessModal | null;