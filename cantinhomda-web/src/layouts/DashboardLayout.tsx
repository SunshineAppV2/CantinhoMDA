import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
    AlertTriangle,
    RefreshCw,
    DollarSign,
    LogOut,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_TRANSLATIONS } from '../pages/members/types';
import { NotificationBell } from '../components/NotificationBell';
import { HelpButton } from '../components/HelpButton';
import { ReferralBanner } from '../components/ReferralBanner';
import { DarkModeToggle } from '../components/DarkModeToggle';

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

export function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const mainRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch Club Settings
    const { data: clubData, isLoading: isClubLoading } = useQuery({
        queryKey: ['club-settings-layout', user?.clubId],
        queryFn: async () => {
            if (!user?.clubId) return null;
            const res = await api.get(`/clubs/${user.clubId}`);
            return res.data;
        },
        enabled: !!user?.clubId,
        staleTime: 1000 * 60 * 5
    });

    // Check Subscription Status
    const { isOverdue: isClubOverdue, isWarning: isClubWarning } = ((): { isOverdue: boolean, isWarning: boolean } => {
        if (!clubData) return { isOverdue: false, isWarning: false };
        const status = clubData.subscriptionStatus;
        if (status === 'OVERDUE' || status === 'CANCELED') return { isOverdue: true, isWarning: false };
        if (clubData.nextBillingDate) {
            const today = new Date();
            const billingDate = new Date(clubData.nextBillingDate);
            const gracePeriod = (clubData.gracePeriodDays && !isNaN(Number(clubData.gracePeriodDays))) ? Number(clubData.gracePeriodDays) : 0;
            const cutoffDate = new Date(billingDate);
            cutoffDate.setDate(cutoffDate.getDate() + gracePeriod);
            if (today > cutoffDate) return { isOverdue: true, isWarning: false };
            if (today > billingDate) return { isOverdue: false, isWarning: true };
        }
        return { isOverdue: false, isWarning: false };
    })();

    useEffect(() => {
        const isLeader = ['MASTER', 'OWNER', 'ADMIN', 'DIRECTOR'].includes(user?.role || '');
        if (!isClubLoading && isClubOverdue && isLeader && location.pathname !== '/dashboard/subscription' && !location.pathname.includes('/change-password')) {
            navigate('/dashboard/subscription', { replace: true });
        }
    }, [isClubOverdue, isClubLoading, location.pathname, navigate, user?.role]);

    if (isClubLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full"
                />
            </div>
        );
    }

    const isAllowedPage = location.pathname === '/dashboard/subscription' || location.pathname.includes('/change-password');
    const shouldBlockContent = isClubOverdue && !isAllowedPage;

    return (
        <div className="min-h-screen bg-background flex relative selection:bg-blue-500/30 selection:text-blue-200">
            <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 lg:pl-24">
                {/* Subscription Banners */}
                <AnimatePresence>
                    {(isClubOverdue || isClubWarning) && (
                        <motion.div
                            initial={{ y: -50 }}
                            animate={{ y: 0 }}
                            className={`${isClubOverdue ? 'bg-red-600' : 'bg-amber-500'} text-white px-4 py-3 text-center font-bold flex flex-col md:flex-row items-center justify-center gap-4 z-[60] shadow-2xl`}
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 animate-pulse" />
                                <span className="text-sm md:text-base">
                                    {isClubOverdue
                                        ? 'Assinatura VENCIDA. O acesso dos membros está suspenso.'
                                        : 'Assinatura vencida (Período de carência). Regularize para evitar suspensão.'}
                                </span>
                            </div>
                            {['OWNER', 'ADMIN', 'DIRECTOR'].includes(user?.role || '') && (
                                <Link
                                    to="/dashboard/subscription"
                                    className="bg-white text-slate-900 px-6 py-1.5 rounded-full text-xs hover:scale-105 transition-all uppercase font-black shadow-lg"
                                >
                                    Resolver Agora
                                </Link>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Top Header */}
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 h-20 flex items-center justify-between px-8 sticky top-0 z-30">{ }
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 tracking-tight hidden sm:block">
                                {location.pathname.split('/').pop()?.replace(/-/g, ' ').toUpperCase() || 'DASHBOARD'}
                            </h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">
                                CantinhoMDA • {clubData?.name || 'Sistema'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/20 dark:border-slate-700/20 mr-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm"
                                title="Atualizar Página"
                            >
                                <RefreshCw className="w-4.5 h-4.5" />
                            </button>
                            <NotificationBell />
                            <DarkModeToggle />
                        </div>

                        <Link to="/dashboard/profile" className="flex items-center gap-3 bg-white/50 hover:bg-white p-1.5 pr-4 rounded-2xl transition-all border border-transparent hover:border-slate-200 hover:shadow-xl shadow-slate-200/50 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-sm ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                {user?.name?.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'DBV'}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-black text-slate-800 leading-none">{user?.name || 'Usuário'}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                        {ROLE_TRANSLATIONS[user?.role || '']?.toLowerCase() || 'Membro'}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main ref={mainRef} className="flex-1 overflow-auto p-4 md:p-8 gradient-bg relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="max-w-7xl mx-auto w-full"
                        >
                            {shouldBlockContent ? (
                                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                                    <motion.div
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        className="bg-white p-10 rounded-[2.5rem] border border-red-100 flex flex-col items-center max-w-lg shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)]"
                                    >
                                        <div className="p-5 bg-red-50 rounded-3xl mb-6">
                                            <AlertTriangle className="w-12 h-12 text-red-500" />
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Acesso Suspenso</h2>
                                        <p className="text-slate-500 mb-10 text-lg leading-relaxed">
                                            O acesso a este clube está temporariamente suspenso devido à assinatura vencida.
                                        </p>

                                        {['MASTER', 'OWNER', 'ADMIN', 'DIRECTOR'].includes(user?.role || '') ? (
                                            <Link
                                                to="/dashboard/subscription"
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-3 text-lg"
                                            >
                                                <DollarSign className="w-6 h-6" />
                                                Regularizar Agora
                                            </Link>
                                        ) : (
                                            <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 text-sm text-red-700 font-bold">
                                                Entre em contato com o diretor do seu clube.
                                            </div>
                                        )}
                                    </motion.div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <ReferralBanner />
                                    <Outlet />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
            <HelpButton />
        </div>
    );
}
