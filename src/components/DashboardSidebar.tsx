import React from 'react';

interface DashboardSidebarProps {
  recentTasks: { id: string; title: string; status: string; createdAt: string }[];
  onNewTask?: () => void;
}

const tips = [
  'Dica: Use filtros para encontrar tarefas rapidamente.',
  'Você pode editar uma tarefa clicando no lápis ao lado dela.',
  'Mantenha suas tarefas organizadas por prioridade!',
  'Experimente criar times para colaborar melhor.',
  'Tarefas concluídas = mente tranquila!'
];

function getRandomTip() {
  return tips[Math.floor(Math.random() * tips.length)];
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ recentTasks }) => {
  return (
    <aside className="w-full md:w-80 flex-shrink-0 flex flex-col gap-6 p-4 md:pl-0">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-blue-100 dark:border-gray-800 p-5 flex flex-col gap-2">
        <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-2">Atividades Recentes</h3>
        {recentTasks.length === 0 ? (
          <span className="text-gray-400 text-sm">Nenhuma atividade recente.</span>
        ) : (
          <ul className="space-y-2">
            {recentTasks.slice(0, 3).map(t => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${t.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-400'} inline-block`}></span>
                <span className="truncate max-w-[120px]" title={t.title}>{t.title}</span>
                <span className="ml-auto text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950 rounded-2xl shadow border border-blue-100 dark:border-gray-800 p-5 flex flex-col items-start gap-2">
        <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200">Dica do Dia</h4>
        <span className="text-sm text-blue-800 dark:text-blue-300 italic">{getRandomTip()}</span>
      </div>

    </aside>
  );
}
