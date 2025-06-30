import { useState, useEffect } from 'react';
import { User } from '../context/types';

interface TeamMembersManagerProps {
  currentMembers: string[];
  onSave: (memberIds: string[]) => void;
  onCancel: () => void;
  allUsers: User[];
}

const TeamMembersManager = ({
  currentMembers,
  onSave,
  onCancel,
  allUsers,
}: TeamMembersManagerProps) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>(currentMembers || []);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSelectedMembers(currentMembers || []);
  }, [currentMembers]);

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSave = () => {
    onSave(selectedMembers);
  };

  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Gerenciar Membros da Equipe
      </h3>
      
      <div className="mb-4">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Buscar usuários
        </label>
        <input
          type="text"
          id="search"
          placeholder="Digite o nome ou e-mail"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 dark:border-gray-700 rounded-md p-2">
        {filteredUsers.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum usuário encontrado</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <li key={user.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                      alt={user.name}
                      className="h-10 w-10 rounded-full mr-3"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user.id)}
                      onChange={() => toggleMemberSelection(user.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default TeamMembersManager;
