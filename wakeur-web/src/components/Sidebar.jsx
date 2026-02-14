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
    DocumentChartBarIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen = false, onClose = () => { }, isCollapsed = false, toggleCollapse = () => { } }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile, signOut } = useAuth();

    const isMobile = window.innerWidth < 1024;

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
        { path: '/agents', label: 'Agents', icon: UsersIcon, allowedRoles: ['owner'], section: 'Gestion' },
        { path: '/transactions', label: 'Historique', icon: DocumentChartBarIcon, allowedRoles: ['owner', 'agent'], section: 'Gestion' },
        { path: '/reports', label: 'Rapports', icon: ChartBarIcon, allowedRoles: ['owner'], section: 'Gestion' },
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
        return `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
            ? 'bg-[var(--primary)] text-white shadow-sm'
            : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-main)]'
            } ${isCollapsed ? 'justify-center' : ''}`;
    };

    return (
        <>
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 flex h-full flex-col border-r border-[var(--border)] bg-[var(--bg-app)] transition-all duration-300 ease-in-out lg:translate-x-0 
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                ${isCollapsed ? 'w-20' : 'w-64'}`}
            >
                {/* Brand Logo Section */}
                <div className={`flex items-center justify-between px-4 py-6 border-b border-[var(--border-subtle)] ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-md">
                            <span className="text-lg font-bold font-serif-display">W</span>
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight text-[var(--text-main)] uppercase">Wakeur</span>
                                <span className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)]">Sokhna</span>
                            </div>
                        )}
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] rounded-lg"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
                    {Object.entries(groupedItems).map(([section, items]) => (
                        <div key={section} className="mb-6 last:mb-0">
                            {!isCollapsed && (
                                <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-80">
                                    {section}
                                </h3>
                            )}
                            {isCollapsed && (
                                <div className="h-px w-8 mx-auto bg-[var(--border)] mb-3 opacity-50"></div>
                            )}
                            <div className="space-y-1">
                                {items.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={linkClass(item.path)}
                                        onClick={() => isMobile && onClose()}
                                        title={isCollapsed ? item.label : ''}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        {!isCollapsed && <span>{item.label}</span>}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer / Toggle */}
                <div className="border-t border-[var(--border)] p-3">
                    <button
                        onClick={toggleCollapse}
                        className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-colors mb-2"
                    >
                        {isCollapsed ? <ChevronDoubleRightIcon className="h-4 w-4" /> : <ChevronDoubleLeftIcon className="h-4 w-4" />}
                    </button>

                    <div className={`rounded-xl bg-[var(--bg-subtle)] p-3 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="h-8 w-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {userProfile?.full_name?.charAt(0) || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col min-w-0 overflow-hidden">
                                <span className="text-xs font-semibold truncate text-[var(--text-main)]">
                                    {userProfile?.full_name?.split(' ')[0]}
                                </span>
                                <button onClick={handleLogout} className="text-[10px] text-[var(--danger)] hover:underline flex items-center gap-1">
                                    Déconnexion
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
