FROM maven:3.9.15-eclipse-temurin-21-alpine AS build

WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B package -Dmaven.test.skip=true

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
RUN addgroup -S repetito && adduser -S repetito -G repetito

COPY --from=build /app/target/repetito-backend-0.0.1-SNAPSHOT.jar app.jar

USER repetito
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
