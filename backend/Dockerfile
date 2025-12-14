# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app



# Some environments intermittently fail to resolve Maven hosts during Docker builds.
# Use an explicit Maven Central mirror hostname to improve reliability.
RUN mkdir -p /root/.m2 \
	&& printf '%s\n' \
		'<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"' \
		'          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' \
		'          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd">' \
		'  <mirrors>' \
		'    <mirror>' \
		'      <id>central-repo1</id>' \
		'      <name>Maven Central</name>' \
		'      <url>https://repo1.maven.org/maven2</url>' \
		'      <mirrorOf>central</mirrorOf>' \
		'    </mirror>' \
		'  </mirrors>' \
		'</settings>' \
		> /root/.m2/settings.xml

COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
	mvn -s /root/.m2/settings.xml -DskipTests dependency:go-offline dependency:resolve-plugins -B
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
	mvn -s /root/.m2/settings.xml -DskipTests clean package -B

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
