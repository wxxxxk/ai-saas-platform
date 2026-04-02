package com.wxxk.aisaas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

// @EnableJpaAuditing: BaseEntity의 @CreatedDate, @LastModifiedDate가
// AuditingEntityListener를 통해 자동으로 값을 주입받으려면
// JPA Auditing 기능이 활성화되어 있어야 한다.
// 이 어노테이션이 없으면 createdAt, updatedAt이 null로 저장된다.
@SpringBootApplication
@EnableJpaAuditing
public class AisaasApplication {

	public static void main(String[] args) {
		SpringApplication.run(AisaasApplication.class, args);
	}

}
