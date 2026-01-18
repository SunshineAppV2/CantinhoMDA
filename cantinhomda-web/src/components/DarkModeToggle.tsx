import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '../hooks/useDarkMode';

/**
 * Componente de Toggle para Dark Mode
 * 
 * Features:
 * - Animação suave de transição
 * - Ícones animados (Sol/Lua)
 * - Tooltip informativo
 * - Acessível (ARIA labels)
 */
export function DarkModeToggle() {
    const { isDark, toggle } = useDarkMode();

    return (
        <motion.button
            onClick={toggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="
        relative p-3 rounded-2xl 
        bg-slate-100 hover:bg-slate-200
        dark:bg-slate-800 dark:hover:bg-slate-700
        transition-colors duration-200
        group
      "
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
            <AnimatePresence mode="wait">
                {isDark ? (
                    <motion.div
                        key="moon"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Moon className="w-5 h-5 text-slate-300" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Sun className="w-5 h-5 text-amber-500" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tooltip */}
            <div className="
        absolute -bottom-12 left-1/2 -translate-x-1/2
        px-3 py-1.5 rounded-lg
        bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none
        whitespace-nowrap
      ">
                {isDark ? 'Modo claro' : 'Modo escuro'}
                <div className="
          absolute -top-1 left-1/2 -translate-x-1/2
          w-2 h-2 rotate-45
          bg-slate-900 dark:bg-slate-700
        " />
            </div>
        </motion.button>
    );
}
