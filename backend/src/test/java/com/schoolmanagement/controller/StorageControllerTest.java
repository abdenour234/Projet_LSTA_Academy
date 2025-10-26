package com.schoolmanagement.controller;

import io.minio.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for StorageController - LSTA-002
 * Tests file upload/download functionality with MinIO integration
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LSTA-002: StorageController Unit Tests")
class StorageControllerTest {

    @Mock
    private MinioClient minioClient;

    @InjectMocks
    private StorageController storageController;

    private final String bucketName = "school-management";

    @BeforeEach
    void setUp() {
        // Inject bucket name via reflection since it's @Value annotated
        ReflectionTestUtils.setField(storageController, "bucketName", bucketName);
    }

    @Test
    @DisplayName("Should upload 5MB PDF file successfully")
    void testUpload5MBPdfSuccess() throws Exception {
        // Arrange
        byte[] fileContent = new byte[5 * 1024 * 1024]; // 5MB
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-document.pdf",
                "application/pdf",
                fileContent
        );

        // Mock MinIO putObject - it doesn't return void, it throws exceptions
        // We don't need to mock it, just make sure it doesn't throw
        doAnswer(invocation -> null).when(minioClient).putObject(any(PutObjectArgs.class));

        // Act
        ResponseEntity<Map<String, String>> response = storageController.uploadFile(file);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("filename"));
        assertTrue(response.getBody().containsKey("originalName"));
        assertTrue(response.getBody().containsKey("url"));
        assertTrue(response.getBody().containsKey("contentType"));
        assertTrue(response.getBody().containsKey("size"));
        
        assertEquals("test-document.pdf", response.getBody().get("originalName"));
        assertEquals("application/pdf", response.getBody().get("contentType"));
        assertEquals("5242880", response.getBody().get("size")); // 5MB in bytes
        
        // Verify MinIO interaction
        verify(minioClient, times(1)).putObject(any(PutObjectArgs.class));
    }

    @Test
    @DisplayName("Should reject 15MB file upload (exceeds 10MB limit)")
    void testUpload15MBFileExceedsLimit() throws Exception {
        // Arrange
        byte[] fileContent = new byte[15 * 1024 * 1024]; // 15MB
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "large-file.pdf",
                "application/pdf",
                fileContent
        );

        // Act
        ResponseEntity<Map<String, String>> response = storageController.uploadFile(file);

        // Assert
        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("File size exceeds maximum limit of 10MB", response.getBody().get("error"));
        assertTrue(response.getBody().containsKey("size"));
        assertTrue(response.getBody().containsKey("maxSize"));
        
        // Verify MinIO was NOT called
        verify(minioClient, never()).putObject(any(PutObjectArgs.class));
    }

    @Test
    @DisplayName("Should reject empty file upload")
    void testUploadEmptyFile() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.txt",
                "text/plain",
                new byte[0]
        );

        // Act
        ResponseEntity<Map<String, String>> response = storageController.uploadFile(file);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("File is empty", response.getBody().get("error"));
        
        // Verify MinIO was NOT called
        verify(minioClient, never()).putObject(any(PutObjectArgs.class));
    }

    @Test
    @DisplayName("Should upload file with detected content-type when not provided")
    void testUploadFileWithDetectedContentType() throws Exception {
        // Arrange
        byte[] fileContent = "Test content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.docx",
                "", // Empty content type
                fileContent
        );

        doAnswer(invocation -> null).when(minioClient).putObject(any(PutObjectArgs.class));

        // Act
        ResponseEntity<Map<String, String>> response = storageController.uploadFile(file);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        // Should detect .docx as Word document
        assertEquals("application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                     response.getBody().get("contentType"));
    }

    @Test
    @DisplayName("Should retrieve uploaded file successfully with correct content-type")
    void testRetrieveUploadedFileSuccess() throws Exception {
        // Arrange
        String filename = "test-file.pdf";
        byte[] fileContent = "Test PDF content".getBytes();

        // Mock file exists check
        StatObjectResponse statResponse = mock(StatObjectResponse.class);
        when(statResponse.contentType()).thenReturn("application/pdf");
        when(minioClient.statObject(any(StatObjectArgs.class))).thenReturn(statResponse);

        // Mock file retrieval
        GetObjectResponse getObjectResponse = mock(GetObjectResponse.class);
        when(getObjectResponse.readAllBytes()).thenReturn(fileContent);
        when(minioClient.getObject(any(GetObjectArgs.class))).thenReturn(getObjectResponse);

        // Act
        ResponseEntity<byte[]> response = storageController.getFile(filename);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertArrayEquals(fileContent, response.getBody());
        assertEquals(MediaType.parseMediaType("application/pdf"), response.getHeaders().getContentType());
        assertTrue(response.getHeaders().getFirst("Content-Disposition").contains("inline"));
        
        // Verify MinIO interactions
        verify(minioClient, times(1)).statObject(any(StatObjectArgs.class));
        verify(minioClient, times(1)).getObject(any(GetObjectArgs.class));
    }

    @Test
    @DisplayName("Should return 404 when requesting non-existent file")
    void testRequestNonExistentFile() throws Exception {
        // Arrange
        String filename = "non-existent.pdf";
        
        // Mock file does not exist
        when(minioClient.statObject(any(StatObjectArgs.class)))
                .thenThrow(new RuntimeException("File not found"));

        // Act
        ResponseEntity<byte[]> response = storageController.getFile(filename);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(new String(response.getBody()).contains("File not found"));
        
        // Verify MinIO was called for stat but not for get
        verify(minioClient, times(1)).statObject(any(StatObjectArgs.class));
        verify(minioClient, never()).getObject(any(GetObjectArgs.class));
    }

    @Test
    @DisplayName("Should generate valid pre-signed URL with 1 hour expiry")
    void testGetPresignedUrlSuccess() throws Exception {
        // Arrange
        String filename = "test-document.pdf";
        String expectedUrl = "http://minio:9000/school-management/test-document.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=3600";

        // Mock file exists check
        StatObjectResponse statResponse = mock(StatObjectResponse.class);
        when(minioClient.statObject(any(StatObjectArgs.class))).thenReturn(statResponse);

        // Mock pre-signed URL generation
        when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                .thenReturn(expectedUrl);

        // Act
        ResponseEntity<Map<String, String>> response = storageController.getSignedUrl(filename);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedUrl, response.getBody().get("url"));
        assertEquals("3600", response.getBody().get("expiresIn"));
        assertEquals(filename, response.getBody().get("fileName"));
        
        // Verify MinIO interactions
        verify(minioClient, times(1)).statObject(any(StatObjectArgs.class));
        verify(minioClient, times(1)).getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class));
    }

    @Test
    @DisplayName("Should return 404 when generating signed URL for non-existent file")
    void testGetPresignedUrlFileNotFound() throws Exception {
        // Arrange
        String filename = "non-existent.pdf";
        
        // Mock file does not exist
        when(minioClient.statObject(any(StatObjectArgs.class)))
                .thenThrow(new RuntimeException("File not found"));

        // Act
        ResponseEntity<Map<String, String>> response = storageController.getSignedUrl(filename);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("File not found: " + filename, response.getBody().get("error"));
        
        // Verify pre-signed URL was NOT generated
        verify(minioClient, never()).getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class));
    }

    @Test
    @DisplayName("Should delete file successfully")
    void testDeleteFileSuccess() throws Exception {
        // Arrange
        String filename = "test-file.pdf";
        
        // Mock successful deletion
        doAnswer(invocation -> null).when(minioClient).removeObject(any(RemoveObjectArgs.class));

        // Act
        ResponseEntity<Void> response = storageController.deleteFile(filename);

        // Assert
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        
        // Verify MinIO interaction
        verify(minioClient, times(1)).removeObject(any(RemoveObjectArgs.class));
    }

    @Test
    @DisplayName("Should handle MinIO upload error gracefully")
    void testUploadMinioError() throws Exception {
        // Arrange
        byte[] fileContent = "Test content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                fileContent
        );

        // Mock MinIO error
        doThrow(new RuntimeException("MinIO connection failed"))
                .when(minioClient).putObject(any(PutObjectArgs.class));

        // Act
        ResponseEntity<Map<String, String>> response = storageController.uploadFile(file);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().get("error").contains("Failed to upload file"));
    }

    @Test
    @DisplayName("Should handle MinIO retrieval error gracefully")
    void testRetrieveMinioError() throws Exception {
        // Arrange
        String filename = "test-file.pdf";
        
        // Mock file exists
        StatObjectResponse statResponse = mock(StatObjectResponse.class);
        when(minioClient.statObject(any(StatObjectArgs.class))).thenReturn(statResponse);

        // Mock MinIO error on retrieval
        when(minioClient.getObject(any(GetObjectArgs.class)))
                .thenThrow(new RuntimeException("MinIO connection failed"));

        // Act
        ResponseEntity<byte[]> response = storageController.getFile(filename);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(new String(response.getBody()).contains("Error retrieving file"));
    }

    @Test
    @DisplayName("Should detect content type for various file extensions")
    void testContentTypeDetection() throws Exception {
        // Arrange - test multiple file types
        String[][] testCases = {
                {"document.pdf", "application/pdf"},
                {"image.jpg", "image/jpeg"},
                {"image.png", "image/png"},
                {"spreadsheet.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
                {"presentation.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"},
                {"text.txt", "text/plain"},
                {"data.csv", "text/csv"},
                {"archive.zip", "application/zip"},
                {"video.mp4", "video/mp4"},
                {"audio.mp3", "audio/mpeg"}
        };

        for (String[] testCase : testCases) {
            String filename = testCase[0];
            String expectedContentType = testCase[1];

            byte[] fileContent = "Test content".getBytes();
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    filename,
                    "", // Empty to trigger detection
                    fileContent
            );

            doAnswer(invocation -> null).when(minioClient).putObject(any(PutObjectArgs.class));

            // Act
            ResponseEntity<Map<String, String>> response = storageController.uploadFile(file);

            // Assert
            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertEquals(expectedContentType, response.getBody().get("contentType"),
                    "Failed for file: " + filename);
        }
    }
}
