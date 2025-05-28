import { useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  Library,
  Store,
  Heart,
  Repeat,
  CreditCard,
  HelpCircle,
  X,
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  active: string;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, active }: SidebarProps) {
  const navigate = useNavigate();
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 md:w-48 bg-gray-800 border-r border-gray-700 flex flex-col
          transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 transition-transform duration-300 ease-in-out
        `}
      >
        <div className="p-[19px] border-b border-gray-700 flex justify-between items-center">
          <p className="text-3xl font-bold">
            <span className="text-white">Pixel</span>
            <span className="text-blue-400">Place</span>
          </p>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={toggleSidebar}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 px-2 py-4">
            <li
              className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${
                active === "home"
                  ? "bg-cyan-900/60 text-cyan-300 font-semibold"
                  : "hover:bg-gray-700"
              }`}
              onClick={() => navigate("/")}
            >
              <HomeIcon size={18} />
              <span>Inicial</span>
            </li>
            <li
              className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${
                active === "library"
                  ? "bg-cyan-900/60 text-cyan-300 font-semibold"
                  : "hover:bg-gray-700"
              }`}
              onClick={() => navigate("/library")}
            >
              <Library size={18} />
              <span>Biblioteca</span>
            </li>
            <li
              className={`flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-md cursor-pointer ${
                active === "store"
                  ? "bg-cyan-900/60 text-cyan-300 font-semibold"
                  : "hover:bg-gray-700"
              }`}
              onClick={() => navigate("/store")}
            >
              <Store size={18} />
              <span>Loja</span>
            </li>
            <li
              className={`flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-md cursor-pointer ${
                active === "wishlist"
                  ? "bg-cyan-900/60 text-cyan-300 font-semibold"
                  : "hover:bg-gray-700"
              }`}
              onClick={() => navigate("/wishlist")}
            >
              <Heart size={18} />
              <span>Lista de Desejo</span>
            </li>
            <li
              className={`flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-md cursor-pointer ${
                active === "trade"
                  ? "bg-cyan-900/60 text-cyan-300 font-semibold"
                  : "hover:bg-gray-700"
              }`}
              onClick={() => navigate("/trade")}
            >
              <Repeat size={18} />
              <span>Trocar Jogos</span>
            </li>
            <li
              className={`flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-md cursor-pointer ${
                active === "transactions"
                  ? "bg-cyan-900/60 text-cyan-300 font-semibold"
                  : "hover:bg-gray-700"
              }`}
              onClick={() => navigate("/transactions")}
            >
              <CreditCard size={18} />
              <span>Transações</span>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <li
            className={`flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-md cursor-pointer ${
              active === "help"
                ? "bg-cyan-900/60 text-cyan-300 font-semibold"
                : "hover:bg-gray-700"
            }`}
            onClick={() => navigate("/help")}
          >
            <HelpCircle size={18} />
            <span>Ajuda</span>
          </li>
        </div>
      </div>
    </>
  );
}