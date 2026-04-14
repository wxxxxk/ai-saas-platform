import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 배포용 standalone 출력 모드.
  // .next/standalone/ 에 최소 실행 파일만 생성되어 이미지 크기를 줄인다.
  output: "standalone",

  // 개발 모드에서 좌측 하단에 표시되는 원형 Dev Indicator를 비활성화한다.
  // appIsrStatus: 빌드 상태를 표시하는 버튼 (false = 숨김)
  devIndicators: false,
};

export default nextConfig;
