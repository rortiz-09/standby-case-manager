import { DeveloperProfile } from '../types/developer';

export const DEVELOPERS: DeveloperProfile[] = [
    {
        id: '1',
        name: 'Ronny Ortiz',
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
        name: 'Allan Cordova',
        role: 'Frontend Specialist',
        bio: 'Experto en React y diseño UI/UX. Amante del código limpio.',
        avatarUrl: 'https://ui-avatars.com/api/?name=Dev+Two&background=random',
        socialLinks: [
            { platform: 'github', url: 'https://github.com' },
            { platform: 'twitter', url: 'https://twitter.com' }
        ]
    },
    {
        id: '3',
        name: 'Jose Briones',
        role: 'Backend Developer',
        bio: 'Especialista en arquitecturas robustas y optimización de bases de datos.',
        avatarUrl: 'https://ui-avatars.com/api/?name=Dev+Three&background=random',
        socialLinks: [
            { platform: 'github', url: 'https://github.com' },
            { platform: 'linkedin', url: 'https://linkedin.com' }
        ]
    },
    {
        id: '4',
        name: 'Larry Sanchez',
        role: 'DevOps Engineer',
        bio: 'Automatizando todo lo que se mueve. Fanático de Docker y CI/CD.',
        avatarUrl: 'https://ui-avatars.com/api/?name=Dev+Four&background=random',
        socialLinks: [
            { platform: 'github', url: 'https://github.com' },
            { platform: 'website', url: 'https://example.com' }
        ]
    }
];
