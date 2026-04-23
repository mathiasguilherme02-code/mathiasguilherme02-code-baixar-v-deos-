import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/analyze', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    // Detect platform
    let platform = 'unknown';
    if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
    else if (url.includes('instagram.com')) platform = 'instagram';
    else if (url.includes('tiktok.com')) platform = 'tiktok';

    if (platform === 'unknown') {
      return res.status(400).json({ error: 'Plataforma não suportada ou URL inválida.' });
    }

    // MOCK: In a real app, you would call a RapidAPI service or yt-dlp here to get metadata
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    res.json({
      platform,
      title: `Vídeo do ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
      thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
      duration: '00:15',
      downloadUrl: '#', // In a real app, this would be a temporary signed URL or a direct API pipe
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
