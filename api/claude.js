const GEMINI_API_KEY = process.env.GEMINI_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const PROMPT = Eres un asistente de taller de vehículos de limpieza pública. Analiza este formulario de solicitud de reparación y extrae los datos en JSON puro sin markdown.
Devuelve SOLO este JSON:
{
  "matricula": "matrícula del vehículo (solo letras y números, sin guiones)",
  "conductor": "nombre completo del conductor",
  "descripcion": "descripción completa del problema tal como aparece",
  "titulo": "título corto del problema en máximo 8 palabras",
  "prioridad": "normal|urgente|alta|baja según lo que indique el formulario",
  "ubicacion": "ubicación del vehículo si aparece"
}
Si no encuentras algún dato, usa cadena vacía "".;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image_base64, image_media_type } = req.body;

    const geminiBody = {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: image_media_type || 'image/jpeg',
              data: image_base64
            }
          },
          { text: PROMPT }
        ]
      }],
      generationConfig: { maxOutputTokens: 500, temperature: 0.1 }
    };

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    const data = await response.json();

    if (!response.ok) return res.status(response.status).json(data);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
