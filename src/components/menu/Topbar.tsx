import { useEffect, useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, ShoppingCart, Menu, BadgeCent } from "lucide-react";
import TradePreviewList from "../trade/TradePreviewList";
import { useAuth, useTrades, useCart } from "../../contexts/AppDataContext";
import AuthModal from '../AuthModal';

interface TopbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  placeholder?: string;
  searchValue: string;
  onSearchChange?: (value: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

function UserCredits() {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return (
    <div className="flex items-center bg-gray-700 border border-cyan-700 rounded px-1 py-1 mr-2 text-cyan-300 font-semibold text-sm gap-1 min-w-[70px] justify-center" title="Seus créditos">
      <BadgeCent size={16} color="#facc15" />
      <span className="tabular-nums">
        {currentUser.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}

export default function Topbar({
  sidebarOpen,
  setSidebarOpen,
  placeholder = "Pesquisar",
  searchValue,
  onSearchChange,
  searchInputRef,
}: TopbarProps) {
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { currentUser, reloadUser, removeUser } = useAuth();
  const { trades } = useTrades();
  const { cart } = useCart();
  const cartCount = cart?.items?.length || 0;
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  // Controle de tempo para evitar reloads excessivos
  const lastReloadRef = useRef({
    cart: 0,
    trades: 0,
    user: 0,
  });
  const RELOAD_INTERVAL = 60 * 1000; // 1 minuto

  // Fecha popover ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    }
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleLogout = () => { removeUser(); setProfileOpen(false); };
  const handleLogin = () => setShowAuth(true);

  // Atualiza o carrinho ao clicar no ícone
  const handleCartClick = async () => {
    const now = Date.now();
    if (now - lastReloadRef.current.cart > RELOAD_INTERVAL) {
      lastReloadRef.current.cart = now;
    }
    navigate("/cart");
  };

  // Atualiza as trocas ao abrir notificações
  const handleNotifClick = async () => {
    const now = Date.now();
    if (window.innerWidth < 440) {
      navigate("/trade");
      return;
    }
    if (now - lastReloadRef.current.trades > RELOAD_INTERVAL) {
      lastReloadRef.current.trades = now;
    }
    setNotifOpen((v) => !v);
  };

  // Atualiza o usuário ao abrir o perfil
  const handleProfileClick = async () => {
    const now = Date.now();
    if (now - lastReloadRef.current.user > RELOAD_INTERVAL) {
      await reloadUser();
      lastReloadRef.current.user = now;
    }
    setProfileOpen((v) => !v);
  };

  return (
    <div className="bg-gray-800 p-3 md:p-4 flex items-center border-b border-gray-700">
      {/* Botão do menu lateral */}
      <button className="mr-3 text-gray-400 hover:text-white lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <Menu size={24} />
      </button>
      {/* Campo de busca */}
      <div className="relative flex-1 max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={onSearchChange ? (e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value) : undefined}
          ref={searchInputRef}
          className="block w-full pl-10 pr-3 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {/* Ícones e perfil */}
      <div className="flex items-center space-x-3 md:space-x-4 ml-3 md:ml-4 relative">
        <UserCredits />
        <div className="relative" ref={notifRef}>
          <Bell
            className="h-5 w-5 md:h-6 md:w-6 text-gray-300 cursor-pointer"
            onClick={handleNotifClick}
          />
          {notifOpen && window.innerWidth >= 440 && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-cyan-700 rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-gray-800 font-semibold text-cyan-400 flex items-center gap-2">
                Últimas Solicitações de Troca
              </div>
              <TradePreviewList trades={trades} currentUserId={currentUser?.id || 1} limit={3} />
            </div>
          )}
        </div>
        {/* Carrinho */}
        <div className="relative">
          <ShoppingCart
            className="h-5 w-5 md:h-6 md:w-6 text-gray-300 cursor-pointer"
            onClick={handleCartClick}
            aria-label="Abrir carrinho"
          />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-linear-to-t from-sky-500 to-indigo-500 rounded-full w-4 h-4 flex items-center justify-center shadow cursor-pointer text-white text-[12px] font-bold" onClick={handleCartClick}>{cartCount}</span>
          )}
        </div>
        {/* Avatar do usuário ou botão de login */}
        {currentUser ? (
          <div className="relative" ref={profileRef}>
            <img
              src={currentUser.avatar}
              alt={currentUser.userName}
              className="w-8 h-8 rounded-full object-cover border-2 border-cyan-500 cursor-pointer hover:brightness-110 transition"
              onClick={handleProfileClick}
            />
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-cyan-700 rounded-lg shadow-xl z-50 flex flex-col items-center p-4 animate-fade-in">
                <span className="text-cyan-300 font-semibold mb-2">{currentUser.userName}</span>
                <button
                  className="w-full py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs mt-2 transition"
                  onClick={handleLogout}
                >Sair</button>
              </div>
            )}
          </div>
        ) : (
          <button className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition" onClick={handleLogin}>Entrar</button>
        )}
        {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} onLogin={() => { setShowAuth(false); reloadUser(); }} />
        )}
      </div>
    </div>
  );
}