package com.vahanguide.api.quotation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record QuotationResponse(
        UUID id,
        UUID purchaseProjectId,
        String originalFilename,
        String contentType,
        long sizeBytes,
        LocalDateTime uploadedAt,
        List<Map<String, Object>> extractedItems
) {
    public static QuotationResponse from(DealerQuotation quotation) {
        return new QuotationResponse(
                quotation.getId(),
                quotation.getPurchaseProject().getId(),
                quotation.getOriginalFilename(),
                quotation.getContentType(),
                quotation.getSizeBytes(),
                quotation.getUploadedAt(),
                quotation.getExtractedItems()
        );
    }
}