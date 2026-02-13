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
        return `group flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isActive
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            }`;
    };

    return (
        <>
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-[2px] lg:hidden transition-opacity"
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 p-6 shadow-sm transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Brand Logo Section */}
                <div className="mb-10 flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">
                            <span className="text-lg font-bold">W</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-bold tracking-tight text-zinc-950 dark:text-white uppercase italic">Wakeur</span>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Sokhna Daba</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 lg:hidden"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-hide">
                    {Object.entries(groupedItems).map(([section, items]) => (
                        <div key={section} className="space-y-1.5">
                            <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-600 mb-2">
                                {section}
                            </h3>
                            <div className="space-y-0.5">
                                {items.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={linkClass(item.path)}
                                        onClick={onClose}
                                    >
                                        <item.icon className="h-4.5 w-4.5" />
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Profile/Footer Section */}
                <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <div className="mb-4 flex items-center gap-3 px-2">
                        <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            {userProfile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold truncate text-zinc-900 dark:text-white">
                                {userProfile?.full_name || 'Utilisateur'}
                            </span>
                            <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider">
                                {userProfile?.role === 'owner' ? 'Propriétaire' : 'Agent de vente'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                        <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                        Déconnexion
                    </button>
                </div>
            </aside>
        </>
    );
}
