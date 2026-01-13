import DailyBriefing from '@/components/DailyBriefing';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function Home() {
  // 정적 빌드를 위해 JSON 파일에서 직접 읽기
  const filePath = join(process.cwd(), 'public', 'data', 'briefing.json');
  const fileContent = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(fileContent);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-300 mb-4">데이터를 찾을 수 없습니다</h1>
          <p className="text-slate-500">브리핑 데이터가 아직 생성되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  return <DailyBriefing {...data} />;
}
