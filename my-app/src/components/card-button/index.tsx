import { ArrowBigDown, ArrowDown, Download, Music, Plus, Settings } from 'lucide-react';
import { getCardButtonStyles, type CardButtonVariant } from './styles';

export interface CardButtonProps {
  icon: 'download' | 'profile' | 'plus';
  label?: string;
  onClick?: () => void;
  img?: string;
  variant?: CardButtonVariant;
  iconButton?: boolean;
  title?: string;
  subTitle?: string;
}

export function CardButton({subTitle, title, icon = 'plus', label, onClick, img, iconButton = false, variant = 'primary' }: CardButtonProps) {
  return (
    <div className={getCardButtonStyles(variant)}>
      <button className="flex items-center gap-3" onClick={onClick}>
        {img ? (
          <img 
            src={img} 
            alt={label || 'Avatar'} 
            className="w-8 h-8 rounded-xl object-cover"
          />
        ) : (
          <Download className="w-5 h-5 text-white" />
        )}

        <div className="flex items-start flex-col leading-tight">
          
        <span className="text-text-high text-md font-semibold">
          {title || label || subTitle || 'Download All'}
        </span>
        <span className="text-text-high text-md">
          { subTitle }
        </span>
        </div>
        {iconButton && (
          icon === 'download' ?  <Download className="w-5 h-5" /> :
          icon === 'profile' ? <ArrowDown className="w-5 h-5 " /> :
          <ArrowDown className="w-5 h-5 " />       
        )}
      </button>
    </div>
  );
}