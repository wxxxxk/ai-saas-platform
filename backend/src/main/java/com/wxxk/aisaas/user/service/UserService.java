package com.wxxk.aisaas.user.service;

import com.wxxk.aisaas.common.exception.DuplicateEmailException;
import com.wxxk.aisaas.common.exception.EntityNotFoundException;
import com.wxxk.aisaas.credit.entity.CreditWallet;
import com.wxxk.aisaas.credit.repository.CreditWalletRepository;
import com.wxxk.aisaas.user.entity.User;
import com.wxxk.aisaas.user.enums.UserRole;
import com.wxxk.aisaas.user.enums.UserStatus;
import com.wxxk.aisaas.user.repository.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CreditWalletRepository creditWalletRepository;

    // User 생성과 CreditWallet 생성을 하나의 트랜잭션으로 처리
    // passwordHash: 호출 측에서 인코딩된 값을 전달
    @Transactional
    public User register(String email, String passwordHash, String name) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException(email);
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordHash)
                .name(name)
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.save(user);

        CreditWallet wallet = CreditWallet.builder()
                .user(user)
                .balance(0)
                .lifetimeEarned(0)
                .lifetimeUsed(0)
                .build();

        creditWalletRepository.save(wallet);

        return user;
    }

    @Transactional(readOnly = true)
    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
    }

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User", "email", email));
    }

    @Transactional
    public User updateStatus(UUID id, UserStatus status) {
        User user = getUserById(id);
        user.updateStatus(status);
        return user;
    }
}
