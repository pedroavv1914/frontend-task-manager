import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { TaskStatus } from '../types';

interface TaskFormProps {
  isEditing?: boolean;
  initialData?: {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate: string;
    assignedTo?: string[];
    teamId?: string;
  };
}

const TaskForm = ({ isEditing = false, initialData }: TaskFormProps) => {
  const navigate = useNavigate();
  const { createTask, updateTask, teams } = useTasks();
  const { users } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PENDING' as TaskStatus,
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: [] as string[],
    teamId: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState(users);
  
  // Filtra usuários com base no time selecionado
  const getUsersForTeam = useCallback((teamId: string) => {
    if (!teamId) return [];
    const team = teams.find(t => t.id === teamId);
    if (!team) return [];
    // Converter para string para garantir a comparação correta
    return users.filter(user => team.members.some(memberId => String(memberId) === String(user.id)));
  }, [teams, users]);
  
  // Atualiza usuários disponíveis quando o time muda
  useEffect(() => {
    if (formData.teamId) {
      const teamUsers = getUsersForTeam(formData.teamId);
      setAvailableUsers(teamUsers);
      // Remove usuários atribuídos que não estão mais no time
      setFormData(prev => ({
        ...prev,
        assignedTo: prev.assignedTo.filter(userId => 
          teamUsers.some(user => user.id === userId)
        ),
      }));
    } else {
      setAvailableUsers(users);
    }
  }, [formData.teamId, getUsersForTeam, users]);
  
  // Atualiza o time padrão quando a lista de times muda
  useEffect(() => {
    if (!isEditing && teams.length > 0 && !formData.teamId) {
      setFormData(prev => ({
        ...prev,
        teamId: teams[0].id,
      }));
    }
  }, [teams, isEditing]);

  // Preenche o formulário com os dados iniciais quando em modo de edição
  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        status: initialData.status,
        priority: initialData.priority,
        dueDate: initialData.dueDate.split('T')[0],
        assignedTo: initialData.assignedTo || [],
        teamId: initialData.teamId || '',
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

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('O título da tarefa é obrigatório');
      return;
    }

    setIsLoading(true);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        priority: formData.priority,
        assignedTo: formData.assignedTo,
        teamId: formData.teamId || undefined,
      };

      if (isEditing && initialData) {
        await updateTask(initialData.id, {
          ...taskData,
          status: formData.status,
        });
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        await createTask(taskData);
        toast.success('Tarefa criada com sucesso!');
      }

      navigate(isEditing ? `/tasks/${initialData?.id}` : '/tasks');
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
                    Time
                  </label>
                  <select
                    id="teamId"
                    name="teamId"
                    value={formData.teamId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Selecione um time</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.teamId && availableUsers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Atribuir a
                  </label>
                  <div className="space-y-2">
                    {availableUsers.map(user => (
                      <div key={user.id} className="flex items-center">
                        <input
                          id={`user-${user.id}`}
                          name="assignedTo"
                          type="checkbox"
                          checked={formData.assignedTo.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`user-${user.id}`} className="ml-2 block text-sm text-gray-900">
                          {user.name}
                        </label>
                      </div>
                    ))}
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
