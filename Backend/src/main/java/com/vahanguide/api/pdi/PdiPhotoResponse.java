package com.vahanguide.api.pdi;

import java.time.Instant;
import java.util.UUID;

public record PdiPhotoResponse(
        UUID id,
        UUID purchaseProjectId,
        String checklistItemId,
        String caption,
        String imageUrl,
        String originalFilename,
        String contentType,
        long sizeBytes,
        Instant createdAt
) {
    public static PdiPhotoResponse from(PdiPhoto photo) {
        return new PdiPhotoResponse(
                photo.getId(),
                photo.getPurchaseProject().getId(),
                photo.getChecklistItemId(),
                photo.getCaption(),
                photo.getImageUrl(),
                photo.getOriginalFilename(),
                photo.getContentType(),
                photo.getSizeBytes(),
                photo.getCreatedAt()
        );
    }
}