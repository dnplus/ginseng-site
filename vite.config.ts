import vinext from 'vinext';
import { defineConfig } from 'vite';

// Keep tool state inside the checkout, including in restricted sessions.
process.env.WRANGLER_SEND_METRICS ??= 'false';
process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
process.env.WRANGLER_REGISTRY_PATH ??= '.wrangler/dev-registry';
process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';
process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= 'false';

export default defineConfig(async () => {
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  return {
    // Polling stats every watched file; keep the in-repo pnpm store and build output out of it.
    server: { watch: { useFsEvents: false, usePolling: true, ignored: ['**/.pnpm-store/**', '**/.wrangler/**', '**/dist/**', '**/.omc/**'] } },
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        inspectorPort: false,
      }),
    ],
  };
});
