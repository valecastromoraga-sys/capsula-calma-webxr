# Capsula Calma WebXR

Experiencia sensorial relajante creada con Vite, Three.js y WebXR. Esta base esta pensada para lentes Meta Quest: el usuario puede entrar en un espacio inmersivo, escoger entre tres modos de calma y tomar objetos con los controles VR para moverlos o lanzarlos dentro de la escena.

## Modos de calma

- **Aurora suave:** luces violetas y verdes con particulas lentas.
- **Oceano lento:** ambiente azul con movimiento ondulante y sonido visual de marea.
- **Bosque tibio:** tonos verdes, bruma suave y objetos con movimiento pausado.

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
- Acerca el control a un objeto y presiona el gatillo para tomarlo.
- Suelta el gatillo para dejarlo o lanzarlo con la velocidad del control.
