import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import api from '../../lib/api.js'
import { useToast } from '../../lib/toast.jsx'
import { confirm } from '../../lib/confirm.js'
import { colors } from '../../lib/theme.js'
import { hasRealText, moneyError } from '../../lib/validation.js'
import { Banner, Button, Chip, Field, SwitchRow } from '../../components/ui.jsx'

const UNITS = ['piece', 'kg', '500 g', '250 g', 'litre', '500 ml', 'pack', 'dozen', 'box', 'strip', 'bottle']
const empty = { name: '', category: '', price: '', unit: 'piece', inStock: true, description: '', barcode: '' }
const BARCODE = /^[0-9A-Za-z-]{4,32}$/

export default function ItemScreen() {
  const { id, barcode: scanned, name: suggestedName, section: suggestedSection, description: suggestedDesc, fromScan } = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const notify = useToast()
  const [form, setForm] = useState(empty)
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const isNew = !id
  const set = (key) => (v) => { setForm((f) => ({ ...f, [key]: v })); setErrors((e) => ({ ...e, [key]: undefined })) }

  useEffect(() => {
    api.get('/vendor/products').then((list) => {
      setAll(list)
      const found = id && list.find((p) => p._id === id)
      if (found) setForm({ ...empty, ...found, price: String(found.price), description: found.description || '', barcode: found.barcode || '' })
      else if (id) setError('This item no longer exists.')
      // Opened from the scanner for a new product: pre-fill what we know.
      else if (scanned) setForm({ ...empty, barcode: scanned, name: suggestedName || '', category: suggestedSection || '', description: suggestedDesc || '' })
    }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [id, scanned, suggestedName, suggestedSection, suggestedDesc])

  const sections = useMemo(() => [...new Set(all.map((p) => p.category))].sort(), [all])

  const save = async (addAnother) => {
    const e = {}
    if (!form.name.trim()) e.name = 'Item name is required'
    else if (!hasRealText(form.name, 2, 150)) e.name = 'Item name must be 2-150 characters'
    if (form.price === '') e.price = 'Enter a price (₹0 or more)'
    else if (moneyError(form.price, 'Price', 1000000)) e.price = moneyError(form.price, 'Price', 1000000)
    if (form.barcode && !BARCODE.test(form.barcode.replace(/\s/g, ''))) e.barcode = 'Use 4-32 letters, numbers or dashes'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    setError('')
    const body = { name: form.name.trim(), price: Number(form.price), unit: form.unit.trim() || 'piece', category: form.category.trim() || 'General', description: form.description.trim(), inStock: form.inStock, barcode: form.barcode.replace(/\s/g, '') }
    try {
      if (isNew) await api.post('/vendor/products', body)
      else await api.put(`/vendor/products/${id}`, body)
      notify(isNew ? `"${body.name}" added` : 'Item updated')
      if (addAnother) {
        setAll((a) => [...a, body])
        setForm({ ...empty, category: form.category, unit: form.unit })
      } else if (fromScan) {
        router.back() // straight back to the scanner for the next product
      } else {
        router.back()
      }
    } catch (err) {
      if (/barcode/i.test(err.message)) setErrors((x) => ({ ...x, barcode: err.message }))
      else setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!(await confirm('Delete this item?', `"${form.name}" will be removed from your shop.`, 'Delete'))) return
    try {
      await api.del(`/vendor/products/${id}`)
      notify(`"${form.name}" deleted`)
      router.back()
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: isNew ? 'Add an item' : 'Edit item' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {error ? <Banner kind="error">{error}</Banner> : null}
        {isNew && scanned ? (
          <Banner kind="info">{suggestedName ? 'We found this product. Check the name and add your price.' : "New product. Type its name once and it's saved for the next scan."}</Banner>
        ) : null}
        <Field label="Item name" required value={form.name} onChangeText={set('name')} placeholder="e.g. Amul Toned Milk" error={errors.name} autoFocus={isNew} />
        <Field label="Price" required prefix="₹" value={form.price} onChangeText={(t) => set('price')(t.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" error={errors.price} placeholder="0" />
        <View style={{ gap: 8 }}>
          <Field label="Per (unit)" value={form.unit} onChangeText={set('unit')} placeholder="piece" />
          <View style={styles.wrap}>
            {UNITS.map((u) => <Chip key={u} small label={u} selected={form.unit === u} onPress={() => set('unit')(u)} />)}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Field label="Section" value={form.category} onChangeText={set('category')} placeholder="e.g. Dairy, Staples, Snacks" hint="Groups items on your shop page" />
          {sections.length > 0 && (
            <View style={styles.wrap}>
              {sections.map((c) => <Chip key={c} small label={c} selected={form.category === c} onPress={() => set('category')(c)} />)}
            </View>
          )}
        </View>
        <Field label="Short description (optional)" value={form.description} onChangeText={set('description')} placeholder="Brand, size, variety…" maxLength={300} />
        <Field label="Barcode (optional)" value={form.barcode} onChangeText={(t) => set('barcode')(t.replace(/[^0-9A-Za-z\- ]/g, ''))}
          placeholder="Scan or type the code on the pack" keyboardType="number-pad" maxLength={40} error={errors.barcode}
          hint={errors.barcode ? undefined : 'Lets you find this item later by scanning it'} />
        <SwitchRow icon="cube-outline" title={form.inStock ? 'In stock' : 'Out of stock'} subtitle="Customers see this on your shop page" value={form.inStock} onValueChange={set('inStock')} />
        {!isNew && <Button variant="ghost" icon="trash-outline" title="Delete this item" onPress={remove} style={{ alignSelf: 'center' }} />}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {isNew && <Button flex variant="outline" title="Save & new" disabled={busy} onPress={() => save(true)} />}
        <Button flex size={isNew ? 'md' : 'lg'} icon="checkmark" loading={busy} title={isNew ? 'Add item' : 'Save changes'} onPress={() => save(false)} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  footer: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
})
