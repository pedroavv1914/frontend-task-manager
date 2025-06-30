export type UserRole = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  teamIds?: string[];
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'email' | 'password'>> {
  id: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  promoteToAdmin: (email: string, password: string) => Promise<boolean>;
  demoteToMember: (email: string, password: string) => Promise<boolean>;
  createUser: (userData: CreateUserData) => Promise<User>;
  updateUser: (userData: UpdateUserData) => Promise<User>;
  deleteUser: (userId: string) => Promise<boolean>;
  isAuthenticated: boolean;
  loading: boolean;
}
