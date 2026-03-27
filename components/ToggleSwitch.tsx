import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className = ''
}: ToggleSwitchProps) {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-7'
  };

  const knobSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const translateClasses = {
    sm: 'translate-x-4',
    md: 'translate-x-5',
    lg: 'translate-x-7'
  };

  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`
        relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${checked ? 'bg-indigo-600' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <span
        className={`
          inline-block rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out
          ${knobSizeClasses[size]}
          ${checked ? translateClasses[size] : 'translate-x-0.5'}
        `}
      />
    </button>
  );
}