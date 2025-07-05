import { TaskWithDetails } from '../types';
import { format } from 'date-fns';
import { StatusBadge } from './ui/Badge';

interface TaskCardProps {
  task: TaskWithDetails;
  onEdit: (task: TaskWithDetails) => void;
  onDelete: (id: string) => void;
}

const getStatusBorderColor = (status: string) => {
  switch(status) {
    case 'PENDING': return 'border-yellow-500';
    case 'IN_PROGRESS': return 'border-blue-500';
    case 'COMPLETED': return 'border-green-500';
    case 'BLOCKED': return 'border-red-500';
    default: return 'border-gray-300';
  }
};

const getPriorityColor = (priority: string) => {
  switch(priority) {
    case 'HIGH': return 'text-red-500';
    case 'MEDIUM': return 'text-yellow-500';
    case 'LOW': return 'text-green-500';
    default: return 'text-blue-500';
  }
};

const TaskCard = ({ task, onEdit, onDelete }: TaskCardProps) => {
  const statusBorderColor = getStatusBorderColor(task.status);
  const priorityColor = getPriorityColor(task.priority);
  
  return (
    <div className={`h-full flex flex-col rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 ${statusBorderColor}`}>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white line-clamp-2 leading-tight">
            {task.title}
          </h3>
          <div className="flex space-x-1.5">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-gray-700"
              aria-label="Editar tarefa"
              title={`Editar tarefa: ${task.title}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-gray-700"
              aria-label="Excluir tarefa"
              title="Excluir tarefa"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3 flex-grow">
          {task.description || 'Nenhuma descrição fornecida'}
        </p>

        {/* Responsável e Time */}
        <div className="mb-3 space-y-1.5">
          {task.assignee && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{task.assignee.name || 'Sem responsável'}</span>
            </div>
          )}
          {/* Informação do time foi removida */}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <StatusBadge status={task.status} className="text-xs px-2 py-1" />
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColor} bg-opacity-10`}>
              {task.priority === 'HIGH' && 'Alta'}
              {task.priority === 'MEDIUM' && 'Média'}
              {task.priority === 'LOW' && 'Baixa'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <svg className="h-3.5 w-3.5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {task.dueDate 
                  ? (() => {
                      try {
                        // Tenta formatar a data com date-fns
                        const formattedDate = format(new Date(task.dueDate), 'dd/MM/yyyy');
                        return formattedDate;
                      } catch (error) {
                        console.error('Erro ao formatar data:', error, task.dueDate);
                        return 'Data inválida';
                      }
                    })() 
                  : 'Sem data'}
              </span>
            </div>
            
            {task.assignee && (
              <div className="flex items-center">
                <svg className="h-3.5 w-3.5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{task.assignee.name?.split(' ')[0] || 'Responsável'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
