import React from 'react';
import { Loader2 } from 'lucide-react'; // Icône de chargement

export default function WinkButton({ 
  children, 
  onClick, 
  variant = 'primary', // 'primary' (Noir) ou 'action' (Jaune)
  isLoading = false, 
  disabled = false,
  className = ''
}) {
  const baseStyle = variant === 'action' ? 'btn-action' : 'btn-primary';
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyle} w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" size={20} />
          <span>Chargement...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}