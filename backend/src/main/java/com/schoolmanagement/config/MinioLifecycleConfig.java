package com.schoolmanagement.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketLifecycleArgs;
import io.minio.messages.Expiration;
import io.minio.messages.LifecycleConfiguration;
import io.minio.messages.LifecycleRule;
import io.minio.messages.RuleFilter;
import io.minio.messages.Status;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedList;
import java.util.List;

/**
 * Configuration for MinIO bucket lifecycle policies.
 * Sets up automatic file deletion after 7 days (1 week).
 * Files uploaded by schools (admins/teachers) will be automatically cleaned up.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class MinioLifecycleConfig implements CommandLineRunner {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Override
    public void run(String... args) {
        try {
            log.info("Configuring MinIO bucket lifecycle policies...");
            
            // Ensure bucket exists
            boolean bucketExists = minioClient.bucketExists(
                BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build()
            );

            if (!bucketExists) {
                log.info("Bucket '{}' doesn't exist. Creating...", bucketName);
                minioClient.makeBucket(
                    MakeBucketArgs.builder()
                        .bucket(bucketName)
                        .build()
                );
                log.info("✅ Bucket '{}' created successfully", bucketName);
            }

            // Create lifecycle rule for automatic file deletion after 7 days
            Expiration expiration = new Expiration((java.time.ZonedDateTime) null, 7, null);
            RuleFilter filter = new RuleFilter("activity-files/");
            
            LifecycleRule rule = new LifecycleRule(
                Status.ENABLED,
                null,  // abortIncompleteMultipartUpload
                expiration,
                filter,
                "activity-files-cleanup-rule", // id
                null,  // noncurrentVersionExpiration
                null,  // noncurrentVersionTransition
                null   // transition
            );

            List<LifecycleRule> rules = new LinkedList<>();
            rules.add(rule);

            LifecycleConfiguration config = new LifecycleConfiguration(rules);

            // Apply lifecycle configuration to bucket
            minioClient.setBucketLifecycle(
                SetBucketLifecycleArgs.builder()
                    .bucket(bucketName)
                    .config(config)
                    .build()
            );

            log.info("✅ Lifecycle policy configured successfully for bucket '{}'", bucketName);
            log.info("   Files in 'activity-files/' will be automatically deleted after 7 days");
            
        } catch (Exception e) {
            log.error("❌ Error configuring MinIO lifecycle policy: {}", e.getMessage(), e);
            // Don't fail application startup if lifecycle config fails
            log.warn("Application will continue without automatic file cleanup");
        }
    }
}
