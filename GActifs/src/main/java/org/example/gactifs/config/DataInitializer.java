package org.example.gactifs.config;



import lombok.RequiredArgsConstructor;
import org.example.gactifs.auth.Model.User;
import org.example.gactifs.auth.enums.Role;
import org.example.gactifs.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    @Override
    public void run(String... args) throws Exception {
        initAdmin();


    }

    private void initAdmin() {
        if (userRepository.findByRole(Role.ADMIN).isEmpty()) {
            User admin = User.builder()
                    .firstName("Admin")
                    .lastName("Super")
                    .email("admin@nouran.com")
                    .password(passwordEncoder.encode("admin@2025"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Admin créé : admin@nouran.com");
        } else {
            System.out.println("ℹ️ Admin déjà existant.");
        }
    }

}
