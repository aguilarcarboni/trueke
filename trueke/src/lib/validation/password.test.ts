import { describe, it, expect } from 'vitest'
import {
  isValidPasswordFormat,
  validateChangePasswordFields,
  validateNewPasswordField,
  NEW_PASSWORD_FORMAT_ERROR_MESSAGE,
} from './password'

describe('isValidPasswordFormat', () => {
  it('accepts a valid password with all requirements', () => {
    expect(isValidPasswordFormat('Secure1!')).toBe(true)
  })

  it('accepts exactly 8 characters meeting all requirements', () => {
    expect(isValidPasswordFormat('Abcdef1!')).toBe(true)
  })

  it('accepts longer passwords', () => {
    expect(isValidPasswordFormat('AstroPassword123!')).toBe(true)
  })

  it('accepts all four allowed special characters', () => {
    expect(isValidPasswordFormat('Abcdefg1?')).toBe(true)
    expect(isValidPasswordFormat('Abcdefg1!')).toBe(true)
    expect(isValidPasswordFormat('Abcdefg1*')).toBe(true)
    expect(isValidPasswordFormat('Abcdefg1&')).toBe(true)
  })

  it('rejects password shorter than 8 characters', () => {
    expect(isValidPasswordFormat('Sec1!')).toBe(false)
  })

  it('rejects password missing uppercase letter', () => {
    expect(isValidPasswordFormat('secure1!')).toBe(false)
  })

  it('rejects password missing digit', () => {
    expect(isValidPasswordFormat('SecureAA!')).toBe(false)
  })

  it('rejects password missing special character', () => {
    expect(isValidPasswordFormat('Secure123')).toBe(false)
  })

  it('rejects password with unsupported special character', () => {
    expect(isValidPasswordFormat('Secure1@')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidPasswordFormat('')).toBe(false)
  })
})

describe('validateChangePasswordFields', () => {
  it('returns error when currentPassword is empty', () => {
    expect(validateChangePasswordFields('', 'NewPwd1?')).toBe(
      'Current password is required.'
    )
  })

  it('returns error when currentPassword is whitespace only', () => {
    expect(validateChangePasswordFields('   ', 'NewPwd1?')).toBe(
      'Current password is required.'
    )
  })

  it('returns error when newPassword is empty', () => {
    expect(validateChangePasswordFields('OldPwd1!', '')).toBe(
      'New password is required.'
    )
  })

  it('returns format error when newPassword is invalid', () => {
    expect(validateChangePasswordFields('OldPwd1!', 'weak')).toBe(
      NEW_PASSWORD_FORMAT_ERROR_MESSAGE
    )
  })

  it('returns null when both fields are valid', () => {
    expect(validateChangePasswordFields('OldPwd1!', 'NewPwd2?')).toBeNull()
  })
})

describe('validateNewPasswordField', () => {
  it('returns error when empty', () => {
    expect(validateNewPasswordField('')).toBe('New password is required.')
  })

  it('returns error when whitespace only', () => {
    expect(validateNewPasswordField('   ')).toBe('New password is required.')
  })

  it('returns format error for invalid password', () => {
    expect(validateNewPasswordField('weak')).toBe(NEW_PASSWORD_FORMAT_ERROR_MESSAGE)
  })

  it('returns null for a valid password', () => {
    expect(validateNewPasswordField('NewPwd1?')).toBeNull()
  })
})
