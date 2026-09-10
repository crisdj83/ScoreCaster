import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isValidVapidPublicKey,
  normalizeVapidPublicKey,
  vapidPublicKeyToUint8Array,
} from './vapid.ts'

function samplePublicKey(standardBase64 = false) {
  const bytes = Buffer.alloc(65)
  bytes[0] = 0x04
  for (let i = 1; i < 65; i += 1) bytes[i] = (i * 13) % 256
  const encoded = bytes.toString('base64')
  return standardBase64 ? encoded : encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

describe('normalizeVapidPublicKey', () => {
  it('strips quotes, labels, and whitespace', () => {
    const key = samplePublicKey()
    assert.equal(normalizeVapidPublicKey(`" ${key} "`), key)
    assert.equal(normalizeVapidPublicKey(`Public Key:\n${key}`), key)
  })
})

describe('vapidPublicKeyToUint8Array', () => {
  it('accepts URL-safe keys', () => {
    const decoded = vapidPublicKeyToUint8Array(samplePublicKey())
    assert.equal(decoded.length, 65)
    assert.equal(decoded[0], 0x04)
  })

  it('accepts standard base64 keys that include slashes', () => {
    const key = samplePublicKey(true)
    assert.match(key, /\//)
    const decoded = vapidPublicKeyToUint8Array(key)
    assert.equal(decoded.length, 65)
    assert.equal(isValidVapidPublicKey(key), true)
  })

  it('rejects keys that are not 65-byte uncompressed points', () => {
    assert.equal(isValidVapidPublicKey('not-a-key'), false)
    const short = Buffer.alloc(32, 1).toString('base64url')
    assert.equal(isValidVapidPublicKey(short), false)
  })
})
