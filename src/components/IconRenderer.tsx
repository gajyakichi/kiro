import React from 'react';
import * as LucideIcons from 'lucide-react';
import * as PhosphorIcons from '@phosphor-icons/react';

interface IconRendererProps {
  icon?: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ icon, className, size = 16 }) => {
  if (!icon) return null;

  if (icon.startsWith('lucide:')) {
    const iconName = icon.replace('lucide:', '') as keyof typeof LucideIcons;
    const IconComponent = LucideIcons[iconName] as React.ElementType;
    return IconComponent ? <IconComponent className={className} size={size} /> : null;
  }

  if (icon.startsWith('phosphor:')) {
    const iconName = icon.replace('phosphor:', '') as keyof typeof PhosphorIcons;
    const IconComponent = PhosphorIcons[iconName] as React.ElementType;
    return IconComponent ? <IconComponent className={className} size={size} /> : null;
  }

  // Fallback as emoji or raw text
  return <span className={className} style={{ fontSize: `${size}px` }}>{icon}</span>;
};
