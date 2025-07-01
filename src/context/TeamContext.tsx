import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface TeamMember {
  id: number;
  userId: number;
  teamId: number;
  createdAt: string;
  user: User;
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  members: TeamMember[];
  _count?: {
    members: number;
    tasks: number;
  };
}

interface TeamContextType {
  teams: Team[];
  loading: boolean;
  error: string | null;
  createTeam: (teamData: { 
    name: string; 
    description: string; 
    memberIds?: number[];
  }) => Promise<Team>;
  fetchTeams: () => Promise<void>;
  getTeam: (id: number) => Promise<Team | null>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('http://localhost:3000/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao carregar times');
      }

      const data = await response.json();
      console.log('Dados recebidos da API:', data);
      setTeams(data.data?.teams || data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar times';
      setError(message);
      console.error('Erro ao carregar times:', err);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (teamData: { 
    name: string; 
    description: string; 
    memberIds?: number[];
  }): Promise<Team> => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      // Prepara os dados para envio
      const requestData = {
        name: teamData.name,
        description: teamData.description,
        memberIds: teamData.memberIds || [],
      };

      const response = await fetch('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar time');
      }

      // Atualiza a lista de times após a criação
      await fetchTeams();
      return data.data?.team || data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar time';
      setError(message);
      console.error('Erro ao criar time:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTeam = async (id: number): Promise<Team | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`http://localhost:3000/api/teams/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao buscar time');
      }

      const data = await response.json();
      return data.data?.team || data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar time';
      setError(message);
      console.error('Erro ao buscar time:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Carrega os times quando o componente é montado
  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [user]);

  return (
    <TeamContext.Provider value={{ teams, loading, error, createTeam, fetchTeams, getTeam }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeams = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeams deve ser usado dentro de um TeamProvider');
  }
  return context;
};

export default TeamContext;
