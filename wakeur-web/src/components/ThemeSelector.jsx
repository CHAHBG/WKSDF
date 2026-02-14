import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function ThemeSelector() {
    const { currentPalette, setCurrentPalette, palettes, removeCustomPalette } = useTheme();

    return (
        <div className="w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(palettes).map(([key, palette]) => {
                    const isSelected = currentPalette === key;

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setCurrentPalette(key)}
                            className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 outline-none ${isSelected
                                ? 'border-[var(--primary)] bg-[var(--bg-subtle)] shadow-md'
                                : 'border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-subtle)]'
                                }`}
                        >
                            {/* Color Preview Circles */}
                            <div className="flex -space-x-2 mb-3">
                                <div
                                    className="h-8 w-8 rounded-full border-2 border-[var(--bg-card)] shadow-sm"
                                    style={{ backgroundColor: palette.colors.light.primary }}
                                    title="Primaire"
                                ></div>
                                <div
                                    className="h-8 w-8 rounded-full border-2 border-[var(--bg-card)] shadow-sm z-10"
                                    style={{ backgroundColor: palette.colors.light.accent }}
                                    title="Accent"
                                ></div>
                            </div>

                            {/* Label */}
                            <span className={`text-[10px] font-bold uppercase tracking-wider text-center transition-colors ${isSelected ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
                                }`}>
                                {palette.name}
                            </span>

                            {/* Selected Indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 text-[var(--primary)]">
                                    <CheckCircleIcon className="w-4 h-4" />
                                </div>
                            )}

                            {/* Delete Action for Custom Themes */}
                            {key.startsWith('custom_') && (
                                <div
                                    className="absolute top-2 left-2 text-[var(--text-muted)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Supprimer ce thème ?')) removeCustomPalette(key);
                                    }}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div >
    );
}
