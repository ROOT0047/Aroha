import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://aroha.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Public routes only. Everything else is behind the auth gate.
        const paths = ["/", "/aroha", "/features", "/habit-tracker", "/time-blocking-app"];
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...paths.map((p) =>
            [
              `  <url>`,
              `    <loc>${BASE_URL}${p}</loc>`,
              `    <changefreq>weekly</changefreq>`,
              `    <priority>${p === "/" ? "1.0" : "0.8"}</priority>`,
              `  </url>`,
            ].join("\n"),
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
