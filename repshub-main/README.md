# RepsHub

Sitio web para descubrir los mejores productos REPS desde China. Incluye catálogo de productos, calculadora de impuestos y guías de compra.

## 🚀 Características

- **Catálogo de productos** con más de 1,500 productos
- **Calculadora de impuestos** para Argentina
- **Guía completa** de cómo comprar desde China
- **Integración con Hubbuy** y otros agentes de compra
- **Analytics con Vercel** para estadísticas de visitas
- **Diseño responsive** y optimizado para rendimiento

## 📦 Tecnologías

- HTML5, CSS3, JavaScript (Vanilla)
- Supabase para base de datos
- Vercel Analytics para estadísticas
- Desplegado en Vercel

## 🛠️ Instalación Local

1. Clona el repositorio
2. Abre `index.html` en tu navegador o usa un servidor local:
   ```bash
   python server.py
   ```

## 📦 Catálogo local

Además de Supabase, el sitio ahora puede leer productos desde `data/products.local.json`.

Formato base:

```json
{
  "products": [
    {
      "nombre": "Nike Tech Fleece",
      "categoria": "Buzos",
      "calidad": "1:1",
      "precio_cny": 129,
      "imagen_url": "https://...",
      "source_url": "https://weidian.com/item.html?itemID=1234567890",
      "descripcion": "Opción local importada desde spreadsheet",
      "created_at": "2026-03-30T12:00:00.000Z",
      "activo": true
    }
  ]
}
```

Campos mínimos recomendados: `nombre`, `precio_cny`, `imagen_url` y `source_url`.
Los productos del JSON local se mezclan con los de Supabase en la página de productos y en los destacados.

## 📊 Analytics

El sitio incluye Vercel Analytics para rastrear visitas y estadísticas. Las métricas están disponibles en el dashboard de Vercel.

## 🌐 Despliegue

El sitio está configurado para desplegarse automáticamente en Vercel como sitio estático.

## 📝 Licencia

ISC
