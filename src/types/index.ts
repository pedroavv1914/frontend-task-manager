import { User } from '../context/types';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo: string[]; // Array de IDs de usuários
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  teamId?: string; // ID do time ao qual a tarefa pertence (opcional)
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: string[]; // Array de IDs de usuários
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamWithMembers extends Omit<Team, 'members'> {
  members: User[]; // Array de objetos de usuários
}

export interface TaskWithDetails extends Omit<Task, 'assignedTo' | 'teamId'> {
  assignedTo: User[]; // Array de usuários atribuídos
  team?: Team; // Time ao qual a tarefa pertence (opcional)
}

export interface CreateTaskData {
  title: string;
  description: string;
  dueDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo: string[];
  teamId?: string;
}

export interface CreateTeamData {
  name: string;
  description: string;
  members: string[];
}

export interface UpdateTaskData extends Partial<Omit<CreateTaskData, 'assignedTo'>> {
  status?: TaskStatus;
  assignedTo?: string[];
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  members?: string[];
}
