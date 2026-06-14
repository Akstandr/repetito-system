package dev.andrew.repetitobackend.common.seed;

import dev.andrew.repetitobackend.users.model.User;
import dev.andrew.repetitobackend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String email;

    @Value("${app.admin.password:}")
    private String password;

    @Value("${app.admin.first-name:Администратор}")
    private String firstName;

    @Value("${app.admin.last-name:Системы}")
    private String lastName;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email == null || email.isBlank()) {
            return;
        }

        String normalizedEmail = email.trim().toLowerCase();
        User admin = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (admin != null) {
            if (!admin.isAdmin()) {
                admin.setAdmin(true);
                userRepository.save(admin);
            }
            return;
        }

        if (password == null || password.length() < 8) {
            throw new IllegalStateException("ADMIN_PASSWORD must contain at least 8 characters");
        }

        userRepository.save(User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(password))
                .firstName(firstName == null || firstName.isBlank() ? "Администратор" : firstName.trim())
                .lastName(lastName == null || lastName.isBlank() ? "Системы" : lastName.trim())
                .admin(true)
                .build());
    }
}
