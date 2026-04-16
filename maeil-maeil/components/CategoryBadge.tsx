interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const fontSize = size === 'sm' ? 11 : 12;
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize,
        fontWeight: 600,
        color: '#fe6e00',
        background: 'rgba(254, 110, 0, 0.08)',
        borderLeft: '3px solid #fe6e00',
        borderRadius: '0 4px 4px 0',
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        letterSpacing: '0.3px',
      }}
    >
      {category}
    </span>
  );
}
