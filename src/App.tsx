import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { TeamProvider } from './context/TeamContext';
import { AdminRoute } from './components/AdminRoute';
import Layout from './layouts/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import NewTaskPage from './pages/NewTaskPage';
import EditTaskPage from './pages/EditTaskPage';
import TeamsPage from './pages/TeamsPage';
import ProfilePage from './pages/ProfilePage';
import EditTeamPage from './pages/EditTeamPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import UserManagementPage from './pages/UserManagementPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TaskProvider>
          <TeamProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="tasks">
                <Route index element={<TasksPage />} />
                <Route path="new" element={<NewTaskPage />} />
                <Route path=":id" element={<EditTaskPage />} />
              </Route>
              <Route path="teams">
                <Route 
                  index 
                  element={
                    <AdminRoute>
                      <TeamsPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path=":id/edit" 
                  element={
                    <AdminRoute>
                      <EditTeamPage />
                    </AdminRoute>
                  } 
                />
              </Route>
              <Route path="unauthorized" element={<UnauthorizedPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route 
                path="users" 
                element={
                  <AdminRoute>
                    <UserManagementPage />
                  </AdminRoute>
                } 
              />
              <Route path="404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </Router>
          </TeamProvider>
        </TaskProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App
