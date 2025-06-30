import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { TaskStatus, CreateTaskData, TeamWithMembers } from '../types';
import { User } from '../context/types';

interface TaskFormProps {
  isEditing?: boolean;
  initialData?: Partial<{
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate: string;
    assignedTo: string[];
    teamId: string;
  }>;
}

const TaskForm = ({ isEditing = false, initialData }: TaskFormProps) => {
  const navigate = useNavigate();
  // Removendo taskId não utilizado
  useParams<{ id: string }>();
  
  const { createTask, updateTask, teams, fetchTasks } = useTasks();
  const { users } = useAuth() as { users: User[] };
  
  type FormDataState = {
    title: string;
    description: string;
    status: TaskStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate: string;
    teamId: string;
    assignedUserId: string;
  };

  const [formData, setFormData] = useState<FormDataState>({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: new Date().toISOString().split('T')[0],
    teamId: '',
    assignedUserId: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  // Obtém os usuários disponíveis para o time selecionado
  const availableUsers = useMemo<User[]>(() => {
    if (!formData.teamId) return [];
    
    const team = teams.find(t => t.id === formData.teamId);
    if (!team || !team.members) return [];
    
    // Se não houver membros, retorna array vazio
    if (team.members.length === 0) return [];
    
    // Verifica se o primeiro membro é um objeto (TeamWithMembers) ou string (Team)
    const firstMember = team.members[0];
    const isTeamWithMembers = typeof firstMember === 'object' && firstMember !== null && 'id' in firstMember;
    
    if (isTeamWithMembers) {
      // Se for TeamWithMembers, fazemos um type assertion seguro
      const teamWithMembers = team as unknown as TeamWithMembers;
      return teamWithMembers.members.filter((user): user is User => 
        Boolean(user) && 
        typeof user === 'object' && 
        'id' in user
      );
    } else {
      // Se for Team normal, os membros são strings (IDs)
      const memberIds = (team.members as unknown) as string[];
      return users.filter((user): user is User => {
        if (!user || typeof user !== 'object' || !('id' in user)) return false;
        return memberIds.some(id => String(id) === String(user.id));
      });
    }
  }, [formData.teamId, teams, users]);
  
  const handleTeamChange = (teamId: string) => {
    setFormData(prev => ({
      ...prev,
      teamId,
      assignedUserId: '' // Limpa o usuário selecionado ao mudar de time
    }));
  };

  useEffect(() => {
    if (isEditing && initialData) {
      // Define o assignedUserId com o primeiro usuário atribuído, se existir
      const assignedUserId = initialData.assignedTo?.[0] || '';
      
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        status: initialData.status || 'PENDING',
        priority: initialData.priority || 'MEDIUM',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        teamId: initialData.teamId || '',
        assignedUserId
      });
    }
  }, [isEditing, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUserSelect = (userId: string) => {
    // Atualiza apenas o assignedUserId
    setFormData(prev => ({
      ...prev,
      assignedUserId: userId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('O título da tarefa é obrigatório');
      return;
    }
    
    if (!formData.teamId) {
      toast.error('Selecione um time responsável');
      return;
    }
    
    if (!formData.assignedUserId) {
      toast.error('Selecione um responsável pela tarefa');
      return;
    }
    
    // Prepara os dados da tarefa
    const taskData: CreateTaskData = {
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate,
      priority: formData.priority,
      assignedTo: formData.assignedUserId ? [formData.assignedUserId] : [],
      teamId: formData.teamId
    };
    
    setIsLoading(true);

    try {
      if (isEditing && initialData?.id) {
        await updateTask(initialData.id, {
          ...taskData,
          status: formData.status,
        });
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        await createTask(taskData);
        toast.success('Tarefa criada com sucesso!');
      }
      
      // Atualiza a lista de tarefas e volta para a página anterior
      await fetchTasks();
      navigate(-1);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error('Erro ao salvar a tarefa. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {isEditing ? 'Atualize as informações da tarefa' : 'Preencha os detalhes da nova tarefa'}
            </p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Título <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Título da tarefa"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <div className="mt-1">
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Descreva a tarefa..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="IN_PROGRESS">Em andamento</option>
                    <option value="COMPLETED">Concluída</option>
                    <option value="BLOCKED">Bloqueada</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Prioridade
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  Data de Vencimento
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="dueDate"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {teams.length > 0 && (
                <div>
                  <label htmlFor="teamId" className="block text-sm font-medium text-gray-700">
                    Time Responsável
                  </label>
                  <select
                    id="teamId"
                    name="teamId"
                    value={formData.teamId}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="">Selecione um time</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.members?.length || 0} membros)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.teamId && availableUsers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Responsável
                  </label>
                  <div className="relative">
                    <select
                      id="assignedUserId"
                      name="assignedUserId"
                      value={formData.assignedUserId}
                      onChange={(e) => handleUserSelect(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
                      required
                    >
                      <option value="">Selecione um responsável</option>
                      {availableUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                    {formData.assignedUserId && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                        <p className="text-xs font-medium text-blue-600 mb-1">Responsável:</p>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-bold mr-2">
                            {availableUsers.find(u => u.id === formData.assignedUserId)?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <p className="text-sm font-medium text-blue-900">
                            {availableUsers.find(u => u.id === formData.assignedUserId)?.name || 'Usuário não encontrado'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
