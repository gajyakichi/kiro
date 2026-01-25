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

  const cleanIcon = icon.replace(/^(lucide|phosphor):/, '');

  // If explicitly set to original, strip prefix and map common icons to emojis
  if (baseSet === 'original') {
     const lower = cleanIcon.toLowerCase();
     if (lower === 'folder') return <span className={className} style={{ fontSize: `${size}px` }}>📁</span>;
     if (lower === 'settings' || lower === 'gear') return <span className={className} style={{ fontSize: `${size}px` }}>⚙️</span>;
     if (lower === 'scroll' || lower === 'git') return <span className={className} style={{ fontSize: `${size}px` }}>📜</span>;
     if (lower === 'checksquare' || lower === 'task') return <span className={className} style={{ fontSize: `${size}px` }}>✅</span>;
     if (lower === 'sparkles' || lower === 'daily') return <span className={className} style={{ fontSize: `${size}px` }}>✨</span>;
     if (lower === 'lightbulb' || lower === 'suggest') return <span className={className} style={{ fontSize: `${size}px` }}>💡</span>;
     if (lower === 'calendar') return <span className={className} style={{ fontSize: `${size}px` }}>📅</span>;
     if (lower === 'squarepen' || lower === 'notepencil' || lower === 'note') return <span className={className} style={{ fontSize: `${size}px` }}>📝</span>;
     if (lower === 'palette') return <span className={className} style={{ fontSize: `${size}px` }}>✨</span>;
     return <span className={className} style={{ fontSize: `${size}px` }}>{cleanIcon}</span>;
  }

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
    let pName = cleanIcon.charAt(0).toUpperCase() + cleanIcon.slice(1);
    // Common mappings
    if (pName === 'Settings') pName = 'Gear';
    if (pName === 'SquarePen') pName = 'NotePencil';
    if (pName === 'Calendar') pName = 'CalendarText';
    if (pName === 'CheckSquare') pName = 'CheckSquareOffset';

    const PhosphorIcon = (PhosphorIcons as unknown as Record<string, React.ElementType>)[pName];
    if (PhosphorIcon) return <PhosphorIcon className={className} size={size} />;
  }

  // Default fallback for icons without prefix - try Lucide first or if baseSet is lucide
  const lName = cleanIcon.charAt(0).toUpperCase() + cleanIcon.slice(1);
  const PotentialLucide = (LucideIcons as unknown as Record<string, React.ElementType>)[lName];
  if (PotentialLucide) return <PotentialLucide className={className} size={size} />;

  // Final Fallback as emoji or raw text
  return <span className={className} style={{ fontSize: `${size}px` }}>{cleanIcon}</span>;
};
