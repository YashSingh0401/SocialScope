import { defineConfig } from 'vite';
export default defineConfig({server:{proxy:{'/analytics':'http://127.0.0.1:8000','/events':'http://127.0.0.1:8000','/replays':'http://127.0.0.1:8000','/ready':'http://127.0.0.1:8000'}}});
