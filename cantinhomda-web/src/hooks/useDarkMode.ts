import { useEffect, useState } from 'react';

/**
 * Hook para gerenciar Dark Mode
 * 
 * Funcionalidades:
 * - Detecta preferência do sistema
 * - Persiste escolha do usuário
 * - Sincroniza com localStorage
 * - Aplica classe 'dark' no HTML
 */
export function useDarkMode() {
    const [isDark, setIsDark] = useState(() => {
        // Verificar se há preferência salva
        const saved = localStorage.getItem('theme');
        if (saved) {
            return saved === 'dark';
        }

        // Caso contrário, usar preferência do sistema
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;

        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    // Listener para mudanças na preferência do sistema
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            // Só atualizar se não houver preferência salva
            if (!localStorage.getItem('theme')) {
                setIsDark(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggle = () => setIsDark(!isDark);
    const setDark = () => setIsDark(true);
    const setLight = () => setIsDark(false);

    return { isDark, toggle, setDark, setLight };
}
