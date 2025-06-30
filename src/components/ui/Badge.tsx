import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variantClasses = {
    default: 'bg-primary/10 text-primary hover:bg-primary/20',
    secondary: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
    destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
    success: 'bg-success/10 text-success hover:bg-success/20',
    warning: 'bg-warning/10 text-warning hover:bg-warning/20',
    info: 'bg-info/10 text-info hover:bg-info/20',
    outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

// Componentes de badges específicos para status
export function StatusBadge({ status, className, ...props }: { status: string } & React.HTMLAttributes<HTMLSpanElement>) {
  const statusMap = {
    PENDING: { 
      text: 'Pendente',
      className: 'bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100'
    },
    IN_PROGRESS: { 
      text: 'Em Andamento',
      className: 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
    },
    COMPLETED: { 
      text: 'Concluída',
      className: 'bg-green-50 text-green-800 border border-green-200 hover:bg-green-100'
    },
    BLOCKED: { 
      text: 'Bloqueada',
      className: 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
    },
  };

  const { text, className: statusClassName } = statusMap[status as keyof typeof statusMap] || { 
    text: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusClassName, className)}
      {...props}
    >
      {text}
    </span>
  );
}

// Componente de badge para prioridade
export function PriorityBadge({ priority, className, ...props }: { priority: string } & React.HTMLAttributes<HTMLSpanElement>) {
  const priorityMap = {
    LOW: { 
      text: 'Baixa',
      className: 'bg-green-50 text-green-800 border border-green-200 hover:bg-green-100'
    },
    MEDIUM: { 
      text: 'Média',
      className: 'bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100'
    },
    HIGH: { 
      text: 'Alta',
      className: 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
    },
  };

  const { text, className: priorityClassName } = priorityMap[priority as keyof typeof priorityMap] || { 
    text: priority,
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', priorityClassName, className)}
      {...props}
    >
      {text}
    </span>
  );
}

export default Badge;
