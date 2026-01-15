import { ThemeMode } from '../../types';

export const useThemeStyles = (mode: ThemeMode) => {
  const isDnd = mode === 'dnd';

  return {
    bg: isDnd ? 'bg-dnd-dark' : 'bg-vintage-cream',
    text: isDnd ? 'text-dnd-gold' : 'text-vintage-plum',
    textSecondary: isDnd ? 'text-dnd-steel' : 'text-vintage-plum/60',
    border: isDnd ? 'border-dnd-gold' : 'border-vintage-plum',
    accent: isDnd ? 'text-dnd-crimson' : 'text-vintage-orange',
    
    // Components
    buttonPrimary: isDnd 
      ? 'bg-dnd-crimson text-dnd-gold border-2 border-dnd-gold shadow-[2px_2px_0px_0px_#C0A080] hover:translate-y-[-1px]' 
      : 'bg-vintage-orange text-white border-2 border-vintage-plum shadow-[2px_2px_0px_0px_#6A1D41] hover:translate-y-[-1px]',
    
    buttonSecondary: isDnd
      ? 'bg-transparent border-2 border-dnd-steel text-dnd-steel hover:border-dnd-gold hover:text-dnd-gold'
      : 'bg-white border-2 border-vintage-plum text-vintage-plum hover:bg-vintage-cream',
      
    card: isDnd
      ? "bg-dnd-dark border-2 border-dnd-gold shadow-[6px_6px_0px_0px_#8A1C1C] p-4"
      : "bg-white border-2 border-vintage-plum shadow-[6px_6px_0px_0px_#6A1D41] p-4",

    input: isDnd 
      ? "w-full bg-dnd-dark border-2 border-dnd-steel p-2 text-dnd-gold font-mono text-sm focus:border-dnd-gold focus:shadow-[2px_2px_0px_0px_#C0A080] outline-none"
      : "w-full bg-white border-2 border-vintage-plum p-2 text-vintage-plum font-mono text-sm focus:border-vintage-orange focus:shadow-[2px_2px_0px_0px_#F9591F] outline-none"
  };
};