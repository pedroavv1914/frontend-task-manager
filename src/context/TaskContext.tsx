import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { CreateTaskData } from '../types';
import { Task, Team, CreateTeamData, UpdateTaskData, UpdateTeamData, TaskWithDetails, TeamWithMembers, TaskStatus } from '../types';
import { api } from '../config/api';

// Interface para o retorno da API de remoção de membro
interface RemoveMemberResponse {
  success: boolean;
  team: TeamWithMembers;
}

interface TaskContextType {
  tasks: TaskWithDetails[];
  teams: TeamWithMembers[];
  loading: boolean;
  error: string | null;
  createTask: (taskData: CreateTaskData) => Promise<Task>;
  updateTask: (taskId: string, taskData: UpdateTaskData) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  assignTask: (taskId: string, userIds: string[]) => Promise<void>;
  createTeam: (teamData: CreateTeamData) => Promise<Team>;
  updateTeam: (teamId: string, teamData: UpdateTeamData) => Promise<Team>;
  deleteTeam: (teamId: string) => Promise<void>;
  addTeamMembers: (teamId: string, userIds: string[]) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  getTeamTasks: (teamId: string) => TaskWithDetails[];
  getUserTasks: (userId: string) => TaskWithDetails[];
  fetchTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      console.log('Iniciando carregamento de tarefas...');
      setLoading(true);
      setError(null);
      
      // Busca tarefas da API
      console.log('Fazendo requisição para /tasks...');
      const response = await api.get<any>('/tasks');
      
      // Log detalhado da resposta para depuração
      console.group('=== DETALHES DA RESPOSTA DA API ===');
      console.log('Resposta completa:', response);
      console.log('Dados da resposta:', response?.data);
      
      // Verifica se a resposta tem a estrutura esperada
      let tasksData: TaskWithDetails[] = [];
      const responseData = response?.data || {};
      
      // Verifica diferentes formatos de resposta
      if (responseData && responseData.data && responseData.data.tasks) {
        // Formato 1: { data: { tasks: [...] } }
        console.log('Formato 1: Estrutura data.tasks');
        tasksData = responseData.data.tasks;
      } else if (responseData && responseData.tasks) {
        // Formato 2: { tasks: [...] }
        console.log('Formato 2: Propriedade tasks direta');
        tasksData = responseData.tasks;
      } else if (Array.isArray(responseData)) {
        // Formato 3: [...] (array direto)
        console.log('Formato 3: Array direto');
        tasksData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        // Formato 4: { data: [...] }
        console.log('Formato 4: Propriedade data contendo array');
        tasksData = responseData.data;
      }
      
      console.log('Tarefas extraídas:', tasksData);
      console.groupEnd();
      
      if (tasksData.length > 0) {
        console.log('Tarefas carregadas com sucesso:', tasksData);
        
        // Processa as tarefas da API, mantendo o dueDate original se existir
        const processedTasks = tasksData.map(task => {
          // Se o campo deadline existe na resposta da API, mapeie para dueDate
          if ('deadline' in task) {
            const enhancedTask = {
              ...task,
              dueDate: task.deadline as string, // Mapeia deadline para dueDate com type assertion
              deadline: undefined // Remove o campo deadline para evitar duplicidade
            } as TaskWithDetails; // Garante que o tipo corresponda à TaskWithDetails
            console.log('Tarefa com dueDate mapeado de deadline:', enhancedTask);
            return enhancedTask;
          }
          return task;
        });
        
        setTasks(processedTasks);
        console.log('Estado de tasks atualizado com processedTasks:', processedTasks);
      } else {
        console.log('Nenhuma tarefa encontrada.');
        setTasks([]);
      }
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar tarefas e times da API quando o componente for montado
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Função para atualizar uma tarefa
  const updateTask = useCallback(async (taskId: string | number, taskData: UpdateTaskData): Promise<Task> => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para a API
      const apiData: any = {
        title: taskData.title,
        description: taskData.description,
        // Converte status BLOCKED para PENDING porque o backend não aceita BLOCKED
        status: taskData.status === 'BLOCKED' ? 'PENDING' : taskData.status,
        priority: taskData.priority,
      };
      
      // Guarda o status original para uso local no frontend
      // Garantindo que seja um valor válido de TaskStatus
      const originalStatus: TaskStatus = taskData.status || 'PENDING';

      // Armazena o dueDate para uso posterior na atualização local
      const dueDateToPreserve = taskData.dueDate;
      console.log('dueDate sendo preservado para atualização local:', dueDateToPreserve);
      
      // NÃO enviamos o campo dueDate/deadline para o backend
      // porque o backend ainda não tem suporte completo para esse campo
      if ('dueDate' in taskData && taskData.dueDate) {
        console.log('Data presente, mas não será enviada ao backend:', taskData.dueDate);
        // NÃO adicionamos o campo deadline ao apiData
      }
      
      // Se teamId estiver presente, converte para número (ou null se for string vazia)
      if ('teamId' in taskData) {
        apiData.teamId = taskData.teamId ? Number(taskData.teamId) : null;
        
        // Se houver um time, verifica assignedTo
        if ('assignedTo' in taskData) {
          // Se assignedTo for um array não vazio, pega o primeiro elemento
          if (Array.isArray(taskData.assignedTo) && taskData.assignedTo.length > 0) {
            // Verifica se o usuário é membro do time (se houver time selecionado)
            if (apiData.teamId) {
              // A verificação de membro do time já foi feita no componente
              apiData.assignedTo = Number(taskData.assignedTo[0]);
            } else {
              // Se não houver time, não deve haver assignedTo
              apiData.assignedTo = null;
            }
          } else {
            // Se assignedTo for vazio, envia null
            apiData.assignedTo = null;
          }
        } else {
          // Se assignedTo não estiver definido, mantém como está
          apiData.assignedTo = null;
        }
      } else {
        // Se não houver teamId, não deve haver assignedTo
        apiData.teamId = null;
        apiData.assignedTo = null;
      }
      
      console.log('Enviando para a API:', apiData);
      
      // Chama a API para atualizar a tarefa
      console.log(`Fazendo requisição PUT para /tasks/${taskId} com dados:`, apiData);
      const response = await api.put<any>(`/tasks/${taskId}`, apiData);
      console.log('Resposta da API:', response);
      
      // Extrai a tarefa da resposta - a estrutura é response.data.data.task
      const updatedTaskFromApi = response.data.data ? response.data.data.task : response.data;
      console.log('Tarefa recebida do backend:', updatedTaskFromApi);
      
      // Cria uma versão da tarefa com o status original e a data preservada
      const taskWithPreservedFields: TaskWithDetails = {
        ...updatedTaskFromApi,
        status: originalStatus, // Preserva o status original (especialmente para BLOCKED)
        dueDate: dueDateToPreserve // Mantém a data do formulário
      };
      
      console.log('Tarefa com campos preservados após atualização:', taskWithPreservedFields);
      
      // Atualiza o estado local com a tarefa atualizada e os campos preservados
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? taskWithPreservedFields : task
        )
      );
      
      // Converte para o tipo Task para retornar
      const taskToReturn: Task = {
        id: updatedTaskFromApi.id,
        title: updatedTaskFromApi.title,
        description: updatedTaskFromApi.description,
        status: originalStatus, // Usa o status original preservado
        priority: updatedTaskFromApi.priority,
        createdBy: updatedTaskFromApi.createdBy,
        createdAt: updatedTaskFromApi.createdAt,
        updatedAt: updatedTaskFromApi.updatedAt,
        assignedTo: updatedTaskFromApi.assignee ? [updatedTaskFromApi.assignee.id] : [],
        teamId: updatedTaskFromApi.team?.id,
        dueDate: dueDateToPreserve
      };
      
      setLoading(false);
      
      return taskToReturn;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      console.error('Erro ao atualizar tarefa:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para criar uma nova tarefa
  const createTask = useCallback(async (taskData: CreateTaskData): Promise<Task> => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) throw new Error('Usuário não autenticado');
      
      // Simplificamos ao máximo o objeto que enviamos para o backend
      // para evitar erros 500
      const taskToCreate: any = {
        title: taskData.title || 'Nova tarefa',
        description: taskData.description || '',
        status: 'PENDING', // Sempre começa como pendente
        priority: taskData.priority || 'MEDIUM',
      };
      
      console.log('Criando tarefa com dados simplificados:', taskToCreate);
      
      // Guardamos a data apenas no frontend
      let dueDateToPreserve: string | undefined = undefined;
      if (taskData.dueDate) {
        dueDateToPreserve = taskData.dueDate;
        // Não enviar deadline para o backend
        console.log('Data presente, mas não será enviada ao backend:', dueDateToPreserve);
      }
      
      // Adicionamos TeamId apenas se for necessário e certeza que não causaria erro
      if (taskData.teamId && !isNaN(Number(taskData.teamId))) {
        taskToCreate.teamId = Number(taskData.teamId);
      }
      
      // Simplificamos o envio dos responsáveis
      if (taskData.assignedTo && Array.isArray(taskData.assignedTo) && taskData.assignedTo.length > 0) {
        // Enviamos apenas o primeiro ID e garantimos que é um número válido
        const assigneeId = Number(taskData.assignedTo[0]);
        if (!isNaN(assigneeId)) {
          taskToCreate.assignedTo = assigneeId;
        }
      }
      
      // Chama a API para criar a tarefa
      const createdTask = await api.post<TaskWithDetails>('/tasks', taskToCreate);
      
      console.log('Tarefa criada com sucesso no backend:', createdTask);
      
      // Para corrigir erros de tipagem, vamos criar um objeto que é compatível com o estado
      const taskForState = {
        ...createdTask,
        dueDate: dueDateToPreserve // Preserva o dueDate selecionado no formulário
      };
      
      console.log('Tarefa com dueDate preservado para o frontend:', taskForState);
      
      // Adiciona a tarefa ao estado com o dueDate preservado
      setTasks(prevTasks => [taskForState, ...prevTasks]);
      
      // Convertemos para o tipo Task para retornar para a interface do componente
      const taskToReturn: Task = {
        id: createdTask.id,
        title: createdTask.title,
        description: createdTask.description,
        status: createdTask.status,
        priority: createdTask.priority,
        createdBy: createdTask.createdBy,
        createdAt: createdTask.createdAt,
        updatedAt: createdTask.updatedAt,
        assignedTo: createdTask.assignee ? [createdTask.assignee.id] : [],
        teamId: createdTask.team?.id,
        dueDate: dueDateToPreserve
      };
      
      return taskToReturn;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      console.error('Erro ao criar tarefa:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Função para excluir uma tarefa
  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Chama a API para excluir a tarefa
      await api.delete(`/tasks/${taskId}`);
      
      // Atualiza o estado local removendo a tarefa
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir tarefa';
      console.error('Erro ao excluir tarefa:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para atribuir uma tarefa a um ou mais usuários
  const assignTask = useCallback(async (taskId: string, userIds: string[]): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Validações iniciais
      if (!taskId) {
        throw new Error('ID da tarefa é obrigatório');
      }
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('É necessário informar pelo menos um usuário para atribuir a tarefa');
      }
      
      // Verifica se a tarefa existe localmente
      const taskExists = tasks.some(task => task.id === taskId);
      if (!taskExists) {
        throw new Error('Tarefa não encontrada');
      }
      
      // Chama a API para atribuir os usuários à tarefa
      const updatedTask = await api.put<TaskWithDetails>(`/tasks/${taskId}/assign`, { userIds });
      
      // Atualiza a lista de tarefas com a tarefa atualizada
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === taskId ? updatedTask : task)
      );
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atribuir tarefa';
      console.error('Erro ao atribuir tarefa:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tasks]);

  // Função para criar um novo time
  const createTeam = useCallback(async (teamData: CreateTeamData): Promise<Team> => {
    try {
      setLoading(true);
      setError(null);
      
      // Validações iniciais
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      if (!teamData.name || teamData.name.trim() === '') {
        throw new Error('O nome do time é obrigatório');
      }
      
      // Verifica se já existe um time com o mesmo nome
      const teamExists = teams.some(team => 
        team.name.toLowerCase() === teamData.name.toLowerCase().trim()
      );
      
      if (teamExists) {
        throw new Error('Já existe um time com este nome');
      }
      
      // Prepara os dados do time
      const teamToCreate = {
        ...teamData,
        name: teamData.name.trim(),
        description: teamData.description?.trim() || '',
        createdBy: user.id,
        members: teamData.members || []
      };
      
      // Chama a API para criar o time
      const newTeam = await api.post<TeamWithMembers>('/teams', teamToCreate);
      
      // Atualiza o estado com o novo time
      setTeams(prevTeams => [...prevTeams, newTeam]);
      
      // Retorna o time criado (com membros como strings)
      const team: Team = {
        ...newTeam,
        members: newTeam.members.map(member => 
          typeof member === 'string' ? member : member.id
        )
      };
      
      return team;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar time';
      console.error('Erro ao criar time:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, teams]);

  // Função para atualizar um time
  const updateTeam = useCallback(async (teamId: string, teamData: UpdateTeamData): Promise<Team> => {
    try {
      setLoading(true);
      setError(null);
      
      // Validações iniciais
      if (!teamId) {
        throw new Error('ID do time é obrigatório');
      }
      
      if (teamData.name && teamData.name.trim() === '') {
        throw new Error('O nome do time não pode estar vazio');
      }
      
      // Verifica se o time existe
      const teamExists = teams.some(team => team.id === teamId);
      if (!teamExists) {
        throw new Error('Time não encontrado');
      }
      
      // Verifica se já existe outro time com o mesmo nome (caso o nome tenha sido alterado)
      if (teamData.name) {
        const nameAlreadyExists = teams.some(
          team => team.id !== teamId && 
                 team.name.toLowerCase() === teamData.name?.toLowerCase().trim()
        );
        
        if (nameAlreadyExists) {
          throw new Error('Já existe um time com este nome');
        }
      }
      
      // Prepara os dados para atualização
      const teamToUpdate = {
        ...teamData,
        ...(teamData.name && { name: teamData.name.trim() }),
        ...(teamData.description !== undefined && { 
          description: teamData.description?.trim() || null 
        })
      };
      
      // Chama a API para atualizar o time
      const updatedTeam = await api.put<TeamWithMembers>(`/teams/${teamId}`, teamToUpdate);
      
      // Atualiza o estado com o time atualizado
      setTeams(prevTeams => 
        prevTeams.map(team => team.id === teamId ? updatedTeam : team)
      );
      
      // Converte para o tipo Team (com membros como strings)
      const team: Team = {
        ...updatedTeam,
        members: updatedTeam.members.map(member => 
          typeof member === 'string' ? member : member.id
        )
      };
      
      return team;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar time';
      console.error('Erro ao atualizar time:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teams]);

  // Função para excluir um time
  const deleteTeam = useCallback(async (teamId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Validações iniciais
      if (!teamId) {
        throw new Error('ID do time é obrigatório');
      }
      
      // Verifica se o time existe
      const teamToDelete = teams.find(team => team.id === teamId);
      if (!teamToDelete) {
        throw new Error('Time não encontrado');
      }
      
      // Verifica se o time possui tarefas associadas
      const hasTasks = tasks.some(task => task.team?.id === teamId);
      
      // Se o time tiver tarefas, podemos optar por não permitir a exclusão
      // ou apenas remover as associações (implementação atual)
      if (hasTasks) {
        console.warn('O time possui tarefas associadas. As associações serão removidas.');
      }
      
      // Chama a API do backend para excluir o time
      await api.delete(`/teams/${teamId}`);
      
      // Atualiza o estado local removendo o time
      setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
      
      // Remove referências do time nas tarefas
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.team?.id === teamId 
            ? { 
                ...task, 
                team: undefined,
                // Remove o teamId se existir na tarefa
                ...('teamId' in task ? { teamId: undefined } : {}) 
              } 
            : task
        )
      );
      
      // Retorna sucesso (void)
      return;
    } catch (err) {
      console.error('Erro ao excluir time:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir time');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para adicionar membros a um time

  // Função para adicionar membros a um time
  const addTeamMembers = useCallback(async (teamId: string, userIds: string[]): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Validações iniciais
      if (!teamId) {
        throw new Error('ID do time é obrigatório');
      }
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('É necessário informar pelo menos um usuário para adicionar ao time');
      }
      
      // Verifica se o time existe
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        throw new Error('Time não encontrado');
      }
      
      // Verifica se algum dos usuários já é membro do time
      const existingMembers = team.members.map(member => 
        typeof member === 'string' ? member : member.id
      );
      
      const newMembers = userIds.filter(userId => !existingMembers.includes(userId));
      
      if (newMembers.length === 0) {
        console.warn('Todos os usuários já são membros deste time');
        return;
      }
      
      // Chama a API do backend para adicionar os membros
      const updatedTeam = await api.post<TeamWithMembers>(
        `/teams/${teamId}/members`, 
        { userIds: newMembers }
      );

      // Atualiza o estado local com o time atualizado
      setTeams(prevTeams => 
        prevTeams.map(team => team.id === teamId ? updatedTeam : team)
      );
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar membros ao time';
      console.error('Erro ao adicionar membros ao time:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para remover um membro de um time
  const removeTeamMember = useCallback(async (teamId: string, userId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Validações iniciais
      if (!teamId || !userId) {
        throw new Error('ID do time e do usuário são obrigatórios');
      }
      
      // Verifica se o time existe
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        throw new Error('Time não encontrado');
      }
      
      // Verifica se o usuário é membro do time
      const isMember = team.members.some(member => 
        (typeof member === 'string' ? member : member.id) === userId
      );
      
      if (!isMember) {
        console.warn('O usuário não é membro deste time');
        return;
      }
      
      // Chama a API do backend para remover o membro
      const response = await api.delete<RemoveMemberResponse>(`/teams/${teamId}/members/${userId}`);

      // Atualiza o estado local com o time atualizado
      setTeams(prevTeams => 
        prevTeams.map(team => team.id === teamId ? response.team : team)
      );
    } catch (err) {
      console.error('Erro ao remover membro do time:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover membro do time');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para obter as tarefas de um time específico
  const getTeamTasks = useCallback((teamId: string): TaskWithDetails[] => {
    try {
      return tasks.filter(task => {
        if (!task.team) return false;
        return typeof task.team === 'string' 
          ? task.team === teamId 
          : task.team.id === teamId;
      });
    } catch (err) {
      console.error('Erro ao buscar tarefas do time:', err);
      return [];
    }
  }, [tasks]);

  // Função para obter as tarefas de um usuário específico
  const getUserTasks = useCallback((userId: string): TaskWithDetails[] => {
    try {
      return tasks.filter(task => {
        if (!task.assignee) return false;
        return typeof task.assignee === 'string' 
          ? task.assignee === userId 
          : task.assignee.id === userId;
      });
    } catch (err) {
      console.error('Erro ao buscar tarefas do usuário:', err);
      return [];
    }
  }, [tasks]);

  // Retorna o contexto com os dados e funções
  const contextValue: TaskContextType = {
    tasks,
    teams,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMembers,
    removeTeamMember,
    getTeamTasks,
    getUserTasks,
    fetchTasks,
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
