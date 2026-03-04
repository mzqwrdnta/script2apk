import React, { useState, useMemo } from 'react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
  parseISO, startOfDay, getMonth, getYear, setMonth, setYear
} from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Share2, Plus,
  CheckCircle2, Circle, Clock, Info, Send, X, Edit2, Trash2,
  Filter, MoreVertical, Calendar as CalendarIcon, Hash, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple Indonesian Holiday Helper for 2026
const getHoliday = (date) => {
  const d = format(date, 'MM-dd');
  const holidays = {
    '01-01': 'Tahun Baru 2026',
    '01-29': 'Tahun Baru Imlek',
    '03-20': 'Hari Suci Nyepi',
    '03-20': 'Wafat Yesus Kristus',
    '03-22': 'Hari Raya Idul Fitri',
    '03-23': 'Hari Raya Idul Fitri',
    '05-01': 'Hari Buruh',
    '05-14': 'Kenaikan Yesus Kristus',
    '05-31': 'Hari Raya Waisak',
    '06-01': 'Hari Lahir Pancasila',
    '06-16': 'Hari Raya Idul Adha',
    '08-17': 'Hari Kemerdekaan RI',
    '12-25': 'Hari Raya Natal',
  };
  return holidays[d] || null;
};

function Dashboard({
  categories, events, categoriesMap, onToggleComplete,
  onEditEvent, onDeleteEvent, onAddEvent, onUpdateCategory, onShareWhatsApp
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showCatPopup, setShowCatPopup] = useState(null);

  const years = useMemo(() => {
    const currentYear = getYear(new Date());
    const arr = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      arr.push(i);
    }
    return arr;
  }, []);

  const months = [
    { value: 0, label: 'Januari' }, { value: 1, label: 'Februari' },
    { value: 2, label: 'Maret' }, { value: 3, label: 'April' },
    { value: 4, label: 'Mei' }, { value: 5, label: 'Juni' },
    { value: 6, label: 'Juli' }, { value: 7, label: 'Agustus' },
    { value: 8, label: 'September' }, { value: 9, label: 'Oktober' },
    { value: 10, label: 'November' }, { value: 11, label: 'Desember' }
  ];

  const renderHeader = () => {
    return (
      <div className="calendar-header-advanced">
        <div className="header-left-advanced">
          <div className="picker-triggers">
            <motion.div
              className="month-trigger"
              onClick={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="current-val">{format(currentMonth, 'MMMM', { locale: id })}</span>
              <ChevronDown size={14} className={showMonthPicker ? 'active' : ''} />
            </motion.div>

            <motion.div
              className="year-trigger"
              onClick={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false); }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="current-val">{format(currentMonth, 'yyyy')}</span>
              <ChevronDown size={14} className={showYearPicker ? 'active' : ''} />
            </motion.div>
          </div>

          <AnimatePresence>
            {showMonthPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="dropdown-picker-pro months"
              >
                {months.map(m => (
                  <div
                    key={m.value}
                    className={`dropdown-item ${getMonth(currentMonth) === m.value ? 'active' : ''}`}
                    onClick={() => { setCurrentMonth(setMonth(currentMonth, m.value)); setShowMonthPicker(false); }}
                  >
                    {m.label}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showYearPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="dropdown-picker-pro years"
              >
                {years.map(y => (
                  <div
                    key={y}
                    className={`dropdown-item ${getYear(currentMonth) === y ? 'active' : ''}`}
                    onClick={() => { setCurrentMonth(setYear(currentMonth, y)); setShowYearPicker(false); }}
                  >
                    {y}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="header-right-advanced">
          <div className="nav-controls-pro">

            <div className="arrow-nav-group">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="arrow-btn"><ChevronLeft size={20} /></button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="arrow-btn"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryLegend = () => {
    return (
      <div className="category-legend-pro">
        <div className="legend-items">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="legend-pill"
              style={{ '--cat-color': cat.color }}
              onClick={() => setShowCatPopup(cat)}
            >
              <span className="pill-dot"></span>
              <span className="pill-name">{cat.name}</span>
            </div>
          ))}
          {categories.length === 0 && <span className="no-cat-hint">Belum ada kategori</span>}
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
    return (
      <div className="calendar-grid-head">
        {days.map((day, idx) => (
          <div key={day} className={`day-label-pro ${idx === 0 ? 'is-sunday' : ''}`}>{day}</div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        const dayEvents = events
          .filter(e => isSameDay(parseISO(e.date), cloneDay))
          .sort((a, b) => a.time.localeCompare(b.time));

        const holidayName = getHoliday(cloneDay);
        const isSunday = getMonth(cloneDay) !== -1 && cloneDay.getDay() === 0;

        days.push(
          <div
            key={day.toString()}
            className={`cell-pro ${!isSameMonth(day, monthStart) ? "off-month" : ""} ${isSameDay(day, new Date()) ? "today" : ""} ${isSunday || holidayName ? 'is-holiday' : ''}`}
            onClick={() => onAddEvent(cloneDay)}
          >
            <div className="cell-top-pro">
              <span className="cell-num-pro">{format(day, "d")}</span>
              {holidayName && <span className="holiday-dot" title={holidayName}></span>}
            </div>
            <div className="cell-bars-pro">
              {dayEvents.map(e => (
                <div
                  key={e.id}
                  className={`bar-pro ${e.completed ? 'done' : ''}`}
                  style={{ backgroundColor: categoriesMap[e.categoryId]?.color || '#ccc' }}
                  onClick={(ex) => {
                    ex.stopPropagation();
                    setSelectedEvent(e);
                    setShowDetail(true);
                  }}
                >
                  <span className="bar-time">{e.time}</span>
                  <span className="bar-text">{e.title}</span>
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid-row-pro" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="calendar-body-pro">{rows}</div>;
  };

  return (
    <div className="container dashboard-pro fade-in">
      <section className="main-card-pro glass">
        {renderCategoryLegend()}
        <div className="calendar-content-pro">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>
      </section>

      {/* Category Info Popup */}
      <AnimatePresence>
        {showCatPopup && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCatPopup(null)}
          >
            <motion.div
              className="modal-content-pro glass mobile-half"
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header-pro">
                <h3 className="modal-title-pro">Opsi Kategori</h3>
                <button className="close-btn-pro" onClick={() => setShowCatPopup(null)}><X size={18} /></button>
              </div>
              <div className="modal-body-pro">
                <div className="cat-pill-preview" style={{ '--cat-color': showCatPopup.color }}>
                  <div className="pill-dot"></div>
                  <strong>{showCatPopup.name}</strong>
                </div>
                <div className="modal-actions-pro">
                  <button className="action-row-pro bordered highlight" onClick={() => {
                    setShowCatPopup(null);
                    onShareWhatsApp(showCatPopup.id);
                  }}>
                    <Send size={16} /> <span>Bagikan ke WhatsApp</span>
                  </button>
                  <p className="modal-tip-pro">Ketuk menu <strong>Grup</strong> di bawah untuk mengedit kategory ini.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedEvent && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              className="modal-content-pro glass"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header-pro">
                <div className="cat-tag-pro" style={{ backgroundColor: categoriesMap[selectedEvent.categoryId]?.color }}>
                  {categoriesMap[selectedEvent.categoryId]?.name}
                </div>
                <button className="close-btn-pro" onClick={() => setShowDetail(false)}><X size={18} /></button>
              </div>

              <div className="modal-body-pro overflow-hidden">
                <h3 className={`detail-title-pro ${selectedEvent.completed ? 'completed-text' : ''}`}>
                  {selectedEvent.title}
                </h3>

                <div className="detail-meta-pro">
                  <div className="meta-item-pro">
                    <Clock size={14} /> <span>{selectedEvent.time}</span>
                  </div>
                  <div className="meta-item-pro">
                    <CalendarIcon size={14} /> <span>{format(parseISO(selectedEvent.date), 'EEEE, dd MMMM yyyy', { locale: id })}</span>
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="detail-desc-pro scroll-y">
                    <p>{selectedEvent.description}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer-pro">
                <button
                  className={`main-action-pro bordered ${selectedEvent.completed ? 'undo' : 'done'}`}
                  onClick={() => {
                    onToggleComplete(selectedEvent.id);
                    setSelectedEvent({ ...selectedEvent, completed: !selectedEvent.completed });
                  }}
                >
                  {selectedEvent.completed ? 'Batal Selesai' : 'Tandai Selesai'}
                </button>
                <div className="footer-btns-pro">
                  <button className="icon-btn-pro bordered" onClick={() => {
                    setShowDetail(false);
                    onEditEvent(selectedEvent);
                  }}>
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-btn-pro bordered danger" onClick={() => {
                    setShowDetail(false);
                    onDeleteEvent(selectedEvent.id);
                  }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .dashboard-pro { padding-top: 0.5rem; }
        .main-card-pro { border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        
        .category-legend-pro { padding: 0.75rem 1rem; background: rgba(0,0,0,0.01); border-bottom: 1px solid rgba(0,0,0,0.03); }
        .legend-items { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .legend-pill { display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: white; border-radius: 20px; border: 1.5px solid #f1f5f9; cursor: pointer; transition: 0.2s; }
        .pill-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--cat-color); }
        .pill-name { font-size: 0.65rem; font-weight: 800; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.3px; }

        .calendar-content-pro { padding: 1.25rem; }
        
        /* Advanced Header */
        .calendar-header-advanced { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .header-left-advanced { position: relative; display: flex; align-items: center; }
        .picker-triggers { display: flex; align-items: center; gap: 0.5rem; background: #f1f5f9; padding: 4px; border-radius: 12px; }
        
        .month-trigger, .year-trigger { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 10px; cursor: pointer; transition: 0.2s; }
        .month-trigger:hover, .year-trigger:hover { background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.04); }
        
        .current-val { font-size: 1rem; font-weight: 900; color: var(--text-main); letter-spacing: -0.3px; }
        .picker-triggers svg { color: var(--text-secondary); transition: 0.3s; }
        .picker-triggers svg.active { transform: rotate(180deg); color: var(--accent-color); }
        
        .dropdown-picker-pro { position: absolute; top: 100%; margin-top: 8px; z-index: 1000; width: 180px; max-height: 300px; overflow-y: auto; background: white; border-radius: 16px; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 15px 35px rgba(0,0,0,0.1); padding: 0.5rem; }
        .dropdown-picker-pro.years { left: 100px; }
        .dropdown-item { padding: 8px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .dropdown-item:hover { background: rgba(59, 130, 246, 0.05); color: var(--accent-color); }
        .dropdown-item.active { background: var(--accent-color); color: white; }

        .header-right-advanced { display: flex; align-items: center; }
        .nav-controls-pro { display: flex; align-items: center; gap: 0.75rem; }
        .today-chip { padding: 8px 14px; border-radius: 10px; background: white; border: 2.0px solid #eef2f6; font-size: 0.7rem; font-weight: 900; letter-spacing: 0.5px; }
        .arrow-nav-group { display: flex; background: white; border-radius: 12px; border: 2.0px solid #eef2f6; overflow: hidden; }
        .arrow-btn { width: 38px; height: 38px; color: var(--text-secondary); }
        .arrow-btn:hover { background: #f8fafc; color: var(--accent-color); }
        
        .calendar-grid-head { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 0.5rem; }
        .day-label-pro { text-align: center; font-size: 0.65rem; font-weight: 900; color: #cbd5e1; padding: 0.75rem 0; letter-spacing: 1px; border-bottom: 1px solid transparent; }
        .is-sunday { color: #f43f5e; opacity: 0.8; }

        .cell-pro { border: 0.5px solid #f1f5f9; min-height: 100px; padding: 6px; display: flex; flex-direction: column; cursor: pointer; transition: 0.2s; background: white; }
        .today { background: rgba(59, 130, 246, 0.02); }
        
        .bar-pro { padding: 4px 6px; border-radius: 6px; color: white; font-size: 0.65rem; font-weight: 800; margin-bottom: 4px; display: flex; flex-direction: column; gap: 2px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: 0.2s; }
        .bar-pro:hover { filter: brightness(1.1); transform: scale(1.02); }
        .bar-time { font-style: italic; opacity: 0.9; font-size: 0.6rem; }
        .bar-text { word-break: break-word; white-space: normal; line-height: 1.3; }
        
        @media (max-width: 480px) {
           .month-trigger .current-val { font-size: 0.85rem; }
           .year-trigger .current-val { font-size: 0.85rem; }
           .dropdown-picker-pro { width: 140px; }
        }
      `}} />
    </div>
  );
}

export default Dashboard;
