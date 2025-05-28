import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, ArrowLeft, Repeat, LogOut, MonitorPlay } from "lucide-react";
import Sidebar from "../components/menu/Sidebar";
import Topbar from "../components/menu/Topbar";

export default function Help() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-800 text-white overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="help" />
      <div className="flex-1 flex flex-col lg:ml-0 w-full">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} placeholder="Ajuda e Diferenciais" searchValue={search} onSearchChange={setSearch} />
        <div className="flex-1 overflow-auto p-3 md:p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl bg-gray-900 rounded-lg shadow-lg p-6 md:p-10 border border-cyan-700 flex flex-col items-center">
            <Info size={40} className="text-cyan-400 mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-cyan-300 mb-2 text-center">Por que escolher nossa plataforma?</h2>
            <p className="text-gray-300 text-center mb-6 max-w-xl">
              Descubra os diferenciais que tornam nossa loja única e perfeita para gamers modernos!
            </p>
            <ul className="space-y-5 w-full">
              <li className="flex items-start gap-3">
                <MonitorPlay size={28} className="text-pink-400 mt-1" />
                <div>
                  <span className="font-semibold text-cyan-300">Jogos rodam direto no navegador</span>
                  <p className="text-gray-400 text-sm">Nada de downloads ou instalações. Jogue instantaneamente, de qualquer dispositivo, com performance otimizada e sem complicações.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Repeat size={28} className="text-green-400 mt-1" />
                <div>
                  <span className="font-semibold text-cyan-300">Troca de jogos entre usuários</span>
                  <p className="text-gray-400 text-sm">Ofereça seus jogos para troca e descubra novos títulos sem gastar mais. Negocie de forma fácil, rápida e segura.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <LogOut size={28} className="text-yellow-400 mt-1" />
                <div>
                  <span className="font-semibold text-cyan-300">Troca de contas</span>
                  <p className="text-gray-400 text-sm">Você pode negociar contas inteiras (Todos os jogos), ampliando ainda mais suas possibilidades e experiências.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Info size={28} className="text-cyan-400 mt-1" />
                <div>
                  <span className="font-semibold text-cyan-300">Experiência moderna, segura e responsiva</span>
                  <p className="text-gray-400 text-sm">Interface intuitiva, design responsivo, navegação fluida e total segurança para suas transações e dados.</p>
                </div>
              </li>
            </ul>
            <button
              className="mt-8 px-6 py-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-semibold flex items-center gap-2 transition"
              onClick={() => navigate("/store")}
            >
              <ArrowLeft size={18} /> Voltar para a Loja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 