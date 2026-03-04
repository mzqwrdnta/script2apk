import React, { useState } from 'react';
import { Plus, Trash2, Edit2, ChevronLeft, Palette } from 'lucide-react';
import { addCategory, updateCategory, deleteCategory } from '../db';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#4b5563', '#14b8a6', '#f43f5e'
];

function CategoryManager({ categories, onUpdate, onBack }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (editingId) {
            await updateCategory({ id: editingId, name, color });
            setEditingId(null);
        } else {
            await addCategory({ name, color });
        }

        setName('');
        setColor(PRESET_COLORS[0]);
        setIsAdding(false);
        onUpdate();
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setName(cat.name);
        setColor(cat.color);
        setIsAdding(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Menghapus kategori akan menghapus semua jadwal di dalamnya. Lanjutkan?')) {
            await deleteCategory(id);
            onUpdate();
        }
    };

    return (
        <div className="container">
            <div className="view-header">
                <button onClick={onBack} className="back-btn">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="title">Kelola Judul Kegiatan</h2>
            </div>

            <AnimatePresence>
                {isAdding ? (
                    <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="category-form glass"
                    >
                        <div className="form-group">
                            <label>Nama Judul (misal: Hadroh, Kerja)</label>
                            <input
                                autoFocus
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Masukkan judul kegiatan..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Pilih Warna</label>
                            <div className="color-grid">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`color-bubble ${color === c ? 'active' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setColor(c)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingId(null);
                                    setName('');
                                }}
                            >
                                Batal
                            </button>
                            <button type="submit" className="btn-primary">
                                {editingId ? 'Update' : 'Simpan'}
                            </button>
                        </div>
                    </motion.form>
                ) : (
                    <button className="add-cat-btn glass" onClick={() => setIsAdding(true)}>
                        <Plus size={20} />
                        <span>Tambah Judul Kegiatan Baru</span>
                    </button>
                )}
            </AnimatePresence>

            <div className="category-list">
                {categories.map(cat => (
                    <motion.div
                        layout
                        key={cat.id}
                        className="category-item glass"
                    >
                        <div className="cat-info">
                            <div className="cat-color" style={{ backgroundColor: cat.color }} />
                            <span className="cat-name">{cat.name}</span>
                        </div>
                        <div className="cat-actions">
                            <button onClick={() => handleEdit(cat)} className="icon-btn edit">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(cat)} className="icon-btn delete">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))}
                {categories.length === 0 && !isAdding && (
                    <p className="empty-state">Belum ada judul kegiatan. Buat satu untuk memulai.</p>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .view-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .back-btn {
          color: var(--text-secondary);
        }
        .category-form {
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          margin-bottom: 1.5rem;
          overflow: hidden;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }
        .form-group input {
          width: 100%;
        }
        .color-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.75rem;
        }
        .color-bubble {
          height: 36px;
          border-radius: 50%;
          border: 3px solid transparent;
          transition: var(--transition);
        }
        .color-bubble.active {
          border-color: white;
          box-shadow: 0 0 0 2px var(--accent-color);
        }
        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .btn-primary, .btn-secondary {
          flex: 1;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-weight: 600;
        }
        .btn-primary {
          background: var(--accent-color);
          color: white;
        }
        .btn-secondary {
          background: #f1f5f9;
          color: var(--text-secondary);
        }
        .add-cat-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: var(--radius-lg);
          color: var(--accent-color);
          font-weight: 600;
          margin-bottom: 2rem;
        }
        .category-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .category-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-radius: var(--radius-md);
        }
        .cat-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .cat-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .cat-name {
          font-weight: 600;
        }
        .cat-actions {
          display: flex;
          gap: 0.5rem;
        }
        .icon-btn {
          padding: 0.4rem;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
        }
        .icon-btn:hover {
          background: rgba(0,0,0,0.05);
        }
        .icon-btn.delete:hover {
          color: var(--danger-color);
          background: rgba(239, 68, 68, 0.1);
        }
        .empty-state {
          text-align: center;
          color: var(--text-secondary);
          padding: 3rem 0;
        }
      `}} />
        </div>
    );
}

export default CategoryManager;
