import { Download, Music, Plus, Settings } from 'lucide-react';

export interface CardButtonProps {
icon: 'music' | 'settings' | 'plus';
label?: string;
onClick?: () => void;
}

export function CardButton({icon = 'plus', label, onClick}: CardButtonProps) {
  return (
    <div className="bg-action-primary rounded-xl">

    <button className="flex items-center gap-3 py-2 px-4 ">
      <Download className="w-5 h-5 text-white" />
      <span className="text-text-high text-md font-semibold">Download All</span>
    </button>
    </div>

  );
}