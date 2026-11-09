export default function handler(req, res) {
  const rawFile = Array.isArray(req.query?.file) ? req.query.file[0] : req.query?.file || '';
  const cleanId = String(rawFile).replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = cleanId.startsWith('google') ? `${cleanId}.html` : `google${cleanId}.html`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`google-site-verification: ${fileName}`);
}
