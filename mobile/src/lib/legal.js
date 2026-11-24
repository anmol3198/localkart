import { Linking } from 'react-native'
import { API_URL } from './api.js'

/** The website hosts the Privacy Policy and Terms; in development that's the site running on this computer. */
const site = () => process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '') || API_URL.replace(/\/api$/, '').replace(/:5050$/, ':5173')

export const openPrivacy = () => Linking.openURL(`${site()}/privacy`)
export const openTerms = () => Linking.openURL(`${site()}/terms`)

/** LocalKart's help line for shop owners (forgotten password, set-up help). */
export const SUPPORT_PHONE = '7667213198'
export const callSupport = () => Linking.openURL(`tel:+91${SUPPORT_PHONE}`)
export const whatsappSupport = (text) => Linking.openURL(`https://wa.me/91${SUPPORT_PHONE}?text=${encodeURIComponent(text)}`)
