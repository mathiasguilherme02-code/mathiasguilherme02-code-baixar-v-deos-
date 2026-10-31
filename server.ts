import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

export const app = express();

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed)) return parsed;
  }
  return Number(process.env.PORT) || 3000;
}

const PORT = getPort();

app.use(express.json());

// API Routes
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  let platform = 'unknown';
  if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
  else if (url.includes('instagram.com')) platform = 'instagram';
  else if (url.includes('tiktok.com')) platform = 'tiktok';

  if (platform === 'unknown') {
    return res.status(400).json({ error: 'Plataforma não suportada ou URL inválida.' });
  }

  await new Promise(resolve => setTimeout(resolve, 1500)); 

  res.json({
    platform,
    title: `Vídeo do ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
    duration: '00:15',
    downloadUrl: '#',
  });
});

// Vite middleware for development or static serving for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (!isProd || !hasDist) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Start server unless running in a serverless environment like Vercel Functions
if (!process.env.VERCEL) {
  startServer();
}

export default app;
