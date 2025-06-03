import { useRef, useState } from "react";
import { getGameSwfUrl } from "../services/dataService";
import type { UserGame } from "../services/entities";

declare global { interface Window { RufflePlayer: any } }

export function usePlayGame() {
  const [swfUrl, setSwfUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const ruffleContainerRef = useRef<HTMLDivElement>(null);

  const playGame = async (userGame: UserGame) => {
    try {
      setLoading(true);
      const url = await getGameSwfUrl(userGame.game_id, userGame.user_id);
      if (!url) throw new Error("URL do SWF não encontrada.");
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "application/x-shockwave-flash" });
      const blobUrl = URL.createObjectURL(blob);
      setSwfUrl(blobUrl);
      setIsPlaying(true);
      setTimeout(() => {
        if (ruffleContainerRef.current && window.RufflePlayer) {
          ruffleContainerRef.current.innerHTML = "";
          const ruffle = window.RufflePlayer.newest();
          const player = ruffle.createPlayer();
          player.style.width = "100%";
          player.style.height = "100%";
          player.style.maxWidth = "100%";
          player.style.maxHeight = "100%";
          player.style.objectFit = "contain";
          player.style.display = "block";
          ruffleContainerRef.current.appendChild(player);
          player.load(blobUrl);
        }
      }, 100);
    } catch (err) {
      console.error("Erro ao carregar SWF:", err);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const closeEmulator = () => {
    if (swfUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(swfUrl);
    }
    setSwfUrl(null);
    setIsPlaying(false);
  };

  return { playGame, isPlaying, swfUrl, closeEmulator, ruffleContainerRef, loading };
} 