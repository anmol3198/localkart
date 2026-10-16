import { forwardRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors, radius, shadow, type } from '../lib/theme.js'

const VARIANTS = {
  primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
  outline: { bg: colors.card, fg: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  danger: { bg: colors.danger, fg: '#fff', border: colors.danger },
  whatsapp: { bg: colors.whatsapp, fg: '#06301a', border: colors.whatsapp },
  light: { bg: 'rgba(255,255,255,0.16)', fg: '#fff', border: 'transparent' },
}

export function Button({ title, onPress, variant = 'primary', icon, iconRight, loading, disabled, size = 'md', style, flex }) {
  const v = VARIANTS[variant]
  const h = size === 'lg' ? 52 : size === 'sm' ? 36 : 44
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, borderColor: v.border, height: h, opacity: disabled ? 0.5 : pressed ? 0.85 : 1, paddingHorizontal: size === 'sm' ? 12 : 18 },
        flex && { flex: 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} size="small" /> : icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={v.fg} />}
      {title ? <Text style={[styles.btnText, { color: v.fg, fontSize: size === 'lg' ? 16 : size === 'sm' ? 13 : 15 }]} numberOfLines={1}>{title}</Text> : null}
      {iconRight && !loading && <Ionicons name={iconRight} size={18} color={v.fg} />}
    </Pressable>
  )
}

export function IconButton({ icon, onPress, color = colors.text, label, size = 22, style }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}
      style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }, style]}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  )
}

export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }, style]}>
        {children}
      </Pressable>
    )
  }
  return <View style={[styles.card, style]}>{children}</View>
}

export function Chip({ label, selected, onPress, icon, iconSet: IconSet = Ionicons, color, style, small }) {
  const fg = selected ? '#fff' : color || colors.text
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: Boolean(selected) }}
      style={({ pressed }) => [
        styles.chip,
        small && { height: 26, paddingHorizontal: 9 },
        selected ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: color || colors.border },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {icon && <IconSet name={icon} size={small ? 13 : 16} color={fg} />}
      <Text style={[styles.chipText, small && { fontSize: 12 }, { color: fg }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  )
}

export const Field = forwardRef(function Field({ label, error, hint, prefix, right, multiline, style, required, onFocus, onBlur, ...props }, ref) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={[{ gap: 6 }, style]}>
      {label && <Text style={styles.fieldLabel}>{label}{required ? ' *' : ''}</Text>}
      <View style={[styles.inputWrap, multiline && { height: undefined, minHeight: 84, alignItems: 'flex-start', paddingVertical: 10 },
        focused && { borderColor: colors.primary, borderWidth: 2 }, error && { borderColor: colors.danger }]}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textFaint}
          style={[styles.input, multiline && { textAlignVertical: 'top' }]}
          multiline={multiline}
          onFocus={(e) => { setFocused(true); onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); onBlur?.(e) }}
          {...props}
        />
        {right}
      </View>
      {(error || hint) && <Text style={[type.small, error && { color: colors.danger }]}>{error || hint}</Text>}
    </View>
  )
})

export function PasswordField(props) {
  const [show, setShow] = useState(false)
  return (
    <Field
      {...props}
      secureTextEntry={!show}
      autoCapitalize="none"
      right={<IconButton icon={show ? 'eye-off-outline' : 'eye-outline'} label={show ? 'Hide password' : 'Show password'} color={colors.textMuted} size={20} onPress={() => setShow((s) => !s)} />}
    />
  )
}

export function SwitchRow({ title, subtitle, value, onValueChange, icon, busy, tone = 'success' }) {
  const on = tone === 'success' ? colors.success : colors.primary
  return (
    <Pressable onPress={() => !busy && onValueChange(!value)} style={[styles.switchRow, value && { borderColor: on + '66', backgroundColor: tone === 'success' ? colors.successSoft : colors.primarySoft }]}>
      {icon && <Ionicons name={icon} size={22} color={value ? on : colors.textFaint} />}
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', fontSize: 15, color: colors.text }}>{title}</Text>
        {subtitle && <Text style={type.muted}>{subtitle}</Text>}
      </View>
      {busy ? <ActivityIndicator color={on} /> : (
        <Switch value={value} onValueChange={onValueChange} trackColor={{ true: on, false: '#cfd8d5' }} thumbColor="#fff" />
      )}
    </Pressable>
  )
}

export function EmptyState({ icon = 'search', title, message, action }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Ionicons name={icon} size={34} color={colors.textMuted} /></View>
      <Text style={[type.h3, { textAlign: 'center' }]}>{title}</Text>
      {message && <Text style={[type.muted, { textAlign: 'center', maxWidth: 320 }]}>{message}</Text>}
      {action}
    </View>
  )
}

export function Section({ icon, title, subtitle, right, children }) {
  return (
    <Card style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {icon && <View style={styles.sectionIcon}><Ionicons name={icon} size={20} color={colors.primary} /></View>}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>{title}</Text>
          {subtitle && <Text style={type.muted}>{subtitle}</Text>}
        </View>
        {right}
      </View>
      {children}
    </Card>
  )
}

export function Banner({ kind = 'info', children, action }) {
  const c = { info: [colors.primarySoft, colors.primaryDark, 'information-circle'], error: [colors.dangerSoft, colors.danger, 'alert-circle'], warning: [colors.warningSoft, colors.warning, 'warning'] }[kind]
  return (
    <View style={[styles.banner, { backgroundColor: c[0] }]}>
      <Ionicons name={c[2]} size={20} color={c[1]} />
      <Text style={{ flex: 1, color: c[1], fontSize: 14, fontWeight: '500' }}>{children}</Text>
      {action}
    </View>
  )
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md, borderWidth: 1.5 },
  btnText: { fontWeight: '700' },
  iconBtn: { padding: 6, borderRadius: radius.pill },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  inputWrap: { flexDirection: 'row', alignItems: 'center', minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.card, paddingHorizontal: 12 },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 10, outlineStyle: 'none' },
  prefix: { fontSize: 16, color: colors.textMuted, marginRight: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 16 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eef2f1', alignItems: 'center', justifyContent: 'center' },
  sectionIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md },
})

export { shadow }
