import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import TaskForm from '../components/TaskForm';

// Mock da função utilitária de API para buscar tarefa
const fetchTask = async (id: string | undefined) => {
  if (!id) throw new Error('ID da tarefa não informado');
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/tasks/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Erro ao buscar tarefa');
  return response.json();
};

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

const EditTaskPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTask = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTask(id);
        if (data) {
          setTask(data);
        } else {
          toast.error('Tarefa não encontrada');
          navigate('/tasks');
        }
      } catch (error) {
        console.error('Erro ao carregar tarefa:', error);
        toast.error('Não foi possível carregar os dados da tarefa');
        navigate('/tasks');
      } finally {
        setIsLoading(false);
      }
    };
    loadTask();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }


  if (!task) return null;
  
  // Garantir que os dados da tarefa estejam no formato correto
  const formattedTask = {
    ...task,
    // Garantir que o status esteja em maiúsculas
    status: task.status ? task.status.toUpperCase() as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' : 'PENDING',
    // Garantir que a prioridade esteja em maiúsculas
    priority: task.priority ? task.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' : 'MEDIUM',
    // Se for uma tarefa com detalhes (TaskWithDetails), extrair os IDs dos usuários
    assignedTo: (task as any).assignedTo?.map((user: any) => typeof user === 'string' ? user : user.id) || [],
  };
  
  console.log('Dados da tarefa formatados:', formattedTask);
  
  return <TaskForm isEditing={true} initialData={formattedTask} />;
};

export default EditTaskPage;
