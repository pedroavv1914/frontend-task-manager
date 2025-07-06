import React, { useEffect, useState } from 'react';
import { DashboardHero } from '../components/DashboardHero';
import { DashboardSidebar } from '../components/DashboardSidebar';
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
  assignedTo?: number[];
  assignee?: {
    id: number;
    name: string;
    avatar?: string;
  };
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
    <div className="py-8  bg-gradient-to-br from-sky-50 via-indigo-50 to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="mx-auto px-4 sm:px-6 md:px-8">
        {/* Bloco Hero + Sidebar Dashboard preenchendo o topo */}
        <div className="flex flex-col md:flex-row gap-8 w-full">
          <div className="flex-1 min-w-0">
            {(() => {
              const userId = Number(user?.id);
              return (
                <DashboardHero
                  userName={user?.name || 'Usuário'}
                  avatarUrl={user?.avatar}
                  completed={tasks.filter(t =>
                    t.status === 'COMPLETED' &&
                    (
                      (Array.isArray(t.assignedTo) && userId && t.assignedTo.includes(userId)) ||
                      (t.assignee?.id === userId)
                    )
                  ).length}
                  total={tasks.filter(t =>
                    (Array.isArray(t.assignedTo) && userId && t.assignedTo.includes(userId)) ||
                    (t.assignee?.id === userId)
                  ).length}
                />
              );
            })()}

          </div>
          <DashboardSidebar
            recentTasks={tasks
              .slice()
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3)
              .map(t => ({ id: t.id, title: t.title, status: t.status, createdAt: t.createdAt }))}
            onNewTask={() => alert('Funcionalidade de nova tarefa em breve!')}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {/* Cartões de resumo */}
          {[
            { 
              title: 'Tarefas Pendentes', 
              value: tasks.filter(t => t.status === 'PENDING').length,
              icon: '📝',
              color: 'bg-yellow-400',
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
              className={`group bg-gradient-to-tr ${stat.color} to-indigo-400 dark:to-indigo-700 overflow-hidden shadow-xl rounded-2xl border-2 border-sky-200 dark:border-sky-700 transition-transform hover:scale-105 hover:shadow-2xl`}
            >
              <div className="p-6 flex items-center gap-5">
                <div className="flex-shrink-0 rounded-full bg-white/30 dark:bg-gray-900/40 p-4 shadow group-hover:scale-110 transition-transform">
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <div className="w-0 flex-1">
                  <dl>
                    <dt className="text-base font-semibold text-gray-700 dark:text-gray-200 truncate">
                      {stat.title}
                    </dt>
                    <dd>
                      <div className="text-3xl font-extrabold text-gray-900 dark:text-white drop-shadow-sm">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
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
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600 rounded-2xl overflow-hidden shadow-xl">
                      <thead className="bg-gradient-to-r from-sky-100 via-indigo-100 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
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
                            Responsável
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Ações</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {tasks.slice(0, 5).map((task) => (
                          <tr key={task.id} className="transition-colors hover:bg-sky-50 dark:hover:bg-gray-900">
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                              <div className="font-medium">{task.title}</div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs mt-1 truncate max-w-xs">
                                {task.description && task.description.length > 60 ? `${task.description.slice(0, 60)}...` : task.description}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <StatusBadge status={task.status} className="text-xs" />
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <PriorityBadge priority={task.priority} className="text-xs" />
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 dark:text-gray-200">
                              {'assignee' in task && task.assignee && typeof task.assignee === 'object' && 'name' in task.assignee && typeof (task.assignee as { name: string }).name === 'string' ? (
                                <span className="inline-flex items-center gap-2">
                                  <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shadow bg-gradient-to-br from-blue-400 to-blue-700 border-2 border-white dark:border-gray-800">
                                    {(task.assignee as { name: string }).name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
                                  </span>
                                  <span>{(task.assignee as { name: string }).name}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400">Não atribuído</span>
                              )}
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
