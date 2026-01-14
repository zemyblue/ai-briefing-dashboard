'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// GitHub Raw URL (Public 레포지토리로 변경 후 수정 필요)
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/zemyblue/ai-briefing-dashboard/main/public/data';

export default function Archive() {
    const [dates, setDates] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        // GitHub Raw에서 dates.json 로드
        fetch(`${GITHUB_RAW_URL}/dates.json`, {
            cache: 'default'  // CDN + 브라우저 캐싱
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                setDates(data.dates || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load dates:', err);
                setError(true);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-slate-400">아카이브를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-300 mb-4">아카이브를 불러올 수 없습니다</h1>
                    <p className="text-slate-500">데이터를 불러오는데 실패했습니다.</p>
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

    // 연도별로 그룹화
    const groupedByYear = dates.reduce((acc, date) => {
        const year = date.substring(0, 4);
        if (!acc[year]) acc[year] = [];
        acc[year].push(date);
        return acc;
    }, {} as Record<string, string[]>);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <header className="mb-8">
                    <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
                        ← 홈으로 돌아가기
                    </Link>
                    <h1 className="text-4xl font-bold mb-2">브리핑 아카이브</h1>
                    <p className="text-slate-400">총 {dates.length}개의 브리핑</p>
                </header>

                {Object.entries(groupedByYear)
                    .sort(([a], [b]) => b.localeCompare(a))  // 최신 연도부터
                    .map(([year, yearDates]) => (
                        <section key={year} className="mb-12">
                            <h2 className="text-2xl font-bold mb-4 text-blue-400">{year}년</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {yearDates.map(date => (
                                    <Link
                                        key={date}
                                        href={`/archive/${date}`}
                                        className="block p-4 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-blue-500 transition-all"
                                    >
                                        <time dateTime={date} className="text-sm font-mono">
                                            {date.substring(5)}  {/* MM-DD만 표시 */}
                                        </time>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
            </div>
        </div>
    );
}
