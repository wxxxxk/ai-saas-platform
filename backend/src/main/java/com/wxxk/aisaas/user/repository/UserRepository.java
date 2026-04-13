package com.wxxk.aisaas.user.repository;

import com.wxxk.aisaas.user.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * plan은 LAZY 로딩이므로 /api/auth/me 처럼 plan 정보가 필요한 경우에 사용한다.
     * JOIN FETCH로 한 번의 쿼리에 user + plan을 함께 로드해 LazyInitializationException을 방지한다.
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.plan WHERE u.id = :id")
    Optional<User> findByIdWithPlan(@Param("id") UUID id);
}
