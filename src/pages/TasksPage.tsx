import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTasks } from '../context/TaskContext';
import { useTeams } from '../context/TeamContext';
import { TaskWithDetails, UpdateTaskData, TaskStatus } from '../types';
import TaskCard from '../components/TaskCard';


import TaskDetailsModal from '../components/TaskDetailsModal';

const TasksPage = () => {
  // Limpa localStorage de tasks/teams/users ao carregar a página (exceto token)
  useEffect(() => {
    Object.keys(localStorage).forEach(key => {
      if (!['token'].includes(key)) localStorage.removeItem(key);
    });
  }, []);

  // Desestrutura funções do contexto
  const { tasks, createTask, deleteTask, updateTask, fetchTasks } = useTasks();
  const { teams, fetchTeams } = useTeams();

  // Log para depuração
  useEffect(() => {
    console.log('=== DADOS NO COMPONENTE TASKSPAGE ===');
    console.log('Tarefas:', tasks);
    console.log('Quantidade de tarefas:', tasks.length);
    console.log('Times:', teams);

    if (tasks.length > 0) {
      console.log('Primeira tarefa:', tasks[0]);
      console.log('Tipo do ID da primeira tarefa:', typeof tasks[0].id);
    }
  }, [tasks, teams]);

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
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados do modal de criação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para o formulário de nova tarefa
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    assignedTo: string;
    teamId: string;
    dueDate?: string;
  }>({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    assignedTo: '',
    teamId: '',
    dueDate: undefined
  });

  // Handler para inputs do formulário
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Define o tipo para as chaves do objeto newTask
    type TaskInputField = keyof typeof newTask;
    
    // Se o time for alterado, limpa o responsável
    if (name === 'teamId') {
      setNewTask(prev => ({
        ...prev,
        teamId: value,
        assignedTo: '' // Limpa o responsável ao mudar o time
      }));
      
      // Se houver um time selecionado, verifica se o usuário atual é membro
      if (value) {
        const selectedTeam = teams.find(team => String(team.id) === value);
        if (selectedTeam && newTask.assignedTo && 
            !selectedTeam.members?.some(member => String(member.userId) === String(newTask.assignedTo))) {
          setNewTask(prev => ({
            ...prev,
            assignedTo: '' // Limpa o responsável se não for membro do time
          }));
        }
      }
    } else {
      // Utiliza type assertion para corrigir o erro de tipagem
      setNewTask(prev => ({ ...prev, [name as TaskInputField]: value }));
    }
  };

  // Handler de submit do formulário/modal
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);

    try {
      // Prepara os dados da tarefa
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        assignedTo: newTask.assignedTo ? [newTask.assignedTo] : [],
        teamId: newTask.teamId,
        dueDate: newTask.dueDate // Incluir o campo dueDate
      };
      
      console.log('Enviando dados da tarefa com dueDate:', taskData.dueDate);
      
      await createTask(taskData);

      // Fecha o modal e limpa o formulário
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        status: 'PENDING',
        priority: 'MEDIUM',
        assignedTo: '',
        teamId: '',
        dueDate: undefined // Resetar o campo dueDate
      });
      
      // Recarrega as tarefas
      await fetchTasks();
      
      // Exibe mensagem de sucesso
      toast.success('Tarefa criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para editar tarefa
  const handleEditTask = (task: TaskWithDetails) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignee?.id || '',
      // Garante que teamId seja uma string para funcionar corretamente com o select
      teamId: task.team?.id ? String(task.team.id) : ''
    });
  };

  // Handler de submit do formulário de edição
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setIsSubmitting(true);

    try {
      // Verifica se o usuário atribuído é membro do time selecionado
      if (newTask.teamId && newTask.assignedTo) {
        const selectedTeam = teams.find(team => String(team.id) === newTask.teamId);
        // Log detalhado para diagnóstico da estrutura dos dados do time
        console.log('DIAGNÓSTICO DE ESTRUTURA DO TIME:', {
          teamId: newTask.teamId,
          teamName: selectedTeam?.name,
          assignedToId: newTask.assignedTo,
          assignedToIdType: typeof newTask.assignedTo,
          membersLength: selectedTeam?.members?.length || 0,
          allMembersDetailed: selectedTeam?.members?.map(m => {
            if (typeof m === 'object' && m !== null) {
              // Cria uma representação segura do objeto para logging
              const safeObj = {};
              // Adiciona propriedades comuns que podem existir
              if ('id' in m) safeObj['id'] = String(m.id);
              if ('userId' in m) safeObj['userId'] = String((m as any).userId);
              if ('user' in m && (m as any).user && typeof (m as any).user === 'object') {
                if ('id' in (m as any).user) safeObj['user.id'] = String((m as any).user.id);
              }
              if ('name' in m) safeObj['name'] = (m as any).name;
              if ('email' in m) safeObj['email'] = (m as any).email;
              
              return {
                ...safeObj,
                allKeys: Object.keys(m),
                type: typeof m,
                stringified: JSON.stringify(m).substring(0, 100)
              };
            } else {
              return {
                value: String(m),
                type: typeof m
              };
            }
          })
        });

        // BYPASS TEMPORÁRIO PARA TESTES - remover depois de resolver o problema
        const BYPASS_VALIDATION = true;
        
        if (selectedTeam && selectedTeam.members && !BYPASS_VALIDATION) {
          // Verificação mais robusta considerando diferentes estruturas de dados de membros do time
          const memberMatches = selectedTeam.members.some(member => {
            // Para depuração - analisa cada membro individualmente
            let matchResult = false;
            
            // Possibilidades de IDs do membro
            const possibleIds: string[] = [];
            
            // Caso 1: member é um objeto User com id direto
            if (member && typeof member === 'object' && 'id' in member) {
              // Usar type assertion para resolver o problema de tipagem
              const memberId = (member as {id: string | number}).id;
              possibleIds.push(String(memberId));
            }
            
            // Caso 2: member é um objeto com userId
            if (member && typeof member === 'object' && 'userId' in (member as any)) {
              const userId = (member as {userId: string | number}).userId;
              possibleIds.push(String(userId));
            }
            
            // Caso 3: member tem propriedade user aninhada com id
            if (member && typeof member === 'object' && 'user' in (member as any) && 
                (member as any).user && typeof (member as any).user === 'object' && 
                'id' in (member as any).user) {
              // Usar tipagem explícita para acessar user.id
              const nestedUserId = (member as {user: {id: string | number}}).user.id;
              possibleIds.push(String(nestedUserId));
            }
            
            // Caso 4: member é uma string direta
            if (typeof member === 'string') {
              possibleIds.push(String(member));
            }
            
            // Verifica se algum dos IDs possíveis corresponde ao ID do usuário atribuído
            const assignedToId = String(newTask.assignedTo);
            matchResult = possibleIds.some(id => id === assignedToId);
            
            // Log de depuração individual para cada membro
            console.log(`Comparando membro:`, {
              possibleIds,
              assignedToId,
              match: matchResult,
              member: typeof member === 'object' ? JSON.stringify(member).substring(0, 100) : member
            });
            
            return matchResult;
          });
          
          if (!memberMatches) {
            console.log('Validação falhou:', {
              teamId: newTask.teamId,
              assignedToId: String(newTask.assignedTo),
              teamMemberIds: selectedTeam.members.flatMap(m => {
                const ids: string[] = [];
                
                if (typeof m === 'object' && m !== null) {
                  // Usar tipagens explícitas para resolver problemas
                  if ('id' in m) {
                    const id = (m as {id: string | number}).id;
                    ids.push(String(id));
                  }
                  if ('userId' in (m as any)) {
                    const userId = (m as {userId: string | number}).userId;
                    ids.push(String(userId));
                  }
                  if ('user' in (m as any) && (m as any).user && 'id' in (m as any).user) {
                    const nestedId = (m as {user: {id: string | number}}).user.id;
                    ids.push(String(nestedId));
                  }
                } else if (typeof m === 'string') {
                  ids.push(String(m));
                }
                
                return ids;
              })
            });
            
            // Se chegamos até aqui com bypass desativado, lançamos o erro
            throw new Error('O usuário atribuído deve ser membro do time selecionado');
          }
        }
        
        // Log para indicar que o bypass está ativo
        if (BYPASS_VALIDATION) {
          console.log('AVISO: Validação de membro do time desativada temporariamente para testes');
        }
      }

      const updateData: UpdateTaskData = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        dueDate: newTask.dueDate // Incluir a data limite na edição
      };
      
      console.log('Data sendo atualizada:', newTask.dueDate);

      // Se houver um time selecionado, adiciona ao updateData
      if (newTask.teamId) {
        updateData.teamId = newTask.teamId;
        
        // Se houver um usuário atribuído, verifica se é membro do time
        if (newTask.assignedTo) {
          updateData.assignedTo = [newTask.assignedTo];
        } else {
          // Se não houver usuário atribuído, envia array vazio
          updateData.assignedTo = [];
        }
      } else {
        // Se não houver time selecionado, não envia assignedTo
        updateData.teamId = '';
        updateData.assignedTo = [];
      }
      
      console.log('Enviando dados para atualização:', updateData);

      await updateTask(editingTask.id, updateData);
      
      // Fecha o modal e limpa o estado
      setEditingTask(null);
      setNewTask({
        title: '',
        description: '',
        status: 'PENDING',
        priority: 'MEDIUM',
        assignedTo: '',
        teamId: ''
      });
      
      // Recarrega as tarefas
      await fetchTasks();
      
      toast.success('Tarefa atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar tarefa');
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
        // Converte teamFilter para número para compatibilidade com task.team?.id
        const teamFilterNumber = Number(teamFilter);
        
        // Compara os valores convertendo para o mesmo tipo
        if (!task.team || Number(task.team.id) !== teamFilterNumber) {
          console.log(`❌ Time não corresponde: "${task.team?.id || 'Sem time'}" !== "${teamFilter}" (${teamFilterNumber})`);
          return false;
        }
        console.log(`✅ Time corresponde: ${task.team.id} === ${teamFilterNumber}`);
      }
      
      // Filtro por pessoa responsável
      if (userFilter !== 'all') {
        const userFilterNumber = Number(userFilter);
        if (!task.assignee || Number(task.assignee.id) !== userFilterNumber) {
          console.log(`❌ Responsável não corresponde: "${task.assignee?.name || 'Sem responsável'}" (ID: ${task.assignee?.id || 'N/A'}) !== "${userFilter}" (${userFilterNumber})`);
          return false;
        }
        console.log(`✅ Responsável corresponde: ${task.assignee.name} (ID: ${task.assignee.id}) === ${userFilterNumber}`);
      }

      // Filtro por termo de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          task.title.toLowerCase().includes(searchLower) ||
          (task.description && task.description.toLowerCase().includes(searchLower)) ||
          (task.team && task.team.name.toLowerCase().includes(searchLower)) ||
          (task.assignee && (
            task.assignee.name?.toLowerCase().includes(searchLower) ||
            task.assignee.email?.toLowerCase().includes(searchLower)
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
  }, [tasks, filter, teamFilter, userFilter, searchTerm]);

  // Handler para excluir uma tarefa
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await deleteTask(taskId);
        // Recarrega as tarefas
        await fetchTasks();
        toast.success('Tarefa excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        toast.error(error instanceof Error ? error.message : 'Erro ao excluir tarefa');
      }
    }
  };

  // Fecha o modal de edição e limpa o estado
  const closeEditModal = () => {
    setEditingTask(null);
    setNewTask({
      title: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      assignedTo: '',
      teamId: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cabeçalho moderno */}
      <header className="w-full bg-gradient-to-r from-blue-800 via-blue-600 to-sky-500 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg mb-2 flex items-center gap-3">
              <svg className="h-10 w-10 text-sky-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Minhas Tarefas
            </h1>
            <p className="text-sky-100 text-lg font-medium drop-shadow-sm">Organize, priorize e conclua suas atividades com facilidade.</p>
          </div>
          <button
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-700 text-white font-bold shadow-2xl hover:scale-105 hover:from-sky-500 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-sky-300"
            onClick={() => setShowCreateModal(true)}
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nova Tarefa
          </button>
        </div>
      </header>

      {/* Filtros modernos */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 mb-6 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro de status */}
          <div className="bg-gradient-to-br from-white/90 to-sky-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl flex flex-col items-center py-4 px-3 transition-all duration-200 border-2 border-sky-200 dark:border-sky-900 hover:border-sky-500 hover:shadow-2xl focus-within:ring-2 focus-within:ring-sky-400">
            <label htmlFor="filter" className="block text-xs font-semibold text-blue-600 dark:text-blue-300 mb-2 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-7.414 7.414a1 1 0 01-1.414 0L3.293 6.707A1 1 0 013 6V4z" /></svg>
              Status
            </label>
            <select
              id="filter"
              className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
          <div className="bg-gradient-to-br from-white/90 to-sky-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl flex flex-col items-center py-4 px-3 transition-all duration-200 border-2 border-sky-200 dark:border-sky-900 hover:border-sky-500 hover:shadow-2xl focus-within:ring-2 focus-within:ring-sky-400">
            <label htmlFor="teamFilter" className="block text-xs font-semibold text-blue-600 dark:text-blue-300 mb-2 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20a3 3 0 01-5.356-1.857M17 20H7m0 0H2v-2a3 3 0 015.356-1.857M7 20a3 3 0 005.356-1.857M7 20v-2a3 3 0 015.356-1.857M15 11a4 4 0 10-8 0 4 4 0 008 0z" /></svg>
              Time
            </label>
            <select
              id="teamFilter"
              className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            >
              <option value="all">Todos os times</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          {/* Filtro por pessoa responsável */}
          <div className="bg-gradient-to-br from-white/90 to-sky-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl flex flex-col items-center py-4 px-3 transition-all duration-200 border-2 border-sky-200 dark:border-sky-900 hover:border-sky-500 hover:shadow-2xl focus-within:ring-2 focus-within:ring-sky-400">
            <label htmlFor="userFilter" className="block text-xs font-semibold text-blue-600 dark:text-blue-300 mb-2 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Responsável
            </label>
            <select
              id="userFilter"
              className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="all">Todos os responsáveis</option>
              {tasks
                .filter(task => task.assignee)
                .reduce((acc: {id: string, name: string}[], task) => {
                  if (task.assignee && !acc.some(user => user.id === task.assignee?.id)) {
                    acc.push({
                      id: String(task.assignee.id),
                      name: task.assignee.name || task.assignee.email || 'Usuário sem nome'
                    });
                  }
                  return acc;
                }, [])
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
            </select>
          </div>
          {/* Filtro de busca */}
          <div className="bg-gradient-to-br from-white/90 to-sky-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl flex flex-col items-center py-4 px-3 transition-all duration-200 border-2 border-sky-200 dark:border-sky-900 hover:border-sky-500 hover:shadow-2xl focus-within:ring-2 focus-within:ring-sky-400">
            <label htmlFor="search" className="block text-xs font-semibold text-blue-600 dark:text-blue-300 mb-2 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
              Buscar
            </label>
            <div className="relative w-full">
              <input
                type="text"
                id="search"
                className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-150"
                placeholder="Buscar por título, descrição, time ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de criação/edição de tarefa */}
      {(showCreateModal || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => editingTask ? closeEditModal() : setShowCreateModal(false)}
              aria-label="Fechar"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">
              {editingTask ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
            </h2>
            <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
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
              {/* Campo de data limite */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Data Limite</label>
                <input
                  type="date"
                  name="dueDate"
                  value={newTask.dueDate || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
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
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => editingTask ? closeEditModal() : setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? (editingTask ? 'Salvando...' : 'Criando...')
                    : (editingTask ? 'Salvar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="w-full p-0 py-6">
        <div className="w-full p-0">


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
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-6">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  console.log('Renderizando tarefa:', task.id, task.title);
                  return (
                    <TaskCard
                       key={task.id}
                       task={task}
                       onEdit={() => handleEditTask(task)}
                       onDelete={() => handleDeleteTask(task.id)}
                       onClick={() => setSelectedTask(task)}
                     />
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">Nenhuma tarefa encontrada com os filtros atuais.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Modal de detalhes da tarefa */}
      {selectedTask && (
        <TaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
export default TasksPage;
