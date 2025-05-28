import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/menu/Sidebar";
import Topbar from "../components/menu/Topbar";
import Tags from "../components/Tags";
import BannerCard from "../components/BannerCard";
import { useGames } from "../contexts/AppDataContext";
import GameCard from "../components/GameCard";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const prevSearch = useRef("");
  const navigate = useNavigate();

  // Buscar jogos e categorias do contexto
  const { tags, recentlyAddedGames, featuredGames } = useGames();

  // Função para navegar para a Store filtrando por categoria
  const handleTagClick = (tag: string) => {
    navigate(`/store?category=${encodeURIComponent(tag)}`);
  };

  // Redireciona para a Store ao digitar a primeira letra
  useEffect(() => {
    if (prevSearch.current === "" && search.trim() !== "") {
      navigate(`/store?search=${encodeURIComponent(search)}`);
    }
    prevSearch.current = search;
  }, [search, navigate]);

  return (
    <div className="flex h-screen bg-gray-800 text-white overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="home" />
      <div className="flex-1 flex flex-col w-full">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} placeholder="Pesquisar Loja" searchValue={search} onSearchChange={setSearch} />
        <div className="flex-1 overflow-auto p-3 md:p-4">
          <div className="mx-auto">
            {/* Jogo(s) em destaque */}
            {featuredGames.length > 0 && (
              <BannerCard games={featuredGames} />
            )}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-medium flex items-center">
                  Jogos Recentemente Adicionados
                  <span className="text-yellow-400 ml-1">✦</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 md:gap-4">
                {recentlyAddedGames && recentlyAddedGames.length > 0 ? (
                  recentlyAddedGames.slice(0, 6).map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      showTags={true}
                      showDiscount={true}
                      showPrice={true}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-400 py-10">Nenhum jogo encontrado.</div>
                )}
              </div>
            </div>
            {/* Categorias em destaque */}
            {tags && tags.length > 0 ? (
              <Tags
                tags={tags}
                onTagsClick={handleTagClick}
                maxToShow={6}
                title="Categorias em Destaque"
              />
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}