import React from 'react';
import { TaskWithDetails } from '../types';
import { StatusBadge } from './ui/Badge';
import { format } from 'date-fns';

interface TaskDetailsModalProps {
  task: TaskWithDetails | null;
  onClose: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose }) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-xl"
          aria-label="Fechar"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{task.title}</h2>
        {task.team?.name && (
          <div className="mb-2 text-xs text-gray-500 font-medium">{task.team.name}</div>
        )}
        <div className="flex items-center gap-3 mb-4">
          <StatusBadge status={task.status} className="text-xs px-3 py-1 rounded-full shadow font-semibold" />
          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
            Prioridade: {task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
          </span>
        </div>
        <p className="mb-4 text-gray-700 dark:text-gray-300"><b>Descrição:</b> {task.description || 'Nenhuma descrição fornecida.'}</p>
        <div className="mb-2 flex items-center gap-2">
          <span className="font-semibold text-gray-600 dark:text-gray-300">Responsável:</span>
          {task.assignee ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-base shadow bg-gradient-to-br from-blue-400 to-blue-700 border-2 border-white dark:border-gray-800">
                {task.assignee.name ? task.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U'}
              </span>
              <span className="text-sm">{task.assignee.name}</span>
            </span>
          ) : (
            <span className="text-sm text-gray-400">Não atribuído</span>
          )}
        </div>
        {task.team && (
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Time:</span>
            <span className="text-sm">{task.team.name}</span>
          </div>
        )}
        {task.createdAt && (
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Criada em:</span>
            <span className="text-sm">{format(new Date(task.createdAt), 'dd/MM/yyyy')}</span>
          </div>
        )}
        {task.updatedAt && (
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Atualizada em:</span>
            <span className="text-sm">{format(new Date(task.updatedAt), 'dd/MM/yyyy')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailsModal;
