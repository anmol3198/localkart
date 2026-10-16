package com.localkart.seed;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.localkart.config.AppProperties;
import com.localkart.product.Product;
import com.localkart.product.ProductRepository;
import com.localkart.shop.Shop;
import com.localkart.shop.ShopRepository;

/**
 * Loads demo shops around {@code localkart.seed.lat/lng} when the database is empty.
 * Demo vendor login: shop1@demo.local / demo1234.
 */
@Component
@Order(1)
@ConditionalOnProperty(name = "localkart.seed.enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
	private static final String DEMO_PASSWORD = "demo1234";

	private record Item(String name, String category, int price, String unit, boolean inStock) {
		Item(String name, String category, int price, String unit) {
			this(name, category, price, unit, true);
		}
	}

	/** northKm/eastKm: offset from the seed centre. deliveryKm 0 = pickup only. */
	private record DemoShop(String name, String category, String phone, String address, double northKm,
			double eastKm, double deliveryKm, int minOrder, int deliveryCharge, String hours, List<Item> items) {
	}

	private static final List<DemoShop> SHOPS = List.of(
			new DemoShop("Sharma Kirana Store", "Grocery", "9876500001", "1st Cross, 5th Block", 0.4, 0.3, 3, 200, 20, null,
					List.of(new Item("Basmati Rice", "Staples", 120, "kg"), new Item("Toor Dal", "Staples", 150, "kg"),
							new Item("Sunflower Oil", "Oil", 160, "litre"), new Item("Sugar", "Staples", 45, "kg"),
							new Item("Tata Salt", "Staples", 28, "kg"), new Item("Maggi Noodles", "Snacks", 14, "pack"),
							new Item("Parle-G Biscuits", "Snacks", 10, "pack", false))),
			new DemoShop("Fresh Farm Veggies", "Fruits & Vegetables", "9876500002", "80 Feet Road", -1.2, 0.8, 2, 100, 0, null,
					List.of(new Item("Tomato", "Vegetables", 30, "kg"), new Item("Onion", "Vegetables", 40, "kg"),
							new Item("Potato", "Vegetables", 35, "kg"), new Item("Banana", "Fruits", 60, "dozen"),
							new Item("Apple (Shimla)", "Fruits", 180, "kg"), new Item("Coriander", "Herbs", 10, "bunch"))),
			new DemoShop("Nandini Milk Parlour", "Dairy & Bakery", "9876500003", "Near Sony Signal", 1.8, -1.5, 0, 0, 0,
					"6:00 AM - 10:00 PM",
					List.of(new Item("Toned Milk", "Milk", 27, "500 ml"), new Item("Curd", "Milk", 25, "500 g"),
							new Item("Paneer", "Milk", 90, "200 g"), new Item("Brown Bread", "Bakery", 45, "pack"),
							new Item("Butter", "Milk", 56, "100 g"))),
			new DemoShop("Apollo Health Pharmacy", "Pharmacy", "9876500004", "Hosur Road", -3.1, -2.2, 5, 0, 30, "24 hours",
					List.of(new Item("Paracetamol 500mg", "Medicines", 30, "strip"), new Item("ORS Sachet", "Medicines", 22, "sachet"),
							new Item("Hand Sanitizer", "Personal Care", 99, "bottle"),
							new Item("Digital Thermometer", "Devices", 250, "piece"))),
			new DemoShop("Raju Hardware & Electricals", "Hardware", "9876500005", "Ejipura Main Road", 2.5, 3.0, 0, 0, 0, null,
					List.of(new Item("LED Bulb 9W", "Electrical", 99, "piece"), new Item("Extension Board", "Electrical", 349, "piece"),
							new Item("Screwdriver Set", "Tools", 199, "set"), new Item("M-Seal", "Adhesives", 40, "pack"))),
			// ~7.5 km away: outside the 5 km radius, used to verify the cutoff
			new DemoShop("Far Away Mart", "Grocery", "9876500006", "Outside the 5 km zone", 6, 4.5, 5, 0, 0, null,
					List.of(new Item("Basmati Rice", "Staples", 110, "kg"))));

	private final ShopRepository shops;
	private final ProductRepository products;
	private final PasswordEncoder passwordEncoder;
	private final AppProperties props;

	public DemoDataSeeder(ShopRepository shops, ProductRepository products, PasswordEncoder passwordEncoder,
			AppProperties props) {
		this.shops = shops;
		this.products = products;
		this.passwordEncoder = passwordEncoder;
		this.props = props;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (shops.count() > 0) {
			return;
		}
		double lat = props.seed().lat();
		double lng = props.seed().lng();
		String hash = passwordEncoder.encode(DEMO_PASSWORD);
		for (int i = 0; i < SHOPS.size(); i++) {
			DemoShop d = SHOPS.get(i);
			Shop s = new Shop();
			s.setOwnerName("Demo Owner " + (i + 1));
			s.setEmail("shop" + (i + 1) + "@demo.local");
			s.setPasswordHash(hash);
			s.setShopName(d.name());
			s.setCategory(d.category());
			s.setPhone(d.phone());
			s.setAddress(d.address());
			s.setLatitude(lat + d.northKm() / 110.574);
			s.setLongitude(lng + d.eastKm() / (111.32 * Math.cos(Math.toRadians(lat))));
			s.setHomeDelivery(d.deliveryKm() > 0);
			s.setDeliveryRadiusKm(d.deliveryKm() > 0 ? d.deliveryKm() : 2);
			s.setMinOrderAmount(BigDecimal.valueOf(d.minOrder()));
			s.setDeliveryCharge(BigDecimal.valueOf(d.deliveryCharge()));
			if (d.hours() != null) s.setOpeningHours(d.hours());
			Shop saved = shops.save(s);
			products.saveAll(d.items().stream().map(item -> {
				Product p = new Product();
				p.setShopId(saved.getId());
				p.setName(item.name());
				p.setCategory(item.category());
				p.setPrice(BigDecimal.valueOf(item.price()));
				p.setUnit(item.unit());
				p.setInStock(item.inStock());
				return p;
			}).toList());
		}
		log.info("Seeded {} demo shops around {}, {} (login: shop1@demo.local / {})", SHOPS.size(), lat, lng, DEMO_PASSWORD);
	}
}
