import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { shopSettings, userProfile, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const shopName = shopSettings?.shop_name || 'Wakeur Sokhna';
    const shopNameParts = shopName.split(' ');
    const firstName = shopNameParts[0] || 'Wakeur';
    const lastName = shopNameParts.slice(1).join(' ');

    const mainMenuItems = [
        { path: '/', label: 'Dashboard', allowedRoles: ['owner', 'agent'] },
        { path: '/inventory', label: 'Inventaire', allowedRoles: ['owner'] },
        { path: '/transfers', label: 'Transferts', allowedRoles: ['owner'] },
        { path: '/mobile-money', label: 'Mobile Money', allowedRoles: ['owner', 'agent'] },
        { path: '/sales', label: 'Ventes', allowedRoles: ['owner', 'agent'] },
        { path: '/expenses', label: 'Dépenses', allowedRoles: ['owner'] },
    ];

    const managementItems = [
        { path: '/agents', label: 'Agents', allowedRoles: ['owner'] },
        { path: '/transactions', label: 'Transactions', allowedRoles: ['owner', 'agent'] },
        { path: '/reports', label: 'Rapports & Analyses', allowedRoles: ['owner'] },
    ];

    const filterItems = (items) => {
        if (!userProfile?.role) return [];
        return items.filter((item) => item.allowedRoles.includes(userProfile.role));
    };

    const linkClass = (path) => {
        const isActive = location.pathname === path;
        return `block rounded-xl px-4 py-3 text-base font-semibold transition-all duration-150 ${
            isActive
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`;
    };

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    aria-label="Fermer le menu"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-slate-200 bg-white p-6 shadow-sm transition-transform duration-200 lg:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="mb-8 flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h1 className="flex flex-col text-3xl font-bold leading-tight text-slate-900">
                        {firstName}
                        {lastName && (
                            <span className="mt-1 text-lg font-semibold uppercase tracking-wide text-slate-500">
                                {lastName}
                            </span>
                        )}
                    </h1>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800 lg:hidden"
                        aria-label="Fermer"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-hide">
                    <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Menu principal</p>
                    {filterItems(mainMenuItems).map((item) => (
                        <Link key={item.path} to={item.path} className={linkClass(item.path)} onClick={onClose}>
                            {item.label}
                        </Link>
                    ))}

                    <p className="mb-2 mt-8 px-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Gestion</p>
                    {filterItems(managementItems).map((item) => (
                        <Link key={item.path} to={item.path} className={linkClass(item.path)} onClick={onClose}>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="mt-6 border-t border-slate-200 pt-5">
                    <button
                        onClick={handleLogout}
                        className="w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                    >
                        Déconnexion
                    </button>
                </div>
            </aside>
        </>
    );
}

