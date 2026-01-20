import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
// import { Modal } from './Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
// import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    read: boolean;
    createdAt: string;
}

export function NotificationBell() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    // const { socket } = useSocket(); // Removed for Vercel/Firestore
    const { user } = useAuth(); // Need user ID for Firestore query

    // Listen for real-time notifications via Firestore
    useEffect(() => {
        if (!user?.id) return;

        console.log('[NotificationBell] Setting up Firestore listener for user:', user.id);

        // Query notifications for this user, ordered by creation time
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.id),
            // orderBy('createdAt', 'desc'), // Requires Index, might fail initially without it. 
            // Better to filter Client side or ensure Index exists. 
            // For MVP, we can listen to recent ones or just rely on the REST cache invalidation + basic listener?
            // Actually, let's just listen to the collection where userId matches.
        );

        // Note: Composite index (userId ASC, createdAt DESC) might be needed.
        // For now, let's keep it simple: Just listen.

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.docChanges().length > 0) {
                console.log('Real-time notification received via Firestore');
                queryClient.invalidateQueries({ queryKey: ['notifications'] });

                // Show toast/sound for ADDED notifications
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        // Only show if it's recent (e.g. within last 10 seconds) to avoid spam on load
                        // But since we just invalidate query, the UI handles the list.
                        // We can just emulate the old behavior:
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(data.title, { body: data.message });
                        }
                    }
                });
            }
        });

        return () => unsubscribe();
    }, [user?.id, queryClient]);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const { data: notifications = [] } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await api.get('/notifications');
            return response.data;
        }
        // Removed refetchInterval since we have sockets now
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const readMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.patch(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            return api.patch('/notifications/read-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {/* Popup/Dropdown for Notifications */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                        <h3 className="font-bold text-slate-800">Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => {
                                    markAllReadMutation.mutate();
                                    // Keep open? Or close? User request "popup" usually stays open until clicked outside or action taken.
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline transition-all"
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                        {notifications.length === 0 ? (
                            <div className="py-12 px-8 text-center space-y-3">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <p className="text-slate-500 text-sm font-medium">Você não tem novas notificações.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 transition-all cursor-pointer hover:bg-slate-50 group ${!notification.read ? 'bg-blue-50/30' : 'bg-white'}`}
                                        onClick={() => {
                                            if (!notification.read) readMutation.mutate(notification.id);

                                            if (notification.title === 'Nova Aprovação Pendente') {
                                                navigate('/dashboard/members?action=approvals');
                                                setIsOpen(false);
                                            }
                                            // Don't auto close for generic reads, allows reading multiple?
                                            // User usually wants to scan. 
                                            // But if it's a link, close.
                                        }}
                                    >
                                        <div className="flex gap-3 items-start">
                                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ring-2 ring-white ${notification.type === 'SUCCESS' ? 'bg-green-500' :
                                                notification.type === 'WARNING' ? 'bg-yellow-500' :
                                                    notification.type === 'ERROR' ? 'bg-red-500' : 'bg-blue-500'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm leading-tight mb-1 ${!notification.read ? 'font-bold text-slate-800' : 'text-slate-600 font-medium'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                                                    {notification.message}
                                                </p>
                                                <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-slate-50 bg-slate-50/50 text-center">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider py-1"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
