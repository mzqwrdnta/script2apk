import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, Clock, AlignLeft, Tag } from 'lucide-react';
import { format } from 'date-fns';

function EventForm({ categories, initialEvent, onSubmit, onCancel }) {
    const [title, setTitle] = useState(initialEvent?.title || '');
    const [date, setDate] = useState(initialEvent?.date || format(new Date(), 'yyyy-MM-dd'));
    const [time, setTime] = useState(initialEvent?.time || '10:00');
    const [categoryId, setCategoryId] = useState(initialEvent?.categoryId || (categories[0]?.id || ''));
    const [description, setDescription] = useState(initialEvent?.description || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !categoryId) return;

        onSubmit({
            title,
            date,
            time,
            categoryId: Number(categoryId),
            description
        });
    };

    return (
        <div className="container event-form-view">
            <div className="view-header">
                <button onClick={onCancel} className="back-btn bordered">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="title">{initialEvent ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="glass event-form">
                <div className="form-group">
                    <label><Tag size={16} /> Judul Utama (Kategori)</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                        className="bordered-input"
                    >
                        <option value="" disabled>Pilih Kategori...</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Keterangan Acara (misal: Lomba di Bogor)</label>
                    <input
                        autoFocus
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ketik keterangan acara..."
                        required
                        className="bordered-input"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label><CalendarIcon size={16} /> Tanggal</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="bordered-input"
                        />
                    </div>
                    <div className="form-group">
                        <label><Clock size={16} /> Jam</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                            className="bordered-input"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label><AlignLeft size={16} /> Deskripsi (Opsional)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tambahkan detail tambahan jika ada..."
                        rows={3}
                        className="bordered-input"
                    />
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-secondary bordered" onClick={onCancel}>
                        Batal
                    </button>
                    <button type="submit" className="btn-primary bordered">
                        {initialEvent ? 'Update Jadwal' : 'Tambah ke Kalender'}
                    </button>
                </div>
            </form>

            <style dangerouslySetInnerHTML={{
                __html: `
        .event-form-view {
          padding-top: 1rem;
        }
        .view-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        .back-btn.bordered {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            background: white;
        }
        .event-form {
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0,0,0,0.05);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1rem;
        }
        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--text-secondary);
          margin-bottom: 0.4rem;
          margin-top: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .bordered-input {
          width: 100%;
          background: white !important;
          border: 1.5px solid #f1f5f9 !important;
          border-radius: 10px !important;
          padding: 0.75rem !important;
          font-weight: 600;
          transition: 0.2s;
        }
        .bordered-input:focus {
            border-color: var(--accent-color) !important;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
        .form-actions {
          margin-top: 2rem;
          display: flex;
          gap: 1rem;
        }
        .btn-primary.bordered, .btn-secondary.bordered {
            flex: 1;
            padding: 0.8rem;
            border-radius: 12px;
            font-weight: 800;
            font-size: 0.85rem;
            border: 1.5px solid transparent;
        }
        .btn-primary.bordered {
            background: var(--accent-gradient);
            color: white;
            box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2);
        }
        .btn-secondary.bordered {
            background: white;
            color: var(--text-main);
            border-color: #e2e8f0;
        }
      `}} />
        </div>
    );
}

export default EventForm;
