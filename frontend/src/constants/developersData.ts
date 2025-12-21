import { DeveloperProfile } from '../types/developer';

export const DEVELOPERS: DeveloperProfile[] = [
    {
        id: '1',
        name: 'Dev One',
        role: 'Full Stack Developer',
        bio: 'Apasionado por crear experiencias web increíbles y escalables.',
        avatarUrl: 'https://ui-avatars.com/api/?name=Dev+One&background=random',
        socialLinks: [
            { platform: 'github', url: 'https://github.com' },
            { platform: 'linkedin', url: 'https://linkedin.com' }
        ]
    },
    {
        id: '2',
        name: 'Dev Two',
        role: 'Frontend Specialist',
        bio: 'Experto en React y diseño UI/UX. Amante del código limpio.',
        avatarUrl: 'https://ui-avatars.com/api/?name=Dev+Two&background=random',
        socialLinks: [
            { platform: 'github', url: 'https://github.com' },
            { platform: 'twitter', url: 'https://twitter.com' }
        ]
    }
];
