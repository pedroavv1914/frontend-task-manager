import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interface simplificada de tarefa para a demonstração
interface SimpleTask {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
}

const TaskDemoPage = () => {
  // Estado para armazenar as tarefas criadas
  const [tasks, setTasks] = useState<SimpleTask[]>([
    {
      id: '1',
      title: 'Tarefa exemplo',
      description: 'Esta é uma tarefa pré-existente',
      dueDate: '2025-07-10'
    }
  ]);

  // Estado para o formulário de nova tarefa
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: ''
  });

  // Handler para inputs do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  // Handler para criar tarefa
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    const task: SimpleTask = {
      id: Date.now().toString(), // ID simples baseado no timestamp
      title: newTask.title,
      description: newTask.description,
      dueDate: newTask.dueDate
    };
    
    // Adiciona a nova tarefa à lista
    setTasks(prev => [...prev, task]);
    
    // Limpa o formulário
    setNewTask({
      title: '',
      description: '',
      dueDate: ''
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Demonstração de Data Limite</h1>
      
      {/* Formulário de criação de tarefa */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Nova Tarefa</h2>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              name="title"
              value={newTask.title}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              name="description"
              value={newTask.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Limite</label>
            <input
              type="date"
              name="dueDate"
              value={newTask.dueDate}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Criar Tarefa
          </button>
        </form>
      </div>
      
      {/* Lista de tarefas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <div key={task.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg">{task.title}</h3>
            <p className="text-gray-600 my-2">{task.description}</p>
            <div className="flex items-center text-sm text-gray-500 mt-4">
              <svg className="h-3.5 w-3.5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {task.dueDate 
                  ? format(new Date(task.dueDate), "dd/MM/yyyy", { locale: ptBR }) 
                  : 'Sem data'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskDemoPage;
