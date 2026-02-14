import React, { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bars3Icon, MoonIcon, SunIcon, BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile toggle
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse

    const pageLabel = useMemo(() => {
        return PAGE_LABELS[location.pathname] || 'Tableau de bord';
    }, [location.pathname]);

    const todayLabel = useMemo(() => {
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date());
    }, []);

    const shopName = shopSettings?.shop_name || 'Wakeur Sokhna';
    const initials = userProfile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'US';

    return (
        <div className="min-h-screen bg-[var(--bg-subtle)] dark:bg-[var(--bg-app)] transition-colors duration-300 font-sans">
            {/* Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <main className={`min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                {/* Header - Minimal Sticky */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-[var(--border)]">
                    <div className="flex h-16 items-center justify-between px-6 lg:px-8">

                        {/* Mobile Menu & Title */}
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>

                            <div className="flex flex-col">
                                <h1 className="text-lg font-serif-display font-bold text-[var(--text-main)] tracking-tight">
                                    {pageLabel}
                                </h1>
                                <span className="text-[11px] text-[var(--text-muted)] hidden sm:block">
                                    {todayLabel} • {shopName}
                                </span>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3 sm:gap-6">

                            {/* Search (Visual Only for now) */}
                            <div className="hidden md:flex items-center relative group">
                                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 text-slate-400 group-focus-within:text-slate-600" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    className="pl-9 pr-4 py-1.5 text-sm bg-[var(--bg-subtle)] border border-transparent focus:border-[var(--border)] focus:bg-white rounded-lg transition-all outline-none w-48 focus:w-64"
                                />
                            </div>

                            <div className="h-6 w-px bg-[var(--border)] hidden sm:block"></div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                                >
                                    {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                                </button>
                                <button className="relative p-2 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    <BellIcon className="h-5 w-5" />
                                    <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[var(--danger)]"></span>
                                </button>
                            </div>

                            <div className="flex items-center gap-3 pl-2">
                                <span className="hidden md:block text-sm font-medium text-[var(--text-main)]">
                                    {userProfile?.full_name?.split(' ')[0]}
                                </span>
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {initials}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6 lg:p-8 animate-enter">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
