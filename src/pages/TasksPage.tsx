import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTasks } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';

const TasksPage = () => {
  // Limpa localStorage de tasks/teams/users ao carregar a página (exceto token)
  useEffect(() => {
    Object.keys(localStorage).forEach(key => {
      if (!['token'].includes(key)) localStorage.removeItem(key);
    });
  }, []);
  const { tasks, deleteTask, teams } = useTasks();
  const [isLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  console.log('Todas as tarefas:', tasks);
  
  const filteredTasks = useMemo(() => {
    console.log('=== INICIANDO FILTRAGEM ===');
    console.log('Filtros ativos:', { status: filter, time: teamFilter, busca: searchTerm });
    console.log('Total de tarefas para filtrar:', tasks.length);
    
    const filtered = tasks.filter(task => {
      console.log('\n--- Verificando tarefa ---');
      console.log('ID:', task.id);
      console.log('Título:', task.title);
      console.log('Status:', task.status, `(tipo: ${typeof task.status})`);
      console.log('Time:', task.team?.name || 'Sem time');
      
      // Filtro por status
      if (filter !== 'all') {
        // Verifica se o status da tarefa é definido
        if (!task.status) {
          console.log('❌ Tarefa sem status definido');
          return false;
        }
        
        // Garante que o status da tarefa esteja em maiúsculas para comparação
        const taskStatus = task.status.toUpperCase();
        const filterStatus = filter.toUpperCase();
        
        // Compara os valores de status em maiúsculas
        if (taskStatus !== filterStatus) {
          console.log(`❌ Status não corresponde: "${taskStatus}" !== "${filterStatus}"`);
          return false;
        }
        console.log('✅ Status corresponde');
      }
      
      // Filtro por time
      if (teamFilter !== 'all') {
        if (task.team?.id !== teamFilter) {
          console.log(`❌ Time não corresponde: "${task.team?.id || 'Sem time'}" !== "${teamFilter}"`);
          return false;
        }
        console.log('✅ Time corresponde');
      }
      
      // Filtro por termo de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          task.title.toLowerCase().includes(searchLower) ||
          (task.description && task.description.toLowerCase().includes(searchLower)) ||
          (task.team && task.team.name.toLowerCase().includes(searchLower)) ||
          (task.assignedTo?.some(user => 
            user?.name?.toLowerCase().includes(searchLower) || 
            user?.email?.toLowerCase().includes(searchLower)
          ))
        );
        
        if (!matchesSearch) {
          console.log('❌ Termo de busca não encontrado');
          return false;
        }
        console.log('✅ Termo de busca encontrado');
      }
      
      console.log('✅ Tarefa incluída nos resultados');
      return true;
    });
    
    console.log('=== FILTRAGEM CONCLUÍDA ===');
    console.log('Tarefas encontradas:', filtered.length);
    return filtered;
  }, [tasks, filter, teamFilter, searchTerm]);

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await deleteTask(taskId);
        toast.success('Tarefa excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        toast.error('Erro ao excluir tarefa');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cabeçalho com fundo azul */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Minhas Tarefas</h1>
              <p className="text-blue-100">Gerencie suas tarefas e atividades</p>
            </div>
            <Link
              to="/tasks/new"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Criar Tarefa
            </Link>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          {/* Filtros e Busca */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filtrar por status
              </label>
              <select
                id="filter"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">Todas</option>
                <option value="PENDING">Pendentes</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="COMPLETED">Concluídas</option>
                <option value="BLOCKED">Bloqueadas</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="teamFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filtrar por time
              </label>
              <select
                id="teamFilter"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="all">Todos os times</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Buscar por título, descrição, time ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Lista de Tarefas */}
          <div className="mt-8">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando tarefas...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhuma tarefa encontrada</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm || filter !== 'all' || teamFilter !== 'all' 
                    ? 'Tente ajustar sua busca ou filtros.' 
                    : 'Crie uma nova tarefa para começar.'}
                </p>
                <div className="mt-6">
                  <Link
                    to="/tasks/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Nova Tarefa
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-50 dark:border-gray-700 h-full flex flex-col">
                    <TaskCard 
                      task={task} 
                      onDelete={handleDeleteTask} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
