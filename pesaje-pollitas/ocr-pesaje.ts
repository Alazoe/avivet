// Edge Function: ocr-pesaje
// Desplegar en Supabase Dashboard → Edge Functions → New Function → nombre: ocr-pesaje
// Agregar secret: ANTHROPIC_API_KEY en Project Settings → Edge Functions → Secrets

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { imagen, mediaType } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ ok:false, error:'API key no configurada' }), { headers: CORS });

    const isPdf  = mediaType === 'application/pdf';
    const bloque = isPdf
      ? { type:'document', source:{ type:'base64', media_type:'application/pdf', data: imagen } }
      : { type:'image',    source:{ type:'base64', media_type: mediaType,         data: imagen } };

    const payload = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role:'user', content: [
        bloque,
        { type:'text', text: `Este documento contiene registros de pesaje de aves. Puede venir en distintos formatos:
- "N-PESO": número de ave seguido de guion y peso (ej: "1-245"). Extrae SOLO el peso (número después del guion).
- Lista de pesos directos (ej: "245", "1.245", "1,245").
- Tabla con columnas de número y peso.
Los pesos pueden estar en gramos (valores >100) o en kg (valores <10).
Si están en gramos, divídelos por 1000 para convertir a kg.
Devuelve SOLO un array JSON con los pesos en kg. Ejemplo: [0.245, 0.225, 0.260]
No incluyas los números de identificación de las aves, solo los pesos.` }
      ]}]
    };

    const headers: Record<string,string> = {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    };
    if (isPdf) headers['anthropic-beta'] = 'pdfs-2024-09-25';

    const resp   = await fetch('https://api.anthropic.com/v1/messages', { method:'post', headers, body: JSON.stringify(payload) });
    const result = await resp.json();

    if (result.error) return new Response(JSON.stringify({ ok:false, error: result.error.message }), { headers: CORS });

    const raw   = result.content[0].text.trim();
    const match = raw.match(/\[[\d.,\s]+\]/);
    if (!match) return new Response(JSON.stringify({ ok:false, error:'No se encontraron pesos. Respuesta: ' + raw.slice(0,200) }), { headers: CORS });

    const pesos = JSON.parse(match[0]);
    if (!Array.isArray(pesos) || !pesos.length) throw new Error('Array vacío');

    return new Response(JSON.stringify({ ok:true, pesos }), { headers: CORS });

  } catch(e) {
    return new Response(JSON.stringify({ ok:false, error: String(e) }), { headers: CORS });
  }
});
