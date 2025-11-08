package com.schoolmanagement.config;

import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for MinIO client.
 * MinIO is used for object storage with backend proxy for file access.
 */
@Configuration
@Slf4j
public class MinioConfig {

    @Value("${minio.url:http://minio:9000}")
    private String minioUrl;

    @Value("${minio.access-key:minioadmin}")
    private String accessKey;

    @Value("${minio.secret-key:minioadmin}")
    private String secretKey;

    /**
     * MinIO client for all operations (upload, download, delete).
     * Uses internal Docker network endpoint for direct communication.
     * @return Configured MinioClient instance
     */
    @Bean(name = "minioClient")
    public MinioClient minioClient() {
        log.info("Initializing MinIO client with URL: {}", minioUrl);
        
        return MinioClient.builder()
                .endpoint(minioUrl)
                .credentials(accessKey, secretKey)
                .build();
    }
}
