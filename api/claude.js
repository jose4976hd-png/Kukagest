const GEMINI_API_KEY = process.env.GEMINI_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY;

const PROMPT = 'Eres un asistente de taller de vehiculos de limpieza publica. Analiza este formulario de solicitud de reparacion y extrae los datos en JSON puro sin markdown. Devuelve SOLO este JSON: {"matricula": "matricula del vehiculo (solo letras y numeros, sin guiones)", "conductor": "nombre completo del conductor", "descripcion": "descripcion completa del problema tal como aparece", "titulo": "titulo corto del problema en maximo 8 palabras", "prioridad": "normal|urgente|alta|baja segun lo que indique el formulario", "ubicacion": "ubicacion del vehiculo si aparece"} Si no encuentras algun dato, usa cadena vacia.';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    var body = req.body;
    var image_base64 = body.image_base64;
    var image_media_type = body.image_media_type || 'image/jpeg';

    var geminiBody = {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: image_media_type,
              data: image_base64
            }
          },
          { text: PROMPT }
        ]
      }],
      generationConfig: { maxOutputTokens: 500, temperature: 0.1 }
    };

    var response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    var data = await response.json();

    if (!response.ok) return res.status(response.status).json(data);

    var text = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      text = data.candidates[0].content.parts[0].text || '';
    }

    return res.status(200).json({ text: text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
