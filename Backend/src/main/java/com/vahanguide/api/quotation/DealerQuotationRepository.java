package com.vahanguide.api.quotation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DealerQuotationRepository
        extends JpaRepository<DealerQuotation, UUID> {

    List<DealerQuotation> findByPurchaseProject_IdOrderByUploadedAtDesc(
            UUID purchaseProjectId
    );

    Optional<DealerQuotation> findByIdAndPurchaseProject_Id(
            UUID id,
            UUID purchaseProjectId
    );
}