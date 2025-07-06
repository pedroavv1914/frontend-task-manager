import React from 'react';

interface DashboardHeroProps {
  userName: string;
  avatarUrl?: string;
  completed: number;
  total: number;
}

const getMotivation = (percent: number) => {
  if (percent >= 90) return 'Excelente! Você está arrasando! 🚀';
  if (percent >= 60) return 'Ótimo progresso! Continue assim!';
  if (percent >= 30) return 'Bom começo! Não pare agora!';
  return 'Vamos começar? Cada passo conta!';
};

export const DashboardHero: React.FC<DashboardHeroProps> = ({ userName, avatarUrl, completed, total }) => {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const motivation = getMotivation(percent);
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 w-full py-6 px-4 bg-gradient-to-tr from-blue-50 via-sky-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950 rounded-2xl shadow border border-blue-100 dark:border-gray-800">
      <div className="flex flex-col items-center gap-3">
        <img
          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&size=128`}
          alt={userName}
          className="w-24 h-24 rounded-full shadow-lg border-4 border-blue-200 dark:border-blue-700 bg-white"
        />
        <span className="text-lg font-semibold text-gray-800 dark:text-white">{userName}</span>
      </div>
      <div className="flex-1 flex flex-col items-center md:items-start gap-4">
        <div className="flex items-center gap-6">
          <svg width="72" height="72" viewBox="0 0 72 72" className="block">
            <circle cx="36" cy="36" r="32" fill="#e0e7ef" />
            <circle
              cx="36" cy="36" r="32"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="7"
              strokeDasharray={2 * Math.PI * 32}
              strokeDashoffset={2 * Math.PI * 32 * (1 - percent / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)' }}
            />
            <text x="50%" y="54%" textAnchor="middle" fontSize="1.5rem" fontWeight="bold" fill="#2563eb">{percent}%</text>
          </svg>
          <div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{completed} / {total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Tarefas concluídas</div>
          </div>
        </div>
        <div className="text-base md:text-lg font-medium text-gray-600 dark:text-gray-300 mt-2">{motivation}</div>
      </div>
    </div>
  );
};
