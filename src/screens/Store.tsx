import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Repeat, ShoppingCart, ChevronLeft, ChevronRight, Play, Loader2, X, Heart } from "lucide-react";
import Sidebar from "../components/menu/Sidebar";
import Topbar from "../components/menu/Topbar";
import GameCard from "../components/GameCard";
import FeaturedTags from "../components/Tags";
import TagsFilter from "../components/TagsFilter";
import PriceFilter from "../components/PriceFilter";
import { useAuth, useGames, useWishlist, useUserGames, useCart } from "../contexts/AppDataContext";
import { getDiscountedPrice, getDiscountedGames, getRecentlyAddedGames, getUpcomingGames } from "../helpers/uiHelpers";
import { useCartActions } from "../helpers/useCartActions";
import { useStoreActions } from "../helpers/useStoreActions";
import type { Game, UserGame } from "../services/entities";
import { toast } from "react-toastify";
import AuthModal from '../components/AuthModal';
import { usePlayGame } from "../helpers/usePlayGame";

export default function Store() {
  // ========== GLOBAL HOOKS ==========
  const { currentUser } = useAuth();
  const { games, tags } = useGames();
  const { wishlistGames } = useWishlist();
  const { userGames } = useUserGames();
  const { cart } = useCart();
  const { addToCart } = useCartActions();
  const {
    addToWishlist,
    removeFromWishlist,
    addToTrade,
    removeFromTrade,
  } = useStoreActions();
  const { playGame, isPlaying, swfUrl, closeEmulator, ruffleContainerRef } = usePlayGame();

  // ========== LOCAL STATE ==========
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [addingToCartId, setAddingToCartId] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [wishlistLoadingId, setWishlistLoadingId] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const filtersRef = useRef<HTMLDivElement>(null);
  const urlCategoryApplied = useRef<boolean>(false);
  const topbarInputRef = useRef<HTMLInputElement>(null);
  const [loadingTradeIds, setLoadingTradeIds] = useState<number[]>([]);
  const [loadingPlayIds, setLoadingPlayIds] = useState<number[]>([]);

  // ========== EFFECTS ==========
  useEffect(() => {
    if (!urlCategoryApplied.current) {
      const params = new URLSearchParams(location.search);
      const category = params.get("category");
      if (category && tags.includes(category)) {
        setSelectedTags([category]);
      }
      urlCategoryApplied.current = true;
    }
  }, [tags]);

  useEffect(() => {
    if (searchTerm.trim() && filtersRef.current) {
      filtersRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, selectedTags, priceRange]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    if (searchParam) {
      setSearchTerm(searchParam);
      setTimeout(() => {
        topbarInputRef.current?.focus();
      }, 100);
    }
  }, [location.search]);

  // ========== FILTERED GAMES ==========
  const filteredGames = games.filter((game) => {
    const matchesTag =
      selectedTags.length === 0 ||
      (game.tags?.some((tag) => selectedTags.includes(tag.name)) ?? false);
    const finalPrice = getDiscountedPrice({ price: game.price, discount: game.discount ?? undefined });
    const matchesPrice =
      finalPrice >= priceRange[0] &&
      (priceRange[1] === 0 || finalPrice <= priceRange[1]);
    const matchesSearch =
      searchTerm.trim() === "" ||
      game.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTag && matchesPrice && matchesSearch;
  });

  // ========== PAGINATION ==========
  const upcomingGames = getUpcomingGames(games, 6);
  const upcomingIds = new Set(upcomingGames.map(g => g.id));
  const userGameIds = new Set(userGames.map(ug => ug.game_id));
  const filteredGamesNoUpcoming = filteredGames.filter(
    (g) => !upcomingIds.has(g.id) && !userGameIds.has(g.id)
  );
  const pageSize = 5;
  const totalPages = Math.ceil(filteredGamesNoUpcoming.length / pageSize);
  const paginatedGames = filteredGamesNoUpcoming.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const handlePrevPage = () => setCurrentPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  // ========== SEARCHED UPCOMING & OWNED ==========
  const searchTermLower = searchTerm.trim().toLowerCase();
  const searchedUpcoming = searchTermLower
    ? upcomingGames.filter((game) => game.title.toLowerCase().includes(searchTermLower))
    : [];
  const showSearchedUpcoming = searchTermLower.length > 0 && searchedUpcoming.length > 0;
  const searchedOwnedGames = searchTermLower
    ? userGames
      .map(ug => ({ userGame: ug, game: games.find(g => g.id === ug.game_id) }))
      .filter(({ game }) => game && game.title.toLowerCase().includes(searchTermLower))
    : [];
  const showSearchedOwned = searchTermLower.length > 0 && searchedOwnedGames.length > 0;

  // ========== ACTION HANDLERS ==========
  const isInWishlist = (gameId: number) => wishlistGames.some((g) => g.id === gameId);
  const handleAddToWishlist = async (gameId: number) => {
    if (!currentUser) {
      setShowAuthModal(true);
      toast.info('Você precisa estar logado para adicionar jogos à lista de desejos.', {
        theme: 'dark',
        className: 'bg-gray-900 text-yellow-300 border border-cyan-700',
        autoClose: 2000,
      });
      return;
    }
    setWishlistLoadingId(gameId);
    await addToWishlist(gameId);
    setWishlistLoadingId(null);
  };
  const handleRemoveFromWishlist = async (gameId: number) => {
    setWishlistLoadingId(gameId);
    await removeFromWishlist(gameId);
    setWishlistLoadingId(null);
  };
  const handleAddToCart = async (game: Game) => {
    if (!currentUser) {
      setShowAuthModal(true);
      toast.info('Você precisa estar logado para adicionar jogos ao carrinho.', {
        theme: 'dark',
        className: 'bg-gray-900 text-yellow-300 border border-cyan-700',
        autoClose: 2000,
      });
      return;
    }
    if (cart?.items?.some((item: any) => item.game_id === game.id)) {
      toast.info(`O jogo "${game.title}" já está no seu carrinho.`, {
        theme: "dark",
        className: "bg-gray-900 text-yellow-300 border border-cyan-700",
        autoClose: 1000,
      });
      return;
    }
    setAddingToCartId(game.id);
    await addToCart(game);
    toast.success(`O jogo "${game.title}" foi adicionado ao carrinho!`, {
      theme: "dark",
      className: "bg-gray-900 text-green-400 border border-cyan-700",
      autoClose: 1000,
    });
    setAddingToCartId(null);
  };
  const handleTradeGame = (game: Game) => {
    navigate(`/trade?search=${encodeURIComponent(game.title)}`);
  };
  const handlePlayGame = async (userGame: UserGame) => {
    setLoadingPlayIds((prev) => [...prev, userGame.id]);
    await playGame(userGame);
    setTimeout(() => {
      setLoadingPlayIds((prev) => prev.filter((id) => id !== userGame.id));
    }, 1000);
  };
  const handleToggleGameTrade = async (userGame: UserGame) => {
    setLoadingTradeIds((prev) => [...prev, userGame.id]);
    if (userGame.in_trade) {
      await removeFromTrade(userGame);
    } else {
      await addToTrade(userGame);
    }
    setLoadingTradeIds((prev) => prev.filter((id) => id !== userGame.id));
  };
  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
    setTimeout(() => {
      if (filtersRef.current) {
        filtersRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  // ========== DERIVED GAMES ==========
  const discountedGames = getDiscountedGames(games, 6);
  const recentlyAddedGames = getRecentlyAddedGames(games, 6);

  // ========== RENDER GAME SECTION ==========
  function renderGameSection({ title, gamesList, emptyMessage, renderCard }: {
    title: React.ReactNode,
    gamesList: Game[],
    emptyMessage: string,
    renderCard: (game: Game) => React.ReactNode
  }) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h3 className="text-base md:text-lg font-medium flex items-center">
            {title}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 md:gap-4">
          {gamesList.length > 0
            ? gamesList.map(renderCard)
            : <div className="col-span-full text-center text-gray-400 py-10">{emptyMessage}</div>}
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="flex h-screen bg-gray-800 text-white overflow-hidden">
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} onLogin={() => setShowAuthModal(false)} />
      )}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="store" />
      <div className="flex-1 flex flex-col lg:ml-0 w-full">
        <Topbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          placeholder="Buscar na Loja"
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchInputRef={topbarInputRef}
        />
        <div className="flex-1 overflow-auto p-3 md:p-4">
          <div className="mx-auto">
            {/* Filtros */}
            <div ref={filtersRef} className="mb-6 flex flex-col md:flex-row md:items-start gap-4">
              <TagsFilter
                tags={tags}
                selectedTags={selectedTags}
                onTagsClick={handleTagClick}
                label="Tags"
                className=""
              />
              <PriceFilter
                min={0}
                max={2000}
                value={priceRange}
                onChange={setPriceRange}
                label="Preço"
                className=""
              />
            </div>
            {/* Grid de Jogos Selecionados */}
            <div className="mb-3">
              <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">Jogos Selecionados</h3>
              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 w-full transition-all duration-300">
                  {paginatedGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      primaryLabel={
                        <span className="flex items-center gap-2">
                          {addingToCartId === game.id
                            ? <Loader2 size={16} className="animate-spin" />
                            : <ShoppingCart size={16} />}
                          Adicionar ao Carrinho
                        </span>
                      }
                      secondaryLabel={
                        <span className="flex items-center gap-2">
                          <Repeat size={16} /> Trocar Jogo
                        </span>
                      }
                      onPrimaryAction={() => handleAddToCart(game)}
                      onSecondaryAction={handleTradeGame}
                    />
                  ))}
                  {/* Mostra jogos upcoming se pesquisar */}
                  {showSearchedUpcoming && searchedUpcoming.map((game) => {
                    const inWishlist = isInWishlist(game.id);
                    return (
                      <GameCard
                        key={game.id}
                        game={game}
                        showTags={true}
                        showPrice={true}
                        secondaryLabel={
                          <span className="flex items-center gap-2">
                            {wishlistLoadingId === game.id
                              ? <Loader2 size={16} className="animate-spin" />
                              : inWishlist ? <X size={16} /> : <Heart size={16} />}
                            {inWishlist ? "Remover da Lista de Desejos" : "Adicionar à Lista de Desejos"}
                          </span>
                        }
                        onSecondaryAction={
                          inWishlist
                            ? () => handleRemoveFromWishlist(game.id)
                            : () => handleAddToWishlist(game.id)
                        }
                        secondaryButtonClass={
                          inWishlist
                            ? "w-full py-1 rounded bg-red-700 hover:bg-red-800 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-red-700 transition"
                            : "w-full py-1 rounded bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-pink-700 transition"
                        }
                      />
                    );
                  })}
                  {/* Mostra jogos da biblioteca se pesquisar */}
                  {showSearchedOwned && searchedOwnedGames.map(({ userGame, game }) => {
                    if (!userGame || !game) return null;
                    const isPlayLoading = loadingPlayIds.includes(userGame.id);
                    const isTradeLoading = loadingTradeIds.includes(userGame.id);
                    return (
                      <GameCard
                        key={game.id}
                        game={game}
                        showTags={true}
                        showPrice={false}
                        primaryLabel={
                          <span className="flex items-center gap-2">
                            {isPlayLoading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Play size={16} />
                            )} Jogar
                          </span>
                        }
                        onPrimaryAction={() => handlePlayGame(userGame)}
                        secondaryLabel={
                          <span className="flex items-center gap-2">
                            {isTradeLoading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Repeat size={16} />
                            )}
                            {userGame.in_trade ? "Remover da troca" : "Adicionar para troca"}
                          </span>
                        }
                        onSecondaryAction={() => handleToggleGameTrade(userGame)}
                        secondaryButtonClass={
                          userGame.in_trade
                            ? "w-full py-1 rounded bg-red-700 hover:bg-red-800 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-cyan-700 transition"
                            : "w-full py-1 rounded bg-blue-900/80 hover:bg-blue-800 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 border border-cyan-700 transition"
                        }
                      />
                    );
                  })}
                  {paginatedGames.length === 0 && !showSearchedUpcoming && !showSearchedOwned && (
                    <div className="col-span-full text-center text-gray-400 py-10">Nenhum jogo encontrado com os filtros selecionados.</div>
                  )}
                </div>
                {totalPages > 1 && (
                  <div className="flex flex-col items-center justify-center mt-4 gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        className={`p-2 rounded-full border border-cyan-700 bg-gray-800 text-cyan-400 hover:bg-cyan-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed`}
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                        aria-label="Página anterior"
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <span className="text-xs text-gray-400">
                        Página {currentPage + 1} de {Math.max(totalPages, 1)}
                      </span>
                      <button
                        className={`p-2 rounded-full border border-cyan-700 bg-gray-800 text-cyan-400 hover:bg-cyan-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed`}
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages - 1}
                        aria-label="Próxima página"
                      >
                        <ChevronRight size={22} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Estreias em Breve */}
            {renderGameSection({
              title: (
                <>
                  Estreias em Breve
                  {upcomingGames.length > 0 && (
                    <span className="text-yellow-400 text-lg ml-1">({upcomingGames.length})</span>
                  )}
                </>
              ),
              gamesList: upcomingGames.slice(0, 6),
              emptyMessage: "Nenhum jogo encontrado.",
              renderCard: (game) => {
                const inWishlist = isInWishlist(game.id);
                return (
                  <GameCard
                    key={game.id}
                    game={{ ...game }}
                    showTags={true}
                    showPrice={true}
                    secondaryLabel={
                      <span className="flex items-center gap-2">
                        {wishlistLoadingId === game.id
                          ? <Loader2 size={16} className="animate-spin" />
                          : inWishlist ? <X size={16} /> : <Heart size={16} />}
                        {inWishlist ? "Remover da Lista de Desejos" : "Adicionar à Lista de Desejos"}
                      </span>
                    }
                    onSecondaryAction={
                      inWishlist
                        ? () => handleRemoveFromWishlist(game.id)
                        : () => handleAddToWishlist(game.id)
                    }
                    secondaryButtonClass={
                      inWishlist
                        ? "w-full py-1 rounded bg-red-700 hover:bg-red-800 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-red-700 transition"
                        : "w-full py-1 rounded bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-pink-700 transition"
                    }
                  />
                );
              }
            })}
            {/* Ofertas da Semana */}
            {renderGameSection({
              title: (
                <>
                  Ofertas da Semana
                  <span className="text-red-500 ml-1 text-lg">
                    -{Math.max(...discountedGames.map(g => g.discount || 0), 0)}%
                  </span>
                </>
              ),
              gamesList: discountedGames.slice(0, 6),
              emptyMessage: "Nenhum jogo encontrado.",
              renderCard: (game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  showTags={true}
                  showDiscount={true}
                  showPrice={true}
                />
              )
            })}
            {/* Jogos Recentemente Adicionados */}
            {renderGameSection({
              title: (
                <>
                  Jogos Recentemente Adicionados
                  <span className="text-yellow-400 text-xl ml-1">✦</span>
                </>
              ),
              gamesList: recentlyAddedGames.slice(0, 6),
              emptyMessage: "Nenhum jogo encontrado.",
              renderCard: (game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  showTags={true}
                  showDiscount={true}
                  showPrice={true}
                />
              )
            })}
            {/* Categorias em Destaque */}
            <FeaturedTags
              tags={tags}
              selectedCategories={selectedTags}
              onTagsClick={handleTagClick}
              title="Categorias em Destaque"
              maxToShow={6}
            />
          </div>
        </div>
      </div>
      {isPlaying && swfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          <button
            onClick={closeEmulator}
            className="absolute top-4 right-4 text-white bg-red-600 hover:bg-red-700 rounded-full p-2 z-50"
            title="Fechar"
          >
            <X size={20} />
          </button>
          <div className="w-full h-full flex items-center justify-center">
            <div ref={ruffleContainerRef} className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
}