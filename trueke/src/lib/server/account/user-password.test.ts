import { describe, it, expect } from 'vitest'
import { hashPassword, isPasswordReused } from './user-password'

describe('isPasswordReused', () => {
  it('returns true when the new password matches the current password hash', async () => {
    const currentHash = await hashPassword('CurrentPwd1!')
    const oldHash = await hashPassword('OldPwd1!')

    const reused = await isPasswordReused('CurrentPwd1!', currentHash, [oldHash])

    expect(reused).toBe(true)
  })

  it('returns true when the new password matches one of the history hashes', async () => {
    const currentHash = await hashPassword('CurrentPwd1!')
    const oldHash1 = await hashPassword('OldPwd1!')
    const oldHash2 = await hashPassword('OldPwd2!')

    const reused = await isPasswordReused('OldPwd2!', currentHash, [oldHash1, oldHash2])

    expect(reused).toBe(true)
  })

  it('returns false when the new password does not match current or history hashes', async () => {
    const currentHash = await hashPassword('CurrentPwd1!')
    const oldHash1 = await hashPassword('OldPwd1!')
    const oldHash2 = await hashPassword('OldPwd2!')

    const reused = await isPasswordReused('BrandNewPwd1!', currentHash, [oldHash1, oldHash2])

    expect(reused).toBe(false)
  })
})
