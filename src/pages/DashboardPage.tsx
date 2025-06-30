import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';

// Tipos para as tarefas
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
}

const DashboardPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função utilitária para buscar tarefas da API
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Erro ao buscar tarefas');
      const data = await response.json();
      let tasksArray: Task[] = [];
      if (Array.isArray(data)) {
        tasksArray = data;
      } else if (data && data.data && Array.isArray(data.data.tasks)) {
        tasksArray = data.data.tasks;
      } else {
        console.error('A resposta da API não contém um array de tarefas:', data);
        toast.error('Erro: resposta inesperada da API de tarefas');
        setTasks([]);
        setIsLoading(false);
        return;
      }
      // Ordenação customizada por status e data
      const statusOrder: Record<string, number> = {
        'PENDING': 0,
        'IN_PROGRESS': 1,
        'BLOCKED': 2,
        'COMPLETED': 3
      };
      const sortedTasks = tasksArray.sort((a: Task, b: Task) => {
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast.error('Não foi possível carregar as tarefas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Olá, {user?.name || 'Usuário'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Aqui está o resumo das suas atividades
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Cartões de resumo */}
          {[
            { 
              title: 'Tarefas Pendentes', 
              value: tasks.filter(t => t.status === 'PENDING').length,
              icon: '📝',
              color: 'bg-yellow-500',
            },
            { 
              title: 'Em Andamento', 
              value: tasks.filter(t => t.status === 'IN_PROGRESS').length,
              icon: '⏳',
              color: 'bg-blue-500',
            },
            { 
              title: 'Concluídas', 
              value: tasks.filter(t => t.status === 'COMPLETED').length,
              icon: '✅',
              color: 'bg-green-500',
            },
            { 
              title: 'Bloqueadas', 
              value: tasks.filter(t => t.status === 'BLOCKED').length,
              icon: '⛔',
              color: 'bg-red-500',
            }, 
          ].map((stat, statIdx) => (
            <div
              key={statIdx}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                    <span className="text-white text-xl">{stat.icon}</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                        {stat.title}
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          {stat.value}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Últimas Tarefas
              </h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Uma lista de todas as suas tarefas recentes.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <Link
                to="/tasks/new"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
              >
                Adicionar Tarefa
              </Link>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  {isLoading ? (
                    <div className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Carregando tarefas...
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Nenhuma tarefa encontrada. <Link to="/tasks/new" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">Crie uma nova tarefa</Link> para começar.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                            Tarefa
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                            Status
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                            Prioridade
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                            Vencimento
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Ações</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {tasks.slice(0, 5).map((task) => (
                          <tr key={task.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                              <div className="font-medium">{task.title}</div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-1">
                                {task.description}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <StatusBadge status={task.status} className="text-xs" />
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <PriorityBadge priority={task.priority} className="text-xs" />
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                              {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <Link
                                to={`/tasks/${task.id}`}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                              >
                                Ver detalhes
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
