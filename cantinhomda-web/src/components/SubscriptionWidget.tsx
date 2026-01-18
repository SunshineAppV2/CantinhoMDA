import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { CreditCard, Users, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClubStatus {
    planTier: string;
    memberLimit: number;
    activeMembers: number;
    subscriptionStatus: 'ACTIVE' | 'OVERDUE' | 'CANCELED' | 'TRIAL';
    nextBillingDate: string | null;
}

export function SubscriptionWidget() {
    const [status, setStatus] = useState<ClubStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/clubs/status')
            .then(res => setStatus(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading || !status) return null;

    const usagePercent = Math.min(100, Math.round((status.activeMembers / status.memberLimit) * 100));
    const isOverdue = status.subscriptionStatus === 'OVERDUE' || status.subscriptionStatus === 'CANCELED';
    const isWarning = usagePercent >= 90;

    const getPlanName = (tier: string) => {
        switch (tier) {
            case 'PLAN_P': return 'Plano P (Pequeno)';
            case 'PLAN_M': return 'Plano M (Padrão)';
            case 'PLAN_G': return 'Plano G (Líder)';
            case 'FREE': return 'Plano Gratuito';
            case 'TRIAL': return 'Período de Testes';
            default: return tier;
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-[2rem] premium-shadow border relative overflow-hidden p-6 mb-6 ${isOverdue ? 'bg-red-50/50 border-red-200' : 'bg-white/80 backdrop-blur-xl border-white/50'}`}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl shadow-sm ${isOverdue ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-lg leading-tight">{getPlanName(status.planTier)}</h3>
                        <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isOverdue ? 'text-red-600' : 'text-slate-400'}`}>
                            {isOverdue ? 'Assinatura Vencida' : `Vencimento: ${formatDate(status.nextBillingDate)}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isOverdue ? (
                        <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-xl shadow-red-600/20 uppercase tracking-widest flex items-center gap-2">
                            Regularizar
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                            Paga
                        </div>
                    )}
                </div>
            </div>

            {/* Usage Section */}
            <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            Capacidade do Clube
                        </span>
                        <p className="text-xl font-black text-slate-800">
                            {status.activeMembers} <span className="text-slate-400 font-bold text-sm">/ {status.memberLimit} membros</span>
                        </p>
                    </div>
                    <span className={`text-sm font-black ${isWarning || isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                        {usagePercent}%
                    </span>
                </div>

                <div className="h-3 w-full bg-slate-200/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${usagePercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${isOverdue ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-600'}`}
                    />
                </div>

                {isWarning && !isOverdue && (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">
                            Limite de membros quase atingido. Faça um upgrade para continuar crescendo!
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
