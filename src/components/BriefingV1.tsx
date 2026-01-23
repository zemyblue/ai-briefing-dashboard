'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Calendar, Sparkles, Youtube, ExternalLink, Tag, ArrowRight, Zap, Layers } from 'lucide-react';

interface NewsItem {
  title: string;
  summary: string;
  content: string;
  link: string;
  source: string;
  og_image?: string | null;
  tags: string[];
}

interface VideoItem {
  title: string;
  channel: string;
  link: string;
  thumbnail: string;
  description: string;
}

interface BriefingData {
  date: string;
  keywords: string[];
  sections: {
    hype_check: NewsItem[];
    tech_deep_dive: NewsItem[];
    watch_this: VideoItem[];
  };
}

interface BriefingV1Props {
  briefingData: BriefingData;
  availableDates?: string[];
  selectedDate?: string | null;
  onDateChange?: (date: string | null) => void;
}

const BriefingCard = ({
  item,
  type,
  variant = 'default',
  onClick,
  className = ''
}: {
  item: NewsItem;
  type: 'hype' | 'deep';
  variant?: 'default' | 'hero';
  onClick: () => void;
  className?: string;
}) => {
  const isDeep = type === 'deep';
  const isHero = variant === 'hero';
  const hasImage = !!item.og_image;

  return (
    <motion.button
      layoutId={`card-${item.title}`}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative w-full text-left overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col
        ${isDeep
          ? 'bg-slate-900/60 border-purple-500/30 hover:border-purple-400/60'
          : 'bg-slate-900/40 border-white/10 hover:border-white/20 hover:bg-slate-800/40'
        }
        ${!hasImage || isHero ? (isDeep ? 'p-6' : 'p-5') : 'p-0'}
        ${isHero ? 'min-h-[180px]' : (isDeep ? 'min-h-[180px]' : 'min-h-[140px]')}
        ${className}
      `}
    >
      {isHero && hasImage && (
        <div className="absolute inset-0 z-0">
          <img 
            src={item.og_image!} 
            alt={item.title} 
            className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        </div>
      )}

      {isDeep && !hasImage && !isHero && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      {!isHero && hasImage && (
        <div className="w-full h-32 overflow-hidden relative border-b border-white/5 shrink-0 bg-slate-950/50">
          <img 
            src={item.og_image!} 
            alt={item.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
        </div>
      )}

      <div className={`relative z-10 w-full flex flex-col ${(!isHero && hasImage) ? 'flex-1 p-5 pt-4' : ''}`}>
        <div className="flex items-center gap-2 mb-3 opacity-70">
          <Tag className={`w-3 h-3 ${isDeep ? 'text-purple-400' : 'text-slate-400'}`} />
          <span
            className={`text-[10px] uppercase tracking-wider font-semibold ${isDeep ? 'text-purple-300' : 'text-slate-400'}`}
          >
            {item.source}
          </span>
        </div>

        <h3 className={`font-bold leading-tight mb-2 ${
          isHero 
            ? 'text-2xl md:text-3xl text-white mb-4' 
            : isDeep 
              ? 'text-xl text-white' 
              : 'text-base text-slate-100'
        }`}>
          {item.title}
        </h3>

        {isHero ? (
          <div className="space-y-4 mb-4">
            <p className="text-slate-200 text-base md:text-lg leading-relaxed font-medium">
              {item.summary}
            </p>
            <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-line max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
              {item.content}
            </div>
          </div>
        ) : (
          <div className="mt-1">
            <p className={`text-slate-400 leading-relaxed ${isDeep ? 'text-sm line-clamp-3' : 'text-xs line-clamp-2'}`}>
              {item.summary}
            </p>
          </div>
        )}

        {isDeep && (
          <div className="mt-4 flex items-center text-xs font-bold text-purple-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
            Read More <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        )}
      </div>
    </motion.button>
  );
};

const CompactRow = ({ item, onClick }: { item: NewsItem; onClick: () => void }) => (
  <motion.button
    layoutId={`card-${item.title}`}
    onClick={onClick}
    whileHover={{ x: 4 }}
    className="w-full text-left p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-purple-500/30 hover:bg-slate-800/60 transition-all group shrink-0"
  >
    <div className="flex justify-between items-start gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1.5 opacity-60">
           <Tag className="w-3 h-3 text-purple-400" />
           <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-300">
             {item.source}
           </span>
        </div>
        <h4 className="text-sm font-bold text-slate-200 leading-snug group-hover:text-white line-clamp-2">
          {item.title}
        </h4>
      </div>
      <ArrowRight className="w-4 h-4 text-purple-500/50 group-hover:text-purple-400 transform group-hover:translate-x-1 transition-all mt-1 shrink-0" />
    </div>
  </motion.button>
);

const VideoCard = ({ video, onClick }: { video: VideoItem; onClick: () => void }) => (
  <motion.button
    layoutId={`video-${video.title}`}
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="group relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 hover:border-red-500/50 transition-all"
  >
    <img 
      src={video.thumbnail} 
      alt={video.title} 
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
    
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/20">
        <Play className="w-5 h-5 text-white fill-current" />
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
      <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">{video.title}</h3>
      <p className="text-[10px] text-slate-300 flex items-center gap-1">
        <Youtube className="w-3 h-3" /> {video.channel}
      </p>
    </div>
  </motion.button>
);

const PostcardModal = ({ 
  item, 
  onClose 
}: { 
  item: NewsItem | VideoItem; 
  onClose: () => void;
}) => {
  const isVideo = 'channel' in item;
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div
        layoutId={isVideo ? `video-${item.title}` : `card-${item.title}`}
        className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10 flex flex-col md:flex-row max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white backdrop-blur-sm transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full md:w-5/12 bg-slate-950 relative min-h-[200px] md:min-h-full">
          {isVideo ? (
            <div className="w-full h-full flex items-center bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${new URL(item.link).searchParams.get('v')}`}
                className="w-full aspect-video md:h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <>
              {(item as NewsItem).og_image ? (
                <div className="w-full h-full relative">
                  <img 
                    src={(item as NewsItem).og_image!} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-slate-900 relative overflow-hidden">
                   <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                   <Sparkles className="w-16 h-16 text-purple-500/20" />
                </div>
              )}
            </>
          )}
        </div>

        <div className="w-full md:w-7/12 p-6 md:p-8 overflow-y-auto bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
             {isVideo ? <Youtube className="w-4 h-4 text-red-500"/> : <Zap className="w-4 h-4 text-purple-500"/>}
             <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
               {isVideo ? (item as VideoItem).channel : (item as NewsItem).source}
             </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
            {item.title}
          </h2>

          <div className="prose prose-invert prose-sm max-w-none text-slate-300 mb-8 leading-relaxed">
            {isVideo ? (
              <p className="whitespace-pre-line">{(item as VideoItem).description}</p>
            ) : (
              <>
                <p className="font-medium text-slate-200 mb-4 text-lg">{(item as NewsItem).summary}</p>
                <div className="opacity-90">{(item as NewsItem).content}</div>
              </>
            )}
          </div>

          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all
              ${isVideo 
                ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20' 
                : 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/20'
              }
            `}
          >
            {isVideo ? 'Watch on YouTube' : 'Read Full Source'}
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function BriefingV1({ briefingData, availableDates = [], selectedDate, onDateChange }: BriefingV1Props) {
  const { date, keywords, sections } = briefingData;
  const [selectedItem, setSelectedItem] = useState<NewsItem | VideoItem | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 lg:p-12 font-sans selection:bg-purple-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] opacity-40 mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] opacity-30 mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-widest">
              <Calendar className="w-3 h-3" />
              <span>{date}</span>
              {availableDates.length > 0 && onDateChange && (
                <select
                  value={selectedDate || ''}
                  onChange={(e) => onDateChange(e.target.value || null)}
                  className="ml-2 bg-transparent border-b border-purple-500/30 text-purple-200 focus:outline-none cursor-pointer hover:border-purple-400"
                >
                  <option value="" className="bg-slate-900">Latest</option>
                  {availableDates.map((d) => (
                    <option key={d} value={d} className="bg-slate-900">{d}</option>
                  ))}
                </select>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              AI Daily <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Briefing</span>
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 justify-start md:justify-end max-w-md">
            {keywords.map((keyword, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/10 cursor-default transition-colors"
              >
                #{keyword}
              </span>
            ))}
          </div>
        </header>

        <main className="space-y-16">
          
          <section>
            <div className="flex items-center gap-2 mb-6 text-blue-400">
              <Layers className="w-5 h-5" />
              <h2 className="text-lg font-bold uppercase tracking-widest">Tech Deep Dive</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 flex flex-col gap-4">
                {sections.tech_deep_dive[0] && (
                  <BriefingCard 
                    item={sections.tech_deep_dive[0]} 
                    type="deep" 
                    variant="hero"
                    onClick={() => setSelectedItem(sections.tech_deep_dive[0])}
                    className="min-h-[280px] md:min-h-[320px]" 
                  />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.tech_deep_dive.slice(1, 3).map((item, i) => (
                    <BriefingCard 
                      key={i + 1} 
                      item={item} 
                      type="deep" 
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-900/20 rounded-2xl border border-white/5 p-4 flex flex-col h-full max-h-[600px] overflow-hidden">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">More Updates</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {sections.tech_deep_dive.slice(3).length > 0 ? (
                    sections.tech_deep_dive.slice(3).map((item, i) => (
                      <CompactRow 
                        key={i + 3} 
                        item={item} 
                        onClick={() => setSelectedItem(item)} 
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-600 space-y-2">
                      <Layers className="w-8 h-8 opacity-20" />
                      <p className="text-xs">No more updates today</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6 text-purple-400">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-lg font-bold uppercase tracking-widest">Hype Check</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sections.hype_check.slice(0, 6).map((item, i) => (
                <BriefingCard 
                  key={i} 
                  item={item} 
                  type="hype" 
                  onClick={() => setSelectedItem(item)} 
                />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6 text-red-400">
              <Youtube className="w-5 h-5" />
              <h2 className="text-lg font-bold uppercase tracking-widest">Watch This</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sections.watch_this.map((video, i) => (
                <VideoCard 
                  key={i} 
                  video={video} 
                  onClick={() => setSelectedItem(video)} 
                />
              ))}
            </div>
          </section>

        </main>

        <footer className="pt-12 border-t border-white/5 text-center">
          <p className="text-slate-500 text-sm">
            Powered by AI Agents • {date}
          </p>
        </footer>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <PostcardModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
