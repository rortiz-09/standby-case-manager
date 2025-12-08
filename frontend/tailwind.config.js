/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            colors: {
                vscode: {
                    bg: '#1e1e1e',
                    sidebar: '#252526',
                    activity: '#333333',
                    hover: '#2a2d2e',
                    text: '#cccccc',
                    blue: '#007acc',
                    border: '#3e3e42',
                    // Light Theme
                    'light-bg': '#ffffff',
                    'light-sidebar': '#f3f3f3',
                    'light-activity': '#e8e8e8',
                    'light-hover': '#f0f0f0',
                    'light-text': '#333333',
                    'light-border': '#e5e5e5',
                }
            }
        },
    },
    plugins: [],
}
