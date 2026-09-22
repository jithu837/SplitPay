# ---- Stage 1: Build ----
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first (Docker cache layer)
RUN mvn dependency:go-offline -B
COPY src ./src
RUN cp -n src/main/resources/application.properties.example src/main/resources/application.properties || true
RUN mvn clean package -DskipTests -B

# ---- Stage 2: Run ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/splitpay-backend.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
