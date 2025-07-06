import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Layout = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  };

  // Se o usuário não estiver autenticado e não estiver na página de login ou registro, redirecione para o login
  if (!isAuthenticated && !['/login', '/register'].includes(location.pathname)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se o usuário estiver autenticado e tentar acessar login/registro, redirecione para o dashboard
  if (isAuthenticated && ['/login', '/register', '/'].includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cabeçalho */}
      {!["/login", "/register"].includes(location.pathname) && (
        <header className="w-full bg-gradient-to-r from-sky-600/80 to-indigo-800/80 shadow-2xl rounded-b-3xl py-5 px-0 mb-10 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 px-6">
            {/* Logo e nome do app */}
            <div className="flex items-center gap-5">
              <div className="bg-white/30 rounded-full p-2 shadow-lg relative overflow-hidden">
                <div className="absolute -top-2 -left-2 w-10 h-10 bg-sky-400/40 rounded-full blur-xl animate-pulse"></div>
                <svg className="h-12 w-12 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent drop-shadow-md select-none">
                Task <span className="text-white drop-shadow-lg">Manager</span>
              </span>
            </div>
            {/* Navegação */}
            <nav className="flex flex-wrap items-center gap-2 md:gap-6 text-sm md:text-base font-semibold bg-white/10 rounded-xl px-4 py-2 shadow-inner">
              {[
                { to: '/', label: 'Dashboard' },
                { to: '/tasks', label: 'Tarefas' },
                ...(isAdmin ? [
                  { to: '/teams', label: 'Times' },
                  { to: '/users', label: 'Usuários' }
                ] : []),
                { to: '/profile', label: 'Perfil' }
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg transition-all duration-150 hover:bg-sky-500/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-300/40 ${location.pathname === link.to ? 'bg-sky-600/80 text-white shadow' : 'text-white/90'}`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="ml-2 text-sky-200 hover:text-white px-3 py-2 rounded-lg border border-sky-200/30 hover:bg-sky-600 bg-transparent transition-colors font-bold shadow"
              >
                Sair
              </button>
            </nav>
            {/* Usuário logado */}
            {user && (
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                <div className="w-10 h-10 rounded-full bg-sky-300/60 flex items-center justify-center text-xl font-bold text-white shadow-md border-2 border-white/40 select-none">
                  {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <span className="text-white font-bold text-base bg-white/10 px-3 py-1 rounded-lg shadow-sm">
                  {user.name}
                  {isAdmin && <span className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-400 text-gray-900 font-bold">ADMIN</span>}
                </span>
              </div>
            )}
          </div>
        </header>
      )}


      {/* Conteúdo principal */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
