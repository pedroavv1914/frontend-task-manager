import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface TeamMember {
  id: number;
  userId: number;
  teamId: number;
  createdAt: string;
  user: User;
}

interface Team {
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
  fetchTeams: (force?: boolean) => Promise<Team[]>;
  getTeam: (id: number) => Promise<Team | null>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTeams = useCallback(async (force = false): Promise<Team[]> => {
    if (loading && !force) {
      console.log('Carregamento de times já em andamento, aguardando...');
      return teams;
    }

    if (teams.length > 0 && !force) {
      console.log('Retornando times em cache');
      return teams;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Usuário não autenticado');

      console.log('Iniciando carregamento de times...');
      const response = await fetch('http://localhost:3000/api/teams', {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao carregar times');
      }

      const data = await response.json();
      const teamsData = data.data?.teams || data || [];
      const normalizedTeams = Array.isArray(teamsData) ? teamsData : [teamsData];

      console.log(`Carregados ${normalizedTeams.length} times da API`);

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
  }, [loading, teams]);

  const updateTeam = useCallback(async (id: number, teamData: { 
    name: string; 
    description: string; 
    memberIds?: number[];
  }): Promise<Team> => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Usuário não autenticado');

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

      await fetchTeams();

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
  }, [fetchTeams]);

  const createTeam = useCallback(async (teamData: { 
    name: string; 
    description: string; 
    memberIds?: number[];
  }): Promise<Team> => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Usuário não autenticado');

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

      await fetchTeams();

      const createdTeam = data.data?.team || data;
      return createdTeam;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar time';
      setError(message);
      console.error('Erro ao criar time:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTeams]);

  const getTeam = useCallback(async (id: number): Promise<Team | null> => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Usuário não autenticado');

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
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTeams = async () => {
      if (!user) return;

      try {
        console.log('Carregando times para o usuário:', user.id);
        await fetchTeams();
      } catch (error) {
        console.error('Erro ao carregar times:', error);
        if (isMounted) {
          setError('Falha ao carregar times. Tente novamente mais tarde.');
        }
      }
    };

    if (isMounted && user) {
      loadTeams();
    }

    return () => {
      isMounted = false;
    };
  }, [user, fetchTeams]);

  const contextValue = useMemo(() => ({
    teams,
    loading,
    error,
    createTeam,
    updateTeam,
    fetchTeams,
    getTeam,
  }), [teams, loading, error, createTeam, updateTeam, fetchTeams, getTeam]);

  return (
    <TeamContext.Provider value={contextValue}>
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
