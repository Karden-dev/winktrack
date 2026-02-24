import React from 'react';

export default function WinkInput({ 
  label, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  icon: Icon 
}) {
  return (
    <div className="flex flex-col gap-2 text-left w-full">
      {label && <label className="text-xs font-bold uppercase tracking-wide text-gray-500 ml-1">{label}</label>}
      
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-wink-green transition-colors">
            <Icon size={20} />
          </div>
        )}
        
        <input 
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-white border-2 border-transparent focus:border-wink-black 
                     rounded-xl py-4 pr-4 text-lg font-semibold shadow-sm outline-none transition-all
                     placeholder:text-gray-300 placeholder:font-normal
                     ${Icon ? 'pl-12' : 'pl-4'}`}
        />
      </div>
    </div>
  );
}