import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Uniquement à l'intérieur de docker-compose.dev.yml (voir DOCKER_DEV
  // dans ce fichier) : les évènements natifs de changement de fichier ne
  // traversent pas fiablement un volume Docker monté depuis l'hôte (Docker
  // Desktop sur Windows/macOS), il faut alors forcer le polling. Activé par
  // défaut, ce réglage casse le rechargement à chaud en dehors de Docker sur
  // cette machine (le watcher natif de Turbopack ne redétecte plus rien).
  ...(process.env.DOCKER_DEV === "true" && {
    watchOptions: {
      pollIntervalMs: 500,
    },
  }),
};

export default nextConfig;
