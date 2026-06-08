package dev.andrew.repetitobackend.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Неверный email или пароль"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", translateServiceMessage(exception.getMessage())));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException exception) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("message", translateServiceMessage(exception.getMessage())));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        FieldError fieldError = exception.getBindingResult().getFieldErrors().stream().findFirst().orElse(null);
        String message = fieldError == null ? "Проверьте заполнение формы" : validationMessage(fieldError);

        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleUnreadableMessage(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", "Проверьте заполнение формы: некоторые поля указаны неверно"));
    }

    private String validationMessage(FieldError fieldError) {
        String objectName = fieldError.getObjectName().toLowerCase();
        String field = fieldError.getField();
        String code = fieldError.getCode() == null ? "" : fieldError.getCode();

        if (objectName.contains("message") && field.equals("text")) {
            return "Нельзя отправить пустое сообщение";
        }
        if (objectName.contains("reviewreply") && field.equals("text")) {
            return "Напишите текст ответа на отзыв";
        }
        if (objectName.contains("review") && field.equals("text")) {
            return "Напишите текст отзыва";
        }
        if (objectName.contains("review") && field.equals("rating")) {
            return "Оценка должна быть от 1 до 5 звезд";
        }
        if (objectName.contains("application") && field.equals("tutorCardId")) {
            return "Выберите карточку репетитора";
        }
        if (objectName.contains("application") && field.equals("message")) {
            return "Сопроводительное письмо не должно быть длиннее 1500 символов";
        }
        if (objectName.contains("lesson") && field.equals("studentAccountId")) {
            return "Выберите ученика для занятия";
        }
        if (objectName.contains("lesson") && field.equals("applicationId")) {
            return "Выберите заявку, по которой создается занятие";
        }
        if (objectName.contains("lesson") && field.equals("subject")) {
            return "Укажите предмет занятия";
        }
        if (objectName.contains("lesson") && field.equals("startDateTime")) {
            return code.equals("FutureOrPresent") ? "Нельзя создать занятие в прошлом" : "Укажите дату и время занятия";
        }
        if (objectName.contains("lesson") && field.equals("durationMinutes")) {
            return "Длительность занятия должна быть больше нуля";
        }
        if (objectName.contains("lesson") && field.equals("price")) {
            return "Стоимость занятия должна быть больше нуля";
        }
        if (objectName.contains("lesson") && field.equals("videoMeetingUrl")) {
            return "Ссылка на созвон слишком длинная";
        }
        if (objectName.contains("tutorcard") && field.equals("title")) {
            return "Укажите название карточки";
        }
        if (objectName.contains("tutorcard") && field.equals("subject")) {
            return "Выберите предмет";
        }
        if (objectName.contains("tutorcard") && field.equals("pricePerLesson")) {
            return "Стоимость занятия должна быть больше нуля";
        }
        if (objectName.contains("login") && field.equals("email")) {
            return "Введите email";
        }
        if (objectName.contains("login") && field.equals("password")) {
            return "Введите пароль";
        }
        if (objectName.contains("register") && field.equals("email")) {
            return "Введите email";
        }
        if (objectName.contains("register") && field.equals("password")) {
            return "Введите пароль";
        }
        if (objectName.contains("register") && field.equals("firstName")) {
            return "Введите имя";
        }
        if (objectName.contains("account") && field.equals("type")) {
            return "Выберите тип аккаунта";
        }

        if (code.equals("NotBlank") || code.equals("NotEmpty") || code.equals("NotNull")) {
            return fieldLabel(field) + ": заполните это поле";
        }
        if (code.equals("Positive")) {
            return fieldLabel(field) + ": значение должно быть больше нуля";
        }
        if (code.equals("Min") || code.equals("Max")) {
            return fieldLabel(field) + ": значение вне допустимого диапазона";
        }
        if (code.equals("Size")) {
            return fieldLabel(field) + ": слишком длинное значение";
        }

        return "Проверьте заполнение формы";
    }

    private String fieldLabel(String field) {
        return switch (field) {
            case "email" -> "Email";
            case "password" -> "Пароль";
            case "firstName" -> "Имя";
            case "lastName" -> "Фамилия";
            case "title" -> "Название";
            case "description" -> "Описание";
            case "subject" -> "Предмет";
            case "price", "pricePerLesson" -> "Стоимость";
            case "durationMinutes" -> "Длительность";
            case "startDateTime" -> "Дата и время";
            case "message", "text" -> "Сообщение";
            case "rating" -> "Оценка";
            case "tutorAccountId" -> "Репетитор";
            case "studentAccountId" -> "Ученик";
            case "applicationId" -> "Заявка";
            default -> "Поле";
        };
    }

    private String translateServiceMessage(String message) {
        if (message == null || message.isBlank()) {
            return "Что-то пошло не так. Попробуйте еще раз";
        }

        return switch (message) {
            case "User already exists" -> "Пользователь с таким email уже существует";
            case "User not found" -> "Пользователь не найден";
            case "Account already exists" -> "Такой аккаунт уже создан";
            case "Account not found" -> "Аккаунт не найден";
            case "Profile not found" -> "Профиль не найден";
            case "Select an account first" -> "Сначала выберите активный аккаунт";
            case "Selected account type does not match" -> "Тип выбранного аккаунта не подходит для этого действия";
            case "Tutor card not found" -> "Карточка репетитора не найдена";
            case "Tutor profile not found" -> "Публичный профиль репетитора не найден";
            case "Tutor has no active cards" -> "У репетитора пока нет активной карточки";
            case "Unknown subject" -> "Выберите предмет из списка";
            case "Supported grades must not be empty" -> "Выберите хотя бы один класс или категорию студентов";
            case "Cannot apply to own card" -> "Нельзя отправить заявку на собственную карточку";
            case "Application not found" -> "Заявка не найдена";
            case "Application already processed" -> "Эта заявка уже обработана";
            case "Application is not accepted" -> "Действие доступно только после принятия заявки";
            case "Conversation not found" -> "Диалог не найден";
            case "Message cannot be empty" -> "Нельзя отправить пустое сообщение";
            case "Cannot contact your own tutor profile" -> "Нельзя написать самому себе";
            case "Create a student account first" -> "Сначала создайте аккаунт ученика";
            case "Student account does not match application" -> "Выбранный ученик не относится к этой заявке";
            case "Duration must be positive" -> "Длительность должна быть больше нуля";
            case "Price must be positive" -> "Стоимость должна быть больше нуля";
            case "Subject must not be blank" -> "Укажите предмет";
            case "Lesson not found" -> "Занятие не найдено";
            case "Meeting URL must start with http:// or https://" -> "Ссылка на созвон должна начинаться с http:// или https://";
            case "Cannot delete card with applications" -> "Нельзя удалить карточку, по которой уже есть заявки";
            case "Cannot delete card with lessons" -> "Нельзя удалить карточку, по которой уже есть занятия";
            case "Tutor account not found" -> "Репетитор не найден";
            case "Student account not found" -> "Ученик не найден";
            case "You can review only accepted tutors" -> "Отзыв можно оставить только репетитору, который принял вашу заявку";
            case "Review already exists" -> "Вы уже оставили отзыв этому репетитору";
            case "Review not found" -> "Отзыв не найден";
            case "YANDEX_TELEMOST_TOKEN is required when YANDEX_TELEMOST_DEV_MODE=false" -> "Не настроен токен для создания ссылки на видеозвонок";
            case "Telemost did not return a join URL" -> "Не удалось получить ссылку на видеозвонок";
            case "Failed to create a video meeting URL" -> "Не удалось создать ссылку на видеозвонок";
            default -> {
                if (message.startsWith("Failed to create a Telemost meeting")) {
                    yield "Не удалось создать встречу в Телемосте";
                }
                yield message;
            }
        };
    }
}
