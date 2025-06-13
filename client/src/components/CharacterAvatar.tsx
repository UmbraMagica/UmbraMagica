interface CharacterAvatarProps {
  character: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function CharacterAvatar({ character, size = 'md', className = '' }: CharacterAvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  const initials = `${character.firstName.charAt(0)}${character.lastName.charAt(0)}`;

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${className}`}>
      {character.avatar ? (
        <img
          src={character.avatar}
          alt={`${character.firstName} ${character.lastName}`}
          className="w-full h-full rounded-full object-cover border-2 border-muted"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-primary/20 border-2 border-muted flex items-center justify-center">
          <span className="font-medium text-primary">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}