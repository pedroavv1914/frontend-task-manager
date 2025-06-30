import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../context/TeamContext';

// Usando o tipo TeamWithMembers para tipar os times com membros completos

const TeamsPage = () => {
  // Limpa localStorage de tasks/teams/users ao carregar a página (exceto token)
  useEffect(() => {
    Object.keys(localStorage).forEach(key => {
      if (!['token'].includes(key)) localStorage.removeItem(key);
    });
  }, []);
  const { user } = useAuth();
  const { teams, loading, createTeam, error } = useTeams();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
  });
  
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, name: string}>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { users } = useAuth();
  
  // Exibir erros do contexto
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

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

  // Redirecionar se não for admin
  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  // Carregar usuários disponíveis
  useEffect(() => {
    if (users) {
      setAvailableUsers(users.map(user => ({
        id: user.id.toString(),
        name: user.name || user.email
      })));
    }
  }, [users]);

  // Atualização dos times ocorre apenas via API/backend
  useEffect(() => {
    if (teams.length > 0) {
      // Removido: times são persistidos apenas no backend
    }
  }, [teams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error('Apenas administradores podem criar times');
      return;
    }

    if (!newTeam.name.trim()) {
      toast.error('O nome do time é obrigatório');
      return;
    }

    setIsSubmitting(true);

    try {
      // Cria o time usando a função createTeam do contexto
      await createTeam({
        name: newTeam.name,
        description: newTeam.description,
      });

      // Limpa o formulário e fecha o modal
      setNewTeam({ name: '', description: '' });
      setSelectedUsers([]);
      setShowCreateModal(false);
      toast.success('Time criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar time:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar time';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleDeleteTeam = async (teamId: number) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir times');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este time? Esta ação não pode ser desfeita.')) {
      try {
        setIsSubmitting(true);
        // TODO: Implementar deleção de time no backend
        // await deleteTeam(teamId);
        console.log('Time a ser excluído:', teamId);
        toast.success('Time excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir time:', error);
        toast.error('Não foi possível excluir o time');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Times</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gerencie seus times e membros
            </p>
          </div>
          {isAdmin && (
            <div className="mt-4 sm:mt-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 01-1 1h-3a1 1 0 110-2h-3V9a1 1 0 011-1h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Criar Time
              </button>
            </div>
          )}
        </div>

        {/* Lista de Times */}
        <div className="mt-8">
          {loading && teams.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 border border-gray-200 dark:border-gray-700">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
                <svg
                  className="h-8 w-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Nenhum time encontrado</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comece criando um novo time para organizar seus projetos.
              </p>
              <div className="mt-6">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H6a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Criar Time
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.isArray(teams) && teams.map((team) => (
                <div
                  key={team.id}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  {/* Cabeçalho do Card */}
                  <div className="px-5 pt-5 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {team.name}
                          </h3>

                          {/* Menu de ações */}
                          {isAdmin && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => navigate(`/teams/${team.id}/edit`)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              >
                                {isSubmitting ? (
                                  <span className="inline-flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Criando...
                                  </span>
                                ) : (
                                  <span>Criar Time</span>
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTeam(team.id);
                                }}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                title="Excluir time"
                              >
                                {isSubmitting ? (
                                  <span className="inline-flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Excluindo...
                                  </span>
                                ) : (
                                  <span>Excluir Time</span>
                                )}
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {team.description || 'Sem descrição'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 mt-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm font-medium">
                          {team._count?.members || 0} {team._count?.members === 1 ? 'membro' : 'membros'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Criado em {formatDate(team.createdAt)}
                      </div>
                    </div>
                    {team.members && team.members.some(member => {
                      // Verifica se o membro é um objeto com a propriedade role
                      const memberRole = typeof member === 'object' && member !== null ? 
                        (member as any).role : undefined;
                      return memberRole === 'admin';
                    }) && (
                      <div className="mt-2 flex justify-end">
                        <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <svg className="h-3.5 w-3.5 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Admin
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação de Time */}
      {showCreateModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Criar Novo Time
                  </h3>
                  <div className="mt-2">
                    <form onSubmit={handleCreateTeam}>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="team-name"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
                          >
                            Nome do Time
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              id="team-name"
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                              placeholder="Ex: Time de Desenvolvimento"
                              value={newTeam.name}
                              onChange={(e) =>
                                setNewTeam({ ...newTeam, name: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="team-description"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
                          >
                            Descrição (Opcional)
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="team-description"
                              rows={3}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                              placeholder="Descreva o propósito deste time..."
                              value={newTeam.description}
                              onChange={(e) =>
                                setNewTeam({ ...newTeam, description: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-2">
                            Membros do Time
                          </label>
                          {availableUsers.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                              {availableUsers.map(user => (
                                <div 
                                  key={user.id} 
                                  className={`flex items-center p-2 rounded-md cursor-pointer ${
                                    selectedUsers.includes(user.id)
                                      ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                                  }`}
                                  onClick={() => handleUserToggle(user.id)}
                                >
                                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {user.name}
                                    </p>
                                  </div>
                                  <div className="ml-auto">
                                    <input
                                      type="checkbox"
                                      checked={selectedUsers.includes(user.id)}
                                      onChange={() => {}}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum usuário disponível</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <div className="sm:col-span-2 text-sm text-gray-500 dark:text-gray-400">
                          {selectedUsers.length} {selectedUsers.length === 1 ? 'membro selecionado' : 'membros selecionados'}
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title={selectedUsers.length === 0 ? 'Selecione pelo menos um membro' : ''}
                        >
                          {isSubmitting ? (
                            <span className="inline-flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Criando...
                            </span>
                          ) : 'Criar Time'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default TeamsPage;
