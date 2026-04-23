import React, { useState } from 'react';
import { Download, Youtube, Instagram, Music, Link as LinkIcon, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Platform = 'youtube' | 'instagram' | 'tiktok' | 'unknown';

interface VideoMeta {
  platform: Platform;
  title: string;
  thumbnail: string;
  duration: string;
  downloadUrl: string;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'youtube': return <Youtube className="w-6 h-6 text-red-500" />;
      case 'instagram': return <Instagram className="w-6 h-6 text-pink-500" />;
      case 'tiktok': return <Music className="w-6 h-6 text-teal-400" />;
      default: return <LinkIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setVideoMeta(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao analisar o link.');
      }

      setVideoMeta(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-[720px] flex flex-col items-center text-center space-y-4 mb-10 mt-12 md:mt-24">
        <h1 className="text-4xl md:text-[48px] font-bold tracking-[-1px] leading-[1.1] text-white mb-2">
          Baixe mídia de qualquer lugar, em segundos.
        </h1>
        <p className="text-[#94A3B8] text-[18px] max-w-xl mb-10">
          A ferramenta profissional para salvar vídeos do YouTube, Instagram, TikTok e mais com a qualidade máxima original.
        </p>
        
        <div className="flex justify-center gap-10 mt-8 opacity-60">
          <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[1px] text-white">
            <Youtube className="w-5 h-5" /> YouTube
          </div>
          <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[1px] text-white">
            <Instagram className="w-5 h-5" /> Instagram
          </div>
          <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[1px] text-white">
            <Music className="w-5 h-5" /> TikTok
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[720px]">
        <form onSubmit={handleAnalyze} className="bg-[#1E293B80] border border-[#334155] rounded-[20px] p-2 flex items-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-10 relative">
          <div className="pl-4 flex items-center pointer-events-none">
            <LinkIcon className="h-5 w-5 text-[#94A3B8]" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Cole o link do vídeo aqui..."
            className="w-full bg-transparent border-none text-white py-4 px-6 flex-1 text-[16px] outline-none placeholder:text-[#64748B]"
            required
          />
          <button
            type="submit"
            disabled={loading || !url}
            className="bg-[#38BDF8] hover:bg-[#0EA5E9] disabled:opacity-50 text-[#0F172A] font-bold px-8 py-4 rounded-[14px] transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'DOWNLOAD'}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-10 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {videoMeta && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative overflow-hidden rounded-[16px] bg-[#1E293B] border border-[#334155]"
            >
              <div className="aspect-video w-full bg-[#334155] relative">
                <img 
                  src={videoMeta.thumbnail} 
                  alt={videoMeta.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[#1E293B] via-transparent to-transparent">
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="text-[10px] bg-[#0EA5E9] text-white px-2 py-1 rounded-[4px] font-bold uppercase tracking-wider">
                      {videoMeta.platform}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/60 rounded text-xs font-mono font-medium text-white">
                    {videoMeta.duration}
                  </div>
                </div>
              </div>

              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="card-info overflow-hidden flex-1">
                  <h3 className="text-[16px] font-semibold mb-1 text-white truncate">
                    {videoMeta.title}
                  </h3>
                  <div className="text-[14px] text-[#64748B]">
                    Qualidade HD Pronta
                  </div>
                </div>
                
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button onClick={() => alert("Este é um protótipo.")} className="py-3 px-6 bg-[#38BDF8] hover:bg-[#0EA5E9] rounded-[14px] text-[#0F172A] font-bold flex items-center justify-center gap-2 transition-colors text-[14px]">
                    <Download className="w-4 h-4" />
                    BAIXAR MP4
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer Info */}
      <footer className="mt-auto pt-16 pb-8 text-center text-slate-500 text-sm max-w-xl">
        <p>
          Este projeto é uma interface (Front-end) preparatória. Baixar vídeos de terceiros na prática exige a conexão de um serviço de backend ou API (ex: RapidAPI) que contorne os bloqueios oficiais das plataformas.
        </p>
      </footer>

    </div>
  );
}
