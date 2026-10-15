package com.localkart.product;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.localkart.common.ApiException;

@Service
public class ProductService {

	private final ProductRepository products;

	public ProductService(ProductRepository products) {
		this.products = products;
	}

	@Transactional(readOnly = true)
	public List<Product> list(UUID shopId) {
		return products.findByShopIdOrderByNameAsc(shopId);
	}

	@Transactional
	public Product create(UUID shopId, ProductRequest req) {
		Product p = new Product();
		p.setShopId(shopId);
		apply(req, p);
		return products.saveAndFlush(p);
	}

	@Transactional
	public Product update(UUID shopId, UUID id, ProductRequest req) {
		Product p = owned(shopId, id);
		apply(req, p);
		return products.saveAndFlush(p);
	}

	@Transactional
	public void delete(UUID shopId, UUID id) {
		products.delete(owned(shopId, id));
	}

	/** Vendors can only touch their own shop's items; others look like they don't exist. */
	private Product owned(UUID shopId, UUID id) {
		return products.findByIdAndShopId(id, shopId).orElseThrow(() -> ApiException.notFound("Product not found"));
	}

	private static void apply(ProductRequest req, Product p) {
		if (req.name() != null) p.setName(req.name().trim());
		if (req.category() != null) p.setCategory(req.category().isBlank() ? "General" : req.category().trim());
		if (req.price() != null) p.setPrice(req.price());
		if (req.unit() != null) p.setUnit(req.unit().isBlank() ? "piece" : req.unit().trim());
		if (req.inStock() != null) p.setInStock(req.inStock());
		if (req.description() != null) p.setDescription(req.description().isBlank() ? null : req.description().trim());
	}
}
