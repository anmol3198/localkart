package com.localkart;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

/** End-to-end API tests against a real (embedded) PostgreSQL with the demo seed data. */
@SpringBootTest(properties = { "localkart.seed.enabled=true", "localkart.seed.lat=12.9352", "localkart.seed.lng=77.6245" })
@AutoConfigureMockMvc
class LocalkartApiApplicationTests {

	private static final String HERE = "lat=12.9352&lng=77.6245";
	private static final String[] SEEDED_WITHIN_5KM = { "Sharma Kirana Store", "Fresh Farm Veggies",
			"Nandini Milk Parlour", "Apollo Health Pharmacy", "Raju Hardware & Electricals" };
	private static EmbeddedPostgres pg;

	@DynamicPropertySource
	static void database(DynamicPropertyRegistry registry) throws IOException {
		if (pg == null) {
			pg = EmbeddedPostgres.start();
		}
		registry.add("spring.datasource.url", () -> pg.getJdbcUrl("postgres", "postgres"));
		registry.add("spring.datasource.username", () -> "postgres");
		registry.add("spring.datasource.password", () -> "postgres");
	}

	@AfterAll
	static void stopDatabase() throws IOException {
		if (pg != null) {
			pg.close();
		}
	}

	@Autowired
	MockMvc mvc;

	@Test
	void nearbyReturnsOnlyShopsWithin5KmNearestFirst() throws Exception {
		mvc.perform(get("/api/shops/nearby?" + HERE))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.radiusKm").value(5.0))
				.andExpect(jsonPath("$.shops[*].shopName", hasItems(SEEDED_WITHIN_5KM)))
				.andExpect(jsonPath("$.shops[0].shopName").value("Sharma Kirana Store"))
				.andExpect(jsonPath("$.shops[*].shopName", not(hasItem("Far Away Mart"))))
				.andExpect(jsonPath("$.shops[*].distanceKm", everyItem(lessThanOrEqualTo(5.0))))
				.andExpect(jsonPath("$.shops[0].email").doesNotExist());
	}

	@Test
	void radiusCannotExceedMaximum() throws Exception {
		mvc.perform(get("/api/shops/nearby?" + HERE + "&radiusKm=50"))
				.andExpect(jsonPath("$.radiusKm").value(5.0))
				.andExpect(jsonPath("$.shops[*].shopName", not(hasItem("Far Away Mart"))));
	}

	@Test
	void searchMatchesProductsInInventory() throws Exception {
		mvc.perform(get("/api/shops/nearby?" + HERE + "&q=RICE"))
				.andExpect(jsonPath("$.count").value(1))
				.andExpect(jsonPath("$.shops[0].shopName").value("Sharma Kirana Store"))
				.andExpect(jsonPath("$.shops[0].matchingProducts[0].name").value("Basmati Rice"));
	}

	@Test
	void deliveryFilterAndDeliversToYou() throws Exception {
		mvc.perform(get("/api/shops/nearby?" + HERE + "&delivery=true"))
				.andExpect(jsonPath("$.shops[*].shopName",
						hasItems("Sharma Kirana Store", "Fresh Farm Veggies", "Apollo Health Pharmacy")))
				.andExpect(jsonPath("$.shops[*].homeDelivery", everyItem(is(true))));
	}

	@Test
	void requiresValidLocation() throws Exception {
		mvc.perform(get("/api/shops/nearby?lat=abc&lng=77"))
				.andExpect(status().isBadRequest());
		mvc.perform(get("/api/shops/nearby"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Valid lat and lng are required"));
	}

	@Test
	void vendorEndpointsRequireLogin() throws Exception {
		mvc.perform(get("/api/vendor/shop"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Login required"));
		mvc.perform(get("/api/vendor/shop").header("Authorization", "Bearer garbage"))
				.andExpect(status().isUnauthorized());
		// an expired/invalid vendor token must not block public browsing
		mvc.perform(get("/api/shops/nearby?" + HERE).header("Authorization", "Bearer garbage"))
				.andExpect(status().isOk());
	}

	@Test
	void vendorRegistersManagesInventoryAndAppearsNearby() throws Exception {
		String body = """
				{"ownerName":"Test Owner","email":"New.Vendor@Example.com","password":"secret1",
				 "shopName":"Corner Bakery","phone":"9000000001","address":"Main Road","category":"Dairy & Bakery",
				 "homeDelivery":true,"deliveryRadiusKm":1,"lat":12.9400,"lng":77.6245}""";
		String token = JsonPath.read(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.shop.email").value("new.vendor@example.com"))
				.andReturn().getResponse().getContentAsString(), "$.token");

		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isConflict());

		String auth = "Bearer " + token;
		String productId = JsonPath.read(mvc.perform(post("/api/vendor/products").header("Authorization", auth)
				.contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Croissant\",\"price\":45,\"unit\":\"piece\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.category").value("General"))
				.andReturn().getResponse().getContentAsString(), "$._id");

		mvc.perform(put("/api/vendor/products/" + productId).header("Authorization", auth)
				.contentType(MediaType.APPLICATION_JSON).content("{\"inStock\":false}"))
				.andExpect(jsonPath("$.inStock").value(false))
				.andExpect(jsonPath("$.name").value("Croissant"));

		// customer ~0.5 km away finds it by product and is inside the 1 km delivery radius
		mvc.perform(get("/api/shops/nearby?" + HERE + "&q=croiss"))
				.andExpect(jsonPath("$.shops[0].shopName").value("Corner Bakery"))
				.andExpect(jsonPath("$.shops[0].deliversToYou").value(true));

		// partial update: pause delivery only
		mvc.perform(put("/api/vendor/shop").header("Authorization", auth)
				.contentType(MediaType.APPLICATION_JSON).content("{\"homeDelivery\":false}"))
				.andExpect(jsonPath("$.homeDelivery").value(false))
				.andExpect(jsonPath("$.shopName").value("Corner Bakery"));

		mvc.perform(put("/api/vendor/shop").header("Authorization", auth)
				.contentType(MediaType.APPLICATION_JSON).content("{\"deliveryRadiusKm\":9,\"phone\":\"12\"}"))
				.andExpect(status().isBadRequest());

		mvc.perform(delete("/api/vendor/products/" + productId).header("Authorization", auth))
				.andExpect(status().isNoContent());
	}

	@Test
	void vendorCannotTouchAnotherShopsProducts() throws Exception {
		String token = JsonPath.read(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"shop2@demo.local\",\"password\":\"demo1234\"}"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString(), "$.token");

		String shop1Id = JsonPath.read(mvc.perform(get("/api/shops/nearby?" + HERE + "&q=Sharma"))
				.andReturn().getResponse().getContentAsString(), "$.shops[0]._id");
		String shop1ProductId = JsonPath.read(mvc.perform(get("/api/shops/" + shop1Id))
				.andExpect(jsonPath("$.shop.email").doesNotExist())
				.andReturn().getResponse().getContentAsString(), "$.products[0]._id");

		mvc.perform(delete("/api/vendor/products/" + shop1ProductId).header("Authorization", "Bearer " + token))
				.andExpect(status().isNotFound());
	}

	@Test
	void wrongPasswordIsRejected() throws Exception {
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"shop1@demo.local\",\"password\":\"nope\"}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Invalid email or password"));
	}
}
