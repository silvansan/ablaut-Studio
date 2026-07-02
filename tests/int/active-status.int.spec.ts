import { describe, expect, it } from 'vitest'

import { channelEnabledChip, eventStatusChip } from '@/lib/active-status'

describe('active status chips', () => {
  it('marks active events as green Active', () => {
    expect(eventStatusChip('active')).toEqual({
      className: 'us-chip-active',
      label: 'Active',
    })
  })

  it('marks draft events as red Inactive', () => {
    expect(eventStatusChip('draft')).toEqual({
      className: 'us-chip-inactive',
      label: 'Inactive',
    })
  })

  it('marks enabled channels as green Active', () => {
    expect(channelEnabledChip(true)).toEqual({
      className: 'us-chip-active',
      label: 'Active',
    })
  })

  it('marks disabled channels as red Inactive', () => {
    expect(channelEnabledChip(false)).toEqual({
      className: 'us-chip-inactive',
      label: 'Inactive',
    })
  })
})
