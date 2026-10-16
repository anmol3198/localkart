# Build stage: compile the Spring Boot jar (tests run separately with ./mvnw test).
FROM maven:3.9-eclipse-temurin-26 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests && cp target/localkart-api-*.jar app.jar

# Run stage: small JRE image, non-root user.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/app.jar app.jar
USER app
# Hosts like Render set PORT; the app reads it (defaults to 5050).
EXPOSE 5050
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"
ENTRYPOINT ["java", "-jar", "app.jar"]
