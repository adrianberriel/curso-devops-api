import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    coverage: {
      // Sin `include`, la cobertura solo mide los archivos que algún test importa:
      // los que no tienen test quedan fuera del denominador y el porcentaje sale
      // inflado. Midiendo todo src/ el número refleja el proyecto real.
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        // Bootstrap: arranca el servidor y no tiene lógica propia que testear.
        'src/main.ts',
        // Módulos: solo declaran controllers y providers, sin lógica.
        'src/**/*.module.ts',
      ],
    },
  },
});
