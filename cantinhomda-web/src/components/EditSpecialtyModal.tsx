import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { showToast } from '../lib/toast';

interface Requirement {
    id?: string;
    description: string;
    type: 'TEXT' | 'FILE';
}

interface Specialty {
    id: string;
    name: string;
    area: string;
    requirements: Requirement[];
}

interface EditSpecialtyModalProps {
    isOpen: boolean;
    onClose: () => void;
    specialty: Specialty | null;
}

export function EditSpecialtyModal({ isOpen, onClose, specialty }: EditSpecialtyModalProps) {
    const [requirements, setRequirements] = useState<Requirement[]>([]);

    const queryClient = useQueryClient();

    useEffect(() => {
        if (specialty) {
            setRequirements(specialty.requirements || []);
        }
    }, [specialty]);

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; requirements: Requirement[] }) => {
            return api.patch(`/specialties/${data.id}`, {
                requirements: data.requirements
            });
        },
        onSuccess: () => {
            showToast.success('Especialidade atualizada com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['specialties'] });
            onClose();
        },
        onError: (error: any) => {
            showToast.error('Erro ao salvar: ' + (error.response?.data?.message || 'Erro desconhecido'));
        }
    });

    const handleAddRequirement = () => {
        setRequirements([...requirements, { description: '', type: 'TEXT' }]);
    };

    const handleRemoveRequirement = (index: number) => {
        setRequirements(requirements.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof Requirement, value: string) => {
        const newReqs = [...requirements];
        newReqs[index] = { ...newReqs[index], [field]: value };
        setRequirements(newReqs);
    };

    const handleSave = () => {
        if (!specialty) return;

        // Validate
        if (requirements.some(r => !r.description.trim())) {
            showToast.error('Todos os requisitos devem ter uma descrição.');
            return;
        }

        updateMutation.mutate({
            id: specialty.id,
            requirements
        });
    };

    if (!isOpen || !specialty) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto w-full max-w-3xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                        <div>
                            <Dialog.Title className="text-xl font-bold text-slate-800">
                                Editar Especialidade
                            </Dialog.Title>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-medium text-slate-700">{specialty.name}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-sm text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                                    {specialty.area}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-slate-700">Requisitos ({requirements.length})</h3>
                            <button
                                onClick={handleAddRequirement}
                                className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar Requisito
                            </button>
                        </div>

                        <div className="space-y-3">
                            {requirements.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                                    <p className="text-slate-500">Nenhum requisito cadastrado.</p>
                                    <button
                                        onClick={handleAddRequirement}
                                        className="mt-2 text-blue-600 font-medium hover:underline"
                                    >
                                        Adicionar o primeiro
                                    </button>
                                </div>
                            ) : (
                                requirements.map((req, index) => (
                                    <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start group">
                                        <div className="mt-3 text-slate-300 cursor-move">
                                            <GripVertical className="w-5 h-5" />
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                                                    Descrição
                                                </label>
                                                <textarea
                                                    value={req.description}
                                                    onChange={e => handleChange(index, 'description', e.target.value)}
                                                    placeholder="Descreva o requisito..."
                                                    className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] text-sm resize-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                                                    Tipo de Resposta
                                                </label>
                                                <select
                                                    value={req.type}
                                                    onChange={e => handleChange(index, 'type', e.target.value as any)}
                                                    className="p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full md:w-48"
                                                >
                                                    <option value="TEXT">Texto</option>
                                                    <option value="FILE">Arquivo / Foto</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleRemoveRequirement(index)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
                                            title="Remover requisito"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
