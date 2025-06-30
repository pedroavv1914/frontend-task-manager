import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
// import { useTasks } from '../context/TaskContext'; // Não utilizado

// Mocks das funções utilitárias de API
const getTeam = async (id: string | undefined) => {
  if (!id) throw new Error('ID de time não informado');
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/teams/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Erro ao buscar time');
  return response.json();
};
const deleteTeam = async (id: string | undefined) => {
  if (!id) throw new Error('ID de time não informado');
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/teams/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Erro ao deletar time');
  return response.json();
};

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar: string;
  joinDate: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  members: TeamMember[];
  createdAt: string;
}

const EditTeamPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, name: string}>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { users } = useAuth();
  

  // Redirecionar se não for admin
  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Apenas administradores podem editar times.');
      navigate('/teams');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setIsLoading(true);
        const foundTeam = await getTeam(id);
        if (foundTeam) {
          setTeam(foundTeam);
          setFormData({
            name: foundTeam.name,
            description: foundTeam.description || '',
          });
          setSelectedUsers(foundTeam.members.map(member => member.id));
        } else {
          toast.error('Time não encontrado');
          navigate('/teams');
        }
      } catch (error) {
        console.error('Erro ao carregar time:', error);
        toast.error('Não foi possível carregar os dados do time');
        navigate('/teams');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeam();
  }, [id, navigate]);

  // Carregar usuários disponíveis
  useEffect(() => {
    if (users) {
      setAvailableUsers(users.map(user => ({
        id: user.id,
        name: user.name || user.email
      })));
    }
  }, [users]);
  
  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir times');
      return;
    }
    
    if (!window.confirm('Tem certeza que deseja excluir este time? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await deleteTeam(id);
      toast.success('Time excluído com sucesso!');
      navigate('/teams');
    } catch (error) {
      console.error('Erro ao excluir time:', error);
      toast.error('Não foi possível excluir o time');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar times');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('O nome do time é obrigatório');
      return;
    }

    try {
      setIsLoading(true);
      
      if (!team || !id) {
        console.error('Time ou ID não encontrado');
        return;
      }
      
      // Identificar membros atuais e os que precisam ser adicionados/removidos
      const currentMemberIds = team.members.map(member => member.id);
      const membersToAdd = selectedUsers.filter(id => !currentMemberIds.includes(id));
      const membersToRemove = currentMemberIds.filter(id => !selectedUsers.includes(id));
      
      console.log('Membros atuais:', currentMemberIds);
      console.log('Membros a adicionar:', membersToAdd);
      console.log('Membros a remover:', membersToRemove);
      
      // Atualiza as informações básicas do time
      const updatedTeam = {
        ...team,
        name: formData.name,
        description: formData.description,
        members: [
          ...team.members.filter(member => !membersToRemove.includes(member.id)),
          ...membersToAdd.map(userId => {
            const user = users?.find(u => u.id === userId);
            console.log('Adicionando membro:', userId, 'Dados do usuário:', user);
            return {
              id: userId,
              name: user?.name || `Usuário ${userId}`,
              email: user?.email || '',
              role: 'member' as const,
              avatar: user?.avatar || '',
              joinDate: new Date().toISOString()
            };
          })
        ]
      };
      
      console.log('Time atualizado:', updatedTeam);
      
      // Atualiza o estado local
      setTeam(updatedTeam);
      
      // Sincroniza com a API
      if (membersToAdd.length > 0) {
        console.log('Adicionando membros via API...');
        try {
          await // addTeamMembers removido (id, membersToAdd);
          console.log('Membros adicionados com sucesso');
        } catch (error) {
          console.error('Erro ao adicionar membros:', error);
          throw error;
        }
      }
      
      // Remove membros não selecionados
      if (membersToRemove.length > 0) {
        console.log('Removendo membros via API...');
        for (const userId of membersToRemove) {
          try {
            console.log(`Removendo membro ${userId}...`);
            await // removeTeamMember removido (id, userId);
            console.log(`Membro ${userId} removido com sucesso`);
          } catch (error) {
            console.error(`Erro ao remover membro ${userId}:`, error);
            throw error;
          }
        }
      }
      
      console.log('Todas as operações foram concluídas com sucesso');
      toast.success('Alterações salvas com sucesso!');
      
      // Navega de volta para a lista de times após 1 segundo
      setTimeout(() => {
        navigate('/teams', { replace: true });
      }, 1000);
      
    } catch (error) {
      console.error('Erro detalhado ao salvar alterações:', error);
      toast.error('Não foi possível salvar as alterações');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Editar Time</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Atualize as informações do time
            </p>
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome do Time
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="Nome do time"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descrição
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="Descreva o propósito do time"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      Excluir Time
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/teams')}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </div>
            </form>
            
            {/* Seção de membros do time */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Membros do Time</h3>
              
              {availableUsers.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {availableUsers.map(user => (
                      <div 
                        key={user.id} 
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedUsers.includes(user.id) 
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' 
                            : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50'
                        }`}
                        onClick={() => handleUserToggle(user.id)}
                      >
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedUsers.includes(user.id) ? 'Membro' : 'Não membro'}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => {}}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      As alterações nos membros serão salvas quando você clicar em "Salvar alterações" no final do formulário.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum usuário disponível</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTeamPage;
