const spawn = require('cross-spawn');

class CliService {
    constructor(logger) {
        this.logger = logger;
    }

  
    exec(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const cwd = options.cwd || process.cwd();
            const env = { ...process.env, ...options.env };

            const fullCommand = `${command} ${args.join(' ')}`;
            this.logger.command(`$ ${fullCommand}`);
            this.logger.info(`📂 Working directory: ${cwd}`);

            const child = spawn(command, args, {
                cwd,
                env,
                shell: true,
                stdio: 'pipe'
            });

            let stdout = '';
            let stderr = '';

            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    const text = data.toString();
                    stdout += text;
                    const lines = text.split(/\r?\n/);
                    for (const line of lines) {
                        if (line.trim()) this.logger.stdout(line);
                    }
                });
            }

            if (child.stderr) {
                child.stderr.on('data', (data) => {
                    const text = data.toString();
                    stderr += text;
                    const lines = text.split(/\r?\n/);
                    for (const line of lines) {
                        if (line.trim()) this.logger.stderr(line);
                    }
                });
            }

            child.on('error', (error) => {
                this.logger.error(`Command failed to start: ${error.message}`);
                reject(new Error(`Command failed: ${fullCommand}\n${error.message}`));
            });

            child.on('close', (code) => {
                if (code === 0) {
                    this.logger.success(`Command completed: ${command} (exit code: 0)`);
                    resolve({ stdout, stderr, code });
                } else {
                    // Beberapa commands return non-zero tapi ok (misal npm warn)
                    if (options.allowNonZero) {
                        this.logger.warning(`Command exited with code ${code}: ${command}`);
                        resolve({ stdout, stderr, code });
                    } else {
                        this.logger.error(`Command failed with code ${code}: ${fullCommand}`);
                        reject(new Error(`Command failed (code ${code}): ${fullCommand}\n${stderr}`));
                    }
                }
            });

            // Timeout safety
            const timeout = options.timeout || 600000; // 10 menit default
            const timer = setTimeout(() => {
                child.kill('SIGTERM');
                this.logger.error(`Command timed out after ${timeout / 1000}s: ${fullCommand}`);
                reject(new Error(`Command timed out: ${fullCommand}`));
            }, timeout);

            child.on('close', () => clearTimeout(timer));
        });
    }

    /**
     * Jalankan multiple commands secara sequential
     */
    async execSequence(commands, cwd) {
        const results = [];
        for (const cmd of commands) {
            const result = await this.exec(cmd.command, cmd.args || [], {
                cwd: cmd.cwd || cwd,
                env: cmd.env,
                allowNonZero: cmd.allowNonZero,
                timeout: cmd.timeout
            });
            results.push(result);
        }
        return results;
    }

    /**
     * Cek apakah suatu command tersedia di system
     */
    async checkCommand(command) {
        try {
            await this.exec('which', [command], { allowNonZero: true });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Cek prerequisite tools yang dibutuhkan
     */
    async checkPrerequisites() {
        const tools = {
            node: 'Node.js',
            npm: 'NPM',
            java: 'Java JDK (untuk Android build)',
            gradle: 'Gradle (opsional, Capacitor bundled)'
        };

        const status = {};
        for (const [cmd, name] of Object.entries(tools)) {
            const available = await this.checkCommand(cmd);
            status[cmd] = { name, available };
            if (available) {
                this.logger.success(`${name} ✓ tersedia`);
            } else {
                this.logger.warning(`${name} ✗ tidak ditemukan`);
            }
        }
        return status;
    }
}

module.exports = CliService;
