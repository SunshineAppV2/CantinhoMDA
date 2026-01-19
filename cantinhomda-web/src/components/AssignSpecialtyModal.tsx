import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Search, Users, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { showToast } from '../lib/toast';

interface User {
    id: string;
    name: string;
    photoUrl?: string;
    dbvClass: string;
    unitId?: string;
    unit?: { name: string };
    clubId: string;
}

interface AssignSpecialtyModalProps {
    isOpen: boolean;
    onClose: () => void;
    specialty: { id: string; name: string } | null;
    clubId?: string;
}

const DBV_CLASSES = [
    'AMIGO', 'COMPANHEIRO', 'PESQUISADOR',
    'PIONEIRO', 'EXCURSIONISTA', 'GUIA',
    'LIDER', 'LIDER_MASTER', 'LIDER_MASTER_AVANCADO'
];

export function AssignSpecialtyModal({ isOpen, onClose, specialty, clubId }: AssignSpecialtyModalProps) {
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUnit, setFilterUnit] = useState('');
    const [filterClass, setFilterClass] = useState('');

    const queryClient = useQueryClient();

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedMemberIds([]);
            setSearchTerm('');
        }
    }, [isOpen]);

    // Fetch members
    const { data: members = [], isLoading } = useQuery<User[]>({
        queryKey: ['club-members', clubId],
        queryFn: async () => {
            const res = await api.get('/users', {
                params: { clubId }
            });
            // Filter out those who aren't active members if needed, 
            // but usually we want to see everyone.
            return res.data;
        },
        enabled: isOpen && !!clubId
    });

    // Fetch units for filter
    const { data: units = [] } = useQuery({
        queryKey: ['units', clubId],
        queryFn: async () => {
            const res = await api.get('/units', { params: { clubId } });
            return res.data;
        },
        enabled: isOpen && !!clubId
    });

    const assignMutation = useMutation({
        mutationFn: async (data: { specialtyId: string; userIds: string[] }) => {
            if (!data.specialtyId) throw new Error("Especialidade inválida");
            return api.post(`/specialties/${data.specialtyId}/assign`, {
                userIds: data.userIds
            });
        },
        onSuccess: (data: any) => {
            const count = data.data?.success || selectedMemberIds.length;
            showToast.success(`${count} membro(s) atribuído(s) com sucesso!`);
            queryClient.invalidateQueries({ queryKey: ['specialties'] });
            onClose();
        },
        onError: (error: any) => {
            showToast.error('Erro ao atribuir: ' + (error.response?.data?.message || 'Erro desconhecido'));
        }
    });

    // Filter members
    const filteredMembers = members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUnit = filterUnit ? member.unitId === filterUnit : true;
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

    const handleAssign = () => {
        if (!specialty) return;
        assignMutation.mutate({
            specialtyId: specialty.id,
            userIds: selectedMemberIds
        });
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto w-full max-w-2xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                        <div>
                            <Dialog.Title className="text-xl font-bold text-slate-800">
                                Atribuir Especialidade
                            </Dialog.Title>
                            <p className="text-sm text-slate-500 mt-1">
                                {specialty?.name}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Filters & Actions */}
                    <div className="p-4 border-b border-slate-100 space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar membro..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <select
                                value={filterUnit}
                                onChange={e => setFilterUnit(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Todas as Unidades</option>
                                {units.map((u: any) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            <select
                                value={filterClass}
                                onChange={e => setFilterClass(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Todas as Classes</option>
                                {DBV_CLASSES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-between items-center">
                            <button
                                onClick={handleSelectAll}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                {selectedMemberIds.length === filteredMembers.length && filteredMembers.length > 0
                                    ? 'Desmarcar Todos'
                                    : 'Marcar Todos'}
                            </button>
                            <span className="text-sm text-slate-500">
                                {selectedMemberIds.length} selecionado(s)
                            </span>
                        </div>
                    </div>

                    {/* Member List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                Nenhum membro encontrado.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filteredMembers.map(member => (
                                    <label
                                        key={member.id}
                                        className={`
                                            flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                            ${selectedMemberIds.includes(member.id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors
                                            ${selectedMemberIds.includes(member.id)
                                                ? 'bg-blue-500 border-blue-500'
                                                : 'border-slate-300 bg-white'
                                            }
                                        `}>
                                            {selectedMemberIds.includes(member.id) && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={selectedMemberIds.includes(member.id)}
                                            onChange={() => {
                                                if (selectedMemberIds.includes(member.id)) {
                                                    setSelectedMemberIds(prev => prev.filter(id => id !== member.id));
                                                } else {
                                                    setSelectedMemberIds(prev => [...prev, member.id]);
                                                }
                                            }}
                                        />
                                        <div>
                                            <p className={`font-semibold text-sm ${selectedMemberIds.includes(member.id) ? 'text-blue-900' : 'text-slate-700'}`}>
                                                {member.name}
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                <span>{member.dbvClass}</span>
                                                {member.unit && (
                                                    <>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                        <span>{member.unit.name}</span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={selectedMemberIds.length === 0 || assignMutation.isPending}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        >
                            {assignMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Atribuindo...
                                </>
                            ) : (
                                <>
                                    <Users className="w-4 h-4" />
                                    Atribuir a {selectedMemberIds.length} membro(s)
                                </>
                            )}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
