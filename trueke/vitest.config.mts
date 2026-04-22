import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'src/components/ui/**'],
    pool: 'threads',
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**',
        'src/hooks/**',
        'src/components/sections/**',
        'src/components/misc/**',
      ],
      exclude: ['src/components/ui/**', '**/*.test.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
