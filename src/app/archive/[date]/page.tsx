'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DailyBriefing from '@/components/DailyBriefing';

// GitHub Raw URL (Public 레포지토리로 변경 후 수정 필요)
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/zemyblue/ai-briefing-dashboard/main/public/data';

export default function DateBriefing() {
    const params = useParams();
    const router = useRouter();
    const date = params.date as string;  // 2026-01-14

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!date) return;

        const [year, month, day] = date.split('-');
        const url = `${GITHUB_RAW_URL}/${year}/${month}/${day}.json`;

        fetch(url, {
            cache: 'default'  // CDN + 브라우저 캐싱
        })
            .then(res => {
                if (!res.ok) throw new Error('Not found');
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
    }, [date]);

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
                    <h1 className="text-2xl font-bold text-slate-300 mb-4">브리핑을 찾을 수 없습니다</h1>
                    <p className="text-slate-500 mb-6">{date} 날짜의 브리핑이 존재하지 않습니다.</p>
                    <div className="space-x-4">
                        <button
                            onClick={() => router.push('/archive')}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            아카이브로 돌아가기
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
                        >
                            홈으로 가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="bg-slate-900 border-b border-slate-800">
                <div className="container mx-auto px-4 py-4 max-w-6xl">
                    <Link href="/archive" className="text-blue-400 hover:text-blue-300">
                        ← 아카이브로 돌아가기
                    </Link>
                </div>
            </div>
            <DailyBriefing {...data} />
        </div>
    );
}
