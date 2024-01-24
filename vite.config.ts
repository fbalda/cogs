// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    plugins: [svelte()],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    base: process.env.BASE_URL ?? "/",
  });
};
