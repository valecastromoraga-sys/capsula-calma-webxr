# Capsula Calma WebXR

Experiencia sensorial relajante creada con Vite, Three.js y WebXR. Esta base esta pensada para lentes Meta Quest: el usuario aparece dentro de una capsula interior suave, escoge un modo de acompanamiento y el ambiente cambia con luz, color y movimiento lento.

## Modos de calma

- **Necesito regularme:** luz calida, respiracion visual lenta y puntos suaves que aparecen y desaparecen.
- **Necesito tomar una pausa:** ambiente mas oscuro, azul noche y violeta profundo, con movimiento casi inmovil.
- **Necesito reenfocarme:** claridad fria, menta y celeste, con lineas sutiles de orientacion.

## Audio preparado

El codigo espera estos archivos en `public/audio/`. Si alguno no existe, la experiencia muestra un warning en consola y sigue funcionando visualmente.

- `public/audio/bienvenida.mp3`
- `public/audio/regularme.mp3`
- `public/audio/pausa.mp3`
- `public/audio/reenfocarme.mp3`
- `public/audio/ambiente-regularme.mp3`
- `public/audio/ambiente-pausa.mp3`
- `public/audio/ambiente-reenfocarme.mp3`

## Requisitos

- Node.js 18 o superior.
- Un navegador compatible con WebXR.
- Meta Quest conectado por navegador en modo inmersivo.
- Para usar WebXR fuera de `localhost`, el sitio debe servirse con HTTPS.

## Uso local

```bash
npm install
npm run dev
```

Abre la URL local que muestra Vite. En Meta Quest puedes abrir la direccion de red del computador si ambos dispositivos estan en la misma red y el navegador permite la sesion WebXR.

## Construccion

```bash
npm run build
npm run preview
```

La salida queda en `dist/`.

## Publicacion en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub.
2. En GitHub, entra a **Settings > Pages**.
3. Selecciona **GitHub Actions** como fuente de despliegue.
4. Haz push a la rama `main`; el workflow incluido construye Vite y publica `dist/`.

La configuracion `base: './'` en `vite.config.js` permite que los assets funcionen bien en GitHub Pages, incluso si el repositorio se publica en una ruta como `/capsula-calma-webxr/`.

## Controles VR

- Apunta a un boton y presiona el gatillo para cambiar de modo.
- Cada modo cambia la iluminacion, los puntos de luz y la sensacion general de la capsula.
