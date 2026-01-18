import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';
// Firestore removed - using API instead
import { api } from '../lib/axios';
import { ShoppingBag, Plus, Tag, Coins, PackageCheck, AlertCircle, Edit, Trash2, Search, Filter, History, Trash, Check, X, CheckSquare, Clock, ArrowRight } from 'lucide-react';
import { Modal } from '../components/Modal';
import { toast } from 'sonner';
import { ROLE_TRANSLATIONS } from './members/types';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    imageUrl?: string;
}

interface Purchase {
    id: string;
    product: Product;
    points_at_purchase: number; // Changed from 'cost'
    status: string;
    created_at: string; // Changed from 'createdAt'
    user?: { name: string; role: string }; // For Admin view
}

export function Store() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'store' | 'inventory' | 'admin'>('store');
    const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Create/Edit Form State
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('-1');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('REAL');
    const [imageUrl, setImageUrl] = useState('');

    const isAdmin = ['OWNER', 'ADMIN', 'DIRECTOR'].includes(user?.role || '');

    // Fetch fresh user data to ensure points are up-to-date
    const { data: currentUser, isLoading: isLoadingUser } = useQuery({
        queryKey: ['user-profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const res = await api.get(`/users/${user.id}`);
            return res.data;
        },
        enabled: !!user?.id,
        staleTime: 0,
        refetchOnWindowFocus: true
    });

    const { data: products = [] } = useQuery<Product[]>({
        queryKey: ['products', user?.clubId],
        queryFn: async () => {
            if (!user?.clubId) return [];
            const res = await api.get('/store/products');
            return res.data;
        },
        enabled: !!user?.clubId
    });

    const { data: myPurchases = [] } = useQuery<Purchase[]>({
        queryKey: ['my-purchases', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const res = await api.get('/store/inventory');
            return res.data;
        },
        enabled: !!user?.id,
        retry: false
    });

    const { data: clubPurchases = [] } = useQuery<Purchase[]>({
        queryKey: ['club-purchases', user?.clubId],
        queryFn: async () => {
            if (!user?.clubId) return [];
            const res = await api.get('/store/admin/purchases');
            return res.data;
        },
        enabled: activeTab === 'admin' && isAdmin
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/store/products', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsCreateModalOpen(false);
            resetForm();
            toast.success('Produto criado com sucesso!');
        },
        onError: (error: any) => {
            toast.error('Erro ao criar produto: ' + (error.response?.data?.message || error.message));
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.patch(`/store/products/${data.id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsCreateModalOpen(false);
            setEditingProduct(null);
            resetForm();
            toast.success('Produto atualizado com sucesso!');
        },
        onError: (error: any) => {
            toast.error('Erro ao atualizar produto: ' + (error.response?.data?.message || error.message));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (productId: string) => {
            await api.delete(`/store/products/${productId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Produto excluído com sucesso!');
        },
        onError: (error: any) => {
            toast.error('Erro ao excluir produto: ' + (error.response?.data?.message || error.message));
        }
    });

    const buyMutation = useMutation({
        mutationFn: async (productId: string) => {
            await api.post(`/store/buy/${productId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            toast.success('Compra realizada com sucesso!');
        },
        onError: (error: any) => {
            console.error('Buy error:', error);
            const msg = error.response?.data?.message || error.message || 'Falha desconhecida.';
            toast.error(`Erro na compra: ${msg}`);
        }
    });

    const deliverMutation = useMutation({
        mutationFn: async (purchaseId: string) => {
            await api.post(`/store/admin/deliver/${purchaseId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-purchases'] });
            toast.success('Produto marcado como entregue!');
        }
    });

    const refundMutation = useMutation({
        mutationFn: async (purchaseId: string) => {
            await api.post(`/store/admin/refund/${purchaseId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-purchases'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            toast.success('Compra estornada com sucesso!');
        },
        onError: (err: any) => toast.error('Erro ao estornar: ' + (err.response?.data?.message || err.message))
    });

    const resetForm = () => {
        setName('');
        setPrice('');
        setStock('-1');
        setDescription('');
        setCategory('REAL');
        setImageUrl('');
    };

    const handleOpenCreate = () => {
        setEditingProduct(null);
        resetForm();
        setIsCreateModalOpen(true);
    };

    const handleOpenEdit = (product: Product) => {
        setEditingProduct(product);
        setName(product.name);
        setPrice(String(product.price));
        setStock(String(product.stock));
        setDescription(product.description || '');
        setCategory(product.category);
        setImageUrl(product.imageUrl || '');
        setIsCreateModalOpen(true);
    };

    const handleUpload = async () => {
        // TODO: Implement image upload via backend API
        toast.info('Upload de imagem temporariamente desabilitado. Use URL direta.');
        return;

        /* Firebase Storage removed
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        try {
            toast.info('Enviando imagem...');
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const storageRef = ref(storage, `products/${Date.now()}_${sanitizedName}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            setImageUrl(downloadURL);
            toast.success('Imagem enviada com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao enviar imagem.');
        }
        */
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, name, price, stock, description, category, imageUrl });
        } else {
            createMutation.mutate({ name, price, stock, description, category, imageUrl });
        }
    };

    // Derived State
    const categories = ['TODOS', ...Array.from(new Set(products.map(p => p.category)))];
    const filteredProducts = selectedCategory === 'TODOS'
        ? products
        : products.filter(p => p.category === selectedCategory);

    return (
        <div>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8"
            >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Loja Virtual</h1>
                    <div className="bg-amber-100/80 backdrop-blur-md text-amber-700 px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-3 shadow-xl shadow-amber-600/10 border border-amber-200">
                        <div className="p-2 bg-amber-600 text-white rounded-xl shadow-lg">
                            <Coins className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-widest leading-none mb-1">Seu Saldo</p>
                            <p className="text-lg leading-none">{isLoadingUser ? '...' : (currentUser?.points?.toLocaleString() || 0)} <span className="text-xs">Pontos</span></p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex bg-slate-100/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50">
                        <button
                            onClick={() => setActiveTab('store')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'store' ? 'bg-white shadow-lg text-blue-600 border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Loja
                        </button>
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white shadow-lg text-blue-600 border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Meus Itens
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'admin' ? 'bg-white shadow-lg text-blue-600 border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <PackageCheck className="w-4 h-4" /> Gestão
                            </button>
                        )}
                    </div>

                    {isAdmin && activeTab === 'store' && (
                        <button
                            onClick={handleOpenCreate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 text-xs uppercase tracking-widest"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Produto
                        </button>
                    )}
                </div>
            </motion.div>

            {activeTab === 'store' && (
                <>
                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-6 mb-2 custom-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${selectedCategory === cat
                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 shadow-lg'
                                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.05
                                }
                            }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                    >
                        {filteredProducts.map(product => (
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                key={product.id}
                                className="glass-card rounded-[2.5rem] premium-shadow overflow-hidden flex flex-col group hover:scale-[1.02] transition-all relative border border-white/50"
                            >
                                <div className="h-56 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                            <ShoppingBag className="w-16 h-16 text-slate-300" />
                                        </div>
                                    )}

                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                        <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm border border-white/50 flex items-center gap-2">
                                            <Tag className="w-3 h-3" />
                                            {product.category}
                                        </div>
                                        {product.stock >= 0 && product.stock < 5 && (
                                            <div className="bg-rose-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg animate-pulse flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" />
                                                Quase Esgotado ({product.stock})
                                            </div>
                                        )}
                                    </div>

                                    {/* Overlay for price/buy on hover? No, let's keep it visible but interactive */}
                                </div>

                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="font-black text-slate-900 text-lg mb-2 tracking-tight line-clamp-1">{product.name}</h3>
                                    <p className="text-sm text-slate-500 mb-6 font-bold leading-relaxed line-clamp-2">{product.description}</p>

                                    <div className="mt-auto space-y-6">
                                        <div className="flex items-center justify-between pt-6 border-t border-slate-100/50">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Preço</span>
                                                <span className="text-2xl font-black text-amber-600 flex items-center gap-1.5">
                                                    <Coins className="w-5 h-5" />
                                                    {product.price}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    if (confirm(`Comprar "${product.name}" por ${product.price} pontos?`)) {
                                                        buyMutation.mutate(product.id);
                                                    }
                                                }}
                                                disabled={
                                                    (currentUser?.points || 0) < product.price ||
                                                    buyMutation.isPending ||
                                                    (product.stock !== -1 && product.stock <= 0)
                                                }
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50 disabled:grayscale disabled:shadow-none"
                                            >
                                                {product.stock !== -1 && product.stock <= 0 ? 'Esgotado' : 'Resgatar'}
                                            </button>
                                        </div>

                                        {/* Admin Actions Row */}
                                        {isAdmin && (
                                            <div className="flex gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                                <button
                                                    onClick={() => handleOpenEdit(product)}
                                                    className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 py-3 rounded-xl transition-all"
                                                >
                                                    <Edit className="w-3 h-3" /> Editar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Excluir "${product.name}"?`)) {
                                                            deleteMutation.mutate(product.id);
                                                        }
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 py-3 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Excluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {filteredProducts.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-20 text-center"
                            >
                                <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum produto nesta categoria</p>
                            </motion.div>
                        )}
                    </motion.div>
                </>
            )}

            {activeTab === 'inventory' && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card rounded-[2.5rem] premium-shadow overflow-hidden"
                >
                    <div className="p-8 border-b border-slate-100/50 font-black text-slate-800 flex items-center gap-3">
                        <History className="w-5 h-5 text-blue-600" />
                        Meus Itens Resgatados
                    </div>
                    {myPurchases.length === 0 ? (
                        <div className="p-20 text-center">
                            <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Você ainda não resgatou nenhum item</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/50 text-slate-400">
                                    <tr>
                                        <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Item</th>
                                        <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Custo</th>
                                        <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Data</th>
                                        <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/50">
                                    {myPurchases.map((purchase, idx) => (
                                        <motion.tr
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={purchase.id}
                                            className="hover:bg-blue-50/30 transition-colors"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="font-black text-slate-800">{purchase.product?.name || 'Produto Removido'}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{purchase.product?.category}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-1.5 font-black text-amber-600">
                                                    <Coins className="w-4 h-4" />
                                                    {purchase.points_at_purchase || purchase.product?.price}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-slate-500 font-bold">
                                                {new Date(purchase.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border ${purchase.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                    purchase.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        'bg-rose-100 text-rose-700 border-rose-200'
                                                    }`}>
                                                    {purchase.status === 'DELIVERED' ? 'Entregue' :
                                                        purchase.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}

            {activeTab === 'admin' && isAdmin && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card rounded-[2.5rem] premium-shadow overflow-hidden"
                >
                    <div className="p-8 border-b border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                        <div className="flex items-center gap-3">
                            <PackageCheck className="w-5 h-5 text-blue-600" />
                            <div>
                                <h3 className="font-black text-slate-800">Gestão de Pedidos</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de {clubPurchases.length} resgates</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 text-slate-400">
                                <tr>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Membro</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Produto</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Data</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-center">Status</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                                {clubPurchases.map((purchase, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        key={purchase.id}
                                        className="hover:bg-blue-50/30 transition-colors"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="font-black text-slate-800">{purchase.user?.name}</div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                                {ROLE_TRANSLATIONS[purchase.user?.role as keyof typeof ROLE_TRANSLATIONS] || purchase.user?.role}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 font-bold text-slate-700">
                                            {purchase.product?.name}
                                        </td>
                                        <td className="px-8 py-5 text-slate-500 font-bold">
                                            {new Date(purchase.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-dashed ${purchase.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    purchase.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                                        'bg-rose-50 text-rose-700 border-rose-200'
                                                }`}>
                                                {purchase.status === 'DELIVERED' ? 'Entregue' :
                                                    purchase.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                {purchase.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => deliverMutation.mutate(purchase.id)}
                                                            className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                            title="Marcar como Entregue"
                                                        >
                                                            <Check className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Estornar esta compra? Os pontos serão devolvidos ao membro.')) {
                                                                    refundMutation.mutate(purchase.id);
                                                                }
                                                            }}
                                                            className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                            title="Estornar / Cancelar"
                                                        >
                                                            <Trash className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                                {purchase.status !== 'PENDING' && (
                                                    <span className="text-[10px] font-black uppercase text-slate-300 px-4">Finalizado</span>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {clubPurchases.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <PackageCheck className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum pedido realizado ainda</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Create/Edit Product Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={editingProduct ? "Editar Produto" : "Novo Produto"}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Nome do Produto</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800"
                                placeholder="Ex: Camiseta do Clube"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Preço (Pontos)</label>
                                <div className="relative">
                                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Estoque (-1 = ∞)</label>
                                <input
                                    type="number"
                                    required
                                    value={stock}
                                    onChange={e => setStock(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Categoria</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800 appearance-none"
                            >
                                <option value="REAL">Item Físico (Real)</option>
                                <option value="VIRTUAL">Item Virtual</option>
                                <option value="UNIFORME">Uniforme</option>
                                <option value="ACAMPAMENTO">Acampamento</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Descrição</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800 resize-none h-32"
                                placeholder="Dê detalhes sobre o produto..."
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">URL da Imagem</label>
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={e => setImageUrl(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800"
                                placeholder="https://exemplo.com/imagem.jpg"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
                        >
                            {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : (editingProduct ? 'Salvar Alterações' : 'Criar Produto')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
