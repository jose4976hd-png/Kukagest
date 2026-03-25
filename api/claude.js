const OPENROUTER_KEY = process.env.GEMINI_KEY;

const PROMPT_FOTO = 'Eres un asistente de taller de vehiculos de limpieza publica. Analiza este formulario de solicitud de reparacion y extrae los datos en JSON puro sin markdown. Devuelve SOLO este JSON: {"matricula": "matricula del vehiculo (solo letras y numeros, sin guiones)", "conductor": "nombre completo del conductor", "descripcion": "descripcion completa del problema tal como aparece", "titulo": "titulo corto del problema en maximo 8 palabras", "prioridad": "normal|urgente|alta|baja segun lo que indique el formulario", "ubicacion": "ubicacion del vehiculo si aparece"} Si no encuentras algun dato, usa cadena vacia.';

const PROMPT_TEXTO = 'Eres un asistente de taller de vehiculos de limpieza publica. Analiza este texto dictado por un mecanico y extrae los datos en JSON puro sin markdown. El texto puede contener la matricula del vehiculo, descripcion del problema, actuacion realizada, repuestos usados, tiempo empleado y material a pedir. Devuelve SOLO este JSON: {"matricula": "matricula del vehiculo (solo letras y numeros)", "titulo": "titulo corto en maximo 8 palabras", "descripcion": "que le pasa al vehiculo", "actuacion": "que se ha hecho", "repuestos": [{"nombre": "nombre del repuesto", "cantidad": 1}], "tiempo": "tiempo empleado en formato como 30 min o 1h 30min", "pedido": "material a pedir si se menciona"} Si no encuentras algun dato usa cadena vacia o array vacio.';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    var body = req.body;

    var messages;

    if (body.texto) {
      // Modo texto: partes express dictados
      messages = [{
        role: 'user',
        content: PROMPT_TEXTO + '\n\nTexto del mecanico: ' + body.texto
      }];
    } else {
      // Modo imagen: fotopartes
      var image_base64 = body.image_base64;
      var image_media_type = body.image_media_type || 'image/jpeg';
      messages = [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: 'data:' + image_media_type + ';base64,' + image_base64 }
          },
          { type: 'text', text: PROMPT_FOTO }
        ]
      }];
    }

    var response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENROUTER_KEY,
        'HTTP-Referer': 'https://project-zx72o.vercel.app',
        'X-Title': 'Kukagest'
      },
      body: JSON.stringify({
        model: 'google/gemma-3-4b-it:free',
        messages: messages
      })
    });

    var data = await response.json();

    if (!response.ok) return res.status(response.status).json(data);

    var text = '';
    if (data.choices && data.choices[0] && data.choices[0].message) {
      text = data.choices[0].message.content || '';
    }

    return res.status(200).json({ text: text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
