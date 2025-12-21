export interface SocialLink {
    platform: 'github' | 'linkedin' | 'twitter' | 'website';
    url: string;
}

export interface DeveloperProfile {
    id: string;
    name: string;
    role: string;
    bio: string;
    avatarUrl: string;
    socialLinks: SocialLink[];
}
