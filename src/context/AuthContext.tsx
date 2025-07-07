import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { AuthContextType, User, CreateUserData, UpdateUserData } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Função de login real
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer login');
      }
      
      const data = await response.json();
      const token = data.token || data.data?.token;
      
      if (!token) {
        throw new Error('Token não recebido do servidor');
      }
      
      // Salva o token no localStorage
      localStorage.setItem('token', token);
      setToken(token);
      
      // Busca os dados do usuário usando o token
      const userResponse = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!userResponse.ok) {
        throw new Error('Erro ao carregar dados do usuário');
      }
      
      const userData = await userResponse.json();
      const user = userData.user || userData.data?.user;
      
      if (!user) {
        throw new Error('Dados do usuário não encontrados');
      }
      
      setUser(user);
      return true;
    } catch (error) {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      toast.error('Erro ao fazer login');
      return false;
    }
  };


  // Função de registro real
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao registrar');
      // Após registro, realiza login automático
      return await login(email, password);
    } catch (error) {
      toast.error('Erro ao registrar');
      return false;
    }
  };

  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  // Novo estado para loading de autenticação
  const [authLoading, setAuthLoading] = useState(true);


  // Carrega o usuário autenticado do backend usando o token JWT
  useEffect(() => {
    const fetchUser = async () => {
      setAuthLoading(true);
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        setUser(null);
        setAuthLoading(false);
        return;
      }
      
      setToken(storedToken);
      
      try {
        const res = await fetch('http://localhost:3000/api/auth/me', {
          headers: { 
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) {
          throw new Error('Falha ao carregar usuário autenticado');
        }
        
        const data = await res.json();
        const user = data.user || data.data?.user;
        
        if (!user) {
          throw new Error('Dados do usuário não encontrados');
        }
        
        setUser(user);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
      } finally {
        setAuthLoading(false);
      }
    };
    
    fetchUser();
  }, []); // Removido token das dependências para evitar loops

  // Carrega todos os usuários do backend
  const loadUsers = async () => {
    const currentToken = localStorage.getItem('token');
    
    if (!currentToken) {
      console.log('Nenhum token encontrado no localStorage');
      setUsers([]);
      return;
    }
    
    console.log('Token JWT encontrado:', currentToken);
    
    try {
      const res = await fetch('http://localhost:3000/api/users', {
        headers: { 
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao carregar usuários');
      }
      
      const data = await res.json();
      console.log('Users data from API:', data); // Debug log
      
      // Handle different response formats
      let usersList: User[] = [];
      if (Array.isArray(data)) {
        usersList = data as User[];
      } else if (data && Array.isArray(data.data)) {
        usersList = data.data as User[];
      } else if (data && Array.isArray(data.users)) {
        usersList = data.users as User[];
      } else if (data && data.data && Array.isArray(data.data.users)) {
        usersList = data.data.users as User[];
      }
      
      console.log('Processed users list:', usersList); // Debug log
      console.log('Users with ADMIN role:', usersList.filter(u => u.role === 'ADMIN')); // Log de usuários admin
      setUsers(usersList);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
      
      // Se o token for inválido, faz logout
      if (error instanceof Error && error.message.includes('token')) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
      }
    }
  };

  // Carregar usuários do backend ao iniciar ou quando o token mudar
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const logout = async () => {
    setToken(null);
    setUser(null);
    // O redirecionamento será tratado pelo componente que chama o logout
    return Promise.resolve();
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!token || !user) throw new Error('Usuário não autenticado');
    try {
      const res = await fetch('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Erro ao atualizar perfil');
      setUser(result.user);
      toast.success('Perfil atualizado com sucesso!');
      return;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) throw new Error('Usuário não autenticado');
    try {
      const res = await fetch('http://localhost:3000/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Erro ao atualizar senha');
      toast.success('Senha atualizada com sucesso!');
      return;
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      throw error;
    }
  };

  // Função para rebaixar usuário para MEMBER
  const demoteToMember = async (email: string, _adminPassword: string): Promise<boolean> => {
    if (!token) throw new Error('Usuário não autenticado');
    try {
      // Buscar usuário pelo email para obter o id
      const userToDemote = users.find(u => u.email === email);
      if (!userToDemote) throw new Error('Usuário não encontrado');
      if (user && user.id === userToDemote.id) throw new Error('Você não pode rebaixar a si mesmo');
      const res = await fetch(`http://localhost:3000/api/users/${userToDemote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'MEMBER' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao rebaixar usuário');
      toast.success('Usuário rebaixado a membro!');
      await loadUsers();
      return true;
    } catch (error) {
      console.error('Erro ao rebaixar usuário:', error);
      throw error;
    }
  };

  // Nova versão de promoteToAdmin
  const promoteToAdmin = async (email: string, _adminPassword: string): Promise<boolean> => {
    if (!token) throw new Error('Usuário não autenticado');
    try {
      // Buscar usuário pelo email para obter o id
      const userToPromote = users.find(u => u.email === email);
      if (!userToPromote) throw new Error('Usuário não encontrado');
      const res = await fetch(`http://localhost:3000/api/users/${userToPromote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'ADMIN' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao promover usuário');
      toast.success('Usuário promovido a administrador!');
      await loadUsers();
      return true;
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      throw error;
    }
  };


  const createUser = async (userData: CreateUserData): Promise<User> => {
    try {
      // Use the auth/register endpoint for user creation
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao criar usuário');
      }
      
      toast.success('Usuário criado com sucesso!');
      await loadUsers();
      
      // Return the created user data
      return data.user || data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  };

  const updateUser = async (userData: UpdateUserData): Promise<User> => {
    if (!token) throw new Error('Usuário não autenticado');
    try {
      // Extrair apenas os campos necessários para a atualização
      const { id, currentPassword, newPassword, ...restData } = userData;
      
      // Criar um novo objeto com as propriedades corretas
      const updateData: Record<string, any> = { ...restData };
      
      // Se uma nova senha for fornecida, adicionar ao corpo da requisição
      if (newPassword) {
        updateData.password = newPassword;
      }
      
      const res = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        const errorMessage = data.message || data.error || 'Erro ao atualizar usuário';
        throw new Error(errorMessage);
      }
      
      // Atualizar o usuário atual se for o próprio perfil
      if (user && user.id === id) {
        setUser(prev => prev ? { ...prev, ...updateData } : null);
      }
      
      // Recarregar a lista de usuários
      await loadUsers();
      
      // Retornar o usuário atualizado
      return data.user || data;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    if (!token) throw new Error('Usuário não autenticado');
    
    // Verifica se o ID é válido
    if (!userId) {
      throw new Error('ID de usuário inválido');
    }
    
    // Converte o ID para número
    const userIdNumber = parseInt(userId, 10);
    if (isNaN(userIdNumber)) {
      throw new Error('ID de usuário inválido');
    }
    
    // Converte o ID do usuário atual para número para comparação
    const currentUserId = user?.id ? parseInt(user.id, 10) : null;
    
    // Verifica se está tentando excluir a si mesmo
    if (currentUserId === userIdNumber) {
      throw new Error('Você não pode excluir a si mesmo');
    }
    
    try {
      const res = await fetch(`http://localhost:3000/api/users/${userIdNumber}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao excluir usuário');
      }
      
      toast.success('Usuário excluído com sucesso!');
      await loadUsers();
      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir usuário';
      toast.error(errorMessage);
      throw error;
    }
  };

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await fetch('http://localhost:3000/api/auth/me', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || 'Erro ao carregar usuário');
          }
          setUser(data.user);
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
        }
      }
    };
    loadUser();
  }, [token]);

  useEffect(() => {
    const loadUsersList = async () => {
      await loadUsers();

    };
    loadUsersList();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        users,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        promoteToAdmin,
        demoteToMember,
        createUser,
        updateUser,
        deleteUser,
        isAuthenticated: !!user,
        loading: authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext;
