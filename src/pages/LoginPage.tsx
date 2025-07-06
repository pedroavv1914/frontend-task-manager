import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

type FormData = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      const success = await login(data.email, data.password);
      if (success) {
        toast.success('Login realizado com sucesso!');
        navigate(from, { replace: true });
      } else {
        toast.error('Credenciais inválidas. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error('Ocorreu um erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-md w-full space-y-8 p-10 rounded-3xl shadow-2xl border-2 border-sky-400 bg-gradient-to-br from-sky-50 via-sky-100 to-indigo-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-full p-3 shadow-lg mb-4 animate-pulse">
            <svg className="h-14 w-14 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center drop-shadow-sm">Bem-vindo de volta!</h2>
          <p className="mt-2 text-center text-base text-gray-700 dark:text-gray-300">Faça login para acessar o seu painel de tarefas.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="relative mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 sm:text-sm dark:bg-gray-700 dark:text-white`}
                  {...register('email', { required: 'Email é obrigatório' })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="mt-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`block w-full pl-10 pr-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 sm:text-sm dark:bg-gray-700 dark:text-white`}
                  {...register('password', { required: 'Senha é obrigatória' })}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 rounded-lg shadow-lg text-base font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Entrando...</span>
              ) : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
