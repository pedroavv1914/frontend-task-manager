import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="py-12 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase">
            Gerenciador de Tarefas
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Organize suas tarefas de forma simples e eficiente
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
            Gerencie suas tarefas, equipes e projetos em um só lugar. Aumente sua produtividade hoje mesmo!
          </p>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Tarefas',
                description: 'Crie, organize e acompanhe suas tarefas em um só lugar.',
                icon: '📝',
              },
              {
                name: 'Equipes',
                description: 'Colabore com sua equipe em projetos compartilhados.',
                icon: '👥',
              },
              {
                name: 'Relatórios',
                description: 'Acompanhe seu progresso com relatórios detalhados.',
                icon: '📊',
              },
            ].map((feature) => (
              <div
                key={feature.name}
                className="pt-6"
              >
                <div className="flow-root bg-gray-50 dark:bg-gray-800 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg text-2xl">
                        {feature.icon}
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">
                      {feature.name}
                    </h3>
                    <p className="mt-5 text-base text-gray-500 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isAuthenticated && (
          <div className="mt-10 text-center">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Comece agora
              </Link>
            </div>
            <div className="mt-3">
              <p className="text-base text-gray-500 dark:text-gray-300">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Faça login
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
