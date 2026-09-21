# KakoBuy — Réplica en Tailwind CSS

Réplica del home de KakoBuy (header, accesos rápidos, carrusel de banners,
ticker de noticias, tutorial, soluciones, servicios, footer) más las vistas
de **Cart** (carrito vacío) y **Mine** (perfil), con navegación real entre
las tres mediante la tab bar inferior (mobile) o los íconos del header
(desktop). Hecho con Tailwind CSS (compilado, sin CDN) y JS vanilla.

Varias secciones (logo, accesos rápidos, tutorial) usan directamente
capturas reales de la app, recortadas e integradas para que el resultado
sea idéntico al original en vez de una recreación aproximada.

## Cómo verla

Simplemente abrí `index.html` con doble clic — se abre en tu navegador tal
cual, sin instalar nada (el CSS ya viene compilado en `dist/tailwind.css`).

## Estructura

```
index.html            Página completa (HTML + Tailwind + JS inline)
dist/tailwind.css     CSS de Tailwind ya compilado y minificado (lo que usa index.html)
src/input.css         Fuente del CSS (tema con los colores de marca) — solo hace falta si vas a modificar estilos
images/               Logo real, tarjetas de accesos rápidos y tutorial recortados de la app original
package.json / package-lock.json   Dependencia de @tailwindcss/cli para recompilar
.gitignore             Ignora node_modules/
```

## Si vas a editar clases de Tailwind

Necesitás recompilar `dist/tailwind.css` para que las nuevas clases se
incluyan:

```bash
npm install
npx @tailwindcss/cli -i src/input.css -o dist/tailwind.css --minify
```

## Subir a GitHub

Descomprimí el ZIP y hacé commit de todo el contenido de esta carpeta
(node_modules no existe en el ZIP, se genera solo con `npm install` si lo
necesitás para recompilar).
