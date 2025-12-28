import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import {
    ChevronDown, ChevronUp, Eye, EyeOff, Search,
    ShieldCheck, DollarSign, ShoppingBag, Settings, HelpCircle,
    UserCircle, Building2, BarChart
} from 'lucide-react';
import { Modal } from './Modal';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    isVisible: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
    'GESTÃO MASTER': ShieldCheck,
    'MEU ACESSO': UserCircle,
    'GESTÃO DO CLUBE': Building2,
    'ACOMPANHAMENTO': BarChart,
    'FINANCEIRO': DollarSign,
    'LOJA VIRTUAL': ShoppingBag,
    'GERAL': Settings,
};

export function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isAdmin = ['OWNER', 'ADMIN', 'MASTER'].includes(user?.role || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [openItems, setOpenItems] = useState<string[]>([]);

    const { data: faqs = [], isLoading } = useQuery<FAQ[]>({
        queryKey: ['faqs', isAdmin],
        queryFn: async () => {
            const params = isAdmin ? '?all=true' : '';
            const response = await api.get(`/faqs${params}`);
            return response.data;
        },
        enabled: isOpen
    });

    const toggleMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.patch(`/ faqs / ${id}/toggle`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
        }
    });

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedFaqs = filteredFaqs.reduce((groups: any, faq) => {
        const cat = faq.category || 'GERAL';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(faq);
        return groups;
    }, {});

    const toggleItem = (id: string) => {
        setOpenItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Central de Ajuda (FAQ)">
            <div className="space-y-4 max-h-[75vh] flex flex-col">
                {/* Search Bar */}
                <div className="relative sticky top-0 bg-white pb-2 z-10">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar ajuda (ex: pontos, PIX, perfil...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                    />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-sm">Carregando guias do sistema...</p>
                        </div>
                    )}

                    {!isLoading && filteredFaqs.length === 0 && (
                        <div className="text-center py-12">
                            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">Nenhum passo a passo encontrado para "{searchTerm}"</p>
                        </div>
                    )}

                    {Object.keys(groupedFaqs).map(category => {
                        const Icon = CATEGORY_ICONS[category] || HelpCircle;
                        return (
                            <div key={category} className="mb-6">
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        {category}
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {groupedFaqs[category].map((faq: FAQ) => (
                                        <div
                                            key={faq.id}
                                            className={`border rounded-xl transition-all duration-200 ${openItems.includes(faq.id)
                                                ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                                                : 'bg-white border-slate-100 hover:border-slate-200'
                                                }`}
                                        >
                                            <button
                                                onClick={() => toggleItem(faq.id)}
                                                className="w-full flex items-center justify-between p-4 text-left"
                                            >
                                                <span className={`text-sm font-semibold leading-tight ${openItems.includes(faq.id) ? 'text-blue-700' : 'text-slate-700'
                                                    } ${!faq.isVisible ? 'opacity-40 italic' : ''}`}>
                                                    {faq.question}
                                                </span>
                                                <div className="flex items-center gap-3 ml-4">
                                                    {isAdmin && (
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleMutation.mutate(faq.id);
                                                            }}
                                                            className={`p-1.5 rounded-lg hover:bg-white/80 transition-colors ${faq.isVisible ? 'text-emerald-500' : 'text-slate-300'
                                                                }`}
                                                            title={faq.isVisible ? 'Visível para membros' : 'Oculto para membros'}
                                                        >
                                                            {faq.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                        </div>
                                                    )}
                                                    {openItems.includes(faq.id)
                                                        ? <ChevronUp className="w-4 h-4 text-blue-400" />
                                                        : <ChevronDown className="w-4 h-4 text-slate-300" />
                                                    }
                                                </div>
                                            </button>

                                            {openItems.includes(faq.id) && (
                                                <div className="px-4 pb-4 pt-1">
                                                    <div className="h-px bg-blue-100 mb-3 opacity-50" />
                                                    <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-white/50 p-3 rounded-lg border border-blue-50/50">
                                                        {faq.answer}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="pt-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 italic">
                        Não encontrou o que precisava? Fale com a diretoria do clube ou o suporte Master.
                    </p>
                </div>
            </div>
        </Modal>
    );
}
