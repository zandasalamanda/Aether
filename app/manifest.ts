import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kairo — Map the way. Build the day.",
    short_name: "Kairo",
    description: "Turn goals, ideas, and available time into a clear plan for today.",
    start_url: "/app/today",
    display: "standalone",
    background_color: "#0a0b0d",
    theme_color: "#0a0b0d",
    icons: [
      { src: "/kairo-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/kairo-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
