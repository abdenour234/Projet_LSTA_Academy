package com.schoolmanagement.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory rate limiter (per-minute fixed window).
 *
 * Note: This is per-app-instance. For multi-instance deployments, use a shared store.
 */
@Component
public class MessagingRateLimiter {

    private static final long WINDOW_MILLIS = 60_000L;

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Value("${messaging.rate-limits.send-message:30}")
    private int sendMessagePerMinute;

    @Value("${messaging.rate-limits.upload-file:10}")
    private int uploadFilePerMinute;

    public void checkSendMessage(String userId) {
        check("SEND_MESSAGE:" + userId, sendMessagePerMinute);
    }

    public void checkUploadFile(String userId) {
        check("UPLOAD_FILE:" + userId, uploadFilePerMinute);
    }

    private void check(String key, int limitPerMinute) {
        long now = Instant.now().toEpochMilli();
        long windowStart = now - (now % WINDOW_MILLIS);

        WindowCounter counter = counters.compute(key, (k, existing) -> {
            if (existing == null || existing.windowStartMillis != windowStart) {
                return new WindowCounter(windowStart);
            }
            return existing;
        });

        int current = counter.count.incrementAndGet();
        if (current > limitPerMinute) {
            throw new IllegalStateException("Rate limit exceeded");
        }

        // opportunistic cleanup
        if (counters.size() > 20_000) {
            counters.entrySet().removeIf(e -> e.getValue().windowStartMillis < windowStart - WINDOW_MILLIS);
        }
    }

    private static final class WindowCounter {
        private final long windowStartMillis;
        private final AtomicInteger count = new AtomicInteger(0);

        private WindowCounter(long windowStartMillis) {
            this.windowStartMillis = windowStartMillis;
        }
    }
}
