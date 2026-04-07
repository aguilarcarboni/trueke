import { describe, it, expect } from 'vitest'
import { AddressSchema, EMPTY_ADDRESS } from './address'

const VALID_ADDRESS = {
  countryCode: 'US',
  province: 'Texas',
  city: 'Lubbock',
  zipCode: '79401',
  addressLine1: '123 Main St',
  addressLine2: 'Apt 4',
  muniDistrict: '',
}

describe('AddressSchema', () => {
  it('accepts a complete valid address', () => {
    const result = AddressSchema.safeParse(VALID_ADDRESS)
    expect(result.success).toBe(true)
  })

  it('accepts an address without optional fields (addressLine2, muniDistrict)', () => {
    const { addressLine2: _l2, muniDistrict: _md, ...minimal } = VALID_ADDRESS
    const result = AddressSchema.safeParse(minimal)
    expect(result.success).toBe(true)
  })

  it('rejects an empty countryCode', () => {
    const result = AddressSchema.safeParse({ ...VALID_ADDRESS, countryCode: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a countryCode longer than 2 characters', () => {
    const result = AddressSchema.safeParse({ ...VALID_ADDRESS, countryCode: 'USA' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid (non-existent) countryCode', () => {
    const result = AddressSchema.safeParse({ ...VALID_ADDRESS, countryCode: 'XX' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty province', () => {
    const result = AddressSchema.safeParse({ ...VALID_ADDRESS, province: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a province with numeric characters', () => {
    const result = AddressSchema.safeParse({ ...VALID_ADDRESS, province: 'Texas123' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty city', () => {
    const result = AddressSchema.safeParse({ ...VALID_ADDRESS, city: '' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty zipCode', () => {
    const result = AddressSchema.safeParse({ ...VALID_ADDRESS, zipCode: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a zipCode with special characters (@#$)', () => {
    const result = AddressSchema.safeParse({ ...VALID_ADDRESS, zipCode: '79401@' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty addressLine1', () => {
    const result = AddressSchema.safeParse({ ...VALID_ADDRESS, addressLine1: '' })
    expect(result.success).toBe(false)
  })

  it('rejects addressLine1 with invalid characters', () => {
    const result = AddressSchema.safeParse({
      ...VALID_ADDRESS,
      addressLine1: '123 Main St <script>',
    })
    expect(result.success).toBe(false)
  })
})

describe('EMPTY_ADDRESS', () => {
  it('fails AddressSchema validation (all required fields are empty)', () => {
    const result = AddressSchema.safeParse(EMPTY_ADDRESS)
    expect(result.success).toBe(false)
  })
})
