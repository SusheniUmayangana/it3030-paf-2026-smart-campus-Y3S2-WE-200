package com.smartcampus.backend.config;

import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String superAdminEmail = "superadmin@smartcampus.com";

        if (userRepository.findByEmail(superAdminEmail).isEmpty()) {
            User superAdmin = new User();
            superAdmin.setName("Super Admin");
            superAdmin.setEmail(superAdminEmail);
            superAdmin.setPassword(passwordEncoder.encode("SuperAdmin@123"));
            superAdmin.setProvider("local");
            superAdmin.setRole("SUPER_ADMIN");

            userRepository.save(superAdmin);
            System.out.println("✅ SUPER_ADMIN account seeded: " + superAdminEmail);
        } else {
            System.out.println("ℹ️ SUPER_ADMIN account already exists.");
        }
    }
}
