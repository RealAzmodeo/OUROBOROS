
import React from 'react';

export const TechFrame: React.FC<{ children: React.ReactNode; className?: string; color?: string }> = ({ children, className = "", color = "border-vintage-plum" }) => (
    <div className={`relative ${className}`}>
        <div className={`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 ${color} z-10`} />
        <div className={`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 ${color} z-10`} />
        <div className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 ${color} z-10`} />
        <div className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 ${color} z-10`} />
        <div className={`absolute top-1/2 -left-1 w-1 h-8 bg-current transform -translate-y-1/2 opacity-50`} />
        <div className={`absolute top-1/2 -right-1 w-1 h-8 bg-current transform -translate-y-1/2 opacity-50`} />
        {children}
    </div>
);
