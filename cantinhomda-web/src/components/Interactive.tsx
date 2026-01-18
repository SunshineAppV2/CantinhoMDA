import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

/**
 * Componentes com Micro-interações
 * 
 * Botões, inputs e cards animados para melhor UX
 */

// ============================================
// BUTTON COMPONENT
// ============================================

interface ButtonProps extends HTMLMotionProps<'button'> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', isLoading, children, className = '', ...props }, ref) => {
        const baseStyles = 'font-black uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

        const variants = {
            primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20',
            secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
            danger: 'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/20',
            ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
        };

        const sizes = {
            sm: 'px-4 py-2 text-xs',
            md: 'px-6 py-3 text-xs',
            lg: 'px-8 py-4 text-sm',
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                        />
                        <span>Carregando...</span>
                    </>
                ) : (
                    children
                )}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

// ============================================
// INPUT COMPONENT
// ============================================

interface InputProps extends Omit<HTMLMotionProps<'input'>, 'type'> {
    label?: string;
    error?: string;
    success?: string;
    type?: string;
    icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, success, icon, className = '', ...props }, ref) => {
        const hasError = !!error;
        const hasSuccess = !!success;

        return (
            <div className="space-y-2">
                {label && (
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
                        {label}
                    </label>
                )}

                <div className="relative">
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            {icon}
                        </div>
                    )}

                    <motion.input
                        ref={ref}
                        whileFocus={{ scale: 1.01 }}
                        className={`
              w-full px-6 py-4 
              ${icon ? 'pl-12' : ''}
              bg-slate-50 dark:bg-slate-900
              border-2 rounded-2xl
              font-bold text-slate-800 dark:text-slate-200
              outline-none
              transition-all duration-200
              ${hasError ? 'border-red-500 focus:ring-2 focus:ring-red-500' : ''}
              ${hasSuccess ? 'border-green-500 focus:ring-2 focus:ring-green-500' : ''}
              ${!hasError && !hasSuccess ? 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500' : ''}
              ${className}
            `}
                        {...props}
                    />
                </div>

                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-bold text-red-600 dark:text-red-400 px-1"
                    >
                        {error}
                    </motion.p>
                )}

                {success && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-bold text-green-600 dark:text-green-400 px-1"
                    >
                        {success}
                    </motion.p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

// ============================================
// CARD COMPONENT
// ============================================

interface CardProps extends HTMLMotionProps<'div'> {
    hover?: boolean;
    children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ hover = true, children, className = '', ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
                transition={{ duration: 0.2 }}
                className={`
          glass-card rounded-[2.5rem] p-8 premium-shadow
          ${hover ? 'cursor-pointer' : ''}
          ${className}
        `}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

Card.displayName = 'Card';

// ============================================
// ICON BUTTON COMPONENT
// ============================================

interface IconButtonProps extends HTMLMotionProps<'button'> {
    icon: React.ReactNode;
    label?: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon, label, variant = 'ghost', className = '', ...props }, ref) => {
        const variants = {
            primary: 'bg-blue-600 hover:bg-blue-700 text-white',
            secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300',
            danger: 'bg-red-50 hover:bg-red-600 text-red-600 hover:text-white',
            ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400',
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`
          p-3 rounded-xl transition-all
          ${variants[variant]}
          ${className}
        `}
                title={label}
                aria-label={label}
                {...props}
            >
                {icon}
            </motion.button>
        );
    }
);

IconButton.displayName = 'IconButton';

// ============================================
// BADGE COMPONENT
// ============================================

interface BadgeProps extends HTMLMotionProps<'span'> {
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    children: React.ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ variant = 'primary', children, className = '', ...props }, ref) => {
        const variants = {
            primary: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
            success: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
            warning: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
            danger: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
            info: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        };

        return (
            <motion.span
                ref={ref}
                whileHover={{ scale: 1.05 }}
                className={`
          inline-flex items-center gap-1
          px-4 py-1.5 rounded-full
          text-xs font-black uppercase tracking-widest
          border
          ${variants[variant]}
          ${className}
        `}
                {...props}
            >
                {children}
            </motion.span>
        );
    }
);

Badge.displayName = 'Badge';

// ============================================
// FLOATING ACTION BUTTON
// ============================================

interface FABProps extends HTMLMotionProps<'button'> {
    icon: React.ReactNode;
    label?: string;
}

export const FAB = forwardRef<HTMLButtonElement, FABProps>(
    ({ icon, label, className = '', ...props }, ref) => {
        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className={`
          fixed bottom-8 right-8
          w-16 h-16 rounded-full
          bg-blue-600 hover:bg-blue-700
          text-white
          shadow-2xl shadow-blue-600/30
          flex items-center justify-center
          z-50
          ${className}
        `}
                title={label}
                aria-label={label}
                {...props}
            >
                {icon}
            </motion.button>
        );
    }
);

FAB.displayName = 'FAB';
