import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Trophy, Calendar, DollarSign, ArrowRight, Stars, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from '../components/Skeleton';
import { Modal } from '../components/Modal';
import { ProfileUpdateModal } from '../components/ProfileUpdateModal';
import { ReferralPopup } from '../components/ReferralPopup';

import { ROLE_TRANSLATIONS } from './members/types';

import { SubscriptionWidget } from '../components/SubscriptionWidget';
import { SignaturesWidget } from '../components/SignaturesWidget';

import { FamilyDashboard } from './FamilyDashboard';
import { api } from '../lib/axios';

export function Dashboard() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="space-y-8 p-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64 bg-slate-200/50" />
                    <Skeleton className="h-4 w-48 bg-slate-200/30" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-3xl bg-slate-200/50" />)}
                </div>
            </div>
        );
    }

    if (!user) return null;

    if (user.role === 'PARENT') {
        return <FamilyDashboard />;
    }

    return <DirectorDashboard />;
}

function DirectorDashboard() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [showBirthdaysModal, setShowBirthdaysModal] = useState(false);
    const [showProfileUpdate, setShowProfileUpdate] = useState(false);
    const [showReferralPopup, setShowReferralPopup] = useState(false);

    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats', user?.clubId],
        queryFn: async () => {
            if (!user?.clubId) return null;
            try {
                const res = await api.get('/users/dashboard-stats');
                return res.data;
            } catch (error) {
                console.error('[Dashboard] Error loading stats:', error);
                return {
                    activeMembers: 0,
                    birthdays: [],
                    nextEvent: null,
                    financial: { balance: 0 }
                };
            }
        },
        enabled: !!user?.clubId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false
    });

    const { data: clubStatus } = useQuery({
        queryKey: ['club-status-api'],
        queryFn: async () => {
            const res = await api.get('/clubs/status');
            return res.data;
        },
        enabled: ['OWNER', 'ADMIN', 'DIRECTOR'].includes(user?.role || ''),
        staleTime: 1000 * 60 * 30
    });

    const { data: systemConfig } = useQuery({
        queryKey: ['system-config'],
        queryFn: async () => {
            try {
                const res = await api.get('/system/config');
                return res.data;
            } catch {
                return { referralEnabled: false };
            }
        },
        staleTime: 1000 * 60 * 5
    });

    const handleCopyReferral = () => {
        if (clubStatus?.referralCode) {
            const link = `${window.location.origin}/register?ref=${clubStatus.referralCode}`;
            navigator.clipboard.writeText(link);
            import('sonner').then(({ toast }) => toast.success('✨ Link de indicação copiado!'));
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-10 pb-10">
            {/* Hero Section */}
            <div className="space-y-2">
                <motion.h1
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="text-4xl font-black text-slate-900 tracking-tight"
                >
                    Olá, {user?.name?.split(' ')[0]}! 👋
                </motion.h1>
                <motion.p
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-500 font-medium"
                >
                    Aqui está um resumo do que está acontecendo no seu clube hoje.
                </motion.p>
            </div>

            {/* Top Row: System Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Subscription Widget (Modernized via Layout or direct) */}
                    {['OWNER', 'ADMIN', 'DIRECTOR'].includes(user?.role || '') && <SubscriptionWidget />}
                    <SignaturesWidget />
                </div>

                {/* Secondary Info area */}
                <div className="space-y-6">
                    {/* Referral Widget - Premium Variant */}
                    {systemConfig?.referralEnabled && clubStatus?.referralCode && (
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group min-h-[300px] flex flex-col justify-between"
                        >
                            <div className="absolute top-[-20%] right-[-10%] opacity-20 group-hover:scale-110 transition-transform duration-700">
                                <Stars className="w-64 h-64 text-blue-500" />
                            </div>

                            <div className="relative z-10">
                                <div className="p-3 bg-blue-600 w-fit rounded-2xl mb-6 shadow-lg shadow-blue-600/30">
                                    <Share2 className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-black mb-3 leading-tight">Programa de<br />Indicações</h3>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                                    Indique outros diretores e ganhe benefícios exclusivos para seu clube.
                                </p>
                            </div>

                            <div className="relative z-10 space-y-4">
                                <div className="flex items-end justify-between mb-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Progresso Atual</span>
                                    <span className="text-2xl font-black">{clubStatus.referralCredits?.length || 0}/3</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((clubStatus.referralCredits?.length || 0) / 3) * 100}%` }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                    />
                                </div>
                                <button
                                    onClick={handleCopyReferral}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    Copiar Link de Convite
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {/* Active Members Card */}
                <motion.div variants={item} className="group">
                    <div
                        onClick={() => navigate('/dashboard/members')}
                        className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 premium-shadow flex flex-col justify-between h-56 cursor-pointer hover:bg-white hover:-translate-y-2 transition-all duration-300"
                    >
                        <div className="p-4 bg-blue-50 w-fit rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Membros Ativos</p>
                            <h3 className="text-4xl font-black text-slate-900">{stats?.activeMembers || 0}</h3>
                        </div>
                    </div>
                </motion.div>

                {/* Financial Card */}
                {['OWNER', 'ADMIN', 'DIRECTOR', 'TREASURER'].includes(user?.role || '') && (
                    <motion.div variants={item} className="group">
                        <div
                            onClick={() => navigate('/dashboard/financial')}
                            className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 premium-shadow flex flex-col justify-between h-56 cursor-pointer hover:bg-white hover:-translate-y-2 transition-all duration-300"
                        >
                            <div className={`p-4 w-fit rounded-2xl transition-colors ${(stats?.financial?.balance || 0) >= 0 ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'}`}>
                                <DollarSign className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Saldo do Mês</p>
                                <h3 className={`text-4xl font-black ${(stats?.financial?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-700'}`}>
                                    <span className="text-lg mr-1 font-bold">R$</span>
                                    {stats?.financial?.balance?.toFixed(0) || '0'}
                                </h3>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Next Event Card */}
                <motion.div variants={item} className="group">
                    <div
                        onClick={() => navigate('/dashboard/events')}
                        className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 premium-shadow flex flex-col justify-between h-56 cursor-pointer hover:bg-white hover:-translate-y-2 transition-all duration-300"
                    >
                        <div className="p-4 bg-purple-50 w-fit rounded-2xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Próximo Evento</p>
                            <h3 className="text-xl font-black text-slate-800 line-clamp-1 mb-1" title={stats?.nextEvent?.title || 'Nenhum'}>
                                {stats?.nextEvent?.title || 'Nenhum'}
                            </h3>
                            {stats?.nextEvent && (
                                <p className="text-xs text-slate-500 font-bold">
                                    {new Date(stats?.nextEvent?.startDate).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Birthdays Card */}
                <motion.div variants={item} className="group">
                    <div
                        onClick={() => setShowBirthdaysModal(true)}
                        className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 premium-shadow flex flex-col justify-between h-56 cursor-pointer hover:bg-white hover:-translate-y-2 transition-all duration-300"
                    >
                        <div className="p-4 bg-pink-50 w-fit rounded-2xl text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                            <Trophy className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Aniversariantes</p>
                            <h3 className="text-4xl font-black text-slate-900">
                                {stats?.birthdays?.length || 0}
                                <span className="text-sm font-bold ml-2 text-slate-400">Este mês</span>
                            </h3>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Birthdays Modal - Refined */}
            <Modal
                isOpen={showBirthdaysModal}
                onClose={() => setShowBirthdaysModal(false)}
                title="🎂 Aniversariantes do Mês"
            >
                {stats?.birthdays?.length === 0 ? (
                    <div className="py-12 text-center space-y-4">
                        <div className="p-6 bg-slate-50 w-fit mx-auto rounded-3xl">
                            <Calendar className="w-12 h-12 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold">Ninguém faz aniversário este mês.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto pr-2 scrollbar-none">
                        {stats?.birthdays?.map((b: any, i: number) => (
                            <motion.div
                                key={b.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => navigate(`/dashboard/members?search=${b.name}`)}
                                className="flex items-center gap-4 py-4 hover:bg-slate-50 px-4 rounded-2xl transition-all cursor-pointer group"
                            >
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black transition-colors group-hover:bg-blue-600 group-hover:text-white shrink-0">
                                    {b.day}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-800 truncate">{b.name}</p>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{ROLE_TRANSLATIONS[b.role] || b.role}</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                            </motion.div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* Incomplete Profile Logic (kept as is) */}
            {showProfileUpdate && user?.role === 'OWNER' && (
                <ProfileUpdateModal
                    user={user}
                    club={clubStatus}
                    onUpdate={async () => {
                        await refreshUser();
                        setShowProfileUpdate(false);
                        if (!localStorage.getItem('referralPopupDismissed')) {
                            setShowReferralPopup(true);
                        }
                    }}
                />
            )}

            {/* Referral Popup Logic (kept as is) */}
            {showReferralPopup && clubStatus?.referralCode && (
                <ReferralPopup
                    referralCode={clubStatus.referralCode}
                    clubName={clubStatus.name || 'seu clube'}
                    onClose={() => setShowReferralPopup(false)}
                />
            )}
        </div >
    );
}
