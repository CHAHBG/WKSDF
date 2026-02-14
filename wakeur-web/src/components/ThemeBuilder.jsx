import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SparklesIcon, TrashIcon } from '@heroicons/react/24/outline'; // Updated import

export default function ThemeBuilder() {
    const { addCustomPalette } = useTheme();
    const [name, setName] = useState('');
    const [primary, setPrimary] = useState('#2563eb');
    const [accent, setAccent] = useState('#f59e0b');
    const [preview, setPreview] = useState(null);

    // Simple helpers to generate variants (lightening/darkening logic could be improved with a library like chroma-js/tinycolor2, 
    // but for now we'll do simple hex manipulation or keep it valid Css)
    // Actually, to ensure valid hexes for simple execution without deps, let's just use the selected colors 
    // and maybe a simple opacity or filter approach if we were using CSS, but here we need hex strings.
    // For simplicity in this "No-External-Lip" version, we will just use the primary as primaryLight (or maybe just a slightly different static logic isn't perfect).
    // BETTER APPROACH: Let's just use the user's input directly for primary/accent and maybe derive a "soft" version?
    // Let's implement a dummy "lighten/darken" or just use the same color for simplicty if complex logic is needed.
    // However, to make it "Advanced", users expect it to look good. 
    // Let's assume the user picks the "Main" color.

    // Hex to RGB Helper
    const hexToRgb = (hex) => {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Adjust brightness roughly
    const adjustBrightness = (hex, percent) => {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        const amt = Math.round(2.55 * percent);
        const R = (rgb.r + amt < 255) ? (rgb.r + amt > 0 ? rgb.r + amt : 0) : 255;
        const G = (rgb.g + amt < 255) ? (rgb.g + amt > 0 ? rgb.g + amt : 0) : 255;
        const B = (rgb.b + amt < 255) ? (rgb.b + amt > 0 ? rgb.b + amt : 0) : 255;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    useEffect(() => {
        // Generate preview object on change
        setPreview({
            name: name || 'Mon Thème',
            colors: {
                light: {
                    primary: primary,
                    primaryLight: adjustBrightness(primary, 20), // lighter
                    accent: accent
                },
                dark: {
                    primary: adjustBrightness(primary, 40), // very light for dark mode text/elements
                    primaryLight: adjustBrightness(primary, 50),
                    accent: adjustBrightness(accent, 10)
                }
            }
        });
    }, [name, primary, accent]);

    const handleSave = (e) => {
        e.preventDefault();
        if (!name) return;

        const key = `custom_${Date.now()}`;
        addCustomPalette(key, preview);
        setName('');
        // Optional: Reset colors or keep them
    };

    return (
        <form onSubmit={handleSave} className="space-y-4">
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Nom du thème</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Rouge Brique, Corporate Blue..."
                    className="input-modern"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Couleur Principale</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={primary}
                            onChange={(e) => setPrimary(e.target.value)}
                            className="h-10 w-full rounded-lg cursor-pointer border border-[var(--border)]"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Couleur d'Accent</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={accent}
                            onChange={(e) => setAccent(e.target.value)}
                            className="h-10 w-full rounded-lg cursor-pointer border border-[var(--border)]"
                        />
                    </div>
                </div>
            </div>

            {/* Preview Box */}
            <div className="mt-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]">
                <p className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wide font-bold">Aperçu du bouton</p>
                <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl font-medium text-white shadow-sm transition-all text-sm"
                    style={{ backgroundColor: primary, boxShadow: `0 4px 10px ${adjustBrightness(primary, -50)}40` }}
                >
                    Voir le résultat
                </button>
                <span className="ml-3 text-sm font-medium" style={{ color: primary }}>Texte coloré</span>
            </div>

            <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center gap-2"
                disabled={!name}
            >
                <SparklesIcon className="w-5 h-5" />
                Créer le thème
            </button>
        </form>
    );
}
