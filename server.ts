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

// API: Analyze URL and extract actual media download links
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  const cleanUrl = url.trim();
  let platform = 'unknown';
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) platform = 'youtube';
  else if (cleanUrl.includes('instagram.com')) platform = 'instagram';
  else if (cleanUrl.includes('tiktok.com')) platform = 'tiktok';

  if (platform === 'unknown') {
    return res.status(400).json({ error: 'Plataforma não suportada. Cole um link do YouTube, TikTok ou Instagram.' });
  }

  try {
    const btch = await import('btch-downloader');

    // 1. TikTok
    if (platform === 'tiktok') {
      try {
        const tt = await btch.ttdl(cleanUrl);
        if (tt && tt.video && tt.video.length > 0 && tt.video[0]) {
          return res.json({
            platform: 'tiktok',
            title: tt.title || 'Vídeo do TikTok',
            thumbnail: tt.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
            duration: 'HD',
            downloadUrl: tt.video[0],
            audioUrl: tt.audio && tt.audio[0] ? tt.audio[0] : undefined,
          });
        }
      } catch (ttErr) {
        console.warn('btch.ttdl error, tentando fallback TikWM:', ttErr);
      }

      // Fallback TikWM
      try {
        const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`);
        const tikJson = await tikRes.json();
        if (tikJson.code === 0 && tikJson.data) {
          const videoUrl = tikJson.data.play || tikJson.data.wmplay;
          return res.json({
            platform: 'tiktok',
            title: tikJson.data.title || 'Vídeo do TikTok',
            thumbnail: tikJson.data.cover || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
            duration: tikJson.data.duration ? `${tikJson.data.duration}s` : 'HD',
            downloadUrl: videoUrl,
            audioUrl: tikJson.data.music,
          });
        }
      } catch (fallbackErr) {
        console.error('TikWM fallback error:', fallbackErr);
      }
    }

    // 2. YouTube
    if (platform === 'youtube') {
      try {
        const yt = await btch.youtube(cleanUrl);
        if (yt && (yt.mp4 || yt.mp3)) {
          return res.json({
            platform: 'youtube',
            title: yt.title || 'Vídeo do YouTube',
            thumbnail: yt.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
            duration: 'HD',
            downloadUrl: yt.mp4 || yt.mp3,
            audioUrl: yt.mp3,
          });
        }
      } catch (ytErr) {
        console.warn('btch.youtube error:', ytErr);
      }
    }

    // 3. Instagram
    if (platform === 'instagram') {
      try {
        const ig = await btch.igdl(cleanUrl);
        if (ig && Array.isArray(ig.result) && ig.result.length > 0) {
          const valid = ig.result.find((item: any) => item.url && item.url.trim().length > 0);
          if (valid) {
            return res.json({
              platform: 'instagram',
              title: 'Reel / Vídeo do Instagram',
              thumbnail: valid.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
              duration: 'HD',
              downloadUrl: valid.url,
            });
          }
        }
      } catch (igErr) {
        console.warn('btch.igdl error:', igErr);
      }
    }

    // Se a extração automatizada não retornar link direto da plataforma
    return res.status(422).json({
      error: 'Não foi possível extrair a mídia desse link diretamente. O perfil ou vídeo pode ser privado ou restrito.',
    });
  } catch (error: any) {
    console.error('Erro na análise da mídia:', error);
    return res.status(500).json({ error: 'Erro interno ao processar link: ' + error.message });
  }
});

// API: Proxy stream that triggers direct device file download
app.get('/api/download-file', async (req, res) => {
  const fileUrl = req.query.url as string;
  const rawFilename = (req.query.filename as string) || 'video.mp4';
  const filename = rawFilename.replace(/[^\w.-]/gi, '_');

  if (!fileUrl) {
    return res.status(400).send('URL do arquivo não fornecida');
  }

  try {
    const upstreamRes = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': fileUrl,
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      return res.redirect(fileUrl);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', filename.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4');

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const { Readable } = await import('stream');
    const nodeStream = Readable.fromWeb(upstreamRes.body as any);
    nodeStream.pipe(res);
  } catch (err: any) {
    console.error('Download stream error:', err);
    res.redirect(fileUrl);
  }
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
