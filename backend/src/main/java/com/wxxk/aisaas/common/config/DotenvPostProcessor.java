package com.wxxk.aisaas.common.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

/**
 * 애플리케이션 기동 시 .env 파일을 읽어 Spring Environment에 주입한다.
 * 실제 환경변수(OS / CI / 운영)가 항상 우선하며, .env는 그보다 낮은 우선순위로 추가된다.
 * .env 파일이 없으면 아무것도 하지 않으므로 운영 환경에서 안전하게 사용 가능하다.
 *
 * getOrder() = Integer.MIN_VALUE + 5: ConfigDataEnvironmentPostProcessor(MIN+10)보다
 * 먼저 실행되어 ${OPENAI_API_KEY:} 플레이스홀더 해석 전에 PropertySource를 등록한다.
 * addAfter(systemEnvironment): OS 환경변수보다는 낮고, application.properties보다는 높은 우선순위.
 */
public class DotenvPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final Logger log = Logger.getLogger(DotenvPostProcessor.class.getName());
    private static final String PROPERTY_SOURCE_NAME = "dotenv";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        var dotenvPath = Paths.get(".env");
        if (!Files.exists(dotenvPath)) {
            return;
        }

        Map<String, Object> props = new HashMap<>();
        try {
            Files.lines(dotenvPath).forEach(line -> {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    return;
                }
                int idx = trimmed.indexOf('=');
                if (idx <= 0) {
                    return;
                }
                String key = trimmed.substring(0, idx).trim();
                String value = trimmed.substring(idx + 1).trim();
                value = stripQuotes(value);
                props.put(key, value);
            });
        } catch (IOException e) {
            // .env 읽기 실패 시 무시 — 기동을 막지 않는다.
        }

        if (props.isEmpty()) {
            return;
        }

        // OS 환경변수(systemEnvironment)보다 낮고, application.properties보다 높은 위치에 삽입
        var sources = environment.getPropertySources();
        var dotenvSource = new MapPropertySource(PROPERTY_SOURCE_NAME, props);
        if (sources.contains(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME)) {
            sources.addAfter(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, dotenvSource);
        } else {
            sources.addLast(dotenvSource);
        }

        logLoadedKeys(props);
    }

    private void logLoadedKeys(Map<String, Object> props) {
        props.forEach((key, value) ->
            log.info(String.format("[DotenvPostProcessor] loaded: %s (length=%d)", key, value.toString().length()))
        );
    }

    private String stripQuotes(String value) {
        if (value.length() >= 2
                && ((value.startsWith("\"") && value.endsWith("\""))
                        || (value.startsWith("'") && value.endsWith("'")))) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }

    @Override
    public int getOrder() {
        // ConfigDataEnvironmentPostProcessor.ORDER = Integer.MIN_VALUE + 10
        // 우리는 그보다 먼저(+5) 실행해야 플레이스홀더 해석 전에 PropertySource가 등록된다.
        return Integer.MIN_VALUE + 5;
    }
}
