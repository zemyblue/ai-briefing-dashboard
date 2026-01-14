'use client';

import { useEffect, useState } from 'react';
import DailyBriefing from '@/components/DailyBriefing';

// GitHub Raw URL (Public 레포지토리로 변경 후 수정 필요)
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/zemyblue/ai-briefing-dashboard/main/public/data';

export default function Home() {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // GitHub Raw에서 최신 브리핑 데이터 로드
    fetch(`${GITHUB_RAW_URL}/latest.json`, {
      cache: 'default'  // 브라우저 기본 캐싱 전략 (Cloudflare CDN 캐싱 활용)
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(briefingData => {
        setData(briefingData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load briefing:', err);
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-400">브리핑 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-300 mb-4">데이터를 찾을 수 없습니다</h1>
          <p className="text-slate-500">브리핑 데이터를 불러오는데 실패했습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return <DailyBriefing {...(data as Record<string, unknown>)} />;
}

