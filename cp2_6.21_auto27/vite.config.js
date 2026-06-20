import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    base: './',
    build: {
        target: 'es2020',
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
            input: {
                main: './index.html'
            }
        }
    },
    server: {
        port: 5180,
        open: false,
        host: true
    },
    optimizeDeps: {
        include: ['three']
    }
});
