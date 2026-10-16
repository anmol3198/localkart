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
@SpringBootTest(properties = { "localkart.seed.enabled=true", "localkart.barcode-lookup.enabled=false", "localkart.seed.lat=12.9352", "localkart.seed.lng=77.6245" })
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
				{"ownerName":"Test Owner","email":"New.Vendor@Example.com","password":"secret12",
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

	private String registerShop(String email) throws Exception {
		String body = """
				{"ownerName":"Insights Owner","email":"%s","password":"secret12",
				 "shopName":"Insights Store","phone":"9000000009","address":"Test Road","lat":13.3000,"lng":77.9000}"""
				.formatted(email);
		return JsonPath.read(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString(), "$.token");
	}

	private String shopIdOf(String token) throws Exception {
		return JsonPath.read(mvc.perform(get("/api/vendor/shop").header("Authorization", "Bearer " + token))
				.andReturn().getResponse().getContentAsString(), "$._id");
	}

	private org.springframework.test.web.servlet.ResultActions event(String shopId, String json) throws Exception {
		return mvc.perform(post("/api/shops/" + shopId + "/events").contentType(MediaType.APPLICATION_JSON).content(json));
	}

	@Test
	void customerActivityIsValidatedAndCountedOncePerVisitor() throws Exception {
		String token = registerShop("events.owner@example.com");
		String shopId = shopIdOf(token);

		event(shopId, "{\"type\":\"VIEW\",\"source\":\"WEB\",\"visitorId\":\"visitor-aaaa-1111\"}").andExpect(status().isAccepted());
		// same visitor viewing again within 30 minutes is not counted twice
		event(shopId, "{\"type\":\"view\",\"source\":\"web\",\"visitorId\":\"visitor-aaaa-1111\"}").andExpect(status().isAccepted());
		event(shopId, "{\"type\":\"VIEW\",\"source\":\"ANDROID\",\"visitorId\":\"visitor-bbbb-2222\"}").andExpect(status().isAccepted());
		event(shopId, "{\"type\":\"CALL\",\"source\":\"ANDROID\",\"visitorId\":\"visitor-bbbb-2222\"}").andExpect(status().isAccepted());
		event(shopId, "{\"type\":\"WHATSAPP\",\"source\":\"IOS\",\"visitorId\":\"visitor-cccc-3333\"}").andExpect(status().isAccepted());
		// no visitor id: falls back to the client's IP + user agent
		event(shopId, "{\"type\":\"DIRECTIONS\"}").andExpect(status().isAccepted());

		event(shopId, "{\"type\":\"LIKE\"}").andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Event type must be VIEW, CALL, WHATSAPP or DIRECTIONS"));
		event(shopId, "{}").andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Event type is required"));
		event(shopId, "{\"type\":\"CALL\",\"source\":\"FAX\"}").andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Source must be WEB, ANDROID or IOS"));
		event(shopId, "{\"type\":\"CALL\",\"visitorId\":\"<script>\"}").andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Invalid visitor id"));
		event("00000000-0000-0000-0000-000000000000", "{\"type\":\"CALL\"}").andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Shop not found"));
		event("not-a-uuid", "{\"type\":\"CALL\"}").andExpect(status().isBadRequest());

		mvc.perform(get("/api/vendor/insights?days=7").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.days").value(7))
				.andExpect(jsonPath("$.timezone").value("Asia/Kolkata"))
				.andExpect(jsonPath("$.totals.views").value(2))
				.andExpect(jsonPath("$.totals.calls").value(1))
				.andExpect(jsonPath("$.totals.whatsapp").value(1))
				.andExpect(jsonPath("$.totals.directions").value(1))
				.andExpect(jsonPath("$.totals.contacts").value(2))
				.andExpect(jsonPath("$.previous.views").value(0))
				.andExpect(jsonPath("$.daily.length()").value(7))
				.andExpect(jsonPath("$.daily[6].views").value(2))
				.andExpect(jsonPath("$.sources.web").value(2))
				.andExpect(jsonPath("$.sources.android").value(2))
				.andExpect(jsonPath("$.sources.ios").value(1));
	}

	@Test
	void insightsAreOwnerOnlyAndValidated() throws Exception {
		mvc.perform(get("/api/vendor/insights")).andExpect(status().isUnauthorized());
		String token = registerShop("insights.owner@example.com");
		mvc.perform(get("/api/vendor/insights?days=5").header("Authorization", "Bearer " + token))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("days must be 7, 30 or 90"));
		mvc.perform(get("/api/vendor/insights?days=abc").header("Authorization", "Bearer " + token))
				.andExpect(status().isBadRequest());
		// another shop's activity never shows up in a new shop's numbers
		mvc.perform(get("/api/vendor/insights?days=90").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.daily.length()").value(90))
				.andExpect(jsonPath("$.totals.views").value(0));
	}

	@Test
	void demoShopsComeWithSampleActivity() throws Exception {
		String token = JsonPath.read(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"shop1@demo.local\",\"password\":\"demo1234\"}"))
				.andReturn().getResponse().getContentAsString(), "$.token");
		mvc.perform(get("/api/vendor/insights?days=30").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totals.views", org.hamcrest.Matchers.greaterThan(100)));
	}

	@Test
	void simultaneousDuplicateEventsAreCountedOnce() throws Exception {
		String token = registerShop("race.owner@example.com");
		String shopId = shopIdOf(token);
		var pool = java.util.concurrent.Executors.newFixedThreadPool(6);
		try {
			var jobs = new java.util.ArrayList<java.util.concurrent.Future<Integer>>();
			for (int i = 0; i < 6; i++) {
				jobs.add(pool.submit(() -> event(shopId, "{\"type\":\"VIEW\",\"visitorId\":\"visitor-race-0001\"}")
						.andReturn().getResponse().getStatus()));
			}
			for (var job : jobs) {
				org.junit.jupiter.api.Assertions.assertEquals(202, job.get());
			}
		} finally {
			pool.shutdown();
		}
		mvc.perform(get("/api/vendor/insights?days=7").header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$.totals.views").value(1));
	}

	@Test
	void barcodesAreValidatedUniquePerShopAndScannable() throws Exception {
		String auth = "Bearer " + registerShop("barcode.owner@example.com");
		String valid = "4006381333931"; // a real EAN-13 with a correct check digit

		String id = JsonPath.read(mvc.perform(post("/api/vendor/products").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Highlighter\",\"price\":40,\"barcode\":\" 4006381333931 \"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.barcode").value(valid))
				.andReturn().getResponse().getContentAsString(), "$._id");

		// scan-to-find
		mvc.perform(get("/api/vendor/products/barcode/" + valid).header("Authorization", auth))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Highlighter"));
		mvc.perform(get("/api/vendor/products/barcode/0000000000000").header("Authorization", auth))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("No item with this barcode in your shop yet"));

		// one item per code per shop
		mvc.perform(post("/api/vendor/products").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Other pen\",\"price\":10,\"barcode\":\"" + valid + "\"}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("\"Highlighter\" already uses this barcode"));
		// re-saving the same item with its own code is fine
		mvc.perform(put("/api/vendor/products/" + id).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"barcode\":\"" + valid + "\",\"price\":42}"))
				.andExpect(status().isOk());

		// typo in a retail code (wrong check digit) and junk characters
		mvc.perform(post("/api/vendor/products").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Typo\",\"price\":1,\"barcode\":\"4006381333932\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("This barcode looks mistyped: its last digit doesn't match. Please scan it again"));
		mvc.perform(post("/api/vendor/products").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Junk\",\"price\":1,\"barcode\":\"ab$c\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Barcode can only have letters, numbers and dashes (4-32 characters)"));

		// shop's own (non-retail) codes are allowed, and "" clears the code
		mvc.perform(put("/api/vendor/products/" + id).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"barcode\":\"shop-0001\"}"))
				.andExpect(jsonPath("$.barcode").value("SHOP-0001"));
		mvc.perform(put("/api/vendor/products/" + id).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"barcode\":\"\"}"))
				.andExpect(jsonPath("$.barcode").doesNotExist());

		// another shop can use the same code for its own item, and can't see this shop's
		String other = "Bearer " + registerShop("barcode.other@example.com");
		mvc.perform(post("/api/vendor/products").header("Authorization", other).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Their highlighter\",\"price\":45,\"barcode\":\"" + valid + "\"}"))
				.andExpect(status().isCreated());
		mvc.perform(get("/api/vendor/products/barcode/SHOP-0001").header("Authorization", other))
				.andExpect(status().isNotFound());
	}

	@Test
	void barcodeLookupIsOwnerOnlyAndExplainsMisses() throws Exception {
		mvc.perform(get("/api/vendor/barcode-lookup/4006381333931")).andExpect(status().isUnauthorized());
		String auth = "Bearer " + registerShop("lookup.owner@example.com");
		mvc.perform(get("/api/vendor/barcode-lookup/4006381333931").header("Authorization", auth))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("We don't know this product yet. Type its name once and it's saved for next time"));
		mvc.perform(get("/api/vendor/barcode-lookup/SHOP-1").header("Authorization", auth))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Only product barcodes (8-14 digits) can be looked up. Type the item name instead"));
		mvc.perform(get("/api/vendor/barcode-lookup/4006381333932").header("Authorization", auth))
				.andExpect(status().isBadRequest());
	}

	private org.springframework.test.web.servlet.ResultActions register(String json) throws Exception {
		return mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private static String signup(String overrides) {
		// a valid registration, with some fields replaced
		String base = """
				"ownerName":"Asha Rao","email":"asha%d@example.com","password":"secret12","shopName":"Asha Stores",
				"phone":"9876543210","address":"12 MG Road, Indiranagar","lat":12.97,"lng":77.64""".formatted(System.nanoTime());
		return "{" + base + (overrides.isEmpty() ? "" : "," + overrides) + "}";
	}

	@Test
	void registrationRejectsBadPhoneEmailPasswordAndNames() throws Exception {
		String phoneMsg = "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9 (or a landline with STD code, e.g. 080 2345 6789)";
		for (String bad : new String[] { "1234567890", "0000000000", "9999999999", "98765", "+1 415 555 0101", "98765abcde" }) {
			register(signup("\"phone\":\"" + bad + "\"")).andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.message").value(phoneMsg));
		}
		for (String bad : new String[] { "asha@", "asha@gmail", "asha@@gmail.com", "asha..rao@gmail.com", "asha rao@gmail.com", "@gmail.com", "asha@gmail.c" }) {
			register(signup("\"email\":\"" + bad + "\"")).andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.message").value("Enter a valid email, like name@gmail.com"));
		}
		for (String bad : new String[] { "short1", "onlyletters", "12345678" }) {
			register(signup("\"password\":\"" + bad + "\"")).andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.message").value("Password must be 8-72 characters with at least one letter and one number"));
		}
		register(signup("\"ownerName\":\"12345\"")).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Enter your name using letters (2-80 characters)"));
		register(signup("\"shopName\":\" a \"")).andExpect(status().isBadRequest());
		register(signup("\"address\":\"12\"")).andExpect(status().isBadRequest());
		register(signup("\"lat\":40.71,\"lng\":-74.0")).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Shop location must be in India"));
		register(signup("\"alternatePhone\":\"+91 98765 43210\"")).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Alternate phone must be different from the main phone"));
		register(signup("\"minOrderAmount\":12.345")).andExpect(status().isBadRequest());
	}

	@Test
	void phoneAndEmailAreCleanedUp() throws Exception {
		String email = "  Priya.Shop" + System.nanoTime() + "@Gmail.COM ";
		register("""
				{"ownerName":"  Priya   Nair ","email":"%s","password":"secret12","shopName":"Priya Mart",
				 "phone":"+91 98765-43211","alternatePhone":"080 2345 6789","address":"5 Church Street","lat":12.97,"lng":77.60}"""
				.formatted(email))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.shop.phone").value("9876543211"))
				.andExpect(jsonPath("$.shop.alternatePhone").value("08023456789"))
				.andExpect(jsonPath("$.shop.email").value(email.trim().toLowerCase()))
				.andExpect(jsonPath("$.shop.ownerName").value("Priya Nair"));
		register(signup("\"ownerName\":\"प्रिया शर्मा\"")).andExpect(status().isCreated());
		// leading 0 and 91 prefixes on mobiles are fine too
		register(signup("\"phone\":\"09876543212\"")).andExpect(status().isCreated()).andExpect(jsonPath("$.shop.phone").value("9876543212"));
		register(signup("\"phone\":\"919876543213\"")).andExpect(status().isCreated()).andExpect(jsonPath("$.shop.phone").value("9876543213"));
	}

	@Test
	void loginNeedsBothFieldsAndItemsAreChecked() throws Exception {
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"\",\"password\":\"x\"}"))
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Enter your email"));
		String auth = "Bearer " + registerShop("items.rules@example.com");
		mvc.perform(post("/api/vendor/products").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\" x \",\"price\":10}"))
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Item name must be 2-150 characters"));
		mvc.perform(post("/api/vendor/products").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Rice\",\"price\":10.555}"))
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Price can have at most 2 decimal places"));
		mvc.perform(post("/api/vendor/products").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Gold\",\"price\":5000000}"))
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Price can be at most ₹10,00,000"));
	}
}
