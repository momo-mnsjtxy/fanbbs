import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import UiIcon from '../src/UiIcon.vue'
import { icons, iconStrokeWidth } from '../src/icons.js'

describe('Hugeicons adapter', () => {
  it('renders every supported icon as decorative, non-focusable SVG', () => {
    for (const name of Object.keys(icons)) {
      const wrapper = mount(UiIcon, { props: { name } })
      expect(wrapper.element.tagName.toLowerCase()).toBe('svg')
      expect(wrapper.attributes('aria-hidden')).toBe('true')
      expect(wrapper.attributes('focusable')).toBe('false')
      expect(wrapper.element.children.length).toBeGreaterThan(0)
      for (const element of wrapper.element.children) {
        expect(element.getAttribute('stroke-width')).toBe(String(iconStrokeWidth))
      }
      wrapper.unmount()
    }
  })
  it('reacts to icon changes without adding a wrapper or a tab stop', async () => {
    const wrapper = mount(UiIcon, { props: { name: 'menu' }, attrs: { class: 'toolbar-icon' } })
    const before = wrapper.html()
    await wrapper.setProps({ name: 'close' })
    expect(wrapper.html()).not.toBe(before)
    expect(wrapper.classes()).toContain('toolbar-icon')
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })
  it('falls back for missing names and Object prototype keys', () => {
    const fallback = mount(UiIcon).html()
    for (const name of ['not-an-icon', 'constructor', '__proto__', 'toString']) {
      expect(mount(UiIcon, { props: { name } }).html()).toBe(fallback)
    }
  })
  it('maps all literal app icons to the free catalog', () => {
    const app = readFileSync('src/App.vue', 'utf8')
    const names = [...app.matchAll(/<UiIcon name="([^"]+)"/g)].map(match => match[1])
    expect(names.length).toBeGreaterThan(20)
    for (const name of names) expect(Object.hasOwn(icons, name)).toBe(true)
  })
})
