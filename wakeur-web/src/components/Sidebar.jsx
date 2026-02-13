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
    ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen = false, onClose = () => { } }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { shopSettings, userProfile, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const shopName = shopSettings?.shop_name || 'Wakeur Sokhna';

    const menuItems = [
        { path: '/', label: 'Tableau de bord', icon: HomeIcon, allowedRoles: ['owner', 'agent'], section: 'Menu' },
        { path: '/inventory', label: 'Inventaire', icon: Square3Stack3DIcon, allowedRoles: ['owner'], section: 'Menu' },
        { path: '/sales', label: 'Ventes', icon: ShoppingBagIcon, allowedRoles: ['owner', 'agent'], section: 'Operations' },
        { path: '/mobile-money', label: 'Mobile Money', icon: CreditCardIcon, allowedRoles: ['owner', 'agent'], section: 'Operations' },
        { path: '/transfers', label: 'Transferts', icon: ArrowsRightLeftIcon, allowedRoles: ['owner'], section: 'Operations' },
        { path: '/expenses', label: 'Dépenses', icon: CurrencyDollarIcon, allowedRoles: ['owner'], section: 'Gestion' },
        { path: '/agents', label: 'Gestion des Agents', icon: UsersIcon, allowedRoles: ['owner'], section: 'Gestion' },
        { path: '/transactions', label: 'Historique', icon: ChartBarIcon, allowedRoles: ['owner', 'agent'], section: 'Gestion' },
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
        return `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
            }`;
    };

    return (
        <>
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 p-6 shadow-xl transition-all duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Brand Logo Section */}
                <div className="mb-10 flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                            <span className="text-xl font-black tracking-tighter">W</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold leading-none tracking-tight text-slate-900 dark:text-white">Wakeur</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Sokhna Daba</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 lg:hidden"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-hide">
                    {Object.entries(groupedItems).map(([section, items]) => (
                        <div key={section} className="space-y-2">
                            <h3 className="px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                {section}
                            </h3>
                            <div className="space-y-1">
                                {items.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={linkClass(item.path)}
                                        onClick={onClose}
                                    >
                                        <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Profile/Footer Section */}
                <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <div className="mb-4 flex items-center gap-3 px-2">
                        <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {userProfile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold truncate text-slate-900 dark:text-white">
                                {userProfile?.full_name || 'Utilisateur'}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500">
                                {userProfile?.role === 'owner' ? 'Propriétaire' : 'Agent de vente'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 transition-all duration-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" />
                        Déconnexion
                    </button>
                </div>
            </aside>
        </>
    );
}


