'use client';

import { useEffect, useState } from 'react';
import DailyBriefing, { DailyBriefingProps } from '@/components/DailyBriefing';

// GitHub Raw URL (Public 레포지토리 또는 배포 환경)
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/zemyblue/ai-briefing-dashboard/main/public/data';

export default function Home() {
  const [data, setData] = useState<DailyBriefingProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 사용 가능한 날짜 목록 로드
  useEffect(() => {
    fetch(`${GITHUB_RAW_URL}/dates.json`, {
      cache: 'default'
    })
      .then(res => res.json())
      .then(datesData => {
        setAvailableDates(datesData.dates || []);
      })
      .catch(err => {
        console.error('Failed to load dates:', err);
      });
  }, []);

  // 브리핑 데이터 로드
  useEffect(() => {
    setLoading(true);
    setError(false);

    let dataUrl: string;
    if (selectedDate) {
      // 선택된 날짜의 데이터 로드
      const [year, month, day] = selectedDate.split('-');
      dataUrl = `${GITHUB_RAW_URL}/${year}/${month}/${day}.json`;
    } else {
      // 최신 데이터 로드
      dataUrl = `${GITHUB_RAW_URL}/latest.json`;
    }

    fetch(dataUrl, {
      cache: 'default'
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


  if (!data) {
    return null;
  }

  return (
    <div>
      <DailyBriefing
        {...data}
        availableDates={availableDates}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    </div>
  );
}

