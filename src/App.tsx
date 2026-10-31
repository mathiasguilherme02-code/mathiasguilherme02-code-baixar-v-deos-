import React, { useState } from 'react';
import { 
  Download, 
  Youtube, 
  Instagram, 
  Music, 
  Link as LinkIcon, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ClipboardPaste, 
  ExternalLink,
  Volume2,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Platform = 'youtube' | 'instagram' | 'tiktok' | 'unknown';

interface VideoMeta {
  platform: Platform;
  title: string;
  thumbnail: string;
  duration: string;
  downloadUrl: string;
  audioUrl?: string;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'youtube': return <Youtube className="w-6 h-6 text-red-500" />;
      case 'instagram': return <Instagram className="w-6 h-6 text-pink-500" />;
      case 'tiktok': return <Music className="w-6 h-6 text-teal-400" />;
      default: return <LinkIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const match = text.match(/https?:\/\/[^\s]+/i);
          setUrl(match ? match[0] : text.trim());
        }
      }
    } catch {
      // Browser clipboard permission may be blocked on mobile
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    let targetUrl = url.trim();
    const match = targetUrl.match(/https?:\/\/[^\s]+/i);
    if (match) {
      targetUrl = match[0];
      setUrl(targetUrl);
    }

    setLoading(true);
    setError('');
    setVideoMeta(null);
    setDownloadSuccess(false);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao analisar o link.');
      }

      setVideoMeta(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar o link.');
    } finally {
      setLoading(false);
    }
  };

  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  const resetToHome = () => {
    setUrl('');
    setVideoMeta(null);
    setLoading(false);
    setDownloading(false);
    setDownloadSuccess(false);
  };

  const triggerDeviceDownload = (mediaUrl: string, isAudio: boolean = false) => {
    if (!mediaUrl) return;
    setDownloading(true);
    setDownloadSuccess(false);

    const cleanTitle = (videoMeta?.title || 'midia')
      .replace(/[^\w\s-]/gi, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 35) || 'video';

    const ext = isAudio ? 'mp3' : 'mp4';
    const filename = `${cleanTitle}.${ext}`;

    const downloadEndpoint = `/api/download-file?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(filename)}`;

    // Mobile check: avoids pop-up blockers on iOS Safari and Android Chrome
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.assign(downloadEndpoint);
    } else {
      const link = document.createElement('a');
      link.href = downloadEndpoint;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Show success feedback
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);

      // Automatically return to main page after finishing download
      setTimeout(() => {
        resetToHome();
        setDownloadSuccessToast(true);
        setTimeout(() => {
          setDownloadSuccessToast(false);
        }, 4000);
      }, 2500);
    }, 1200);
  };

  return (
    <div className="min-h-screen p-4 md:p-12 flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-[720px] flex flex-col items-center text-center space-y-4 mb-8 mt-8 md:mt-16">
        <h1 className="text-3xl md:text-[46px] font-bold tracking-[-1px] leading-[1.1] text-white mb-1">
          Baixe mídia de qualquer lugar, em segundos.
        </h1>
        <p className="text-[#94A3B8] text-base md:text-[18px] max-w-xl mb-6">
          A ferramenta para salvar vídeos do YouTube, Instagram e TikTok direto na pasta de Downloads do seu celular ou computador.
        </p>
        
        <div className="flex justify-center gap-6 md:gap-10 mt-4 opacity-70">
          <div className="flex items-center gap-2 text-[12px] md:text-[13px] font-semibold uppercase tracking-[1px] text-white">
            <Youtube className="w-4 h-4 md:w-5 md:h-5 text-red-500" /> YouTube
          </div>
          <div className="flex items-center gap-2 text-[12px] md:text-[13px] font-semibold uppercase tracking-[1px] text-white">
            <Instagram className="w-4 h-4 md:w-5 md:h-5 text-pink-500" /> Instagram
          </div>
          <div className="flex items-center gap-2 text-[12px] md:text-[13px] font-semibold uppercase tracking-[1px] text-white">
            <Music className="w-4 h-4 md:w-5 md:h-5 text-teal-400" /> TikTok
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[720px]">
        {/* Toast Notification when returning to main page */}
        <AnimatePresence>
          {downloadSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-emerald-300 text-sm shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Download concluído!</strong> O arquivo foi salvo no seu dispositivo. Cole outro link abaixo para continuar.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDownloadSuccessToast(false)}
                className="text-emerald-400/70 hover:text-emerald-200 text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAnalyze} className="bg-[#1E293B80] border border-[#334155] rounded-[20px] p-2 flex flex-col sm:flex-row items-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-6 relative">
          <div className="flex items-center w-full flex-1">
            <div className="pl-3 md:pl-4 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-[#94A3B8]" />
            </div>
            <input
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Cole o link do vídeo aqui..."
              className="w-full bg-transparent border-none text-white py-3 md:py-4 px-3 md:px-4 flex-1 text-base outline-none placeholder:text-[#64748B]"
              required
            />
            {/* Clipboard Paste Shortcut */}
            <button
              type="button"
              onClick={handlePaste}
              title="Colar link da área de transferência"
              className="mr-2 px-2.5 py-1.5 rounded-lg bg-[#334155]/60 hover:bg-[#334155] text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Colar</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !url}
            className="w-full sm:w-auto bg-[#38BDF8] hover:bg-[#0EA5E9] disabled:opacity-50 text-[#0F172A] font-bold px-6 md:px-8 py-3.5 md:py-4 rounded-[14px] transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>ANALISANDO...</span>
              </>
            ) : (
              'DOWNLOAD'
            )}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
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
              className="relative overflow-hidden rounded-[16px] bg-[#1E293B] border border-[#334155] shadow-xl"
            >
              <div className="aspect-video w-full bg-[#334155] relative overflow-hidden">
                <img 
                  src={videoMeta.thumbnail} 
                  alt={videoMeta.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[#1E293B] via-transparent to-transparent">
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="text-[10px] bg-[#0EA5E9] text-white px-2 py-1 rounded-[4px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      {getPlatformIcon(videoMeta.platform)}
                      {videoMeta.platform}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/70 rounded text-xs font-mono font-medium text-white backdrop-blur-sm">
                    {videoMeta.duration}
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="text-[13px] text-[#94A3B8] flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                    Link verificado e pronto
                  </div>
                  <button
                    type="button"
                    onClick={resetToHome}
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 transition-colors"
                    title="Voltar para a página principal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Voltar</span>
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="text-[17px] font-semibold text-white line-clamp-2">
                    {videoMeta.title}
                  </h3>
                </div>

                {downloadSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-3 text-emerald-300 text-xs md:text-sm shadow-md"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 animate-pulse" />
                    <div>
                      <p className="font-semibold text-emerald-200">Download concluído!</p>
                      <p className="text-emerald-400/90 text-xs">O arquivo foi enviado para o seu dispositivo. Retornando à página principal...</p>
                    </div>
                  </motion.div>
                )}
                
                {/* Download Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-700/60">
                  {/* Primary Video Download */}
                  <button 
                    onClick={() => triggerDeviceDownload(videoMeta.downloadUrl, false)} 
                    disabled={downloading}
                    className="flex-1 py-3 px-5 bg-[#38BDF8] hover:bg-[#0EA5E9] active:scale-[0.98] rounded-[14px] text-[#0F172A] font-bold flex items-center justify-center gap-2 transition-all text-[14px] shadow-lg shadow-sky-500/20"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Iniciando download...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        BAIXAR VÍDEO (MP4)
                      </>
                    )}
                  </button>

                  {/* Audio MP3 Download if available */}
                  {videoMeta.audioUrl && (
                    <button 
                      onClick={() => triggerDeviceDownload(videoMeta.audioUrl!, true)}
                      disabled={downloading}
                      className="py-3 px-4 bg-slate-700/80 hover:bg-slate-700 active:scale-[0.98] rounded-[14px] text-white font-semibold flex items-center justify-center gap-2 transition-all text-[13px]"
                      title="Baixar somente a faixa de áudio"
                    >
                      <Volume2 className="w-4 h-4 text-teal-400" />
                      Áudio (MP3)
                    </button>
                  )}

                  {/* Fallback direct link */}
                  <a
                    href={videoMeta.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-700/40 hover:bg-slate-700/80 rounded-[14px] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                    title="Abrir link original de mídia"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer Info */}
      <footer className="mt-auto pt-12 pb-6 text-center text-slate-500 text-xs md:text-sm max-w-xl">
        <p>
          Os downloads são salvos diretamente no armazenamento do seu dispositivo (Android, iPhone, Windows, Mac). Mídias de contas privadas não são suportadas.
        </p>
      </footer>

    </div>
  );
}
