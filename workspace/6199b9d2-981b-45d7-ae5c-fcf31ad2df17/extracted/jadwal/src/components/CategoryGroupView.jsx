import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronRight, Clock, Send, Plus, Edit2, Trash2, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

function CategoryGroupView({
  categories,
  events,
  onEditEvent,
  categoriesMap,
  onShareWhatsApp,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}) {
  const groupedEvents = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      events: events
        .filter(e => e.categoryId === cat.id)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    }));
  }, [categories, events]);

  return (
    <div className="container category-group-view fade-in">
      <div className="view-header-pro flex-col-center">
        <div className="header-text-full">
          <h2 className="title">Grup Jadwal</h2>
          <p className="subtitle">Kelola kategori dan lihat semua kegiatan Anda.</p>
        </div>
        <motion.button
          className="add-cat-btn glass-btn accent-glow mobile-full-width"
          onClick={onAddCategory}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={18} /> <span className="nowrap">Kategori</span>
        </motion.button>
      </div>

      <div className="category-groups">
        {groupedEvents.map(group => (
          <div key={group.id} className="cat-group glass">
            <div className="cat-group-header" style={{ borderLeftColor: group.color }}>
              <div className="header-info">
                <span className="cat-name">{group.name}</span>
                <span className="event-count">{group.events.length} Kegiatan</span>
              </div>
              <div className="header-actions">
                <button className="icon-action-btn" onClick={() => onShareWhatsApp(group.id)} title="Bagikan">
                  <Send size={16} />
                </button>
                <button className="icon-action-btn" onClick={() => onEditCategory(group)} title="Edit">
                  <Edit2 size={16} />
                </button>
                <button className="icon-action-btn danger" onClick={() => onDeleteCategory(group.id)} title="Hapus">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="group-events">
              {group.events.length > 0 ? (
                group.events.map(event => (
                  <div key={event.id} className="group-event-item" onClick={() => onEditEvent(event)}>
                    <div className="event-date-info">
                      <span className="date-num">{format(parseISO(event.date), 'dd')}</span>
                      <span className="date-month">{format(parseISO(event.date), 'MMM', { locale: id }).toUpperCase()}</span>
                    </div>
                    <div className="event-content overflow-hidden">
                      <div className="event-title-row">
                        <span className={`event-title ${event.completed ? 'completed-text' : ''}`}>{event.title}</span>
                        <span className="event-time"><Clock size={12} /> {event.time}</span>
                      </div>
                      {event.description && <p className="event-desc-full">{event.description}</p>}
                    </div>
                    <ChevronRight size={18} className="chevron" />
                  </div>
                ))
              ) : (
                <div className="empty-group">Belum ada jadwal untuk kategori ini.</div>
              )}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="empty-state-pro glass">
            <div className="empty-icon-circle">
              <Hash size={32} />
            </div>
            <h3>Belum Ada Kategori</h3>
            <p>Kategori membantu Anda menyusun jadwal dengan warna yang berbeda.</p>
            <button className="btn-primary bordered mt-1" onClick={onAddCategory}>Buat Sekarang</button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .category-group-view { padding-top: 0.5rem; }
        .view-header-pro { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 2rem; position: relative; }
        .header-text-full { flex: 1; min-width: 0; }
        .header-text-full .title { font-size: 1.5rem; font-weight: 900; letter-spacing: -1px; line-height: 1.2; margin-bottom: 0.25rem; }
        .header-text-full .subtitle { font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; line-height: 1.4; }
        
        .add-cat-btn.glass-btn { padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; flex-shrink: 0; align-self: center; }
        .nowrap { white-space: nowrap; }
        
        .accent-glow { border: 1.5px solid var(--accent-color) !important; color: var(--accent-color) !important; background: white !important; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.08) !important; }

        .category-groups { display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 40px; }
        .cat-group { overflow: hidden; padding: 0; border-radius: 24px; border: 1px solid rgba(0,0,0,0.06); }
        .cat-group-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; background: rgba(0,0,0,0.01); border-left: 8px solid #ccc; }
        .header-info .cat-name { font-size: 1.1rem; font-weight: 800; display: block; letter-spacing: -0.3px; }
        .event-count { font-size: 0.75rem; color: var(--text-secondary); font-weight: 800; text-transform: uppercase; }
        
        .header-actions { display: flex; gap: 8px; }
        .icon-action-btn { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); background: white; border: 1px solid #f1f5f9; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
        .icon-action-btn:hover { color: var(--accent-color); border-color: var(--accent-color); transform: translateY(-2px); }
        .icon-action-btn.danger:hover { color: var(--danger-color); border-color: var(--danger-color); }

        .group-events { display: flex; flex-direction: column; }
        .group-event-item { display: flex; align-items: center; gap: 1.25rem; padding: 1rem 1.5rem; border-top: 1px solid rgba(0,0,0,0.03); cursor: pointer; transition: 0.2s; }
        .group-event-item:hover { background: rgba(59, 130, 246, 0.02); }
        
        .event-date-info { display: flex; flex-direction: column; align-items: center; min-width: 45px; }
        .date-num { font-size: 1.3rem; font-weight: 900; line-height: 1; color: var(--text-main); }
        .date-month { font-size: 0.65rem; font-weight: 900; color: #94a3b8; }
        
        .event-title { font-size: 0.95rem; font-weight: 800; word-break: break-word; }
        .event-time { font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }
        
        .empty-icon-circle { width: 64px; height: 64px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; margin-bottom: 0.5rem; }

        @media (max-width: 480px) {
           .view-header-pro { flex-direction: column; align-items: flex-start; }
           .add-cat-btn.mobile-full-width { align-self: flex-start; margin-top: 0.5rem; width: fit-content; }
        }
      `}} />
    </div>
  );
}

export default CategoryGroupView;
