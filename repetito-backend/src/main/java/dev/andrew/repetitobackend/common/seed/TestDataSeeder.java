package dev.andrew.repetitobackend.common.seed;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.repository.AccountRepository;
import dev.andrew.repetitobackend.accounts.service.AccountService;
import dev.andrew.repetitobackend.tutorcards.model.TutorCard;
import dev.andrew.repetitobackend.tutorcards.model.TutorCardModerationStatus;
import dev.andrew.repetitobackend.tutorcards.model.TutorCardFormat;
import dev.andrew.repetitobackend.tutorcards.repository.TutorCardRepository;
import dev.andrew.repetitobackend.users.model.User;
import dev.andrew.repetitobackend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed-test-data", havingValue = "true")
public class TestDataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final AccountService accountService;
    private final TutorCardRepository tutorCardRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedTutorCards();
    }

    private void seedTutorCards() {
        String[] subjectCodes = {
                "math", "russian", "english", "physics", "chemistry",
                "biology", "informatics", "history", "social-studies", "literature"
        };

        String[] subjectTitles = {
                "Математика", "Русский язык", "Английский язык", "Физика", "Химия",
                "Биология", "Информатика", "История", "Обществознание", "Литература"
        };

        String[] firstNames = {
                "Иван", "Анна", "Сергей", "Мария", "Алексей",
                "Ольга", "Дмитрий", "Елена", "Павел", "Наталья"
        };

        String[] lastNames = {
                "Иванов", "Петрова", "Смирнов", "Кузнецова", "Волков",
                "Соколова", "Морозов", "Попова", "Новиков", "Васильева"
        };

        List<List<Integer>> gradeSets = List.of(
                List.of(1, 2, 3, 4),
                List.of(5, 6, 7, 8, 9),
                List.of(8, 9, 10, 11),
                List.of(10, 11),
                List.of(5, 6, 7),
                List.of(2, 3, 4, 5, 6),
                List.of(7, 8, 9),
                List.of(1, 5, 9),
                List.of(6, 10, 11),
                List.of(4, 8, 11)
        );

        TutorCardFormat[] formats = {
                TutorCardFormat.ONLINE,
                TutorCardFormat.OFFLINE,
                TutorCardFormat.MIXED
        };

        for (int index = 1; index <= 50; index++) {
            String email = String.format("seed.tutor.%02d@repetito.local", index);
            String firstName = firstNames[(index - 1) % firstNames.length];
            String lastName = lastNames[(index - 1) % lastNames.length] + String.format(" %02d", index);
            String subjectCode = subjectCodes[(index - 1) % subjectCodes.length];
            String subjectTitle = subjectTitles[(index - 1) % subjectTitles.length];
            List<Integer> grades = gradeSets.get((index - 1) % gradeSets.size());
            TutorCardFormat format = formats[(index - 1) % formats.length];

            User user = userRepository.findByEmail(email).orElseGet(() ->
                    userRepository.save(User.builder()
                            .email(email)
                            .passwordHash(passwordEncoder.encode("SeedTutor123!"))
                            .firstName(firstName)
                            .lastName(lastName)
                            .build())
            );

            Account tutorAccount = accountRepository.findByUserIdAndType(user.getId(), AccountType.TUTOR)
                    .orElseGet(() -> accountService.createAccount(user.getId(), AccountType.TUTOR));

            String title = String.format("Подготовка по %s №%02d", subjectTitle, index);
            if (tutorCardRepository.existsByTutorAccountIdAndTitle(tutorAccount.getId(), title)) {
                continue;
            }

            tutorCardRepository.save(TutorCard.builder()
                    .tutorAccount(tutorAccount)
                    .title(title)
                    .description(String.format(
                            "Пробная карточка для %s. Помогаю с %s, подбираю формат занятий под запрос ученика.",
                            subjectTitle.toLowerCase(),
                            subjectTitle.toLowerCase()
                    ))
                    .subject(subjectCode)
                    .pricePerLesson(BigDecimal.valueOf(900 + (index % 10) * 100L))
                    .supportedGrades(new LinkedHashSet<>(grades))
                    .format(format)
                    .isActive(true)
                    .moderationStatus(TutorCardModerationStatus.APPROVED)
                    .build());
        }
    }
}
