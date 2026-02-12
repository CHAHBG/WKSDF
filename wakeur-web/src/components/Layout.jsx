import React, { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

const PAGE_LABELS = {
    '/': 'Dashboard',
    '/inventory': 'Inventaire',
    '/transfers': 'Transferts',
    '/mobile-money': 'Mobile Money',
    '/sales': 'Ventes',
    '/expenses': 'Depenses',
    '/agents': 'Agents',
    '/transactions': 'Transactions',
    '/reports': 'Rapports',
};

export default function Layout() {
    const location = useLocation();
    const { shopSettings, userProfile } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const pageLabel = useMemo(() => {
        return PAGE_LABELS[location.pathname] || 'Espace de gestion';
    }, [location.pathname]);

    const todayLabel = useMemo(() => {
        return new Intl.DateTimeFormat('fr-FR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        }).format(new Date());
    }, []);

    const shopName = shopSettings?.shop_name || 'Wakeur Sokhna';
    const roleLabel = userProfile?.role === 'owner' ? 'Proprietaire' : 'Agent';

    return (
        <div className="min-h-screen bg-slate-100">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="min-h-screen lg:ml-72">
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-100/90 backdrop-blur">
                    <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(true)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                                aria-label="Ouvrir le menu"
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>
                            <div className="min-w-0">
                                <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{shopName}</p>
                                <h1 className="truncate text-xl font-bold text-slate-900">{pageLabel}</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
                                {todayLabel}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                {roleLabel}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
