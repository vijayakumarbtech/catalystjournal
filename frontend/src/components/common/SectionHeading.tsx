interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  variant?: 'light' | 'dark';
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  variant = 'light',
}: Props) {
  const isDark = variant === 'dark';
  return (
    <div className={align === 'center' ? 'text-center max-w-2xl mx-auto' : ''}>
      {eyebrow && (
        <p className={`eyebrow mb-2 ${isDark ? 'text-gold-400' : ''}`}>{eyebrow}</p>
      )}
      <h2
        className={`text-3xl sm:text-4xl font-bold mb-3 ${isDark ? 'text-white' : ''}`}
      >
        {title}
      </h2>
      {description && (
        <p className={`leading-relaxed ${isDark ? 'text-stone-300' : 'text-ink-700'}`}>
          {description}
        </p>
      )}
    </div>
  );
}
