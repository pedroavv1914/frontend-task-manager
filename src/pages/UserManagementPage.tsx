import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { UserRole } from '../context/types';
import { UserCircleIcon, UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const UsersPage = () => {
  // Limpa localStorage de tasks/teams/users ao carregar a página (exceto token)
  useEffect(() => {
    Object.keys(localStorage).forEach(key => {
      if (!['token'].includes(key)) localStorage.removeItem(key);
    });
  }, []);

  const { users, user: currentUser, promoteToAdmin, demoteToMember, createUser, updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState<{email: string; action: 'promote' | 'demote'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  // Modal de criação de usuário
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'MEMBER' as UserRole,
    bio: '',
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  // Modal de edição de usuário
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    role: 'MEMBER' as UserRole,
    bio: '',
    password: '',
    confirmPassword: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const openEditModal = (user: any) => {
    setEditForm({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role,
      bio: user.bio || '',
      password: '',
      confirmPassword: '',
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleEditInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    if (!editForm.name.trim()) errors.name = 'Nome obrigatório';
    if (!editForm.email.trim()) errors.email = 'E-mail obrigatório';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(editForm.email)) errors.email = 'E-mail inválido';
    if (editForm.password && editForm.password.length < 6) errors.password = 'Mínimo 6 caracteres';
    if (editForm.password !== editForm.confirmPassword) errors.confirmPassword = 'Senhas não conferem';
    return errors;
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateEditForm();
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setIsEditing(true);
      await updateUser({
        id: editForm.id,
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        bio: editForm.bio,
        ...(editForm.password ? { newPassword: editForm.password } : {}),
      });
      setShowEditModal(false);
      setEditForm({ id: '', name: '', email: '', role: 'MEMBER', bio: '', password: '', confirmPassword: '' });
      setEditErrors({});
    } catch (error) {
      setEditErrors({ submit: error instanceof Error ? error.message : 'Erro ao editar usuário' });
    } finally {
      setIsEditing(false);
    }
  };


  // Validação simples
  const validateCreateForm = () => {
    const errors: Record<string, string> = {};
    if (!createForm.name.trim()) errors.name = 'Nome obrigatório';
    if (!createForm.email.trim()) errors.email = 'E-mail obrigatório';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(createForm.email)) errors.email = 'E-mail inválido';
    if (!createForm.password) errors.password = 'Senha obrigatória';
    else if (createForm.password.length < 6) errors.password = 'Mínimo 6 caracteres';
    if (createForm.password !== createForm.confirmPassword) errors.confirmPassword = 'Senhas não conferem';
    return errors;
  };

  const handleCreateInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateCreateForm();
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setIsCreating(true);
      await createUser({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        bio: createForm.bio,
      });
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', confirmPassword: '', role: 'MEMBER', bio: '' });
      setCreateErrors({});
    } catch (error) {
      setCreateErrors({ submit: error instanceof Error ? error.message : 'Erro ao criar usuário' });
    } finally {
      setIsCreating(false);
    }
  };


  // Estatísticas
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const memberCount = users.length - adminCount;

  // Função de ação de promover/rebaixar
  const handleRoleChange = async (email: string) => {
    if (!selectedUser) return;
    try {
      setIsLoading(true);
      if (selectedUser.action === 'promote') {
        if (!password) {
          toast.error('Por favor, insira a senha de administrador');
          return;
        }
        await promoteToAdmin(email, password);
        toast.success('Usuário promovido a administrador com sucesso!');
      } else {
        await demoteToMember(email, '');
        toast.success('Usuário rebaixado a membro com sucesso!');
      }
      setSelectedUser(null);
      setPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar função do usuário');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra usuários
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    const searchLower = searchTerm.toLowerCase();
    const name = user.name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const matchesSearch = name.includes(searchLower) || email.includes(searchLower);
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });
  // Ordena admins primeiro
  const sortedUsers = [...filteredUsers].sort((a, b) => a.role === 'ADMIN' && b.role !== 'ADMIN' ? -1 : 1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header visual */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-10 pb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-center gap-5">
            <img
              className="h-20 w-20 rounded-full border-4 border-blue-200 dark:border-blue-800 shadow"
              src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=random`}
              alt={currentUser?.name}
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" /> Usuários
              </h1>
              <p className="text-gray-500 dark:text-gray-300 mt-2 text-lg">Gerencie permissões, veja estatísticas e promova membros da equipe.</p>
            </div>
          </div>
          {/* Botão de adicionar usuário */}
          <div className="flex flex-col gap-4 items-end">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow transition-colors"
            >
              + Adicionar Usuário
            </button>
            <div className="flex gap-4">
              <div className="flex flex-col items-center bg-gradient-to-br from-white/80 to-blue-50 dark:from-gray-800 dark:to-blue-950 rounded-xl shadow px-8 py-4 border border-blue-100 dark:border-blue-900">
                <span className="text-xs text-gray-500 dark:text-gray-300">Total</span>
                <span className="text-2xl font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <UserGroupIcon className="h-6 w-6" /> {users.length}
                </span>
              </div>
              <div className="flex flex-col items-center bg-gradient-to-br from-white/80 to-green-50 dark:from-gray-800 dark:to-green-950 rounded-xl shadow px-8 py-4 border border-green-100 dark:border-green-900">
                <span className="text-xs text-gray-500 dark:text-gray-300">Admins</span>
                <span className="text-2xl font-bold text-green-700 dark:text-green-300 flex items-center gap-1">
                  <ShieldCheckIcon className="h-6 w-6" /> {adminCount}
                </span>
              </div>
              <div className="flex flex-col items-center bg-gradient-to-br from-white/80 to-indigo-50 dark:from-gray-800 dark:to-indigo-950 rounded-xl shadow px-8 py-4 border border-indigo-100 dark:border-indigo-900">
                <span className="text-xs text-gray-500 dark:text-gray-300">Membros</span>
                <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  <UserCircleIcon className="h-6 w-6" /> {memberCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Buscar usuários..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <select
              className="block pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as UserRole | 'ALL')}
            >
              <option value="ALL">Todas as funções</option>
              <option value="ADMIN">Administradores</option>
              <option value="MEMBER">Membros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de usuários */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Função</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedUsers.length > 0 ? (
                      sortedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <img
                                className="h-10 w-10 rounded-full border-2 border-blue-200 dark:border-blue-800 shadow"
                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                alt={user.name}
                              />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                  {user.name}
                                  {user.id === currentUser?.id && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">Você</span>
                                  )}
                                </div>
                                {user.bio && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{user.bio}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full gap-1 items-center ${
                              user.role === 'ADMIN'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {user.role === 'ADMIN' ? <ShieldCheckIcon className="h-4 w-4" /> : <UserCircleIcon className="h-4 w-4" />} {user.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {user.id !== currentUser?.id && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(user)}
                                  className="mr-3 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedUser({
                                    email: user.email,
                                    action: user.role === 'ADMIN' ? 'demote' : 'promote'
                                  })}
                                  className={`${user.role === 'ADMIN' 
                                    ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300'
                                    : 'text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300'
                                  }`}
                                >
                                  {user.role === 'ADMIN' ? 'Rebaixar' : 'Tornar Admin'}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center text-lg text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <UserGroupIcon className="h-16 w-16 text-blue-200 dark:text-blue-800" />
                            <span>Nenhum usuário encontrado com os critérios de busca.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {/* Modal de confirmação */}
            {selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {selectedUser.action === 'promote' ? 'Promover a Administrador' : 'Rebaixar a Membro'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {selectedUser.action === 'promote' 
                      ? `Digite a senha de administrador para confirmar a promoção de ${selectedUser.email} a administrador.`
                      : `Tem certeza que deseja rebaixar ${selectedUser.email} a membro? Esta ação removerá os privilégios de administrador.`}
                  </p>
                  {selectedUser.action === 'promote' && (
                    <div className="mb-4">
                      <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Senha de Administrador
                      </label>
                      <input
                        type="password"
                        id="admin-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                        placeholder="Digite sua senha de administrador"
                        autoComplete="current-password"
                      />
                    </div>
                  )}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setPassword('');
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange(selectedUser.email)}
                      disabled={isLoading || (selectedUser.action === 'promote' && !password)}
                      className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                        isLoading || (selectedUser.action === 'promote' && !password)
                          ? 'bg-blue-300 dark:bg-blue-700 cursor-not-allowed'
                          : selectedUser.action === 'promote' 
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-yellow-600 hover:bg-yellow-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        selectedUser.action === 'promote' ? 'focus:ring-blue-500' : 'focus:ring-yellow-500'
                      }`}
                    >
                      {isLoading 
                        ? (selectedUser.action === 'promote' ? 'Promovendo...' : 'Rebaixando...')
                        : (selectedUser.action === 'promote' ? 'Promover' : 'Rebaixar')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal de criação de usuário */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-8 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowCreateModal(false)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Adicionar Usuário</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome</label>
                <input name="name" value={createForm.name} onChange={handleCreateInput} className={`w-full px-3 py-2 rounded border ${createErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
                {createErrors.name && <span className="text-xs text-red-500">{createErrors.name}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">E-mail</label>
                <input name="email" type="email" value={createForm.email} onChange={handleCreateInput} className={`w-full px-3 py-2 rounded border ${createErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
                {createErrors.email && <span className="text-xs text-red-500">{createErrors.email}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Senha</label>
                <input name="password" type="password" value={createForm.password} onChange={handleCreateInput} className={`w-full px-3 py-2 rounded border ${createErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
                {createErrors.password && <span className="text-xs text-red-500">{createErrors.password}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Confirmar Senha</label>
                <input name="confirmPassword" type="password" value={createForm.confirmPassword} onChange={handleCreateInput} className={`w-full px-3 py-2 rounded border ${createErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
                {createErrors.confirmPassword && <span className="text-xs text-red-500">{createErrors.confirmPassword}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Função</label>
                <select name="role" value={createForm.role} onChange={handleCreateInput} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="MEMBER">Membro</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Bio (opcional)</label>
                <textarea name="bio" value={createForm.bio} onChange={handleCreateInput} rows={2} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              {createErrors.submit && <div className="text-red-500 text-sm">{createErrors.submit}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">Cancelar</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {isCreating ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de edição de usuário */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-8 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowEditModal(false)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Editar Usuário</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome</label>
                <input name="name" value={editForm.name} onChange={handleEditInput} className={`w-full px-3 py-2 rounded border ${editErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
                {editErrors.name && <span className="text-xs text-red-500">{editErrors.name}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">E-mail</label>
                <input name="email" type="email" value={editForm.email} onChange={handleEditInput} className={`w-full px-3 py-2 rounded border ${editErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} disabled />
                {editErrors.email && <span className="text-xs text-red-500">{editErrors.email}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Função</label>
                <select name="role" value={editForm.role} onChange={handleEditInput} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" disabled={editForm.id === currentUser?.id}>
                  <option value="MEMBER">Membro</option>
                  <option value="ADMIN">Administrador</option>
                </select>
                {editForm.id === currentUser?.id && (
                  <span className="text-xs text-yellow-600">Você não pode alterar seu próprio papel.</span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Bio (opcional)</label>
                <textarea name="bio" value={editForm.bio} onChange={handleEditInput} rows={2} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nova Senha (opcional)</label>
                <input name="password" type="password" value={editForm.password} onChange={handleEditInput} className={`w-full px-3 py-2 rounded border ${editErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
                {editErrors.password && <span className="text-xs text-red-500">{editErrors.password}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Confirmar Nova Senha</label>
                <input name="confirmPassword" type="password" value={editForm.confirmPassword} onChange={handleEditInput} className={`w-full px-3 py-2 rounded border ${editErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
                {editErrors.confirmPassword && <span className="text-xs text-red-500">{editErrors.confirmPassword}</span>}
              </div>
              {editErrors.submit && <div className="text-red-500 text-sm">{editErrors.submit}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">Cancelar</button>
                <button type="submit" disabled={isEditing} className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {isEditing ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
