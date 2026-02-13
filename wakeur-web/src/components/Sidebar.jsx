import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    XMarkIcon,
    HomeIcon,
    Square3Stack3DIcon,
    ArrowsRightLeftIcon,
    CurrencyDollarIcon,
    ShoppingBagIcon,
    CreditCardIcon,
    UsersIcon,
    ChartBarIcon,
    ArrowLeftOnRectangleIcon,
    DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen = false, onClose = () => { } }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const menuItems = [
        { path: '/', label: 'Tableau de bord', icon: HomeIcon, allowedRoles: ['owner', 'agent'], section: 'Menu' },
        { path: '/inventory', label: 'Inventaire', icon: Square3Stack3DIcon, allowedRoles: ['owner'], section: 'Menu' },
        { path: '/sales', label: 'Ventes', icon: ShoppingBagIcon, allowedRoles: ['owner', 'agent'], section: 'Opérations' },
        { path: '/mobile-money', label: 'Mobile Money', icon: CreditCardIcon, allowedRoles: ['owner', 'agent'], section: 'Opérations' },
        { path: '/transfers', label: 'Transferts', icon: ArrowsRightLeftIcon, allowedRoles: ['owner'], section: 'Opérations' },
        { path: '/expenses', label: 'Dépenses', icon: CurrencyDollarIcon, allowedRoles: ['owner'], section: 'Gestion' },
        { path: '/agents', label: 'Gestion des Agents', icon: UsersIcon, allowedRoles: ['owner'], section: 'Gestion' },
        { path: '/transactions', label: 'Historique', icon: DocumentChartBarIcon, allowedRoles: ['owner', 'agent'], section: 'Gestion' },
        { path: '/reports', label: 'Analyses', icon: ChartBarIcon, allowedRoles: ['owner'], section: 'Gestion' },
    ];

    const filterItemsByRole = (items) => {
        if (!userProfile?.role) return [];
        return items.filter((item) => item.allowedRoles.includes(userProfile.role));
    };

    const groupedItems = filterItemsByRole(menuItems).reduce((acc, item) => {
        if (!acc[item.section]) acc[item.section] = [];
        acc[item.section].push(item);
        return acc;
    }, {});

    const linkClass = (path) => {
        const isActive = location.pathname === path;
        return `group flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-300 ${isActive
            ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 scale-[1.02]'
            : 'text-zinc-500 hover:bg-teal-50 hover:text-teal-600 dark:text-zinc-400 dark:hover:bg-teal-900/20 dark:hover:text-teal-400'
            }`;
    };

    return (
        <>
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-teal-900/10 backdrop-blur-sm lg:hidden transition-opacity"
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-zinc-200/50 bg-white/80 backdrop-blur-xl dark:bg-zinc-950/80 dark:border-zinc-800 p-8 transition-transform duration-500 ease-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Brand Logo Section */}
                <div className="mb-12 flex items-center justify-between px-2">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-xl shadow-teal-600/30 group-hover:rotate-6 transition-transform">
                            <span className="text-xl font-black">W</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">Wakeur</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400">Sokhna Daba</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-500 hover:bg-zinc-100 lg:hidden"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 space-y-10 overflow-y-auto pr-2 scrollbar-hide">
                    {Object.entries(groupedItems).map(([section, items]) => (
                        <div key={section} className="space-y-3">
                            <h3 className="px-5 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-600">
                                {section}
                            </h3>
                            <div className="space-y-1.5">
                                {items.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={linkClass(item.path)}
                                        onClick={onClose}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Profile/Footer Section */}
                <div className="mt-8 border-t border-zinc-100 dark:border-zinc-800 pt-8">
                    <div className="mb-6 flex items-center gap-4 px-2">
                        <div className="h-10 w-10 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-sm font-black text-teal-600 border border-teal-100 dark:border-teal-800">
                            {userProfile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black truncate text-zinc-900 dark:text-white">
                                {userProfile?.full_name || 'Utilisateur'}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {userProfile?.role === 'owner' ? 'Propriétaire' : 'Agent'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-2xl px-5 py-3 text-xs font-black text-rose-500 transition-all hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:gap-4"
                    >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                        Se déconnecter
                    </button>
                </div>
            </aside>
        </>
    );
}
