import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { UserRole } from '../context/types';

const UsersPage = () => {
  // Limpa localStorage de tasks/teams/users ao carregar a página (exceto token)
  useEffect(() => {
    Object.keys(localStorage).forEach(key => {
      if (!['token'].includes(key)) localStorage.removeItem(key);
    });
  }, []);
  const { users, user: currentUser, promoteToAdmin, demoteToMember } = useAuth();
  const [password, setPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState<{email: string; action: 'promote' | 'demote'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  
  // Contadores para estatísticas
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const memberCount = users.length - adminCount;

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
        // Para rebaixar, não precisamos da senha, mas podemos adicionar uma verificação adicional se necessário
        await demoteToMember(email, '');
        toast.success('Usuário rebaixado a membro com sucesso!');
      }
      
      // Limpa os estados
      setSelectedUser(null);
      setPassword('');
    } catch (error) {
      console.error(`Erro ao ${selectedUser?.action === 'promote' ? 'promover' : 'rebaixar'} usuário:`, error);
      toast.error(error instanceof Error ? error.message : `Erro ao ${selectedUser?.action === 'promote' ? 'promover' : 'rebaixar'} usuário`);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug log to see the current users list
  useEffect(() => {
    console.log('Current users list in component:', users);
  }, [users]);

  // Filtra usuários com base no termo de busca e filtro de função
  const filteredUsers = users.filter(user => {
    if (!user) return false; // Skip any undefined users
    
    const searchLower = searchTerm.toLowerCase();
    const name = user.name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    
    const matchesSearch = name.includes(searchLower) || email.includes(searchLower);
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Ordena os usuários, mostrando os administradores primeiro
  const sortedUsers = [...filteredUsers].sort((a, b) => 
    a.role === 'ADMIN' && b.role !== 'ADMIN' ? -1 : 1
  );

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="sm:flex sm:items-center justify-between">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Gerenciar Usuários</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Visualize e gerencie os {users.length} usuários do sistema
              {adminCount > 0 && ` (${adminCount} administrador${adminCount !== 1 ? 'es' : ''} e ${memberCount} membro${memberCount !== 1 ? 's' : ''})`}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar usuários..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="block pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
            >
              <option value="ALL">Todas as funções</option>
              <option value="ADMIN">Administradores</option>
              <option value="MEMBER">Membros</option>
            </select>
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Equipes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedUsers.length > 0 ? (
                    sortedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full" 
                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                                alt={user.name}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                                {user.id === currentUser?.id && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                    Você
                                  </span>
                                )}
                              </div>
                              {user.bio && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                  {user.bio}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'ADMIN' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {user.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.teamIds && user.teamIds.length > 0 ? (
                              user.teamIds.map(teamId => (
                                <span key={teamId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100">
                                  {teamId.substring(0, 8)}...
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-xs">Sem equipes</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {user.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => setSelectedUser({
                                email: user.email,
                                action: user.role === 'ADMIN' ? 'demote' : 'promote'
                              })}
                              className={`mr-3 ${user.role === 'ADMIN' 
                                ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300'
                                : 'text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300'
                              }`}
                            >
                              {user.role === 'ADMIN' ? 'Rebaixar' : 'Tornar Admin'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Nenhum usuário encontrado com os critérios de busca.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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
    </div>
  );
};

export default UsersPage;
