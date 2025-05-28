import { useRef, useState, useEffect } from 'react';
import supabase from '../services/supabaseClient';
import { getAllTags, createTagIfNotExists, addTagsToGame } from '../services/dataService';

// @ts-ignore
declare global { interface Window { RufflePlayer: any } }

const ADMIN_PASSWORD = '';
const SWF_BUCKET = 'games-swf';
const COVER_BUCKET = 'games-covers';

export default function AdminGameUpload() {
  const [adminPass, setAdminPass] = useState('');
  const [auth, setAuth] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [swfFile, setSwfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverInput, setCoverInput] = useState('');
  const [swfLoaded, setSwfLoaded] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const swfPreviewRef = useRef<HTMLDivElement>(null);
  const swfInputRef = useRef<HTMLInputElement>(null);
  const [discount, setDiscount] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  // Banner
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerInput, setBannerInput] = useState('');

  // Carregar Ruffle via CDN
  if (typeof window !== 'undefined' && !window.RufflePlayer) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@ruffle-rs/ruffle';
    script.async = true;
    document.body.appendChild(script);
  }

  // Buscar todas as tags ao montar o componente
  useEffect(() => {
    getAllTags()
      .then(tags => setAllTags(tags.map(t => t.name)))
      .catch(() => setAllTags([]));
  }, []);

  // Filtrar sugestões conforme digita
  function handleTagsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setTags(value);
    if (value.trim() === '') {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
      return;
    }
    // Pega a última tag sendo digitada
    const last = value.split(',').pop()?.trim().toLowerCase() || '';
    if (last.length > 0) {
      const filtered = allTags.filter(
        (tag) => tag.toLowerCase().includes(last) &&
          !value.split(',').map(t => t.trim().toLowerCase()).includes(tag.toLowerCase())
      );
      setTagSuggestions(filtered.slice(0, 5));
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
    }
  }

  function handleTagSuggestionClick(suggestion: string) {
    // Remove espaços extras e vírgulas finais
    let tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    // Substitui a última tag pelo suggestion
    tagsArr = [...tagsArr.slice(0, -1), suggestion];
    // Remove duplicatas
    tagsArr = Array.from(new Set(tagsArr));
    setTags(tagsArr.join(', ') + ', ');
    setShowTagSuggestions(false);
  }

  // Preview da imagem
  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setCoverFile(file || null);
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverUrl(url);
      setCoverInput('');
    }
  }

  // Preview da imagem por URL
  function handleCoverUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const url = e.target.value;
    setCoverInput(url);
    setCoverFile(null);
    if (url.startsWith('http')) {
      setCoverUrl(url);
    } else {
      setCoverUrl('');
    }
  }

  function handleRemoveCover() {
    setCoverFile(null);
    setCoverUrl('');
    setCoverInput('');
  }

  function handleRemoveSwf() {
    setSwfFile(null);
    setSwfLoaded(false);
    if (swfPreviewRef.current) swfPreviewRef.current.innerHTML = '';
    if (swfInputRef.current) swfInputRef.current.value = '';
  }

  // Formatação automática do preço
  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/[^\d]/g, '');
    if (!value) {
      setPrice('');
      return;
    }
    // Formata para reais: 123456 -> 1.234,56
    value = (parseInt(value, 10) / 100).toFixed(2);
    value = value.replace('.', ',');
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setPrice(value);
  }

  // Preview do SWF
  async function handleSwfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSwfLoaded(false);
    const file = e.target.files?.[0];
    if (file) {
      setSwfFile(file);
      setTimeout(() => loadSwfPreview(URL.createObjectURL(file)), 300); // Espera Ruffle carregar
    }
  }

  function loadSwfPreview(url: string) {
    setSwfLoaded(false);
    if (swfPreviewRef.current && window.RufflePlayer) {
      swfPreviewRef.current.innerHTML = '';
      // @ts-ignore
      const ruffle = window.RufflePlayer.newest();
      // @ts-ignore
      const player = ruffle.createPlayer();
      player.width = 400;
      player.height = 300;
      player.style.width = '400px';
      player.style.height = '300px';
      player.addEventListener('loadedmetadata', () => setSwfLoaded(true));
      player.addEventListener('error', () => setSwfLoaded(false));
      swfPreviewRef.current.appendChild(player);
      player.load(url);
      setTimeout(() => setSwfLoaded(true), 2000); // fallback: considera carregado após 2s
    }
  }

  // Preview do banner
  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setBannerFile(file || null);
    if (file) {
      const url = URL.createObjectURL(file);
      setBannerUrl(url);
      setBannerInput('');
    }
  }
  function handleBannerUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const url = e.target.value;
    setBannerInput(url);
    setBannerFile(null);
    if (url.startsWith('http')) {
      setBannerUrl(url);
    } else {
      setBannerUrl('');
    }
  }
  function handleRemoveBanner() {
    setBannerFile(null);
    setBannerUrl('');
    setBannerInput('');
  }

  // Formatação e limitação do desconto
  function handleDiscountChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/[^\d]/g, '');
    let num = Number(value);
    if (num < 0) num = 0;
    if (num > 100) num = 100;
    setDiscount(num ? String(num) : '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!auth) return setError('Acesso negado.');
    if (!title || !price || !capaPreenchida) return setError('Preencha todos os campos obrigatórios.');
    setLoading(true);
    try {
      // 1. Garantir que todas as tags existem e obter seus ids
      const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
      const tagIds: number[] = [];
      for (const tagName of tagsArr) {
        const tagId = await createTagIfNotExists(tagName);
        tagIds.push(tagId);
      }

      // 2. Upload SWF (opcional)
      let swfUrl = '';
      if (swfFile) {
        const swfExt = swfFile.name.split('.').pop();
        const swfStorageName = `${Date.now()}_${title.replace(/\s+/g, '_')}.${swfExt}`;
        const { error: swfErr } = await supabase.storage.from(SWF_BUCKET).upload(swfStorageName, swfFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/x-shockwave-flash',
        });
        if (swfErr) throw swfErr;
        swfUrl = supabase.storage.from(SWF_BUCKET).getPublicUrl(swfStorageName).data.publicUrl;
      }
      // 3. Upload capa (opcional, mas validada como obrigatória na tela)
      let image = '';
      if (coverFile) {
        const coverExt = coverFile.name.split('.').pop();
        const coverStorageName = `${Date.now()}_${title.replace(/\s+/g, '_')}_cover.${coverExt}`;
        const { error: coverErr } = await supabase.storage.from(COVER_BUCKET).upload(coverStorageName, coverFile, {
          cacheControl: '3600',
          upsert: false,
        });
        if (coverErr) throw coverErr;
        image = supabase.storage.from(COVER_BUCKET).getPublicUrl(coverStorageName).data.publicUrl;
      } else if (coverInput.startsWith('http')) {
        image = coverInput;
      }
      // 4. Upload banner (opcional)
      let banner = '';
      if (bannerFile) {
        const bannerExt = bannerFile.name.split('.').pop();
        const bannerStorageName = `${Date.now()}_${title.replace(/\s+/g, '_')}_banner.${bannerExt}`;
        const { error: bannerErr } = await supabase.storage.from(COVER_BUCKET).upload(bannerStorageName, bannerFile, {
          cacheControl: '3600',
          upsert: false,
        });
        if (bannerErr) throw bannerErr;
        banner = supabase.storage.from(COVER_BUCKET).getPublicUrl(bannerStorageName).data.publicUrl;
      } else if (bannerInput.startsWith('http')) {
        banner = bannerInput;
      }
      // 5. Salvar o jogo no banco (sem o campo tags)
      const { data: gameData, error: dbErr } = await supabase.from('games').insert({
        title,
        price: Number(price.replace(/\./g, '').replace(',', '.')),
        swfUrl: swfUrl || null,
        image: image || null,
        discount: discount ? Number(discount) : null,
        releaseDate: releaseDate || null,
        banner: banner || null,
      }).select('id').single();
      if (dbErr) throw dbErr;
      // 6. Associar as tags ao jogo
      if (gameData && gameData.id && tagIds.length > 0) {
        await addTagsToGame(gameData.id, tagIds);
      }
      setSuccess('Jogo cadastrado com sucesso!');
      setTitle(''); setPrice(''); setTags(''); setSwfFile(null); setCoverFile(null); setCoverUrl(''); setCoverInput(''); setSwfLoaded(false); setDiscount(''); setReleaseDate(''); setBannerFile(null); setBannerUrl(''); setBannerInput('');
      if (swfInputRef.current) swfInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar jogo');
    } finally {
      setLoading(false);
    }
  }

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) setAuth(true);
    else setError('Senha de admin incorreta');
  }

  if (!auth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <form onSubmit={handleAuth} className="bg-gray-800 p-6 rounded shadow-md flex flex-col gap-4">
          <h2 className="text-cyan-400 text-xl font-bold mb-2">Admin - Upload de Jogo</h2>
          <input type="password" placeholder="Senha de admin" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="px-3 py-2 rounded bg-gray-700 border border-cyan-700 text-white focus:outline-none" />
          <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white rounded py-2 font-semibold">Entrar</button>
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </form>
      </div>
    );
  }

  // Validação dos campos obrigatórios
  const capaPreenchida = !!(coverFile || (coverInput && coverInput.startsWith('http')));
  const canSubmit = auth && title && price && capaPreenchida;

  return (
    <div className="w-full mx-auto p-4 md:p-8 bg-gray-900 min-h-screen flex flex-col justify-center">
      <h2 className="text-cyan-400 text-2xl font-bold mb-4 text-center">Cadastrar Novo Jogo SWF</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <input type="text" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} className="px-3 py-2 rounded bg-gray-700 border border-cyan-700 text-white focus:outline-none w-full" required />
        <input type="text" placeholder="Preço (R$)" value={price} onChange={handlePriceChange} className="px-3 py-2 rounded bg-gray-700 border border-cyan-700 text-white focus:outline-none w-full" required inputMode="numeric" />
        <div className="relative w-full max-w-full">
          <input
            type="text"
            placeholder="Tags (separadas por vírgula) Opcional"
            value={tags}
            onChange={handleTagsChange}
            onFocus={handleTagsChange}
            className="px-3 py-2 rounded bg-gray-700 border border-cyan-700 text-white focus:outline-none w-full"
            autoComplete="off"
          />
          {showTagSuggestions && tagSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 bg-gray-800 border border-cyan-700 rounded shadow-md mt-1 z-20 w-full">
              {tagSuggestions.map((suggestion) => (
                <div
                  key={suggestion}
                  className="px-3 py-2 cursor-pointer hover:bg-cyan-700 text-white text-sm"
                  onClick={() => handleTagSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        <input
          type="number"
          placeholder="Desconto (%) opcional"
          value={discount}
          onChange={handleDiscountChange}
          className="px-3 py-2 rounded bg-gray-700 border border-cyan-700 text-white focus:outline-none w-full"
          min={0} max={100}
        />
        <input
          type="date"
          placeholder="Data de lançamento"
          value={releaseDate}
          onChange={e => setReleaseDate(e.target.value)}
          className="px-3 py-2 rounded bg-gray-700 border border-cyan-700 text-white focus:outline-none w-full"
          title="Data de lançamento do jogo (opcional)"
        />
        <span className="text-xs text-gray-400 -mt-2 mb-1">Data de lançamento (opcional)</span>
        <label className="text-cyan-300">Arquivo SWF (Opcional)</label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <input type="file" accept=".swf" onChange={handleSwfChange} className="text-white" required={false} disabled={!!swfFile} ref={swfInputRef} />
          {swfFile && <button type="button" onClick={handleRemoveSwf} className="text-red-400 hover:text-red-600 text-xs border border-red-400 rounded px-2 py-1">Remover SWF</button>}
        </div>
        <div ref={swfPreviewRef} className="border border-cyan-700 rounded bg-black my-2 flex items-center justify-center w-full" style={{ maxWidth: 400, height: 300 }} />
        {!swfLoaded && swfFile && <div className="text-yellow-400 text-xs">O SWF precisa carregar corretamente para permitir o cadastro.</div>}
        <label className="text-cyan-300">Imagem de capa</label>
        <div className="flex flex-col gap-2">
          <input type="file" accept="image/*" onChange={handleCoverChange} className="text-white" disabled={!!coverFile || !!coverInput} />
          <span className="text-gray-400 text-xs">ou</span>
          <input type="text" placeholder="URL da imagem (https://...)" value={coverInput} onChange={handleCoverUrlChange} className="px-2 py-1 rounded bg-gray-700 border border-cyan-700 text-white focus:outline-none w-64" disabled={!!coverFile} />
          {(coverFile || coverInput) && <button type="button" onClick={handleRemoveCover} className="text-red-400 hover:text-red-600 text-xs border border-red-400 rounded px-2 py-1 max-w-xs">Remover capa</button>}
        </div>
        {coverUrl && <img src={coverUrl} alt="Preview capa" className="w-full max-w-xs h-32 object-cover rounded border border-cyan-700" />}
        <label className="text-cyan-300">Banner (opcional)</label>
        <div className="flex flex-col gap-2">
          <input type="file" accept="image/*" onChange={handleBannerChange} className="text-white" disabled={!!bannerFile || !!bannerInput} />
          <span className="text-gray-400 text-xs">ou</span>
          <input type="text" placeholder="URL do banner (https://...)" value={bannerInput} onChange={handleBannerUrlChange} className="px-2 py-1 rounded bg-gray-700 border border-cyan-700 text-white focus:outline-none w-64" disabled={!!bannerFile} />
          {(bannerFile || bannerInput) && <button type="button" onClick={handleRemoveBanner} className="text-red-400 hover:text-red-600 text-xs border border-red-400 rounded px-2 py-1 max-w-xs">Remover banner</button>}
        </div>
        {bannerUrl && <img src={bannerUrl} alt="Preview banner" className="w-full max-w-xs h-32 object-cover rounded border border-cyan-700" />}
        <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white rounded py-2 font-semibold disabled:opacity-50 w-full" disabled={!canSubmit || loading}>{loading ? 'Enviando...' : 'Cadastrar Jogo'}</button>
        {error && <div className="text-red-400 text-sm text-center">{error}</div>}
        {success && <div className="text-green-400 text-sm text-center">{success}</div>}
      </form>
    </div>
  );
} 