import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      cleanVueFileName: false,
      tsconfigPath: "tsconfig.build.json",
    }),
    tsconfigPaths(),
  ],

  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "lib/CourseClear.ts"),
      name: "course-clear",
      fileName: (format, name) => `${name}.${format}.js`,
      formats: ["es"],
    },
  },
});
