import { openDB } from 'idb';

const DB_NAME = 'JadwalAppDB';
const DB_VERSION = 1;

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('categories')) {
                const categoryStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
                categoryStore.createIndex('name', 'name', { unique: true });
            }
            if (!db.objectStoreNames.contains('events')) {
                const eventStore = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
                eventStore.createIndex('categoryId', 'categoryId', { unique: false });
                eventStore.createIndex('date', 'date', { unique: false });
            }
        },
    });
};

// Categories CRUD
export const getAllCategories = async () => {
    const db = await initDB();
    return db.getAll('categories');
};

export const addCategory = async (category) => {
    const db = await initDB();
    return db.add('categories', {
        ...category,
        createdAt: new Date().toISOString(),
    });
};

export const updateCategory = async (category) => {
    const db = await initDB();
    return db.put('categories', category);
};

export const deleteCategory = async (id) => {
    const db = await initDB();
    // Also delete all events in this category
    const tx = db.transaction(['events', 'categories'], 'readwrite');
    const eventStore = tx.objectStore('events');
    const categoryStore = tx.objectStore('categories');

    const events = await eventStore.index('categoryId').getAll(id);
    for (const event of events) {
        await eventStore.delete(event.id);
    }
    await categoryStore.delete(id);
    return tx.done;
};

// Events CRUD
export const getAllEvents = async () => {
    const db = await initDB();
    return db.getAll('events');
};

export const getEventsByDateRange = async (start, end) => {
    const db = await initDB();
    const range = IDBKeyRange.bound(start, end);
    return db.getAllFromIndex('events', 'date', range);
};

export const addEvent = async (event) => {
    const db = await initDB();
    return db.add('events', {
        ...event,
        completed: false,
        createdAt: new Date().toISOString(),
    });
};

export const updateEvent = async (event) => {
    const db = await initDB();
    return db.put('events', event);
};

export const deleteEvent = async (id) => {
    const db = await initDB();
    return db.delete('events', id);
};

export const toggleEventCompletion = async (id) => {
    const db = await initDB();
    const event = await db.get('events', id);
    if (event) {
        event.completed = !event.completed;
        await db.put('events', event);
    }
    return event;
};
