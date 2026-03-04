class Logger {
    constructor(io, projectId) {
        this.io = io;
        this.projectId = projectId;
        this.logs = [];
    }

    emit(type, message) {
        const entry = {
            type,
            message,
            timestamp: new Date().toISOString()
        };
        this.logs.push(entry);
        if (this.io) {
            this.io.to(this.projectId).emit('build:log', entry);
        }
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${prefix} [${this.projectId?.slice(0, 8)}] ${message}`);
    }

    info(msg) { this.emit('info', msg); }
    success(msg) { this.emit('success', msg); }
    error(msg) { this.emit('error', msg); }
    warning(msg) { this.emit('warning', msg); }
    command(msg) { this.emit('command', msg); }
    stdout(msg) { this.emit('stdout', msg); }
    stderr(msg) { this.emit('stderr', msg); }

    getLogs() { return this.logs; }
}

module.exports = Logger;
