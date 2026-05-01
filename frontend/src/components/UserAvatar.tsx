'use client';

import React from "react";

interface UserAvatarProps {
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    size?: "sm" | "md" | "lg";
}

function getInitials(firstName?: string | null, lastName?: string | null, username?: string | null) {
    const first = firstName?.trim();
    const last = lastName?.trim();
    const user = username?.trim();

    if (first && last) {
        return `${first[0]}${last[0]}`.toUpperCase();
    }

    if (first) {
        return first.slice(0, 2).toUpperCase();
    }

    if (user) {
        return user.slice(0, 2).toUpperCase();
    }

    return "U";
}

export default function UserAvatar({
    firstName,
    lastName,
    username,
    size = "md",
}: UserAvatarProps) {
    const sizeClasses = {
        sm: "w-7 h-7 text-[10px]",
        md: "w-9 h-9 text-[12px]",
        lg: "w-12 h-12 text-[16px]",
    };

    return (
        <div
            className={`${sizeClasses[size]} rounded-full bg-[#1a3d28] border border-white/10 text-[#f0c040] flex items-center justify-center font-semibold uppercase`}
            title={username || "User profile"}
        >
            {getInitials(firstName, lastName, username)}
        </div>
    );
}