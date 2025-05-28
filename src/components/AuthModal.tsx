import React, { useState } from 'react';
import { useAuthActions } from '../helpers/useAuthActions';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthModal({ onClose, onLogin }: { onClose: () => void, onLogin: (user: any) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuthActions();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let user;
      if (isRegister) {
        user = await register(userName, password);
      } else {
        user = await login(userName, password);
      }
      onLogin(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg p-6 max-w-[90vw] md:max-w-md w-full border border-cyan-700 shadow-xl relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={onClose}>×</button>
        <h4 className="text-lg font-semibold mb-4 text-cyan-400">{isRegister ? 'Criar Conta' : 'Entrar'}</h4>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nome de usuário"
            minLength={5}
            maxLength={25}
            value={userName}
            onChange={e => setUserName(e.target.value)}
            className="px-3 py-2 rounded bg-gray-700 border border-cyan-700 text-white focus:outline-none"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              minLength={5}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 border border-cyan-700 text-white focus:outline-none w-full pr-10"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-200 focus:outline-none"
              tabIndex={0}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Aguarde...' : isRegister ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>
        <div className="mt-4 text-center">
          {isRegister ? (
            <span className="text-gray-400 text-xs">
              Já tem conta?{' '}
              <button className="text-cyan-400 underline" type="button" onClick={() => setIsRegister(false)}>Entrar</button>
            </span>
          ) : (
            <span className="text-gray-400 text-xs">
              Não tem conta?{' '}
              <button className="text-cyan-400 underline" type="button" onClick={() => setIsRegister(true)}>Cadastre-se</button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 