import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { UserPlus, BookOpen, Award, Search } from 'lucide-react';
import { AssignRequirementModal } from '../components/AssignRequirementModal';
import { AssignSpecialtyModal } from '../components/AssignSpecialtyModal';
import { useAuth } from '../contexts/AuthContext';
import { RequirementStats } from '../components/RequirementStats';

interface Requirement {
    id: string;
    description: string;
    code?: string;
    dbvClass?: string;
    area?: string;
}

interface Specialty {
    id: string;
    name: string;
    area: string;
    requirements: any[];
}

const DBV_CLASSES = [
    'AMIGO', 'COMPANHEIRO', 'PESQUISADOR',
    'PIONEIRO', 'EXCURSIONISTA', 'GUIA'
];

const SPECIALTY_AREAS = [
    'Todas as Áreas',
    'ADRA',
    'Artes e Habilidades Manuais',
    'Atividades Agrícolas',
    'Atividades Missionárias e Comunitárias',
    'Atividades Profissionais',
    'Atividades Recreativas',
    'Ciência e Saúde',
    'Estudos da Natureza',
    'Habilidades Domésticas',
    'Mestrados'
];

export function Assignments() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'requirements' | 'specialties'>('requirements');
    const [search, setSearch] = useState('');
    const [selectedClass, setSelectedClass] = useState('AMIGO');
    const [selectedSpecialtyArea, setSelectedSpecialtyArea] = useState('Todas as Áreas');

    // Modals
    const [isAssignReqModalOpen, setIsAssignReqModalOpen] = useState(false);
    const [isAssignSpecModalOpen, setIsAssignSpecModalOpen] = useState(false);
    const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
    const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);

    // Fetch Requirements
    const { data: requirements = [], isLoading: loadingReqs } = useQuery<Requirement[]>({
        queryKey: ['requirements', selectedClass, search],
        queryFn: async () => {
            const res = await api.get('/requirements');
            let filtered = res.data.filter((r: Requirement) => r.dbvClass === selectedClass);

            if (search) {
                filtered = filtered.filter((r: Requirement) =>
                    r.description.toLowerCase().includes(search.toLowerCase()) ||
                    r.code?.toLowerCase().includes(search.toLowerCase())
                );
            }

            return filtered;
        },
        enabled: activeTab === 'requirements'
    });

    // Fetch Specialties
    const { data: specialties = [], isLoading: loadingSpecs } = useQuery({
        queryKey: ['specialties', selectedSpecialtyArea, search],
        queryFn: async () => {
            const res = await api.get('/specialties');
            let filtered = res.data;

            if (selectedSpecialtyArea !== 'Todas as Áreas') {
                filtered = filtered.filter((s: any) => s.area === selectedSpecialtyArea);
            }

            if (search) {
                filtered = filtered.filter((s: any) =>
                    s.name.toLowerCase().includes(search.toLowerCase())
                );
            }

            return filtered;
        },
        enabled: activeTab === 'specialties'
    });

    const isLoading = activeTab === 'requirements' ? loadingReqs : loadingSpecs;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <UserPlus className="w-7 h-7 text-green-600" />
                        Atribuições
                    </h1>
                    <p className="text-slate-500 mt-1">Atribua requisitos e especialidades aos membros do clube</p>
                </div>

                {/* Dicas Contextuais */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg max-w-md">
                    <h3 className="font-bold text-blue-900 text-sm mb-2">💡 Dicas Rápidas</h3>
                    <ul className="text-xs text-blue-800 space-y-1">
                        <li>✓ Aqui você atribui requisitos e especialidades aos membros</li>
                        <li>✓ Use os filtros para encontrar rapidamente o que precisa</li>
                        <li>✓ Clique no ícone <UserPlus className="w-3 h-3 inline" /> para atribuir a múltiplos membros</li>
                        <li>✓ Veja as estatísticas de progresso ao lado de cada item</li>
                    </ul>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex gap-1">
                <button
                    onClick={() => setActiveTab('requirements')}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'requirements'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Requisitos
                </button>
                <button
                    onClick={() => setActiveTab('specialties')}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'specialties'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <Award className="w-4 h-4 inline mr-2" />
                    Especialidades
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-wrap gap-4 items-center">
                    {activeTab === 'requirements' && (
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-medium text-slate-700"
                        >
                            {DBV_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}

                    <div className="flex-1 relative min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={activeTab === 'requirements' ? 'Buscar requisito...' : 'Buscar especialidade...'}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                    </div>
                </div>

                {activeTab === 'specialties' && (
                    <div className="flex flex-wrap gap-2">
                        {SPECIALTY_AREAS.map(area => (
                            <button
                                key={area}
                                onClick={() => setSelectedSpecialtyArea(area)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedSpecialtyArea === area
                                    ? 'bg-green-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {area}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : activeTab === 'requirements' ? (
                    requirements.length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-500">Nenhum requisito encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {requirements.map(req => (
                                <div
                                    key={req.id}
                                    className="group bg-white p-4 rounded-lg border border-slate-200 hover:border-green-300 hover:shadow-md transition-all flex items-start gap-4"
                                >
                                    <div className="mt-1 shrink-0">
                                        {req.code ? (
                                            <span className="font-mono font-bold text-xs bg-slate-800 text-white px-2 py-1 rounded">
                                                {req.code}
                                            </span>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-800 font-medium leading-relaxed">{req.description}</p>
                                        {req.area && (
                                            <span className="inline-block mt-2 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                {req.area}
                                            </span>
                                        )}
                                    </div>

                                    {/* Estatísticas */}
                                    <RequirementStats requirementId={req.id} />

                                    <button
                                        onClick={() => {
                                            setSelectedRequirement(req);
                                            setIsAssignReqModalOpen(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Atribuir a Membros"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    specialties.length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-500">Nenhuma especialidade encontrada.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {specialties.map((spec: any) => (
                                <div
                                    key={spec.id}
                                    className="group bg-white p-4 rounded-lg border border-slate-200 hover:border-green-300 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800 mb-1">{spec.name}</h4>
                                            <p className="text-xs text-slate-500">{spec.area}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedSpecialty(spec);
                                                setIsAssignSpecModalOpen(true);
                                            }}
                                            className="p-1.5 hover:bg-green-50 rounded text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Atribuir Especialidade"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Modals */}
            <AssignRequirementModal
                isOpen={isAssignReqModalOpen}
                onClose={() => setIsAssignReqModalOpen(false)}
                requirement={selectedRequirement}
                clubId={user?.clubId}
            />

            <AssignSpecialtyModal
                isOpen={isAssignSpecModalOpen}
                onClose={() => setIsAssignSpecModalOpen(false)}
                specialty={selectedSpecialty}
                clubId={user?.clubId}
            />
        </div>
    );
}
