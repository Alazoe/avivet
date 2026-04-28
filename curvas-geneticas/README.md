# Curvas Genéticas · Ponedoras · avivet.cl

Herramienta de referencia técnica para las cuatro líneas genéticas ponedoras de uso en el sur de Chile. Muestra curvas de peso corporal, consumo de alimento y agua por semana, producción estimada y calculadora de equipamiento.

## Líneas incluidas

| Línea | Tipo | Fuente de datos |
|---|---|---|
| **Hy-Line Brown** | Marrón, alta producción | Hy-Line Commercial Management Guide |
| **Hy-Line W-80** | Blanca, alta eficiencia | Hy-Line W-80 Standard (Chile, jaula) |
| **Lohmann Brown** | Marrón, alta adaptabilidad | Manual Lohmann Brown Lite |
| **Nick Brown** | Marrón, huevo grande | Manual Nick Chick (Hendrix Genetics) — estimado |

## Funcionalidades

- **Selector de línea genética** — alterna entre las 4 líneas con un clic
- **Tab Crianza** — gráficos de peso, alimento y agua (semanas 1 al fin de crianza) + tabla completa
- **Tab Postura** — % postura, peso de huevo, peso corporal, alimento y agua (semanas 19–100) + tabla
- **Tab Equipamiento** — calculadora automática para un N° de aves configurable:
  - Crianza: superficie, perchas, bebederos, nipples, comederos
  - Postura: nidos individuales, nidos comunitarios, bebederos, nipples, comederos, perchas, acceso exterior

## Uso

Es una página estática sin dependencias externas (fuera de Google Fonts).  
Para usarla localmente, basta abrir `index.html` en un navegador.  
Está publicada en GitHub Pages: **http://avivet.cl/avivet/curvas-geneticas/**

## Estructura

```
curvas-geneticas/
├── index.html    Página principal (HTML + CSS inline)
├── app.js        Datos y lógica de renderizado (SVG, tablas, equipamiento)
└── README.md     Este archivo
```

## Datos y fuentes

- Los datos de peso corporal, alimento y agua de **Lohmann Brown** (sem 1–100) provienen de la tabla de texto del Excel de referencia.
- Los datos de **Hy-Line Brown** usan la curva estándar del manual comercial; los valores de % postura y peso huevo son del modelo de proyeccion-galpones.
- Los datos de **Hy-Line W-80** y **Nick Brown** son estimados a partir de los manuales de fabricante con ajustes para condiciones de Chile.
- Los ratios de equipamiento son los mínimos recomendados para sistemas no convencionales (piso/pastoreo) en Chile.

---

**avivet.cl** · MV Andrés Lazo Escobar · Valdivia, Chile
