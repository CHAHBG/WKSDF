import React, { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bars3Icon, MoonIcon, SunIcon, BellIcon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const PAGE_LABELS = {
    '/': 'Tableau de bord',
    '/inventory': 'Inventaire',
    '/transfers': 'Transferts',
    '/mobile-money': 'Operations MM',
    '/sales': 'Point de Vente',
    '/expenses': 'Dépenses',
    '/agents': 'Gestion des Agents',
    '/transactions': 'Historique',
    '/reports': 'Analyses & Rapports',
};

export default function Layout() {
    const location = useLocation();
    const { shopSettings, userProfile } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const pageLabel = useMemo(() => {
        return PAGE_LABELS[location.pathname] || 'Tableau de bord';
    }, [location.pathname]);

    const todayLabel = useMemo(() => {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        }).format(new Date());
    }, []);

    const shopName = shopSettings?.shop_name || 'Wakeur Sokhna';
    const initials = userProfile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'US';

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="min-h-screen lg:ml-64 transition-all">
                {/* Header Section - Minimalist */}
                <header className="sticky top-0 z-30 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
                    <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 lg:px-10">

                        {/* Left Side: Mobile Menu & Page Title */}
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(true)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 lg:hidden"
                            >
                                <Bars3Icon className="h-5 w-5" />
                            </button>
                            <div className="hidden sm:block">
                                <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white uppercase tracking-wider">{pageLabel}</h1>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">{shopName}</p>
                            </div>
                        </div>

                        {/* Right Side: Tools & Profile */}
                        <div className="flex items-center gap-4">
                            {/* Date Badge - Muted */}
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 text-[11px] font-medium text-zinc-500 border-r border-zinc-200 dark:border-zinc-800 pr-6">
                                {todayLabel}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleTheme}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                                >
                                    {isDark ? <SunIcon className="h-4.5 w-4.5" /> : <MoonIcon className="h-4.5 w-4.5" />}
                                </button>
                                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors">
                                    <BellIcon className="h-4.5 w-4.5" />
                                </button>
                            </div>

                            {/* User Profile - Standard Executive Look */}
                            <div className="flex items-center gap-3 pl-2">
                                <div className="hidden text-right lg:block">
                                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                                        {userProfile?.full_name?.split(' ')[0] || 'User'}
                                    </p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 font-bold text-[10px] border border-zinc-200 dark:border-zinc-800">
                                    {initials}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="mx-auto w-full max-w-7xl p-6 lg:p-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
