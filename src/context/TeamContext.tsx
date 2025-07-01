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
  createdById?: number;
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
  updateTeam: (id: number, teamData: { 
    name: string; 
    description: string; 
    memberIds?: number[];
  }) => Promise<Team>;
  fetchTeams: () => Promise<Team[]>;
  getTeam: (id: number) => Promise<Team | null>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTeams = async (): Promise<Team[]> => {
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
      console.log('Dados recebidos da API (fetchTeams):', {
        rawData: data,
        teamsData: data.data?.teams || data || [],
        hasData: !!(data.data?.teams || data)
      });
      
      const teamsData = data.data?.teams || data || [];
      const normalizedTeams = Array.isArray(teamsData) ? teamsData : [teamsData];
      
      console.log('Times normalizados:', normalizedTeams.map(team => ({
        id: team.id,
        name: team.name,
        memberCount: team.members?.length,
        _count: team._count,
        hasMembers: !!team.members?.length
      })));
      
      setTeams(normalizedTeams);
      return normalizedTeams;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar times';
      setError(message);
      console.error('Erro ao carregar times:', err);
      const emptyTeams: Team[] = [];
      setTeams(emptyTeams);
      return emptyTeams;
    } finally {
      setLoading(false);
    }
  };

  const updateTeam = async (id: number, teamData: { 
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
        name: teamData.name.trim(),
        description: teamData.description.trim(),
        memberIds: teamData.memberIds || [],
      };

      const response = await fetch(`http://localhost:3000/api/teams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar time');
      }

      // Atualiza a lista de times após a atualização
      await fetchTeams();
      
      // Retorna o time atualizado
      const updatedTeam = data.data?.team || data;
      return updatedTeam;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar time';
      setError(message);
      console.error('Erro ao atualizar time:', err);
      throw err;
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
      const updatedTeams = await fetchTeams();
      // Retorna o time criado com os dados completos
      const createdTeam = data.data?.team || data;
      // Garante que a lista de times esteja atualizada antes de retornar
      return updatedTeams.find(t => t.id === createdTeam.id) || createdTeam;
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
    <TeamContext.Provider value={{
      teams,
      loading,
      error,
      createTeam,
      updateTeam,
      fetchTeams,
      getTeam,
    }}>
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
