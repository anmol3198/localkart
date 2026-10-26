import { Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import LegalPage from '../components/LegalPage.jsx'
import { CONTACT_EMAIL, GRIEVANCE_OFFICER } from '../lib/legal.js'

const P = (props) => <Typography paragraph {...props} />
const H = ({ children }) => <Typography component="h3">{children}</Typography>
const Mail = () => <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>

const SUMMARY = [
  'LocalKart is a directory. It connects you with local shops; it doesn’t sell, deliver or take payment for anything.',
  'Your order, payment and delivery are between you and the shop.',
  'Shops must be real, list honest prices and keep their stock up to date.',
  'It’s free today. If we ever charge shops, we will give at least 30 days’ notice first.',
]

const SECTIONS = [
  ['Agreement', <>
    <P>These Terms of Use apply to the LocalKart website and app (together, “LocalKart”). By using LocalKart you agree to these terms and to our <Link component={RouterLink} to="/privacy">Privacy Policy</Link>. Shop owners agree to them when they register. If you don’t agree, please don’t use LocalKart.</P>
  </>],

  ['What LocalKart is, and isn’t', <>
    <P>LocalKart lists shops near you with the items, prices and delivery options the shops provide. You can call a shop, message it on WhatsApp, get directions, or send it an order list.</P>
    <P>LocalKart is not a seller, delivery service or payment service. We don’t own, check or handle the goods listed. When you order, the agreement is directly between you and the shop: price, payment, delivery, quality, returns and refunds. Under the IT Act, LocalKart acts as an intermediary for the information shops publish.</P>
  </>],

  ['For customers', <>
    <ul>
      <li>Shops provide their prices, stock, hours and delivery details, and these can change. Always confirm the final price and availability with the shop before you pay.</li>
      <li>Distances are approximate and based on the location you set.</li>
      <li>Sending an order on LocalKart only sends a message. The order is confirmed only when the shop accepts it.</li>
      <li>If you have a problem with a shop, please contact the shop first. If a listing is false, misleading or unsafe, report it to us at <Mail />.</li>
    </ul>
  </>],

  ['For shop owners', <>
    <H>Who can register</H>
    <P>You must be at least 18 and either own the shop or be authorised by its owner to list it. The shop must be a real, operating business at the address and map location you give. One account per shop.</P>
    <H>Review</H>
    <P>New shops and their changes are reviewed before customers can see them. We may ask for proof that the shop is real. We may approve or reject a shop, or suspend one later, for example if details are false, customers report problems, or these terms are broken. We will tell you why where we reasonably can, and you can fix the details and resubmit.</P>
    <H>Your listing</H>
    <ul>
      <li>Keep your details, prices and stock accurate and up to date. Don’t list items you don’t have.</li>
      <li>Follow the laws that apply to your shop, including those on MRP and packaged goods, food safety (FSSAI), medicines and consumer protection. Pharmacies must follow drug laws, including prescription requirements.</li>
      <li>Don’t list illegal, counterfeit or stolen goods, weapons, or anything you aren’t licensed to sell. Don’t sell age-restricted products to minors.</li>
      <li>Treat customers fairly, and honour the prices and delivery terms you show.</li>
      <li>Keep your password private. You are responsible for activity on your account. If you think someone else has used it, change your password and log out of all other devices.</li>
    </ul>
    <H>Permission to show your listing</H>
    <P>You keep ownership of your listing. You allow LocalKart to display it, including your shop name, contact details, location, items, prices and anything else you add, on LocalKart and in shareable links and QR posters, for as long as your shop is listed.</P>
    <H>Leaving</H>
    <P>You can delete your shop at any time from <b>Shop settings → Password &amp; security → Delete my shop</b>. This permanently removes your account, items and activity numbers.</P>
  </>],

  ['Things nobody may do', <>
    <ul>
      <li>Give false information, or pretend to be another person or shop.</li>
      <li>Copy or scrape LocalKart’s listings in bulk, or use bots to send traffic, fake views or taps.</li>
      <li>Try to break, overload or get around LocalKart’s security or rate limits, or access accounts or data that aren’t yours.</li>
      <li>Upload anything unlawful, harmful, misleading, hateful or infringing, or send spam through LocalKart.</li>
    </ul>
    <P>We may remove content, limit access or close accounts that do these things, and report illegal activity to the authorities.</P>
  </>],

  ['Fees', <>
    <P>LocalKart is free for customers and shops today, and we take no commission on orders. If we introduce paid plans or features for shops, we will publish the prices and give at least 30 days’ notice. Paid features will never be switched on without your agreement.</P>
  </>],

  ['Other services', <>
    <P>LocalKart uses services run by others, including OpenStreetMap maps, WhatsApp, your phone’s dialler and Open Food Facts product data. Their own terms apply when you use them, and we aren’t responsible for how they work.</P>
  </>],

  ['Availability and changes', <>
    <P>We work to keep LocalKart running and accurate, but it may sometimes be unavailable, slow or wrong. We may change, add or remove features. If we change these terms, we will update the date at the top and, for important changes, tell shop owners in advance. If you keep using LocalKart after that, you accept the new terms.</P>
  </>],

  ['Disclaimers and liability', <>
    <P>LocalKart is provided “as is”. As far as the law allows, we don’t promise that listings are complete or accurate, or that any shop, product or delivery will meet your expectations.</P>
    <P>As far as the law allows, LocalKart is not liable for any loss arising from goods or services bought from shops, from information that shops provide, or for indirect or consequential losses. Otherwise, our total liability to you is limited to ₹1,000 or the amount you paid us in the last 12 months, whichever is higher. Nothing in these terms limits any rights you have under consumer protection law that can’t be excluded.</P>
    <P>Shop owners will cover LocalKart for claims caused by their listings, their goods or services, or their breach of these terms or the law.</P>
  </>],

  ['Law and disputes', <>
    <P>These terms are governed by the laws of India. Please contact us first so we can try to resolve any dispute. If that doesn’t work, the courts in India have jurisdiction.</P>
  </>],

  ['Contact and Grievance Officer', <>
    <P>Under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, you can report content or raise a complaint with our Grievance Officer:</P>
    <P><b>{GRIEVANCE_OFFICER}</b>, Grievance Officer, LocalKart<br />Email: <Mail /></P>
    <P>We acknowledge complaints within 24 hours and resolve them within 15 days.</P>
  </>],
]

export default function Terms() {
  return <LegalPage title="Terms of Use" summary={SUMMARY} sections={SECTIONS} other={{ to: '/privacy', label: 'Privacy Policy' }} />
}
