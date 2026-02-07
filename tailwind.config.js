/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'discord-dark': '#36393f',
        'discord-sidebar': '#202225',
        'discord-channel': '#2f3136',
        'nexus-accent': '#5865F2', // Blurple
      }
    },
  },
  plugins: [],
}
