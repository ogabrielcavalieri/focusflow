export default async function handler(req, res) {
  if (req.method === 'POST') {
    const session = req.body;
    // Save to DB (Supabase or JSON)
    console.log('Session saved:', session);
    res.status(200).json({ success: true });
  } else if (req.method === 'GET') {
    // Return sessions
    res.status(200).json({ sessions: [] });
  } else {
    res.status(405).end();
  }
}
