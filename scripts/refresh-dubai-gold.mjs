/**
 * Standalone Khaleej Times → dubai-gold.json refresh for GitHub Pages repo.
 * Used by GitHub Actions (no Vite app required).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const KT_URL = 'https://www.khaleejtimes.com/gold-forex'
const KT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100
}

function stripHtml(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/,/g, '')
}

function pickRateCell(row) {
  const raw = row?.afternoon || row?.morning || row?.evening || row?.yesterday
  if (raw == null || raw === '') return null
  const n = Number(String(raw).replace(/,/g, ''))
  return Number.isFinite(n) ? round2(n) : null
}

function parseKhaleejDataPage(html) {
  const m = String(html).match(/id="app"\s+data-page="([^"]+)"/)
  if (!m) return null

  let page
  try {
    page = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
  } catch {
    return null
  }

  const rows = page?.props?.goldRates?.rates
  if (!Array.isArray(rows)) return null

  const byType = (label) => rows.find((r) => String(r.type).toUpperCase() === label)

  const rate24k = pickRateCell(byType('24K'))
  const rate22k = pickRateCell(byType('22K'))
  const rate21k = pickRateCell(byType('21K'))
  const rate18k = pickRateCell(byType('18K'))
  const ounce = pickRateCell(byType('OUNCE'))

  if (!rate24k || !rate22k) return null

  return { rate24k, rate22k, rate21k, rate18k, ounce }
}

function parseKhaleejTimes(html) {
  const fromPage = parseKhaleejDataPage(html)
  if (fromPage) return fromPage

  const text = stripHtml(html)
  const goldIdx = text.search(/UAE\s+Gold\s+Rate/i)
  const block = goldIdx >= 0 ? text.slice(goldIdx, goldIdx + 1500) : text

  const grab = (karat) => {
    const re = new RegExp(`${karat}\\s*K[^\\d]{0,40}(\\d{2,3}\\.\\d{2})`, 'i')
    const m = block.match(re)
    return m ? round2(m[1]) : null
  }

  const rate24k = grab(24)
  const rate22k = grab(22)
  const rate21k = grab(21)
  const rate18k = grab(18)

  if (!rate24k || !rate22k) {
    throw new Error('Could not parse Khaleej Times gold table')
  }
  if (rate24k < 200 || rate24k > 1200 || rate22k >= rate24k) {
    throw new Error(`Implausible rates 24K=${rate24k} 22K=${rate22k}`)
  }

  return { rate24k, rate22k, rate21k, rate18k }
}

async function fetchLiveKhaleejHtml() {
  const res = await fetch(KT_URL, {
    headers: KT_HEADERS,
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`Khaleej Times HTTP ${res.status}`)
  const html = await res.text()
  if (!html || html.length < 200) throw new Error('Khaleej Times empty response')
  return html
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = process.argv[2] || join(repoRoot, 'dubai-gold.json')

const html = await fetchLiveKhaleejHtml()
const parsed = parseKhaleejTimes(html)
const fetchedAt = new Date().toISOString()

const payload = {
  ...parsed,
  source: 'Khaleej Times · UAE Gold Rate',
  sourceUrl: KT_URL,
  live: true,
  fetchedAt,
  refreshedBy: process.env.GITHUB_ACTIONS ? 'github-actions' : 'manual',
}

let changed = true
try {
  const prev = JSON.parse(readFileSync(outPath, 'utf8'))
  changed =
    prev.rate24k !== payload.rate24k ||
    prev.rate22k !== payload.rate22k ||
    prev.rate21k !== payload.rate21k ||
    prev.rate18k !== payload.rate18k
} catch {
  changed = true
}

writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`)
console.log(
  JSON.stringify({
    outPath,
    changed,
    rate24k: payload.rate24k,
    rate22k: payload.rate22k,
    fetchedAt,
  }),
)
