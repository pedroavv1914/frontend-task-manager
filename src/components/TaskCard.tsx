import { TaskWithDetails } from '../types';
import { StatusBadge } from './ui/Badge';

interface TaskCardProps {
  task: TaskWithDetails;
  onEdit?: (task: TaskWithDetails) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
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

const TaskCard = ({ task, onEdit, onDelete, onClick }: TaskCardProps) => {
  const statusBorderColor = getStatusBorderColor(task.status);
  const priorityColor = getPriorityColor(task.priority);
  
  return (
    <div
      className={`max-w-lg w-full mx-auto h-full flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl hover:scale-[1.025] transition-all duration-300 border-none group cursor-pointer`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Top bar gradiente por status */}
      <div className={
        `h-2 w-full ${
          task.status === 'COMPLETED' ? 'bg-gradient-to-r from-green-400 to-green-600' :
          task.status === 'IN_PROGRESS' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
          task.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-300 to-yellow-500' :
          task.status === 'BLOCKED' ? 'bg-gradient-to-r from-red-400 to-red-600' :
          'bg-gradient-to-r from-gray-300 to-gray-400'
        }`
      } />
      <div className="w-full min-h-[240px] p-6 flex-1 flex flex-col overflow-hidden">
        {/* Cabeçalho: título e botões */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white line-clamp-2 leading-tight">
              {task.title}
            </h3>
            {task.team?.name && (
              <span className="block text-xs text-gray-500 font-medium mt-1">{task.team.name}</span>
            )}
          </div>
          <div className="flex space-x-2">
            {onEdit && (
              <button
                onClick={e => { e.stopPropagation(); onEdit(task); }}
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-gray-700"
                aria-label="Editar tarefa"
                title={`Editar tarefa: ${task.title}`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(task.id); }}
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-gray-700"
                aria-label="Excluir tarefa"
                title="Excluir tarefa"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Linha de status, prioridade à esquerda e avatar grande à direita */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} className="text-xs px-3 py-1 rounded-full shadow font-semibold" />
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow ${priorityColor} bg-opacity-10 bg-white dark:bg-gray-800`}>
              {task.priority === 'HIGH' && (
                <svg className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
              )}
              {task.priority === 'MEDIUM' && (
                <svg className="h-3.5 w-3.5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" /></svg>
              )}
              {task.priority === 'LOW' && (
                <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
              {task.priority === 'HIGH' && 'Alta'}
              {task.priority === 'MEDIUM' && 'Média'}
              {task.priority === 'LOW' && 'Baixa'}
            </span>
          </div>
          {task.assignee && (
            <span className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg shadow bg-gradient-to-br from-blue-400 to-blue-700 border-2 border-white dark:border-gray-800">
              {task.assignee.name ? task.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U'}
            </span>
          )}
        </div>

        {/* Descrição centralizada */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 text-base text-center line-clamp-3">
            {task.description || 'Nenhuma descrição fornecida'}
          </p>
        </div>

      </div>
    </div>
  );
};

export default TaskCard;
