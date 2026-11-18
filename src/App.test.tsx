import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'

describe('App smoke test', () => {
  it('renders the full app without crashing (no localStorage in node)', () => {
    const html = renderToString(<App />)
    expect(html).toContain('FOCUS GHOST')
    expect(html).toContain('Boo')
    expect(html).toContain('25:00')
    expect(html).toContain('The Graveyard')
    expect(html).toContain('Stats')
    expect(html).toContain('Settings')
  })
})
