'use client';

import { useEffect, useState } from 'react';
import BriefingV1 from '@/components/BriefingV1';

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
  schema_version: number;
  date: string;
  keywords: string[];
  sections: {
    hype_check: NewsItem[];
    tech_deep_dive: NewsItem[];
    watch_this: VideoItem[];
  };
}

const DEFAULT_DATA_BASE_URL = 'https://raw.githubusercontent.com/zemyblue/ai-briefing-dashboard/main/public/data';
const DATA_BASE_URL = process.env.NEXT_PUBLIC_DATA_BASE_URL || DEFAULT_DATA_BASE_URL;

export default function Home() {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const cacheBust = String(Math.floor(Date.now() / 60000));

    fetch(`${DATA_BASE_URL}/dates.json?v=${cacheBust}`, {
      cache: 'no-store'
    })
      .then((res) => res.json())
      .then((datesData) => {
        setAvailableDates(datesData.dates || []);
      })
      .catch((err) => {
        console.error('Failed to load dates:', err);
      });
  }, []);

  useEffect(() => {
    const loadBriefing = async () => {
      setLoading(true);
      setError(false);

      const cacheBust = String(Math.floor(Date.now() / 60000));

      let dataUrl: string;
      if (selectedDate) {
        const [year, month] = selectedDate.split('-');
        dataUrl = `${DATA_BASE_URL}/${year}/${month}/${selectedDate}.json?v=${cacheBust}`;
      } else {
        dataUrl = `${DATA_BASE_URL}/latest.json?v=${cacheBust}`;
      }

      try {
        const res = await fetch(dataUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch');
        const briefingData = (await res.json()) as BriefingData;
        setData(briefingData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load briefing:', err);
        setError(true);
        setLoading(false);
      }
    };

    loadBriefing();
  }, [selectedDate]);

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

  return (
    <div>
      <BriefingV1 briefingData={data} availableDates={availableDates} selectedDate={selectedDate} onDateChange={setSelectedDate} />
    </div>
  );
}
