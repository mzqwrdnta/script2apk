import React, { useState } from 'react';
import { ChevronLeft, Palette, Tag, Pipette, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

function CategoryForm({ initialCategory, onSubmit, onCancel }) {
    const [name, setName] = useState(initialCategory?.name || '');
    const [color, setColor] = useState(initialCategory?.color || '#3b82f6');

    const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#ec4899', '#06b6d4', '#111827', '#6366f1', '#14b8a6',
        '#f43f5e', '#84cc16'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        onSubmit({
            name,
            color
        });
    };

    return (
        <div className="container category-form-view fade-in">
            <div className="view-header">
                <button onClick={onCancel} className="back-btn bordered">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="title">{initialCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="glass category-form-pro">
                <div className="form-group">
                    <label><Tag size={16} /> Nama Kelompok Jadwal</label>
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Pekerjaan, Hadroh, Rumah..."
                        required
                        className="bordered-input-lg"
                    />
                </div>

                <div className="form-group">
                    <div className="label-row-pro">
                        <label><Palette size={16} /> Identitas Warna</label>
                        <span className="hex-preview" style={{ color }}>{color.toUpperCase()}</span>
                    </div>

                    <div className="color-alignment-pro">
                        <div className="color-grid-flexible">
                            {colors.map(c => (
                                <motion.div
                                    key={c}
                                    className={`color-pill-pro ${color === c ? 'selected' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    {color === c && <div className="white-dot"></div>}
                                </motion.div>
                            ))}
                            <div className="custom-color-pro-btn bordered">
                                <Pipette size={18} className="pipette-icon" />
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="color-input-hidden"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions-pro">
                    <button type="button" className="btn-secondary-pro bordered" onClick={onCancel}>
                        Batal
                    </button>
                    <button type="submit" className="btn-primary-pro bordered-none accent-bg">
                        {initialCategory ? 'Simpan Perubahan' : 'Buat Grup Sekarang'}
                    </button>
                </div>
            </form>

            <style dangerouslySetInnerHTML={{
                __html: `
        .category-form-view { padding-top: 1rem; }
        .view-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .back-btn.bordered { width: 42px; height: 42px; border-radius: 14px; border: 1.5px solid #e2e8f0; background: white; }
        
        .category-form-pro { padding: 2rem; border-radius: 28px; }
        .bordered-input-lg { width: 100%; padding: 1rem; border-radius: 14px; border: 1.5px solid #eef2f6; background: #fafafa; font-size: 1.1rem; font-weight: 700; transition: 0.3s; }
        .bordered-input-lg:focus { background: white; border-color: var(--accent-color); box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.05); }
        
        .label-row-pro { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .hex-preview { font-size: 0.75rem; font-weight: 900; font-family: monospace; letter-spacing: 1px; }
        
        .color-grid-flexible { display: grid; grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)); gap: 0.75rem; }
        .color-pill-pro { height: 50px; border-radius: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; border: 3px solid transparent; }
        .color-pill-pro.selected { border-color: white; box-shadow: 0 0 0 2px var(--text-main); transform: scale(1.05); }
        .white-dot { width: 10px; height: 10px; border-radius: 50%; background: white; }
        
        .custom-color-pro-btn { position: relative; height: 50px; border-radius: 14px; background: white; border: 2px dashed #e2e8f0; display: flex; align-items: center; justify-content: center; }
        .color-input-hidden { position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer; }

        .form-actions-pro { margin-top: 2.5rem; display: flex; gap: 1rem; }
        .btn-primary-pro, .btn-secondary-pro { flex: 1; padding: 1.1rem; border-radius: 16px; font-weight: 900; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px; transition: 0.3s; }
        .btn-primary-pro.accent-bg { background: var(--accent-gradient); color: white; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3); }
        .btn-secondary-pro { background: white; color: var(--text-main); border: 1.5px solid #e2e8f0; }
        
        @media (max-width: 480px) {
            .color-grid-flexible { grid-template-columns: repeat(4, 1fr); }
            .form-actions-pro { flex-direction: column-reverse; }
        }
      `}} />
        </div>
    );
}

export default CategoryForm;
