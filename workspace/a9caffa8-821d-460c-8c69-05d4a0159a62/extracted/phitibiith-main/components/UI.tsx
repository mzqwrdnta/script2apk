import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'teal';
  isLoading?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  icon,
  className = '',
  size = 'md',
  ...props
}) => {
  const baseStyle = "relative flex items-center justify-center gap-2 rounded-full font-black transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-3 border-gray-900";

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3",
    lg: "px-8 py-4 text-lg"
  };

  const variants = {
    primary: "bg-[#FF6B9D] hover:bg-[#ff5a8f] text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5",
    secondary: "bg-white text-gray-900 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)]",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-900 border-transparent shadow-none",
    outline: "bg-white border-gray-300 hover:border-gray-900 text-gray-900 shadow-none hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]",
    teal: "bg-[#4ECDC4] hover:bg-[#45b7aa] text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5"
  };

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      ) : icon}
      {children}
    </button>
  );
};

export const IconButton: React.FC<ButtonProps> = ({ className = '', size = 'md', ...props }) => {
  const sizeMap = {
    sm: '!p-2 !px-2.5',
    md: '!p-2.5 !px-3',
    lg: '!p-3 !px-3.5'
  };

  return (
    <Button
      className={`${sizeMap[size]} aspect-square !rounded-xl ${className}`}
      size={size}
      {...props}
    />
  )
}

// Memphis-style Card component
export const Card: React.FC<{ children: React.ReactNode; className?: string; shadowColor?: string }> = ({
  children,
  className = '',
  shadowColor = '#FF6B9D'
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Shadow */}
      <div
        className="absolute inset-0 rounded-3xl transform translate-x-2 translate-y-2"
        style={{ backgroundColor: shadowColor }}
      />
      {/* Main Card */}
      <div className="relative bg-white rounded-3xl border-4 border-gray-900 p-4">
        {children}
      </div>
    </div>
  );
};

// Memphis-style Badge/Pill
export const Badge: React.FC<{ children: React.ReactNode; color?: string; className?: string }> = ({
  children,
  color = '#4ECDC4',
  className = ''
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-white border-2 border-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${className}`}
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  );
};