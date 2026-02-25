import { ArrowDown, Download } from 'lucide-react';
import { getCardStyles, type CardVariant, type CardSize } from '../card/styles';

export interface CardButtonProps {
  icon?: 'download' | 'profile' | 'plus' | null;
  label?: string;
  onClick?: () => void;
  img?: string;
  variant?: CardVariant;
  iconButton?: boolean;
  title?: string;
  subTitle?: string;
  size?: CardSize;
}

export function CardButton({
  subTitle, 
  title, 
  icon, 
  label, 
  onClick, 
  img, 
  iconButton = false, 
  variant = 'primary',
  size = 'md'
}: CardButtonProps) {
  const styles = getCardStyles(variant, size);
  
  const renderIcon = () => {
    if (!icon) return null;
    
    const iconClass = `${styles.icon} ${variant === 'primary' ? 'text-white' : 'text-text-medium'}`;
    
    switch (icon) {
      case 'download':
        return <Download className={iconClass} />;
      case 'profile':
        return <ArrowDown className={iconClass} />;
      default:
        return <ArrowDown className={iconClass} />;
    }
  };

  return (
    <button className={styles.container} onClick={onClick}>
      {img && (
        <img 
          src={img} 
          alt={label || 'Avatar'} 
          className={`${styles.avatar} rounded-xl object-cover`}
        />
      )}
      
      {!img && icon && renderIcon()}

      {(title || label || subTitle) && (
        <div className="flex items-start flex-col leading-tight">
          <span className={`${styles.title} text-text-high font-semibold`}>
            {title || label}
          </span>
          {subTitle && (
            <span className={`${styles.subtitle} text-text-low`}>{subTitle}</span>
          )}
        </div>
      )}

      {iconButton && renderIcon()}
    </button>
  );
}