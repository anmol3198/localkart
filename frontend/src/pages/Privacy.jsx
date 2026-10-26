import { Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import LegalPage from '../components/LegalPage.jsx'
import { CONTACT_EMAIL, GRIEVANCE_OFFICER } from '../lib/legal.js'

const P = (props) => <Typography paragraph {...props} />
const H = ({ children }) => <Typography component="h3">{children}</Typography>
const Mail = () => <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>

const SUMMARY = [
  'Customers don’t need an account. We don’t ask for your name, phone number or email to browse.',
  'Your location is used to find shops near you. It is saved on your device, not in our database.',
  'Your order message goes straight from your phone to the shop on WhatsApp. We never see what’s in it.',
  'Shop owners share their shop details so customers can find them. Owners can delete their shop at any time.',
  'We don’t sell your data, show ads, or use third-party tracking or analytics.',
]

const SECTIONS = [
  ['Who we are', <>
    <P>LocalKart (“we”, “us”) helps people find shops within 5 km, check what is in stock and contact the shop by phone or WhatsApp. It is available at localkart.pages.dev and as a mobile app.</P>
    <P>This policy explains what information we handle, why, and the choices you have. It is written to meet India’s Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000 and its rules. For the personal data described here, LocalKart is the “data fiduciary”.</P>
  </>],

  ['Information about customers', <>
    <H>Your location</H>
    <P>To show nearby shops we use your location: either from your device (only if you allow it) or an address or area you type in. With each search we send the location to our server to find shops around it. We don’t store it in our database. Your device remembers the last location so you don’t have to set it again.</P>
    <P>When you type an address, the text is sent to OpenStreetMap’s Nominatim service to find it on the map.</P>
    <H>What you do on a shop page</H>
    <P>To show shop owners how many people found them, we record when someone opens a shop page or taps Call, WhatsApp, Directions or Send order. For each of these we store:</P>
    <ul>
      <li>the shop, the type of action, the time, and whether it came from the website or the app;</li>
      <li>a one-way, salted hash of a random ID your device creates. If that ID isn’t available, we hash your IP address and browser name instead.</li>
    </ul>
    <P>The hash lets us count one person once instead of every repeated tap. It can’t be turned back into the ID or your IP address, and we don’t store either. Shop owners only see totals, never who visited.</P>
    <H>Your order cart</H>
    <P>Items you add to a cart, and the name and delivery address you type for an order, stay on your device. When you tap Send, your phone opens WhatsApp (or your phone dialler) with the message, and it goes straight to the shop. We don’t receive the message or your phone number. After that the shop handles your order, and WhatsApp’s own privacy policy applies to the chat.</P>
  </>],

  ['Information about shop owners', <>
    <P>When you register a shop we collect:</P>
    <ul>
      <li><b>Account:</b> your name, email address and password. We store the password only as a one-way bcrypt hash, so we can’t read it.</li>
      <li><b>Shop:</b> shop name, phone numbers, address, map location, category, description, opening hours and delivery settings.</li>
      <li><b>Stock:</b> item names, prices, units, categories, barcodes and whether they are in stock.</li>
      <li><b>Records:</b> when you registered and accepted these terms, and our review decision (approved, rejected or suspended) with any note.</li>
    </ul>
    <P><b>What customers see:</b> once your shop is approved, anyone can see the shop name, phone numbers, address, map location, hours, delivery settings and the items and prices you list. Your email address and owner name are never shown to customers.</P>
    <P>When you scan a barcode, our server sends only the barcode number to Open Food Facts, a public product database, to suggest the product name.</P>
  </>],

  ['Information about LocalKart staff', <>
    <P>Staff who review shops have accounts with a name, email and hashed password. Every review action (approve, reject, suspend, reinstate) is recorded with who did it, when, and the shop involved, so decisions are accountable.</P>
  </>],

  ['Technical information', <>
    <P>Like any website, our hosting providers receive your IP address and basic request details (time, page, browser) when you connect. They use these briefly to run and secure the service. To stop abuse we count requests per IP address over 15 minutes. These counts are kept only in the server’s memory and are never saved.</P>
  </>],

  ['Why we use information', <>
    <ul>
      <li>To show customers nearby shops, their stock and prices, and let them contact a shop.</li>
      <li>To create and secure shop owner accounts, and to review shops so that only real shops are listed.</li>
      <li>To give shop owners activity numbers (views, calls, WhatsApp messages, directions, orders).</li>
      <li>To prevent fraud, spam, abuse and attacks, and to fix problems.</li>
      <li>To meet legal obligations.</li>
    </ul>
    <P>We rely on your consent (given when you register, or when you use a feature such as location), and on legitimate uses allowed by the DPDP Act, such as providing a service you asked for and complying with the law. We don’t use your information for advertising, and we don’t sell it.</P>
  </>],

  ['What is stored on your device', <>
    <P>The website (in your browser’s local storage) and the app (in device storage) keep:</P>
    <ul>
      <li>your chosen location;</li>
      <li>the random visitor ID described above;</li>
      <li>your order carts, plus the name and address you last used for an order;</li>
      <li>for shop owners, the login token that keeps you signed in. In the app it is kept in the phone’s secure storage.</li>
    </ul>
    <P>We don’t use advertising cookies or third-party analytics. You can remove all of this by clearing your browser’s site data or uninstalling the app.</P>
  </>],

  ['Who we share information with', <>
    <P>We share information only with the providers that run LocalKart, and only what each one needs:</P>
    <ul>
      <li><b>Render</b>: hosts our server.</li>
      <li><b>Neon</b>: hosts our database, in Singapore.</li>
      <li><b>Cloudflare</b>: hosts and protects the website.</li>
      <li><b>OpenStreetMap</b>: map images and address search. Your device connects to it directly, so it sees your IP address and the map area or search text.</li>
      <li><b>Google Fonts</b>: the website’s typeface. Your browser downloads it from Google.</li>
      <li><b>Open Food Facts</b>: receives barcode numbers only.</li>
      <li><b>WhatsApp and your phone carrier</b>: only when you choose to message or call a shop.</li>
    </ul>
    <P>Some of these providers store or process data outside India, such as in Singapore, the USA or Europe. We choose providers that protect data with industry-standard security. We may also share information when the law requires it, or to protect people from harm or fraud.</P>
  </>],

  ['How long we keep it', <>
    <ul>
      <li><b>Shop accounts, stock and activity:</b> while the shop is registered. When an owner deletes their shop, the account, all items and all activity records are deleted immediately. Copies in our database provider’s short-term backups expire after a few days.</li>
      <li><b>Review history:</b> the staff log keeps the shop’s name and ID with each decision, so actions stay accountable.</li>
      <li><b>On your device:</b> until you clear it, remove an item, or uninstall the app.</li>
    </ul>
  </>],

  ['Your rights and choices', <>
    <P>Under the DPDP Act you can:</P>
    <ul>
      <li><b>Access</b> a summary of the personal data we hold about you.</li>
      <li><b>Correct or update</b> it. Shop owners can edit almost everything in their dashboard.</li>
      <li><b>Erase</b> it, and <b>withdraw consent</b>. Shop owners can delete their shop at any time from <b>Shop settings → Password &amp; security → Delete my shop</b>, on the website or in the app.</li>
      <li><b>Nominate</b> someone to exercise these rights if you die or can’t act yourself.</li>
      <li><b>Complain</b> to our Grievance Officer (below). If you aren’t satisfied, you can approach the Data Protection Board of India.</li>
    </ul>
    <P>Customers can turn off location access in their browser or phone settings at any time and type an area instead. To use any other right, email <Mail />. We may need to confirm it’s you first. We reply within 30 days.</P>
  </>],

  ['How we protect information', <>
    <P>Everything is sent over HTTPS. Passwords are stored as bcrypt hashes. Login sessions expire and can be ended on all devices. Accounts lock for a while after repeated wrong passwords, and requests are rate-limited. New shops are checked before they appear, and staff access is limited by role.</P>
    <P>No system is perfectly secure. If a breach affects your personal data, we will inform you and the Data Protection Board as the law requires.</P>
  </>],

  ['Children', <>
    <P>You must be 18 or older to register a shop. LocalKart is not meant for children, and we don’t knowingly collect personal data from anyone under 18. If you think a child has given us personal data, email us and we will delete it.</P>
  </>],

  ['Changes to this policy', <>
    <P>If we change this policy, we will update the date at the top. If the changes are important, we will tell shop owners by email or in the dashboard before they take effect.</P>
  </>],

  ['Contact and Grievance Officer', <>
    <P>For questions, requests or complaints about your data, contact our Grievance Officer:</P>
    <P><b>{GRIEVANCE_OFFICER}</b>, Grievance Officer, LocalKart<br />Email: <Mail /></P>
    <P>We acknowledge complaints within 24 hours and aim to resolve them within 15 days. The <Link component={RouterLink} to="/terms">Terms of Use</Link> also apply to your use of LocalKart.</P>
  </>],
]

export default function Privacy() {
  return <LegalPage title="Privacy Policy" summary={SUMMARY} sections={SECTIONS} other={{ to: '/terms', label: 'Terms of Use' }} />
}
