# Stage 1: build — Gradle + Java 21 JDK
FROM eclipse-temurin:21-jdk-noble AS builder
WORKDIR /app

# Gradle wrapper 먼저 복사 → 의존성 레이어 캐싱
COPY gradlew ./
COPY gradle/  ./gradle/
COPY build.gradle settings.gradle ./

# gradlew 실행 권한 부여
RUN chmod +x gradlew

# 의존성만 먼저 다운로드 (소스 변경 시 이 레이어는 캐시 재사용)
# auto-download=false: 컨테이너의 JDK를 그대로 사용 (네트워크 의존 제거)
RUN ./gradlew dependencies --no-daemon -q \
    -Porg.gradle.java.installations.auto-download=false

# 소스 복사 후 bootJar 빌드
COPY src/ ./src/
RUN ./gradlew bootJar --no-daemon -x test \
    -Porg.gradle.java.installations.auto-download=false

# ───────────────────────────────────────────────────────────────
# Stage 2: runtime — 최소 JRE 이미지
# ───────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-noble AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 spring \
 && adduser  --system --uid 1001 --ingroup spring spring

COPY --from=builder --chown=spring:spring /app/build/libs/*.jar app.jar

USER spring

EXPOSE 8080

# 컨테이너 메모리 제한에 맞게 JVM 힙 자동 조정 (-XX:+UseContainerSupport 기본값)
ENTRYPOINT ["java", "-jar", "app.jar"]
