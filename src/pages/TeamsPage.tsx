import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTeams, Team as TeamType } from '../context/TeamContext';

// Usando o tipo TeamWithMembers para tipar os times com membros completos

const TeamsPage = () => {
  // Limpa localStorage de tasks/teams/users ao carregar a página (exceto token)
  useEffect(() => {
    Object.keys(localStorage).forEach(key => {
      if (!['token'].includes(key)) localStorage.removeItem(key);
    });
  }, []);
  const { user } = useAuth();
  const { teams, loading, createTeam, updateTeam, fetchTeams, error } = useTeams();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<{ id: number | null, name: string, description: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
  });

  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string, name: string }>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Inicializa o formulário de edição
  const handleEditTeam = (team: TeamType) => {
    setNewTeam({
      name: team.name,
      description: team.description || ''
    });
    setSelectedUsers(team.members?.map(member => member.userId.toString()) || []);
    setEditingTeam({
      id: team.id,
      name: team.name,
      description: team.description || ''
    });
    setShowCreateModal(true);
  };

  // Fecha o modal e limpa o formulário
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setNewTeam({ name: '', description: '' });
    setSelectedUsers([]);
    setEditingTeam(null);
  };


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
      toast.error('Apenas administradores podem gerenciar times');
      return;
    }

    if (!newTeam.name.trim()) {
      toast.error('O nome do time é obrigatório');
      return;
    }

    setIsSubmitting(true);

    try {
      const memberIds = selectedUsers.map(id => parseInt(id, 10));

      if (editingTeam && editingTeam.id) {
        // Atualiza o time existente
        await updateTeam(editingTeam.id, {
          name: newTeam.name.trim(),
          description: newTeam.description.trim(),
          memberIds,
        });
        toast.success('Time atualizado com sucesso!');
      } else {
        // Cria um novo time
        await createTeam({
          name: newTeam.name.trim(),
          description: newTeam.description.trim(),
          memberIds,
        });
        toast.success('Time criado com sucesso!');
      }

      // Limpa o formulário e fecha o modal
      handleCloseModal();

      // Atualiza a lista de times
      await fetchTeams();
    } catch (error) {
      console.error('Erro ao salvar time:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar time';
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
        const response = await fetch(`http://localhost:3000/api/teams/${teamId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erro ao excluir time');
        }

        toast.success('Time excluído com sucesso!');
        // Recarregar a lista de times após a exclusão
        window.location.reload();
      } catch (error) {
        console.error('Erro ao excluir time:', error);
        const errorMessage = error instanceof Error ? error.message : 'Não foi possível excluir o time';
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-100      dark:from-gray-900 dark:via-gray-950 dark:to-blue-950  sm:px-6 lg:px-8">
      <div className="mx-auto">
        {/* HEADER PROFISSIONAL */}
        <header className="rounded-2xl bg-gradient-to-r from-blue-500/90 via-sky-500/90 to-indigo-600/90 dark:from-blue-900 dark:via-blue-950 dark:to-indigo-950 shadow-xl mb-12 p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-white/20 dark:bg-gray-900/40 shadow-lg">
              <svg className="w-10 h-10 text-white dark:text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow dark:text-blue-100 flex items-center gap-2">
                Times
                <span className="inline-block ml-2 px-2 py-0.5 rounded bg-white/20 text-base font-semibold text-white dark:text-blue-100 tracking-wide">Beta</span>
              </h1>
              <p className="mt-2 text-lg text-blue-100 dark:text-blue-200 font-medium max-w-xl">Gerencie equipes, membros e colaboração de forma profissional.</p>
            </div>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 text-base font-bold text-white bg-gradient-to-r from-indigo-500 via-sky-500 to-blue-500 rounded-xl shadow-lg hover:scale-105 hover:from-blue-600 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900 transition-all duration-200"
            >
              <svg className="w-6 h-6 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Novo Time
            </button>
          )}
        </header>

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
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-blue-400 dark:hover:border-blue-500 transform hover:scale-[1.025]"
                  tabIndex={0}
                  aria-label={`Time ${team.name}`}
                >
                  {/* Gradiente sutil no topo */}
                  <div className="h-2 bg-gradient-to-r from-blue-500/70 via-sky-400/70 to-indigo-500/70"></div>

                  {/* Conteúdo do Card */}
                  <div className="p-6 flex flex-col gap-2 min-h-[210px]">

                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate pr-2">
                            {team.name}
                          </h3>
                          {isAdmin && (
                            <div className="flex items-center space-x-1 bg-white/60 dark:bg-gray-800/70 rounded-lg p-1 shadow-sm">
                              <button
                                onClick={() => handleEditTeam(team)}
                                className="relative group p-2 rounded-full text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-700 transition"
                                aria-label={`Editar time ${team.name}`}
                                tabIndex={0}
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="sr-only">Editar</span>
                                <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 px-2 py-1 rounded bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition z-50 whitespace-nowrap">
                                  Editar
                                </span>
                              </button>
                              <button
                                onClick={() => handleDeleteTeam(team.id)}
                                className="relative group p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-700 transition"
                                aria-label={`Excluir time ${team.name}`}
                                tabIndex={0}
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="sr-only">Excluir</span>
                                <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 px-2 py-1 rounded bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition z-50 whitespace-nowrap">
                                  Excluir
                                </span>
                              </button>
                            </div>
                          )}
                        </div>

                        {team.description && (
                          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                            {team.description}
                          </p>
                        )}

                        {/* Membros do time */}
                        {team.members?.length > 0 ? (
                          <div className="mt-4">
                            <div className="flex items-center -space-x-2">
                              {team.members.slice(0, 5).map((member, idx) => (
                                <div
                                  key={member.user.id}
                                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-800 dark:to-indigo-900 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-white shadow transition-transform duration-200 hover:scale-110 group/avatar"
                                  style={{ zIndex: 5 - idx }}
                                  aria-label={`Membro: ${member.user.name || member.user.email}`}
                                >
                                  <span className="sr-only">{member.user.name || member.user.email}</span>
                                  <span data-tooltip-id={`member-tooltip-${team.id}-${idx}`} className="cursor-pointer">
                                    {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                                  </span>
                                  <span className="absolute z-50 invisible group-hover/avatar:visible bg-gray-900 text-white text-xs rounded px-2 py-1 left-1/2 -translate-x-1/2 mt-10 shadow-lg pointer-events-none whitespace-nowrap">
                                    {member.user.name || member.user.email}
                                  </span>
                                </div>
                              ))}
                              {team.members.length > 5 && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200 shadow">
                                  +{team.members.length - 5}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <span className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-300">Nenhum membro</span>
                          </div>
                        )}

                        {/* Rodapé do card */}
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
                            <svg className="h-4 w-4 mr-1 text-blue-400 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="sr-only">Criado em:</span>
                            {new Date(team.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-sky-400/80 to-indigo-500/80 text-white shadow-sm border border-white dark:border-gray-800">
                            {team._count?.members ?? team.members?.length ?? 0} {team._count?.members === 1 || (team.members?.length === 1 && !team._count) ? 'membro' : 'membros'}
                          </span>
                        </div>
                      </div>
                    </div>
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
                                  className={`flex items-center p-2 rounded-md cursor-pointer ${selectedUsers.includes(user.id)
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
                                      onChange={() => { }}
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
