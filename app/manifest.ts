import type { MetadataRoute } from "next";

// Lets counsellors add Faith Connect to their phone's home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Faith Connect",
    short_name: "Faith Connect",
    description: "Follow up every first timer and new convert until they are planted.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#1e1b4b",
    theme_color: "#4338ca",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
