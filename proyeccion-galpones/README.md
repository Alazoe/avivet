# Proyección 3 Galpones · avivet.cl

Visualización web de la proyección de producción de huevos para tres galpones desfasados de gallinas Hy-Line Brown.

## Contenido

```
proyeccion-galpones/
├── index.html      Página principal
├── estilos.css     Estilos (paleta avivet.cl)
├── app.js          Render SVG vanilla y tabla
└── datos.json      Datos de la proyección (181 semanas, 3 galpones)
```

Sin dependencias externas. Solo HTML, CSS y JavaScript vanilla. Las únicas fuentes externas son Google Fonts (Crimson Pro, Inter, IBM Plex Mono) cargadas vía CDN.

## Despliegue en avivet.cl (GitHub Pages)

### Opción A — Subir como subdirectorio del sitio principal

Si avivet.cl está hospedado desde un repo tipo `alazoe.github.io` o `avivet`:

1. En el repo de GitHub, crear la carpeta `proyeccion-galpones/`
2. Subir los 4 archivos (index.html, estilos.css, app.js, datos.json)
3. Hacer commit y push
4. Acceder en: `https://avivet.cl/proyeccion-galpones/`

### Opción B — Repositorio independiente

```bash
# Desde la carpeta extraída
cd proyeccion-galpones
git init
git add .
git commit -m "Proyección 3 galpones Hy-Line Brown"
git branch -M main
git remote add origin git@github.com:Alazoe/proyeccion-galpones.git
git push -u origin main
```

Luego en el repo: `Settings → Pages → Source: main / root`. URL final:
`https://alazoe.github.io/proyeccion-galpones/`

## Pruebas locales

Como `app.js` usa `fetch()` para cargar `datos.json`, no se puede abrir `index.html` directamente con doble clic (CORS bloquea `file://`). Levantar un servidor local:

```bash
cd proyeccion-galpones
python3 -m http.server 8000
# Abrir http://localhost:8000
```

## Actualizar la proyección

Para regenerar los datos con parámetros distintos (línea genética, fechas de ingreso de pollitas, mortalidad, número de aves), reemplazar `datos.json` manteniendo la misma estructura.

Estructura del JSON:

```json
{
  "metadata": { ... },
  "galpones": [
    { "id": "G1", "nombre": "...", "fecha_nacimiento": "2025-07-17", ... }
  ],
  "curva_hyline_brown": [
    { "semana": 19, "postura_pct": 5.0, "peso_huevo_g": 45.0 }
  ],
  "proyeccion_semanal": [
    {
      "semana_cal": 1,
      "fecha_lunes": "2025-07-14",
      "anio": 2025,
      "mes": 7,
      "G1": { "sem_vida": 1, "estado": "crianza", "aves": 1996, "pct_postura": 0, "peso_huevo_g": 0, "huevos_dia": 0, "huevos_semana": 0 },
      "G2": { ... },
      "G3": { ... },
      "total": { "aves_en_postura": 0, "huevos_dia": 0, "huevos_semana": 0 }
    }
  ]
}
```

## Personalización

- **Colores:** editar variables CSS al inicio de `estilos.css` (`--g1`, `--g2`, `--g3`, `--color-primario`, etc.)
- **Fuentes:** cambiar el `<link>` de Google Fonts en `index.html` y las variables `--fuente-titulo`, `--fuente-cuerpo`, `--fuente-mono`
- **Secciones:** agregar/quitar `<section class="bloque">` en `index.html` y la lógica correspondiente en `app.js`

## Licencia

Material técnico de avivet.cl. Uso interno para clientes y consultorías.
