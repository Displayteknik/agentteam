import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: {
        invert: {
          css: {
            "--tw-prose-body": "#d1d5db",
            "--tw-prose-headings": "#ffffff",
            "--tw-prose-bold": "#ffffff",
            "--tw-prose-code": "#a5b4fc",
            "--tw-prose-links": "#a5b4fc",
            "--tw-prose-bullets": "#6b7280",
            "--tw-prose-counters": "#6b7280",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
