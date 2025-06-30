import { TaskWithDetails } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatusBadge, PriorityBadge } from './ui/Badge';

interface TaskCardProps {
  task: TaskWithDetails;
  onDelete: (id: string) => void;
}

const TaskCard = ({ task, onDelete }: TaskCardProps) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{task.title}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => window.location.href = `/tasks/${task.id}`}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Editar tarefa"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="text-gray-400 hover:text-red-600"
              aria-label="Excluir tarefa"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{task.description || 'Nenhuma descrição fornecida'}</p>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <StatusBadge status={task.status} className="text-xs" />
            <PriorityBadge priority={task.priority} className="text-xs" />
          </div>

          <div className="flex items-center justify-start text-sm text-gray-500">
            <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy", { locale: ptBR }) : 'Sem data'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
