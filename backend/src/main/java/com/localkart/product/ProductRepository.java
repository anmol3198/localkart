package com.localkart.product;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, UUID> {

	List<Product> findByShopIdOrderByNameAsc(UUID shopId);

	List<Product> findByShopIdOrderByInStockDescCategoryAscNameAsc(UUID shopId);

	Optional<Product> findByIdAndShopId(UUID id, UUID shopId);

	Optional<Product> findByShopIdAndBarcode(UUID shopId, String barcode);

	/** {@code pattern} is a lower-cased LIKE pattern that uses '!' as its escape character. */
	@Query("""
			select p from Product p
			where p.shopId in :shopIds and lower(p.name) like :pattern escape '!'
			order by p.name""")
	List<Product> searchInShops(@Param("shopIds") Collection<UUID> shopIds, @Param("pattern") String pattern);
}
