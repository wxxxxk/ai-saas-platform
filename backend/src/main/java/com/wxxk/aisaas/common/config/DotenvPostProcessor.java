package com.wxxk.aisaas.common.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * 애플리케이션 기동 시 .env 파일을 읽어 Spring Environment에 주입한다.
 * 실제 환경변수(OS / CI / 운영)가 항상 우선하며, .env는 그보다 낮은 우선순위로 추가된다.
 * .env 파일이 없으면 아무것도 하지 않으므로 운영 환경에서 안전하게 사용 가능하다.
 */
public class DotenvPostProcessor implements EnvironmentPostProcessor, Ordered {

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

        if (!props.isEmpty()) {
            // addLast: 실제 환경변수와 application.properties보다 낮은 우선순위
            environment.getPropertySources().addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, props));
        }
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
        return Ordered.LOWEST_PRECEDENCE;
    }
}
