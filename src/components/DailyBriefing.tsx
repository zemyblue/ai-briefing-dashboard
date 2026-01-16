"use client";

import React, { useState } from 'react';
import { Sparkles, Newspaper, Github, ExternalLink, Calendar, Star, Cpu, Youtube, PlayCircle, X, ChevronRight } from 'lucide-react';


interface NewsItem {
  title: string;
  summary: string;
  link: string;
  tags: string[];
  content?: string; // 상세 내용 (선택적)
}

interface VideoItem {
  title: string;
  channel: string;
  link: string;
  thumbnail_url?: string;
  views?: string;
}

interface RepoItem {

  name: string;
  description: string;
  stars: number;
  language: string;
  url: string;
  reason?: string; // 트렌딩 이유
}

export interface DailyBriefingProps {
  date: string;
  keywords: string[];
  news: NewsItem[];
  github_repos: RepoItem[];
  youtube_videos: VideoItem[];
  availableDates?: string[];
  selectedDate?: string | null;
  onDateChange?: (date: string | null) => void;
}

export default function DailyBriefing({ date, keywords, news, github_repos, youtube_videos, availableDates = [], selectedDate, onDateChange }: DailyBriefingProps) {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // 유튜브 URL에서 썸네일 추출하는 헬퍼 함수
  const getYoutubeThumbnail = (link: string, providedThumb?: string) => {
    if (providedThumb) return providedThumb;
    try {
      const url = new URL(link);
      const videoId = url.searchParams.get("v");
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    } catch {
      // invalid url
    }
    return null;
  };

  return (

    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans selection:bg-purple-500/30">

      {/* Header Section */}
      <header className="max-w-7xl mx-auto mb-16 relative">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-800 pb-8">
          <div>
            <div className="flex items-center gap-3 text-purple-400 mb-2 font-medium tracking-wide text-sm uppercase">
              <Calendar className="w-4 h-4" />
              <span>{date}</span>
              {availableDates.length > 0 && onDateChange && (
                <select
                  value={selectedDate || ''}
                  onChange={(e) => onDateChange(e.target.value || null)}
                  className="ml-2 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:border-purple-500/50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50"
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
            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500 tracking-tight">
              AI Trend Briefing
            </h1>
            <p className="mt-4 text-xl text-slate-400 max-w-2xl leading-relaxed">
              Curated insights from the frontier of Artificial Intelligence.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800/50">
            <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-slate-300">System Online</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: Keywords & Repos (3 cols) */}
        <div className="lg:col-span-3 space-y-8">

          {/* Keywords Section */}
          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-slate-400">Today&apos;s Keywords</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/50 text-xs font-medium text-slate-300 hover:text-white hover:border-purple-500/50 hover:bg-slate-800/80 transition-all cursor-default">
                  # {keyword}
                </span>
              ))}
            </div>
          </section>

          {/* GitHub Repos Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Github className="w-4 h-4 text-white" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-slate-400">Trending Repos</h2>
            </div>
            <div className="space-y-3">
              {github_repos.map((repo, i) => (
                <a key={i} href={repo.url} target="_blank" rel="noopener noreferrer" className="block group p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-600 transition-all duration-300 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm text-slate-200 group-hover:text-blue-400 transition-colors truncate pr-4">{repo.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{repo.description}</p>

                  {/* GitHub Trending Reason */}
                  {repo.reason && (
                    <div className="mb-3 p-2 rounded bg-slate-800/80 border border-slate-700/30">
                      <p className="text-[10px] text-purple-300/90 leading-tight">
                        <span className="font-bold mr-1">Why?</span>
                        {repo.reason}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {repo.language}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current text-yellow-500/50" />
                      {repo.stars.toLocaleString()}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>


        {/* CENTER COLUMN: Top Headlines (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center gap-2 mb-2 px-2">
            <Newspaper className="w-5 h-5 text-pink-400" />
            <h2 className="text-lg font-bold tracking-wider uppercase text-slate-400">Top Headlines</h2>
          </div>

          <div className="grid gap-6">
            {news.map((item, i) => (
              <article
                key={i}
                onClick={() => setSelectedNews(item)}
                className="group relative rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-600 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative p-6 md:p-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map((tag, t) => (
                      <span key={t} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/50">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-xl md:text-2xl font-bold text-slate-100 group-hover:text-blue-300 transition-colors duration-300 leading-tight mb-3">
                    {item.title}
                  </h3>

                  <p className="text-slate-400 leading-relaxed text-sm group-hover:text-slate-300 transition-colors">
                    {item.summary}
                  </p>

                  <div className="pt-4 flex items-center text-xs font-bold text-purple-400 uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
                    Read Report <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>


        {/* RIGHT COLUMN: Trending Videos (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Youtube className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-400">Trending Videos</h2>
          </div>
          <div className="space-y-4">
            {youtube_videos?.map((video, i) => {
              const thumbnailUrl = getYoutubeThumbnail(video.link, video.thumbnail_url);
              return (
                <a key={i} href={video.link} target="_blank" rel="noopener noreferrer" className="block group relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 transition-all duration-300">
                  <div className="aspect-video bg-slate-800 relative">
                    {thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-slate-800">
                        <PlayCircle className="w-10 h-10 text-slate-600 group-hover:text-red-500 transition-colors" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-bold text-xs text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-tight mb-1.5">{video.title}</h3>
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>{video.channel}</span>
                        {video.views && <span>{video.views}</span>}
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

      </main >


      {/* News Detail Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedNews(null)}
          />

          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedNews(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8 md:p-12 space-y-8">
              <header className="space-y-4 border-b border-slate-800 pb-8">
                <div className="flex flex-wrap gap-2">
                  {selectedNews.tags.map((tag, t) => (
                    <span key={t} className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  {selectedNews.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  {selectedNews.link !== '#' && (
                    <a href={selectedNews.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      Original Source
                    </a>
                  )}
                </div>
              </header>

              <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed">
                {selectedNews.content ? (
                  <div className="whitespace-pre-wrap">{selectedNews.content}</div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xl font-medium text-slate-200">
                      {selectedNews.summary}
                    </p>
                    <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-center italic">
                      상세 분석 데이터가 없습니다. 원본 출처를 확인해주세요.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
