import React from 'react';

interface AvatarProps {
    username: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
    username,
    size = 'md',
    className = ''
}) => {
    const initials = username.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2); // generate initials from username

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };

    return (
        <div
            className={`flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold ${sizeClasses[size]} ${className}`}
            aria-label={`User avatar for ${username}`}
        >
            {initials}
        </div>
    );
};

export default Avatar;