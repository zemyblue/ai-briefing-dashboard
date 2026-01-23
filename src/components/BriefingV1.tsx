'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { X, Play, Calendar, Sparkles, Youtube, ExternalLink, Tag } from 'lucide-react';

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

const TiltCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
      el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div ref={ref} className={className} style={{ transition: 'transform 0.1s ease-out' }}>
      {children}
    </div>
  );
};

const MasonryCard = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="break-inside-avoid mb-6"
    >
      {children}
    </motion.div>
  );
};

export default function BriefingV1({ briefingData, availableDates = [], selectedDate, onDateChange }: BriefingV1Props) {
  const { date, keywords, sections } = briefingData;
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-slate-100 p-6 md:p-12 font-sans selection:bg-purple-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[150px]" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[30%] h-[30%] bg-pink-600/15 rounded-full blur-[100px]" />
      </div>

      <header className="relative z-10 max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-purple-500/20 pb-8">
          <div>
            <div className="flex items-center gap-3 text-purple-400 mb-3 font-medium tracking-wide text-sm uppercase">
              <Calendar className="w-4 h-4" />
              <span>{date}</span>
              {availableDates.length > 0 && onDateChange && (
                <select
                  value={selectedDate || ''}
                  onChange={(e) => onDateChange(e.target.value || null)}
                  className="ml-2 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-purple-500/30 text-purple-200 text-xs font-medium hover:border-purple-400/50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="">최신</option>
                  {availableDates.map((dateOption) => (
                    <option key={dateOption} value={dateOption}>
                      {dateOption}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-400 tracking-tight mb-4">
              Fun & Free AI Feed
            </h1>
            <p className="text-xl text-purple-200/80 max-w-2xl leading-relaxed">
              오늘의 가장 핫한 AI 트렌드와 재미있는 소식들을 전해드려요 🚀
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {keywords.map((keyword, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-md border border-purple-500/30 text-purple-200 text-sm font-medium hover:border-purple-400/50 hover:from-purple-600/30 hover:to-pink-600/30 transition-all cursor-default"
              >
                #{keyword}
              </motion.span>
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto space-y-16">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent tracking-tight">
              핫한 이슈
            </h2>
          </div>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {sections.hype_check.map((item, i) => (
              <MasonryCard key={i} index={i}>
                <TiltCard className="h-full">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/10 hover:border-purple-500/40 transition-all duration-500 overflow-hidden group"
                  >
                    {item.og_image && (
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={item.og_image || undefined}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-purple-300/80 font-medium">{item.source}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-300 transition-colors leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                        {item.summary}
                      </p>
                      <div className="mt-4 flex items-center text-xs font-bold text-purple-400 uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
                        자세히 보기 <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  </a>
                </TiltCard>
              </MasonryCard>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              기술 심층 분석
            </h2>
          </div>
          <div className="grid gap-6">
            {sections.tech_deep_dive.map((item, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/10 hover:border-blue-500/40 transition-all duration-300 overflow-hidden"
              >
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 md:p-8 group"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-blue-300/80 font-medium">{item.source}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-base text-slate-300 leading-relaxed mb-4">
                    {item.content}
                  </p>
                  <div className="flex items-center text-sm font-bold text-blue-400 uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
                    Deep Dive <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              </motion.article>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <Youtube className="w-6 h-6 text-red-500" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              영상 보기
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sections.watch_this.map((video, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <TiltCard className="h-full">
                  <button
                    onClick={() => setSelectedVideo(video)}
                    className="w-full h-full rounded-2xl overflow-hidden bg-slate-900/40 backdrop-blur-md border border-white/10 hover:border-red-500/40 transition-all duration-300 group"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent transition-opacity group-hover:opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-red-600/90 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm text-white mb-2 group-hover:text-red-300 transition-colors line-clamp-2 leading-tight">
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{video.channel}</span>
                      </div>
                    </div>
                  </button>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </section>

        {selectedVideo && selectedVideo.link && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm transition-opacity"
            >
              <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl shadow-purple-500/20">
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-6 right-6 p-3 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors z-10"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${new URL(selectedVideo.link).searchParams.get('v')}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <div className="p-6 md:p-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    {selectedVideo.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-purple-300 mb-4">
                    <Youtube className="w-5 h-5" />
                    <span>{selectedVideo.channel}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedVideo.description}
                  </p>
                  <a
                    href={selectedVideo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full hover:from-red-500 hover:to-pink-500 transition-all duration-300"
                  >
                    YouTube에서 보기 <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <footer className="relative z-10 max-w-7xl mx-auto mt-16 pt-8 border-t border-purple-500/20 text-center">
          <p className="text-purple-300/60 text-sm">
            🤖 Powered by Google Gemini 1.5 Flash | Fun & Free AI Feed
          </p>
        </footer>
      </main>
    </div>
  );
}
