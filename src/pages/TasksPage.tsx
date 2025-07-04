import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTasks } from '../context/TaskContext';
import { useTeams } from '../context/TeamContext';
import TaskCard from '../components/TaskCard';

// Tipos auxiliares para o estado do formulário
interface NewTaskState {
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo: string; // Armazena apenas um responsável (ID)
  teamId: string;
}

const TasksPage = () => {
  // Limpa localStorage de tasks/teams/users ao carregar a página (exceto token)
  useEffect(() => {
    Object.keys(localStorage).forEach(key => {
      if (!['token'].includes(key)) localStorage.removeItem(key);
    });
  }, []);
  const { tasks, deleteTask, createTask, fetchTasks } = useTasks();
  const { teams, fetchTeams } = useTeams();
  
  // Carrega as tarefas e times quando o componente é montado
  useEffect(() => {
    fetchTasks();
    fetchTeams();
  }, [fetchTasks, fetchTeams]);

  // Log para depuração dos times
  useEffect(() => {
    console.log('Times disponíveis no componente:', teams);
    if (teams && teams.length > 0) {
      console.log('Detalhes dos times:', teams.map(team => ({
        id: team.id,
        name: team.name,
        memberCount: team.members?.length || 0,
        members: team.members?.map(m => ({
          id: (m as any).id || (m as any).userId,
          name: (m as any).name || 'Nome não disponível'
        }))
      })));
    }
  }, [teams]);
  const [isLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados do modal de criação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTask, setNewTask] = useState<NewTaskState>({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    assignedTo: '',
    teamId: '',
  });

  // Handler para inputs do formulário
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  // Handler de submit do formulário/modal
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('O título da tarefa é obrigatório');
      return;
    }
    if (!newTask.teamId) {
      toast.error('Selecione um time responsável');
      return;
    }
    if (!newTask.assignedTo) {
      toast.error('Selecione um responsável pela tarefa');
      return;
    }
    setIsSubmitting(true);
    try {
      await createTask({
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        assignedTo: [newTask.assignedTo],
        teamId: newTask.teamId,
      });
      toast.success('Tarefa criada com sucesso!');
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        status: 'PENDING',
        priority: 'MEDIUM',
        assignedTo: '',
        teamId: '',
      });
      await fetchTasks();
    } catch (error) {
      toast.error('Erro ao criar tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <button
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
              onClick={() => setShowCreateModal(true)}
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Criar Tarefa
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal de criação de tarefa */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowCreateModal(false)}
              aria-label="Fechar"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Criar Nova Tarefa</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input
                  type="text"
                  name="title"
                  value={newTask.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  name="description"
                  value={newTask.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={newTask.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="PENDING">Pendente</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="COMPLETED">Concluída</option>
                  <option value="BLOCKED">Bloqueada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                <select
                  name="priority"
                  value={newTask.priority}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>
              {/* Campo de seleção de Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Time Responsável</label>
                <select
                  name="teamId"
                  value={newTask.teamId}
                  onChange={e => {
                    handleInputChange(e);
                    setNewTask(prev => ({ ...prev, assignedTo: '' })); // Limpa responsável ao trocar time
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Selecione um time {teams ? `(${teams.length} disponíveis)` : ''}</option>
                  {teams && teams.length > 0 ? teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.members?.length || 0} membros)
                    </option>
                  )) : (
                    <option disabled>Nenhum time disponível</option>
                  )}
                </select>
              </div>
              {/* Campo de seleção de Responsável, filtrado pelo time */}
              {newTask.teamId && (
                <div>
                  {(() => {
                    if (!newTask.teamId) {
                      return null; // Não mostra nada se nenhum time for selecionado
                    }

                    const selectedTeamData = teams.find(team => String(team.id) === newTask.teamId);

                    if (!selectedTeamData) {
                      return null; // Time selecionado não encontrado
                    }

                    const members = selectedTeamData.members || [];

                    if (members.length === 0) {
                      return (
                        <div className="text-red-600 text-sm mt-2">
                          Este time não possui membros. Adicione membros ao time ou selecione outro.
                        </div>
                      );
                    }

                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mt-4">Responsável</label>
                        <select
                          name="assignedTo"
                          value={newTask.assignedTo}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        >
                          <option value="">Selecione um responsável</option>
                          {members.map(member => (
                            <option key={member.id} value={member.userId}>
                              {member.user.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro de status */}
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
            {/* Filtro de time */}
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
            {/* Filtro de busca */}
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
          {/* Renderização condicional da lista ou estado vazio */}
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
            <div>{/* Renderize aqui a lista de tarefas */}</div>
          )}
        </div>
      </div>
    </div>
  );
}
export default TasksPage;
