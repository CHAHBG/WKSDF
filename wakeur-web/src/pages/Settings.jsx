import React from 'react';
import ThemeSelector from '../components/ThemeSelector';
import { Cog6ToothIcon, SwatchIcon } from '@heroicons/react/24/outline';

export default function Settings() {
    return (
        <div className="space-y-6 animate-enter">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold font-serif-display text-[var(--text-main)]">Paramètres</h1>
                <p className="text-sm text-[var(--text-muted)]">Personnalisez votre expérience NESS.</p>
            </div>

            {/* Theme Section */}
            <div className="card-modern p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[var(--bg-subtle)] rounded-lg text-[var(--primary)]">
                        <SwatchIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[var(--text-main)]">Apparence</h2>
                        <p className="text-xs text-[var(--text-muted)]">Choisissez le thème qui correspond à votre marque.</p>
                    </div>
                </div>

                <ThemeSelector />
            </div>

            {/* Application Info */}
            <div className="card-modern p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[var(--bg-subtle)] rounded-lg text-[var(--text-muted)]">
                        <Cog6ToothIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[var(--text-main)]">À propos</h2>
                        <p className="text-xs text-[var(--text-muted)]">Informations sur l'application.</p>
                    </div>
                </div>
                <div className="text-sm text-[var(--text-muted)] space-y-1">
                    <p>Version: <span className="font-medium text-[var(--text-main)]">1.0.0 (NESS)</span></p>
                    <p>ID Boutique: <span className="font-medium text-[var(--text-main)]">Connecté</span></p>
                </div>
            </div>
        </div>
    );
}
