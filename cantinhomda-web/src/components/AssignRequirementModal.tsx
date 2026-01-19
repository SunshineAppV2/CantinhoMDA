import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Search, UserPlus, Users, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { showToast } from '../lib/toast';

interface User {
    id: string;
    name: string;
    photoUrl?: string;
    dbvClass: string;
    unit?: {
        id: string;
        name: string;
    };
    role: string;
    hasRequirement?: boolean; // Indica se já tem o requisito atribuído
}

interface Requirement {
    id: string;
    code?: string;
    description: string;
    area?: string;
    dbvClass?: string;
}

interface AssignRequirementModalProps {
    isOpen: boolean;
    onClose: () => void;
    requirement: Requirement | null;
    clubId?: string;
}

export function AssignRequirementModal({ isOpen, onClose, requirement, clubId }: AssignRequirementModalProps) {
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [filterUnit, setFilterUnit] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const queryClient = useQueryClient();

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedMemberIds([]);
            setSearch('');
            setFilterUnit('');
            // Pre-select class if requirement has one
            if (requirement?.dbvClass && requirement.dbvClass !== 'AMIGO') {
                setFilterClass(requirement.dbvClass);
            } else {
                setFilterClass('');
            }
        }
    }, [isOpen, requirement]);

    // Fetch Members with requirement status
    const { data: members = [], isLoading } = useQuery<User[]>({
        queryKey: ['club-members-assign', clubId, requirement?.id],
        queryFn: async () => {
            const params: any = { clubId };
            const res = await api.get('/users', { params });
            const activeMembers = res.data.filter((u: any) => u.isActive);

            // Fetch which members already have this requirement
            if (requirement?.id) {
                try {
                    const reqRes = await api.get(`/requirements/${requirement.id}/assigned-users`);
                    const assignedUserIds = new Set(reqRes.data.map((u: any) => u.userId));

                    // Mark members who already have the requirement
                    return activeMembers.map((m: any) => ({
                        ...m,
                        hasRequirement: assignedUserIds.has(m.id)
                    }));
                } catch (error) {
                    console.error('Error fetching assigned users:', error);
                    return activeMembers;
                }
            }

            return activeMembers;
        },
        enabled: isOpen && !!requirement
    });

    // Fetch Units for filter
    const { data: units = [] } = useQuery({
        queryKey: ['club-units', clubId],
        queryFn: async () => {
            const res = await api.get('/units', { params: { clubId } });
            return res.data;
        },
        enabled: isOpen
    });

    // Mutation
    const assignMutation = useMutation({
        mutationFn: async (userIds: string[]) => {
            if (!requirement) return;
            return api.post(`/requirements/${requirement.id}/assign`, { userIds });
        },
        onSuccess: (data: any) => {
            const count = data.data?.count || selectedMemberIds.length;
            showToast.success(`${count} membro(s) atribuído(s) com sucesso!`);
            queryClient.invalidateQueries({ queryKey: ['requirements'] }); // Refresh if needed
            onClose();
        },
        onError: (error: any) => {
            showToast.error('Erro ao atribuir: ' + (error.response?.data?.message || 'Erro desconhecido'));
        }
    });

    // Filtering logic
    const filteredMembers = members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase());
        const matchesUnit = filterUnit ? member.unit?.id === filterUnit : true;
        const matchesClass = filterClass ? member.dbvClass === filterClass : true;
        return matchesSearch && matchesUnit && matchesClass;
    });

    const handleSelectAll = () => {
        if (selectedMemberIds.length === filteredMembers.length) {
            setSelectedMemberIds([]);
        } else {
            setSelectedMemberIds(filteredMembers.map(m => m.id));
        }
    };

    const toggleSelection = (userId: string) => {
        if (selectedMemberIds.includes(userId)) {
            setSelectedMemberIds(prev => prev.filter(id => id !== userId));
        } else {
            setSelectedMemberIds(prev => [...prev, userId]);
        }
    };

    if (!isOpen || !requirement) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto w-full max-w-4xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">

                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-2xl">
                        <div>
                            <Dialog.Title className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <UserPlus className="w-6 h-6 text-green-600" />
                                Atribuir Requisito
                            </Dialog.Title>
                            <div className="mt-2 text-sm text-slate-600">
                                <p className="font-medium text-slate-800 mb-1">{requirement.area} • {requirement.code}</p>
                                <p className="line-clamp-2">{requirement.description}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-white rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Filters & Actions */}
                    <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-4 relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar membro..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                            />
                        </div>

                        <div className="md:col-span-3">
                            <select
                                value={filterUnit}
                                onChange={e => setFilterUnit(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-slate-600"
                            >
                                <option value="">Todas as Unidades</option>
                                {units.map((u: any) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-3">
                            <select
                                value={filterClass}
                                onChange={e => setFilterClass(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-slate-600"
                            >
                                <option value="">Todas as Classes</option>
                                {['AMIGO', 'COMPANHEIRO', 'PESQUISADOR', 'PIONEIRO', 'EXCURSIONISTA', 'GUIA'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 text-right">
                            <button
                                onClick={handleSelectAll}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                {selectedMemberIds.length === filteredMembers.length && filteredMembers.length > 0 ? 'Desmarcar Todos' : 'Marcar Todos'}
                            </button>
                        </div>
                    </div>

                    {/* Member Grid */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Nenhum membro encontrado com os filtros atuais.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredMembers.map(member => {
                                    const isSelected = selectedMemberIds.includes(member.id);
                                    return (
                                        <div
                                            key={member.id}
                                            onClick={() => toggleSelection(member.id)}
                                            className={`
                                                relative p-4 rounded-xl border cursor-pointer transition-all select-none group
                                                ${member.hasRequirement
                                                    ? 'bg-blue-50 border-blue-300'
                                                    : isSelected
                                                        ? 'bg-green-50 border-green-500 shadow-sm'
                                                        : 'bg-white border-slate-200 hover:border-green-300 hover:shadow-md'}
                                            `}
                                        >
                                            {/* Badge "JÁ ATRIBUÍDO" */}
                                            {member.hasRequirement && (
                                                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                    JÁ ATRIBUÍDO
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    {member.photoUrl ? (
                                                        <img src={member.photoUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${member.hasRequirement
                                                                ? 'bg-blue-200 text-blue-700'
                                                                : isSelected
                                                                    ? 'bg-green-200 text-green-700'
                                                                    : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                            {member.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    {isSelected && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`font-medium truncate ${member.hasRequirement
                                                            ? 'text-blue-900'
                                                            : isSelected
                                                                ? 'text-green-900'
                                                                : 'text-slate-800'
                                                        }`}>
                                                        {member.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                                                            {member.dbvClass}
                                                        </span>
                                                        {member.unit && (
                                                            <span>• {member.unit.name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl flex justify-between items-center">
                        <div className="text-sm text-slate-500">
                            <strong>{selectedMemberIds.length}</strong> membro(s) selecionado(s)
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => assignMutation.mutate(selectedMemberIds)}
                                disabled={selectedMemberIds.length === 0 || assignMutation.isPending}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {assignMutation.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Atribuindo...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Atribuir Selecionados
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
