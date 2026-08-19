// Edge Function: alerta-bioseguridad
// Desplegar en Supabase Dashboard → Edge Functions → New Function → nombre: alerta-bioseguridad
// Secrets necesarios (Project Settings → Edge Functions → Secrets) — se reutilizan
// los mismos que ya usa alerta-produccion en registro-productivo-avicola:
//   RESEND_API_KEY  → tu API key de resend.com (cuenta gratuita)
//   ALERTA_EMAIL    → correo del asesor para recibir el aviso (ej: alazoemv@gmail.com)
//   ALERTA_FROM     → remitente verificado (ej: alertas@avivet.cl)
//
// Se invoca desde auditoria-sag/index.html justo después de guardar la
// auditoría en la tabla `auditorias_bioseguridad`. Si falla, la auditoría
// ya quedó guardada de todas formas — el correo es solo un aviso.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Content-Type': 'application/json',
};

const RUBRO_LABEL: Record<string, string> = {
  engorda:    'Engorda',
  ponedora_a: 'Ponedora A (≥20.000 aves)',
  ponedora_b: 'Ponedora B (<20.000 aves)',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const {
      establecimiento, responsable, rubro,
      puntajeGlobal, puntajesSeccion, itemsNoCumple, emailProductor,
    } = await req.json();

    const RESEND_KEY  = Deno.env.get('RESEND_API_KEY');
    const ASESOR_MAIL = Deno.env.get('ALERTA_EMAIL') || 'alazoemv@gmail.com';
    const FROM        = Deno.env.get('ALERTA_FROM')  || 'onboarding@resend.dev';

    if (!RESEND_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'RESEND_API_KEY no configurada' }), { headers: CORS });
    }

    const color = puntajeGlobal >= 80 ? '#1b7a4a' : puntajeGlobal >= 60 ? '#b5813a' : '#c0392b';

    const seccionesHtml = Object.values(puntajesSeccion || {})
      .map((s: any) => `<li style="margin:5px 0">${s.nombre}: <strong>${s.pct}%</strong> (${s.cumple} ✓ · ${s.nocumple} ✗ · ${s.noaplica} N/A)</li>`)
      .join('');

    const noCumpleHtml = (itemsNoCumple || []).length
      ? `<p style="margin:18px 0 6px;font-weight:600;color:#1a1916">Ítems no conformes:</p>
         <ul style="margin:0;padding-left:20px;color:#1a1916;line-height:1.5">${(itemsNoCumple as string[]).map((t) => `<li style="margin:5px 0">${t}</li>`).join('')}</ul>`
      : '<p style="margin:18px 0 0;color:#5a5650">Sin ítems marcados como "No Cumple". 🎉</p>';

    const html = `
      <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:560px;margin:0 auto;background:#f5f4f0;padding:8px">
        <div style="background:#1b4332;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;font-family:Georgia,serif;font-size:1.2rem">🧼 Nueva auditoría de bioseguridad</h2>
          <p style="margin:6px 0 0;opacity:.85;font-size:.85rem">${establecimiento || 'Sin nombre'} · ${RUBRO_LABEL[rubro] || rubro}${responsable ? ' · ' + responsable : ''}</p>
        </div>
        <div style="background:#fefefe;border:1px solid #ddd9d0;border-top:none;padding:22px 24px;border-radius:0 0 12px 12px">
          <p style="margin:0 0 4px;font-size:.8rem;color:#5a5650">Cumplimiento global</p>
          <p style="margin:0 0 16px;font-size:2.2rem;font-weight:700;color:${color}">${puntajeGlobal}%</p>
          <p style="margin:0 0 6px;font-weight:600;color:#1a1916">Por sección:</p>
          <ul style="margin:0;padding-left:20px;color:#1a1916;line-height:1.5">${seccionesHtml}</ul>
          ${noCumpleHtml}
          <p style="margin:22px 0 0;font-size:.78rem;color:#9a948c;border-top:1px solid #e8e4de;padding-top:14px">
            Auditoría de Bioseguridad SAG · <a href="https://avivet.cl/avivet/auditoria-sag/" style="color:#2d6a4f;text-decoration:none">avivet.cl</a>
          </p>
        </div>
      </div>`;

    const destinatarios = new Set<string>([ASESOR_MAIL]);
    if (emailProductor && typeof emailProductor === 'string' && emailProductor.includes('@')) {
      destinatarios.add(emailProductor);
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    FROM,
        to:      [...destinatarios],
        subject: `🧼 Auditoría bioseguridad — ${establecimiento || 'Sin nombre'} — ${puntajeGlobal}%`,
        html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify({ ok: res.ok, data }), { headers: CORS });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { headers: CORS });
  }
});
