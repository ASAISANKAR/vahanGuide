package com.vahanguide.api.pdi;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PdiPhotoRepository extends JpaRepository<PdiPhoto, UUID> {

    List<PdiPhoto> findByPurchaseProject_IdOrderByCreatedAtDesc(UUID purchaseProjectId);

    Optional<PdiPhoto> findByIdAndPurchaseProject_Id(
            UUID photoId,
            UUID purchaseProjectId
    );
}