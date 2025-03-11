import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  resolve: {
    alias: {
      "@lib": "../lib-src",
    },
  },

  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      cleanVueFileName: false,
      tsconfigPath: "tsconfig.build.json",
    }),
  ],

  css: {
    modules: {
      localsConvention: "dashes",
    },
  },

  build: {
    sourcemap: true,
    lib: {
      entry: [
        // path.resolve(__dirname, "lib-src/course-clear-react.tsx"),
        path.resolve(__dirname, "lib-src/course-clear-web.ts"),
      ],
      name: "course-clear",
      fileName: (format, name) => `${name}.${format}.js`,
      // fileName: "course-clear",
      formats: ["es", "cjs"], // Removes UMD
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime", // Add jsx-runtime to external
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "ReactJSXRuntime", // Declare it as global
        },
      },
    },
  },
});
