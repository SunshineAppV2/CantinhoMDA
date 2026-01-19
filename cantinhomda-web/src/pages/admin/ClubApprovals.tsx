import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import {
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    MessageSquare,
    Award,
    Ban
} from 'lucide-react';

interface PendingClub {
    id: string;
    name: string;
    region?: string;
    district?: string;
    association?: string;
    union?: string;
    phoneNumber?: string;
    approvalMessage?: string;
    createdAt: string;
    users: Array<{
        id: string;
        name: string;
        email: string;
        phone?: string;
    }>;
}

interface ApprovalMetrics {
    pending: number;
    approved: number;
    rejected: number;
    trial: number;
}

export function ClubApprovals() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedClub, setSelectedClub] = useState<PendingClub | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Form states
    const [grantTrial, setGrantTrial] = useState(false);
    const [trialDays, setTrialDays] = useState(7);
    const [subscriptionPlan, setSubscriptionPlan] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
    const [notes, setNotes] = useState('');
    const [rejectReason, setRejectReason] = useState('');

    // Buscar clubes pendentes
    const { data: pendingClubs = [], isLoading: loadingPending, refetch } = useQuery({
        queryKey: ['clubs', 'pending'],
        queryFn: async () => {
            const res = await api.get('/clubs/admin/pending');
            return res.data as PendingClub[];
        },
        enabled: user?.role === 'MASTER' || user?.email === 'master@cantinhomda.com'
    });

    // Buscar métricas
    const { data: metrics } = useQuery<ApprovalMetrics>({
        queryKey: ['clubs', 'approval-metrics'],
        queryFn: async () => {
            const res = await api.get('/clubs/admin/approval-metrics');
            return res.data;
        },
        enabled: user?.role === 'MASTER' || user?.email === 'master@cantinhomda.com'
    });

    // Mutation para aprovar
    const approveMutation = useMutation({
        mutationFn: async (data: {
            clubId: string;
            grantTrial?: boolean;
            trialDays?: number;
            subscriptionPlan: string;
            notes?: string;
        }) => {
            return api.post(`/clubs/${data.clubId}/approve`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clubs', 'pending'] });
            queryClient.invalidateQueries({ queryKey: ['clubs', 'approval-metrics'] });
            toast.success('Clube aprovado com sucesso!');
            closeModals();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Erro ao aprovar clube');
        }
    });

    // Mutation para rejeitar
    const rejectMutation = useMutation({
        mutationFn: async (data: { clubId: string; reason: string }) => {
            return api.post(`/clubs/${data.clubId}/reject`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clubs', 'pending'] });
            queryClient.invalidateQueries({ queryKey: ['clubs', 'approval-metrics'] });
            toast.success('Clube rejeitado.');
            closeModals();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Erro ao rejeitar clube');
        }
    });

    const closeModals = () => {
        setShowApproveModal(false);
        setShowRejectModal(false);
        setSelectedClub(null);
        setGrantTrial(false);
        setTrialDays(7);
        setSubscriptionPlan('MONTHLY');
        setNotes('');
        setRejectReason('');
    };

    const handleApprove = () => {
        if (!selectedClub) return;

        approveMutation.mutate({
            clubId: selectedClub.id,
            grantTrial,
            trialDays: grantTrial ? trialDays : undefined,
            subscriptionPlan,
            notes
        });
    };

    const handleReject = () => {
        if (!selectedClub || !rejectReason.trim()) {
            toast.error('Por favor, informe o motivo da rejeição');
            return;
        }

        rejectMutation.mutate({
            clubId: selectedClub.id,
            reason: rejectReason
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (user?.role !== 'MASTER' && user?.email !== 'master@cantinhomda.com') {
        return (
            <div className="p-8 text-center text-red-500">
                Acesso restrito ao Master.
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Aprovações de Clubes</h1>
                        <p className="text-slate-500">
                            {pendingClubs.length} clube{pendingClubs.length !== 1 ? 's' : ''} aguardando aprovação
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                </button>
            </div>

            {/* Métricas */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-3 rounded-full">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">{metrics.pending}</p>
                                <p className="text-sm text-slate-500">Pendentes</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-3 rounded-full">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">{metrics.approved}</p>
                                <p className="text-sm text-slate-500">Aprovados</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-3 rounded-full">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">{metrics.rejected}</p>
                                <p className="text-sm text-slate-500">Rejeitados</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Award className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">{metrics.trial}</p>
                                <p className="text-sm text-slate-500">Em Teste</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loadingPending && (
                <div className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                    Carregando clubes...
                </div>
            )}

            {/* Empty State */}
            {!loadingPending && pendingClubs.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-green-800">Nenhum clube pendente</h3>
                    <p className="text-green-600">Todos os clubes foram processados.</p>
                </div>
            )}

            {/* Lista de Clubes Pendentes */}
            {pendingClubs.length > 0 && (
                <div className="grid gap-4">
                    {pendingClubs.map((club) => {
                        const owner = club.users[0];
                        return (
                            <div
                                key={club.id}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-6 space-y-4">
                                    {/* Nome e Data */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-full">
                                                <Building2 className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">{club.name}</h3>
                                                <p className="text-sm text-slate-500">
                                                    Cadastrado em: {formatDate(club.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Localização */}
                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                        {club.region && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                <span>Região: {club.region}</span>
                                            </div>
                                        )}
                                        {club.district && <span>Distrito: {club.district}</span>}
                                        {club.association && <span>Associação: {club.association}</span>}
                                    </div>

                                    {/* Diretor */}
                                    {owner && (
                                        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                            <p className="text-sm font-medium text-slate-700">Diretor:</p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    <span>{owner.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-slate-400" />
                                                    <span>{owner.email}</span>
                                                </div>
                                                {owner.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-slate-400" />
                                                        <span>{owner.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mensagem */}
                                    {club.approvalMessage && (
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-start gap-2">
                                                <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-blue-800 mb-1">Mensagem:</p>
                                                    <p className="text-sm text-blue-700">{club.approvalMessage}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Ações */}
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        <button
                                            onClick={() => {
                                                setSelectedClub(club);
                                                setShowApproveModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Aprovar
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedClub(club);
                                                setShowRejectModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors"
                                        >
                                            <Ban className="w-4 h-4" />
                                            Rejeitar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Aprovação */}
            {showApproveModal && selectedClub && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
                        <h2 className="text-xl font-bold text-slate-800">
                            Aprovar Clube: {selectedClub.name}
                        </h2>

                        <div className="space-y-4">
                            {/* Opção de Teste */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={!grantTrial}
                                        onChange={() => setGrantTrial(false)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium">Aprovar sem período de teste</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={grantTrial}
                                        onChange={() => setGrantTrial(true)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium">Aprovar com período de teste</span>
                                </label>
                            </div>

                            {/* Dias de Teste */}
                            {grantTrial && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Dias de teste:
                                    </label>
                                    <div className="flex gap-2">
                                        {[7, 15, 30].map((days) => (
                                            <button
                                                key={days}
                                                onClick={() => setTrialDays(days)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${trialDays === days
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {days} dias
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Plano */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Plano de assinatura:
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={subscriptionPlan === 'MONTHLY'}
                                            onChange={() => setSubscriptionPlan('MONTHLY')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Mensal (R$ 1,00/membro)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={subscriptionPlan === 'QUARTERLY'}
                                            onChange={() => setSubscriptionPlan('QUARTERLY')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Trimestral (10% desconto)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={subscriptionPlan === 'ANNUAL'}
                                            onChange={() => setSubscriptionPlan('ANNUAL')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Anual (20% desconto)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Notas */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Notas (opcional):
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                    rows={3}
                                    placeholder="Observações sobre a aprovação..."
                                />
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={closeModals}
                                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={approveMutation.isPending}
                                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                {approveMutation.isPending ? 'Aprovando...' : '✅ Confirmar Aprovação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Rejeição */}
            {showRejectModal && selectedClub && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
                        <h2 className="text-xl font-bold text-slate-800">
                            Rejeitar Clube: {selectedClub.name}
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Motivo da rejeição: *
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                                rows={4}
                                placeholder="Explique o motivo da rejeição..."
                                required
                            />
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-700">
                                ⚠️ Esta ação bloqueará o clube permanentemente.
                            </p>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3">
                            <button
                                onClick={closeModals}
                                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={rejectMutation.isPending || !rejectReason.trim()}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                {rejectMutation.isPending ? 'Rejeitando...' : '🚫 Confirmar Rejeição'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
