export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url parameter' })

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only http/https URLs are allowed' })
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; recipe-importer/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    return res.status(502).json({ error: `Upstream returned ${response.status}` })
  }

  const html = await response.text()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).send(html)
}
