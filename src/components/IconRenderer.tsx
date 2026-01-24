import React from 'react';
import * as LucideIcons from 'lucide-react';
import * as PhosphorIcons from '@phosphor-icons/react';

interface IconRendererProps {
  icon?: string;
  className?: string;
  size?: number;
  baseSet?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ icon, className, size = 16, baseSet }) => {
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

  // If baseSet is provided and icon doesn't have prefix, try using baseSet
  if (baseSet === 'phosphor') {
    const phosphorName = icon as keyof typeof PhosphorIcons;
    const PhosphorIcon = PhosphorIcons[phosphorName] as React.ElementType;
    if (PhosphorIcon) return <PhosphorIcon className={className} size={size} />;
  }

  // Default fallback for icons without prefix - try Lucide first or if baseSet is lucide
  const lucideName = icon as keyof typeof LucideIcons;
  const PotentialLucide = LucideIcons[lucideName] as React.ElementType;
  if (PotentialLucide) return <PotentialLucide className={className} size={size} />;

  // Final Fallback as emoji or raw text
  return <span className={className} style={{ fontSize: `${size}px` }}>{icon}</span>;
};
