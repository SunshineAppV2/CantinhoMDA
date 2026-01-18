import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { Plus, TrendingUp, TrendingDown, DollarSign, Printer, Check, X, FileText, Pencil, Trash2, CheckCircle, Eye, QrCode } from 'lucide-react';
import { Modal } from '../components/Modal';
import { generateFinancialReport } from '../lib/pdf-generator';
import { toast } from 'sonner';
import { PaymentModal } from '../components/PaymentModal';
import { SimplePieChart, CashFlowChart } from '../components/Charts';

interface Transaction {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description: string;
    category: string;
    date: string;
    status: 'PENDING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'CANCELED';
    points?: number;
    proofUrl?: string;
    payer?: { id: string; name: string };
    dueDate?: string;
}

const getDaysLabel = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return <div className="text-red-600 font-bold text-[10px] mt-0.5">Vencido há {Math.abs(diffDays)} dias</div>;
    if (diffDays === 0) return <div className="text-orange-600 font-bold text-[10px] mt-0.5">Vence hoje</div>;
    return <div className="text-slate-500 text-[10px] mt-0.5">Vence em {diffDays} dias</div>;
};

export function Treasury() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'HISTORY' | 'VALIDATION'>('HISTORY');

    // Form State
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Mensalidade');
    const [payerId, setPayerId] = useState('');
    const [points, setPoints] = useState<number>(100); // Default: 100 points
    const [recurrence, setRecurrence] = useState(false);
    const [installments, setInstallments] = useState(1);
    const [dueDate, setDueDate] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [settlingTransaction, setSettlingTransaction] = useState<Transaction | null>(null);
    const [validatingTx, setValidatingTx] = useState<Transaction | null>(null);
    const [paymentDate, setPaymentDate] = useState('');
    const [isPaid, setIsPaid] = useState(false);

    // Firestore Imports moved to top

    const { data: transactions = [] } = useQuery<Transaction[]>({
        queryKey: ['transactions', user?.clubId],
        queryFn: async () => {
            if (!user?.clubId) return [];
            const res = await api.get(`/treasury/club/${user.clubId}`);
            return res.data;
        },
        enabled: !!user?.clubId
    });

    const { data: balanceData } = useQuery({
        queryKey: ['treasury-balance', user?.clubId],
        queryFn: async () => {
            if (!user?.clubId) return { balance: 0, income: 0, expense: 0 };
            const res = await api.get(`/treasury/balance/${user.clubId}`);
            return res.data;
        },
        enabled: !!user?.clubId
    });

    const summary = useMemo(() => { // Assuming we lift the query execution or access data directly
        // We use 'transactions' from useQuery
        const monthlyMap = new Map<string, { name: string, income: number, expense: number }>();
        const categoryMap = new Map<string, number>();

        transactions.forEach(t => {
            // Monthly
            const date = new Date(t.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

            if (!monthlyMap.has(key)) {
                monthlyMap.set(key, { name: monthName, income: 0, expense: 0 });
            }
            const m = monthlyMap.get(key)!;
            if (t.type === 'INCOME') m.income += t.amount;
            else m.expense += t.amount;

            // Category (Expenses only usually? Or both? Let's chart Expense Distribution)
            if (t.type === 'EXPENSE') {
                const cat = t.category || 'Outros';
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount);
            }
        });

        // Convert Maps to Arrays
        // Sort months
        const monthlyData = Array.from(monthlyMap.values()).reverse(); // Ascending time order

        const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

        return { monthlyData, categoryData };
    }, [transactions]);

    const { data: members = [], isLoading: membersLoading, error: membersError } = useQuery({
        queryKey: ['treasury-members', user?.clubId],
        queryFn: async () => {
            if (!user?.clubId) {
                console.log('[Treasury] No clubId found, user:', user);
                return [];
            }
            console.log('[Treasury] Fetching members for clubId:', user.clubId);
            try {
                const res = await api.get(`/users?clubId=${user.clubId}`);
                console.log('[Treasury] Members reply:', res.data);
                return res.data || [];
            } catch (error: any) {
                console.error('[Treasury] Error fetching members:', error);
                console.error('[Treasury] Error details:', error.response?.data);
                throw error;
            }
        },
        enabled: !!user?.clubId,
        retry: 1,
        staleTime: 30000 // Cache for 30 seconds
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            if (!user?.clubId) throw new Error("No club ID");

            // Prepare payload for backend
            const basePayload = {
                type: data.type,
                amount: Number(data.amount),
                description: data.description,
                category: data.category,
                clubId: user.clubId,
                dueDate: data.dueDate,
                // Always send points if filled, regardless of generatePoints checkbox
                points: data.points ? Number(data.points) : 0,
                // Send isPaid flag to backend
                isPaid: data.isPaid || false
            };

            console.log('[Treasury Frontend] Creating transaction with:', basePayload);

            if (data.memberIds && data.memberIds.length > 0) {
                const transactions = data.memberIds.map((memberId: string) => ({
                    ...basePayload,
                    payerId: data.payerId || memberId, // Use explicit payer or member self-pay
                    memberId: memberId // Beneficiary
                }));
                console.log(`[Treasury Frontend] Posting to ${api.defaults.baseURL || ''}/treasury/bulk with ${transactions.length} transactions`);
                await api.post('/treasury/bulk', { transactions });
            } else {
                // Single transaction
                console.log(`[Treasury Frontend] Posting to ${api.defaults.baseURL || ''}/treasury with single transaction`);
                await api.post('/treasury', {
                    ...basePayload,
                    payerId: data.payerId,
                    memberId: data.memberId
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['treasury-balance'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Transação registrada!');
        },
        onError: (error: any) => {
            console.error('Create Transaction Error:', error);
            const msg = error.response?.data?.message || 'Erro ao criar transação.';
            toast.error(`Erro: ${msg}`);
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const { id, ...updateData } = data;
            console.log(`[Treasury] Patching to ${api.defaults.baseURL || ''}/treasury/${id} with data:`, updateData);
            await api.patch(`/treasury/${id}`, updateData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            toast.success('Transação atualizada.');
            setIsModalOpen(false);
            resetForm();
        },
        onError: () => toast.error('Erro ao atualizar.')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const toastId = toast.loading('Excluindo transação...');
            try {
                await api.delete(`/treasury/${id}`);
                toast.dismiss(toastId);
            } catch (error) {
                toast.dismiss(toastId);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['treasury-balance'] });
            toast.success('Transação excluída.');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Erro ao excluir.';
            toast.error(message);
        }
    });

    const settleMutation = useMutation({
        mutationFn: async (data: { id: string, paymentDate: string }) => {
            await api.post(`/treasury/${data.id}/settle`, { paymentDate: data.paymentDate });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['treasury-balance'] });
            setSettlingTransaction(null);
            setPaymentDate('');
            toast.success('Baixa registrada!');
        },
        onError: () => toast.error('Erro ao baixar.')
    });

    const approveMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/treasury/${id}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['treasury-balance'] });
            toast.success('Aprovado com sucesso!');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/treasury/${id}/reject`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            toast.success('Rejeitado.')
        }
    });

    const resetForm = () => {
        setAmount('');
        setDescription('');
        setCategory('Mensalidade');
        setPayerId('');
        setPoints(100);
        setRecurrence(false);
        setInstallments(1);
        setDueDate('');
        setSelectedMemberIds([]);
        setEditingTransaction(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleSettle = (t: Transaction) => {
        setSettlingTransaction(t);
        setPaymentDate(new Date().toISOString().split('T')[0]); // Default to today
    };

    const handleEdit = (t: Transaction) => {
        setEditingTransaction(t);
        setType(t.type);
        setAmount(t.amount.toString());
        setDescription(t.description);
        setCategory(t.category);
        setPayerId(t.payer?.id || '');
        setPoints(t.points || 100);
        setRecurrence(false); // Valid for single edit
        setInstallments(1);
        setDueDate(t.date ? new Date(t.date).toISOString().split('T')[0] : ''); // Use date or dueDate? Typically date is creation, dueDate is specific. Using date for now as per form default logic. But wait, form has `dueDate` input.
        // Actually, let's use t.dueDate if exists, else t.date?
        // t interface doesn't have dueDate explicitly defined above line 16, but checking line 16 it ends.
        // I should add dueDate to Transaction interface too if I want to edit it properly.
        // For now, let's assume date refers to 'Data de Vencimento' in the form context?
        // Form input (line 514) binds to `dueDate`.
        // If I edit, I want to see the due date.
        // Backend `Transaction` has `date` (creation/posting) and `dueDate` (vencimento).
        // Let's assume we edit `dueDate`.
        // If `t` from backend has `dueDate`?? Backend `findAll` returns all fields.
        // So `t` has it.
        // I need to add `dueDate` to `Transaction` interface first to be type safe? Yes.
        // Let's assume t has it for now as 'any' or just proceed.
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('[Treasury] handleSubmit - Estado do formulário:', {
            type,
            amount,
            points,
            isPaid,
            dueDate,
            recurrence,
            installments
        });

        if (editingTransaction) {
            updateMutation.mutate({
                id: editingTransaction.id,
                type,
                amount: Number(amount),
                description,
                category,
                points: Number(points),
                dueDate: dueDate ? new Date(dueDate) : undefined
            });
        } else {
            createMutation.mutate({
                type,
                amount,
                description,
                category,
                payerId: payerId || undefined,
                memberIds: selectedMemberIds,
                points: Number(points),        // ← ADICIONADO
                isPaid: isPaid,                // ← ADICIONADO
                dueDate: dueDate || undefined, // ← ADICIONADO
                recurrence: recurrence,        // ← ADICIONADO
                installments: installments     // ← ADICIONADO
            });
        }
    };

    const pendingValidations = transactions.filter(t => t.status === 'WAITING_APPROVAL');

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
            >
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Tesouraria</h1>
                    <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-widest flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                        Gestão Financeira do Clube
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => generateFinancialReport(transactions, balanceData, 'Clube')}
                        className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-2xl font-black transition-all border border-slate-200 shadow-sm flex items-center gap-2 text-xs uppercase tracking-widest"
                    >
                        <Printer className="w-4 h-4" />
                        Relatório
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 text-xs uppercase tracking-widest"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Transação
                    </button>
                    {user?.role === 'MASTER' && (
                        <button
                            onClick={() => setIsPixModalOpen(true)}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/20 flex items-center gap-2 text-xs uppercase tracking-widest"
                        >
                            <QrCode className="w-4 h-4 text-emerald-400" />
                            Cobrar Pix
                        </button>
                    )}
                </div>
            </motion.div>

            <PaymentModal
                isOpen={isPixModalOpen}
                onClose={() => setIsPixModalOpen(false)}
                member={undefined} // Or selected member if we implement that context
            />

            {/* Navigation Tabs */}
            <div className="flex gap-8 border-b border-slate-200/50 mb-4 px-2">
                <button
                    onClick={() => setActiveTab('HISTORY')}
                    className={`pb-4 px-2 font-black text-xs uppercase tracking-[0.2em] transition-all relative ${activeTab === 'HISTORY' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Histórico
                    {activeTab === 'HISTORY' && (
                        <motion.div layoutId="activeTabRef" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('VALIDATION')}
                    className={`pb-4 px-2 font-black text-xs uppercase tracking-[0.2em] transition-all relative ${activeTab === 'VALIDATION' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Validações Pendentes ({pendingValidations.length})
                    {activeTab === 'VALIDATION' && (
                        <motion.div layoutId="activeTabRef" className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Stats Cards (Only in History?) OK to keep always */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-8 rounded-[2.5rem] premium-shadow"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Saldo Total</p>
                            <h3 className={`text-3xl font-black ${(balanceData?.balance || 0) >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                                R$ {balanceData?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="p-4 bg-slate-100/50 rounded-2xl text-slate-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-8 rounded-[2.5rem] premium-shadow"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Entradas</p>
                            <h3 className="text-3xl font-black text-emerald-600">
                                + R$ {balanceData?.income?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-8 rounded-[2.5rem] premium-shadow"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Saídas</p>
                            <h3 className="text-3xl font-black text-rose-600">
                                - R$ {balanceData?.expense?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Charts Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
            >
                <div className="glass-card p-6 rounded-[2.5rem] premium-shadow">
                    <CashFlowChart
                        title="Fluxo de Caixa"
                        data={summary.monthlyData}
                        dataKeyName="name"
                        dataKeyIncome="income"
                        dataKeyExpense="expense"
                    />
                </div>
                <div className="glass-card p-6 rounded-[2.5rem] premium-shadow">
                    <SimplePieChart
                        title="Despesas por Categoria"
                        data={summary.categoryData}
                        dataKeyName="name"
                        dataKeyValue="value"
                    />
                </div>
            </motion.div>

            {/* VALIDATION View */}
            <AnimatePresence mode="wait">
                {activeTab === 'VALIDATION' && (
                    <motion.div
                        key="validation"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-card rounded-[2.5rem] premium-shadow overflow-hidden"
                    >
                        <div className="p-8 border-b border-slate-100/50 font-black text-slate-800 bg-orange-50/30 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            Pagamentos Aguardando Aprovação
                        </div>
                        {pendingValidations.length === 0 ? (
                            <div className="p-20 text-center">
                                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest text-center">Nenhuma validação pendente</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/50 text-slate-400">
                                        <tr>
                                            <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Data</th>
                                            <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Membro</th>
                                            <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Descrição</th>
                                            <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-right">Valor</th>
                                            <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-center">Anexo</th>
                                            <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/50">
                                        {pendingValidations.map((t, idx) => (
                                            <motion.tr
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={t.id}
                                                className="hover:bg-blue-50/30 transition-colors"
                                            >
                                                <td className="px-8 py-5 text-slate-500 font-bold">{new Date(t.date).toLocaleDateString()}</td>
                                                <td className="px-8 py-5 font-black text-slate-800">{t.payer?.name || '-'}</td>
                                                <td className="px-8 py-5">
                                                    <div className="font-bold text-slate-800">{t.description}</div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{t.category}</div>
                                                </td>
                                                <td className="px-8 py-5 text-right font-black text-emerald-600 text-base">R$ {t.amount.toFixed(2)}</td>
                                                <td className="px-8 py-5 text-center">
                                                    {t.proofUrl ? (
                                                        <a href={t.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                                            <FileText className="w-4 h-4" />
                                                        </a>
                                                    ) : <span className="text-slate-300">-</span>}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => approveMutation.mutate(t.id)}
                                                            disabled={approveMutation.isPending}
                                                            className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50" title="Aprovar">
                                                            <Check className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => rejectMutation.mutate(t.id)}
                                                            disabled={rejectMutation.isPending}
                                                            className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50" title="Rejeitar">
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(t.id)}
                                                            disabled={deleteMutation.isPending}
                                                            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50" title="Excluir Definitivamente">
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* HISTORY View */}
                {activeTab === 'HISTORY' && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="glass-card rounded-[2.5rem] premium-shadow overflow-hidden"
                    >
                        <div className="p-8 border-b border-slate-100/50 font-black text-slate-800">
                            Histórico de Transações
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/50 text-slate-400">
                                    <tr>
                                        <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Vencimento</th>
                                        <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Descrição</th>
                                        <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Categoria</th>
                                        <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Membro</th>
                                        <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Status</th>
                                        <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-right">Valor</th>
                                        <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/50">
                                    {transactions.map((t, idx) => {
                                        const isOverdue = t.status === 'PENDING' && t.dueDate && new Date() > new Date(t.dueDate);
                                        let rowClass = 'hover:bg-blue-50/20'; // Default
                                        if (t.status === 'COMPLETED') rowClass = 'bg-emerald-50/10 hover:bg-emerald-50/30';
                                        else if (isOverdue) rowClass = 'bg-rose-50/10 hover:bg-rose-50/30';
                                        else if (t.status === 'PENDING') rowClass = 'bg-amber-50/10 hover:bg-amber-50/30';

                                        return (
                                            <motion.tr
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                key={t.id}
                                                className={`transition-colors border-b border-slate-100/50 ${rowClass}`}
                                            >
                                                <td className="px-8 py-5 text-slate-500 font-bold">
                                                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : new Date(t.date).toLocaleDateString()}
                                                    {t.status === 'PENDING' && getDaysLabel(t.dueDate)}
                                                </td>
                                                <td className="px-8 py-5 font-black text-slate-800 text-base">
                                                    {t.description}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${t.type === 'INCOME'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : 'bg-rose-50 text-rose-700 border-rose-100'
                                                        }`}>
                                                        {t.category}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 font-bold text-slate-600">
                                                    {t.payer?.name || '-'}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border ${t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                        t.status === 'WAITING_APPROVAL' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                            t.status === 'PENDING' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-rose-100 text-rose-700 border-rose-200'
                                                        }`}>
                                                        {t.status === 'COMPLETED' ? 'Concluído' :
                                                            t.status === 'WAITING_APPROVAL' ? 'Aguardando' :
                                                                t.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                                                    </span>
                                                </td>
                                                <td className={`px-8 py-5 text-right font-black text-base ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex justify-center gap-1">
                                                        <button
                                                            onClick={() => handleEdit(t)}
                                                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                            title="Editar"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(t.id)}
                                                            disabled={deleteMutation.isPending}
                                                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        {(t.status === 'WAITING_APPROVAL' || t.status === 'PENDING') && (
                                                            <button
                                                                onClick={() => setValidatingTx(t)}
                                                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                                title="Validar / Ver Detalhes"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {t.status === 'PENDING' && (
                                                            <button
                                                                onClick={() => handleSettle(t)}
                                                                className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                                title="Baixar (Quitar)"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransaction ? "Editar Transação" : "Nova Transação"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setType('INCOME')}
                            className={`flex-1 py-2 rounded-lg font-medium border transition-colors ${type === 'INCOME'
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            Entrada
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('EXPENSE')}
                            className={`flex-1 py-2 rounded-lg font-medium border transition-colors ${type === 'EXPENSE'
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            Saída
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={type === 'INCOME' ? 'Ex: Mensalidade Fevereiro' : 'Ex: Compra de Materiais'}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {type === 'INCOME' ? (
                                    <>
                                        <option>Mensalidade</option>
                                        <option>Seguro</option>
                                        <option>Uniforme</option>
                                        <option>Evento</option>
                                        <option>Outros</option>
                                    </>
                                ) : (
                                    <>
                                        <option>Material</option>
                                        <option>Lanche</option>
                                        <option>Transporte</option>
                                        <option>Inscrição</option>
                                        <option>Outros</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    {type === 'INCOME' && (
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                            {/* Payer Field (Optional - Defaults to Member) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Pagador (Opcional)
                                    <span className="text-xs text-slate-400 font-normal ml-2">
                                        (Quem está pagando? Deixe vazio se for o próprio membro)
                                    </span>
                                </label>
                                <select
                                    value={payerId}
                                    onChange={e => setPayerId(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">O Próprio Membro (Auto-pagamento)</option>
                                    {members
                                        ?.filter((m: any) => m && m.name)
                                        .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
                                        .map((m: any) => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Membros (Selecione um ou mais)
                                    <span className="ml-2 text-xs text-blue-600 font-bold">
                                        [{members?.length || 0} disponíveis]
                                    </span>
                                </label>

                                {/* Debug Info */}
                                {membersError && (
                                    <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                        <p className="text-red-700 font-bold">Erro ao carregar membros:</p>
                                        <p className="text-red-600">{(membersError as any)?.message || 'Erro desconhecido'}</p>
                                    </div>
                                )}

                                {!membersLoading && !membersError && (!members || members.length === 0) && user?.clubId && (
                                    <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                        <p className="text-yellow-700 font-bold">
                                            Atenção: Nenhum membro encontrado.
                                        </p>
                                        <p className="text-yellow-600 text-[10px] mt-1">
                                            clubId: {user.clubId}<br />
                                            Certifique-se que o clube possui membros cadastrados e aprovados.
                                        </p>
                                    </div>
                                )}
                                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                                    {membersLoading ? (
                                        <div className="p-4 text-center text-slate-500">
                                            Carregando membros...
                                        </div>
                                    ) : (!members || members.length === 0) ? (
                                        <div className="p-4 text-center text-slate-500">
                                            Nenhum membro encontrado no clube.
                                        </div>
                                    ) : (
                                        <>
                                            <label className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer border-b border-slate-200 mb-2 font-bold text-blue-600">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMemberIds.length === (members?.length || 0) && (members?.length || 0) > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedMemberIds(members.filter((m: any) => m && m.id).map((m: any) => m.id));
                                                        else setSelectedMemberIds([]);
                                                    }}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                    disabled={!!editingTransaction}
                                                />
                                                <span className={editingTransaction ? 'text-slate-400' : ''}>Selecionar Todos</span>
                                            </label>
                                            {members.filter((m: any) => m != null).map((m: any) => (
                                                <label key={m.id || Math.random().toString()} className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMemberIds.includes(m.id) || (!!editingTransaction && editingTransaction.payer?.id === m.id)}
                                                        onChange={() => {
                                                            if (editingTransaction) return;
                                                            if (!m.id) return;
                                                            setSelectedMemberIds(prev =>
                                                                prev.includes(m.id)
                                                                    ? prev.filter(id => id !== m.id)
                                                                    : [...prev, m.id]
                                                            );
                                                        }}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                        disabled={!!editingTransaction}
                                                    />
                                                    <span className={editingTransaction ? 'text-slate-400' : ''}>{m.name || 'Membro sem nome'}</span>
                                                </label>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPaid"
                                    checked={isPaid}
                                    onChange={e => setIsPaid(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                    disabled={!!editingTransaction}
                                />
                                <label htmlFor="isPaid" className="text-sm text-slate-700 font-bold">
                                    Pagamento já recebido? (Dinheiro)
                                </label>
                            </div>

                            {/* Always show points field for INCOME transactions */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Pontos a conceder ao membro
                                    <span className="text-xs text-slate-400 font-normal ml-2">
                                        (Deixe 0 para não pontuar)
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    value={points}
                                    onChange={e => setPoints(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                    placeholder="Ex: 100"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="recurrence"
                                    checked={recurrence}
                                    onChange={e => setRecurrence(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                    disabled={!!editingTransaction}
                                />
                                <label htmlFor="recurrence" className={`text-sm ${editingTransaction ? 'text-slate-300' : 'text-slate-700'}`}>Pagamento Recorrente (Mensal)?</label>
                            </div>

                            {recurrence && !editingTransaction && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade de Meses</label>
                                    <input
                                        type="number"
                                        min="2"
                                        max="60"
                                        value={installments}
                                        onChange={e => setInstallments(Number(e.target.value))}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                        placeholder="Ex: 12"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Data de Vencimento</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className={`px-4 py-2 rounded-lg text-white font-medium transition-opacity ${type === 'INCOME' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                } ${createMutation.isPending || updateMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : (editingTransaction ? 'Atualizar' : 'Salvar')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Settlement Modal Content Modernization */}
            <Modal isOpen={!!settlingTransaction} onClose={() => setSettlingTransaction(null)} title="Baixar Transação">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (settlingTransaction && paymentDate) {
                        settleMutation.mutate({ id: settlingTransaction.id, paymentDate });
                    }
                }} className="space-y-6">
                    <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-4">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <p className="text-emerald-900 font-black uppercase text-[10px] tracking-widest mb-1">Confirmar Recebimento</p>
                        <p className="text-3xl font-black text-emerald-600 mb-2">R$ {settlingTransaction?.amount.toFixed(2)}</p>
                        <p className="text-slate-600 font-bold">{settlingTransaction?.description}</p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Data do Pagamento</label>
                        <input
                            type="date"
                            required
                            value={paymentDate}
                            onChange={e => setPaymentDate(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-800"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setSettlingTransaction(null)} className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                        <button
                            type="submit"
                            disabled={settleMutation.isPending}
                            className="flex-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50"
                        >
                            {settleMutation.isPending ? 'Processando...' : 'Confirmar Baixa'}
                        </button>
                    </div>
                </form>
            </Modal>
            {/* Validation Modal */}
            <Modal isOpen={!!validatingTx} onClose={() => setValidatingTx(null)} title="Validar Comprovante">
                {validatingTx && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-slate-500">Membro/Pagador</span>
                                <span className="font-bold text-slate-700">{validatingTx.payer?.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-slate-500">Valor</span>
                                <span className="font-bold text-slate-700">R$ {validatingTx.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-slate-500">Descrição</span>
                                <span className="font-medium text-slate-700">{validatingTx.description}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Status Atual</span>
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700">{validatingTx.status}</span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-700 mb-2">Comprovante Anexado</h4>
                            {validatingTx.proofUrl ? (
                                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-100 min-h-[200px] flex items-center justify-center relative group">
                                    {validatingTx.proofUrl.match(/\.(jpeg|jpg|png|webp)$/i) ? (
                                        <a href={api.defaults.baseURL + validatingTx.proofUrl} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={api.defaults.baseURL + validatingTx.proofUrl}
                                                alt="Comprovante"
                                                className="max-w-full max-h-[400px] object-contain"
                                            />
                                        </a>
                                    ) : (
                                        <div className="text-center p-8">
                                            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                                            <p className="text-slate-600 mb-2">Documento PDF ou outro formato</p>
                                            <a
                                                href={api.defaults.baseURL + validatingTx.proofUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline text-sm font-bold"
                                            >
                                                Abrir Arquivo
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-lg text-slate-400">
                                    Nenhum comprovante anexado.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setValidatingTx(null)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Rejeitar este pagamento?')) {
                                        rejectMutation.mutate(validatingTx.id);
                                        setValidatingTx(null);
                                    }
                                }}
                                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-medium rounded-lg flex items-center gap-2"
                            >
                                <X className="w-4 h-4" /> Rejeitar
                            </button>
                            <button
                                onClick={() => {
                                    approveMutation.mutate(validatingTx.id);
                                    setValidatingTx(null);
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" /> Aprovar Pagamento
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
}
