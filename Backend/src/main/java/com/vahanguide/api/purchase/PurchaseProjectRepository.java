package com.vahanguide.api.purchase;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PurchaseProjectRepository extends JpaRepository<PurchaseProject, UUID> { }
