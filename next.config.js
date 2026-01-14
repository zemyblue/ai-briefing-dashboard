/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',  // 정적 HTML 생성
    images: {
        unoptimized: true,  // Cloudflare Pages는 Image Optimization을 지원하지 않음
    },
    trailingSlash: true,  // URL에 슬래시 추가
    skipTrailingSlashRedirect: true,  // 동적 라우트 허용
};

export default nextConfig;

