// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://example.com",
	// El Apple Wallet Web Service recibe peticiones máquina-a-máquina (Apple/APNs) sin
	// header Origin. La autenticación es por token (ApplePass / Bearer), no por cookies,
	// así que la protección CSRF por Origin no aporta seguridad y bloquearía a Apple.
	security: { checkOrigin: false },
	integrations: [mdx(), sitemap(), react()],
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});
