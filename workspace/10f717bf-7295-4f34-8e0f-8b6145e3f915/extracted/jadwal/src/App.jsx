import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, List, Layers, Plus,
  Settings, Share2, Info, ChevronLeft,
  ChevronRight, CheckCircle2, Circle,
  Trash2, Edit2, Send, Grid
} from 'lucide-react';
import {
  getAllCategories, getAllEvents, addCategory, addEvent,
  updateEvent, deleteEvent, toggleEventCompletion, deleteCategory, updateCategory
} from './db';
import Dashboard from './components/Dashboard';
import CategoryManager from './components/CategoryManager';
import EventForm from './components/EventForm';
import CategoryForm from './components/CategoryForm';
import CategoryGroupView from './components/CategoryGroupView';
import { format, getMonth, getYear, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [cats, evts] = await Promise.all([getAllCategories(), getAllEvents()]);
    setCategories(cats);
    setEvents(evts);
    setLoading(false);
  };

  const categoriesMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    }, {});
  }, [categories]);

  const handleAddEvent = (eventOrDate = null) => {
    if (eventOrDate instanceof Date || (typeof eventOrDate === 'string' && !isNaN(Date.parse(eventOrDate)))) {
      const dateStr = typeof eventOrDate === 'string' ? eventOrDate : format(eventOrDate, 'yyyy-MM-dd');
      setEditingEvent({ date: dateStr });
    } else {
      setEditingEvent(eventOrDate);
    }
    setCurrentView('event-form');
  };

  const handleEditCategory = (category = null) => {
    setEditingCategory(category);
    setCurrentView('category-form');
  };

  const handleShareWhatsApp = (catId = null) => {
    try {
      let text = "";
      const catName = catId ? categoriesMap[catId]?.name : "Semua Jadwal";

      text += `*📅 JADWAL KEGIATAN LENGKAP - WAL.IN*\n`;
      text += `*📂 Kategori: ${catName}*\n`;
      text += `------------------------------------\n`;

      const filteredEvents = events
        .filter(e => catId ? e.categoryId === catId : true)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

      if (filteredEvents.length === 0) {
        alert("Tidak ada jadwal untuk dibagikan.");
        return;
      }

      let currentIterMonth = "";
      let currentIterDate = "";

      filteredEvents.forEach(e => {
        const d = parseISO(e.date);
        const monthYearStr = format(d, 'MMMM yyyy', { locale: id }).toUpperCase();
        const dateStr = format(d, 'EEEE, dd MMMM', { locale: id });

        if (currentIterMonth !== monthYearStr) {
          text += `\n🗓️ *--- ${monthYearStr} ---*\n`;
          currentIterMonth = monthYearStr;
          currentIterDate = "";
        }

        if (currentIterDate !== dateStr) {
          text += `\n📍 *${dateStr.toUpperCase()}*\n`;
          currentIterDate = dateStr;
        }

        const statusIcon = e.completed ? "✅" : "⏰";
        text += `${statusIcon} [${e.time}] *${e.title}*\n`;
        if (e.description) {
          text += `└ _${e.description}_\n`;
        }
      });

      text += `\n------------------------------------\n`;
      text += `_Dikirim via Aplikasi Wal.in_`;

      const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

      // Standard window.open is usually the most compatible across all browsers
      const win = window.open(waUrl, '_blank', 'noopener');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        window.location.href = waUrl;
      }

    } catch (err) {
      console.error("WhatsApp Share Error:", err);
      alert("Maaf, terjadi kesalahan saat menyiapkan jadwal.");
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            categories={categories}
            events={events}
            categoriesMap={categoriesMap}
            onToggleComplete={async (id) => {
              await toggleEventCompletion(id);
              fetchData();
            }}
            onEditEvent={handleAddEvent}
            onDeleteEvent={async (id) => {
              if (confirm('Hapus jadwal ini?')) {
                await deleteEvent(id);
                fetchData();
              }
            }}
            onAddEvent={handleAddEvent}
            onUpdateCategory={async (id) => {
              await deleteCategory(id);
              fetchData();
            }}
            onShareWhatsApp={handleShareWhatsApp}
          />
        );
      case 'category-groups':
        return (
          <CategoryGroupView
            categories={categories}
            events={events}
            categoriesMap={categoriesMap}
            onEditEvent={handleAddEvent}
            onShareWhatsApp={handleShareWhatsApp}
            onAddCategory={() => handleEditCategory(null)}
            onEditCategory={handleEditCategory}
            onDeleteCategory={async (id) => {
              if (confirm('Hapus kategori ini beserta semua jadwal di dalamnya?')) {
                await deleteCategory(id);
                await fetchData();
              }
            }}
          />
        );
      case 'category-form':
        return (
          <CategoryForm
            initialCategory={editingCategory}
            onSubmit={async (data) => {
              if (editingCategory?.id) {
                await updateCategory(editingCategory.id, data);
              } else {
                await addCategory(data);
              }
              await fetchData();
              setCurrentView('category-groups');
              setEditingCategory(null);
            }}
            onCancel={() => {
              setCurrentView('category-groups');
              setEditingCategory(null);
            }}
          />
        );
      case 'event-form':
        return (
          <EventForm
            categories={categories}
            initialEvent={editingEvent}
            onSubmit={async (data) => {
              if (editingEvent?.id) {
                await updateEvent({ ...editingEvent, ...data });
              } else {
                await addEvent(data);
              }
              fetchData();
              setCurrentView('dashboard');
              setEditingEvent(null);
            }}
            onCancel={() => {
              setCurrentView('dashboard');
              setEditingEvent(null);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <header className="main-header glass">
        <div className="header-content container">
          <div className="brand" onClick={() => setCurrentView('dashboard')}>
            <img src="/logo.svg" alt="Wal.in" className="brand-icon" />
            <h1>Wal.in</h1>
          </div>
        </div>
      </header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Simplified 3-Item Bottom Navigation */}
      <nav className="bottom-nav glass">
        <button
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          <div className="nav-icon-wrapper">
            <Grid size={22} />
          </div>
          <span>Kalender</span>
        </button>

        <div className="nav-center-action">
          <button
            className="fab-add"
            onClick={() => handleAddEvent()}
          >
            <Plus size={28} />
          </button>
        </div>

        <button
          className={`nav-item ${currentView === 'category-groups' ? 'active' : ''}`}
          onClick={() => setCurrentView('category-groups')}
        >
          <div className="nav-icon-wrapper">
            <Layers size={22} />
          </div>
          <span>Grup</span>
        </button>
      </nav>

      <style dangerouslySetInnerHTML={{
        __html: `
        .app-container {
          padding-bottom: 70px;
        }
        .main-header {
          position: sticky;
          top: 0;
          z-index: 100;
          height: 50px;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .main-header h1 {
          font-size: 1rem;
          font-weight: 900;
          line-height: 1;
          color: #2563eb;
        }
        .header-content {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          height: 100%;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          height: 100%;
        }
        .brand-icon {
          width: 20px;
          height: 20px;
          color: #2563eb;
        }
      `}} />
    </div>
  );
}

export default App;
