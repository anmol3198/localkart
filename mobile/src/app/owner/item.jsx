import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import api from '../../lib/api.js'
import { useToast } from '../../lib/toast.jsx'
import { confirm } from '../../lib/confirm.js'
import { colors } from '../../lib/theme.js'
import { Banner, Button, Chip, Field, SwitchRow } from '../../components/ui.jsx'

const UNITS = ['piece', 'kg', '500 g', '250 g', 'litre', '500 ml', 'pack', 'dozen', 'box', 'strip', 'bottle']
const empty = { name: '', category: '', price: '', unit: 'piece', inStock: true, description: '' }

export default function ItemScreen() {
  const { id } = useLocalSearchParams()
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
      if (found) setForm({ ...empty, ...found, price: String(found.price), description: found.description || '' })
      else if (id) setError('This item no longer exists.')
    }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [id])

  const sections = useMemo(() => [...new Set(all.map((p) => p.category))].sort(), [all])

  const save = async (addAnother) => {
    const e = {}
    if (!form.name.trim()) e.name = 'Item name is required'
    if (form.price === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0) e.price = 'Enter a price of ₹0 or more'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    setError('')
    const body = { name: form.name.trim(), price: Number(form.price), unit: form.unit.trim() || 'piece', category: form.category.trim() || 'General', description: form.description.trim(), inStock: form.inStock }
    try {
      if (isNew) await api.post('/vendor/products', body)
      else await api.put(`/vendor/products/${id}`, body)
      notify(isNew ? `"${body.name}" added` : 'Item updated')
      if (addAnother) {
        setAll((a) => [...a, body])
        setForm({ ...empty, category: form.category, unit: form.unit })
      } else {
        router.back()
      }
    } catch (err) {
      setError(err.message)
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
