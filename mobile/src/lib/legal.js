import { Linking } from 'react-native'
import { API_URL } from './api.js'

/** The website hosts the Privacy Policy and Terms; in development that's the site running on this computer. */
const site = () => process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '') || API_URL.replace(/\/api$/, '').replace(/:5050$/, ':5173')

export const openPrivacy = () => Linking.openURL(`${site()}/privacy`)
export const openTerms = () => Linking.openURL(`${site()}/terms`)
