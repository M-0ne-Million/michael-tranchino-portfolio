# Michael Tranchino · Portfolio

My portfolio as a Roman and Japanese sci-fi city, rendered in real time with Three.js.
Every district is a part of my CV:

| District | Section |
|---|---|
| Core 中心 | About |
| Turbine 動力 | Engee Software, contractor for Baker Hughes |
| Labs 工房 | Selected projects |
| Foundry 工場 | XAutomation / EUROFORK |
| Beacon 灯台 | Guardians startup |
| Stack 技術 | Skills |
| Academy 学舎 | Education and languages |
| Circuit 車 | Cars, with a live race simulation |
| Uplink 通信 | Contact |

**Live:** https://m-0ne-million.github.io/michael-tranchino-portfolio/

## Highlights

- Fully procedural city: no 3D models, every building, roof, column and car is generated in code.
- Shader-based windows and roads in world space, bloom post-processing, instanced skyline.
- Scroll-driven camera that orbits the city and rests on each district.
- Circuit: a driver model per car with grip-limited corner speed, aero downforce, power and traction limits,
  late braking, racing line, overtakes on the free side, power-oversteer drifts and tyre smoke, plus live telemetry.
- Italian and English with a global toggle (`?lang=it` / `?lang=en` for shareable links).
- Text and navigation work without WebGL; motion respects `prefers-reduced-motion`.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Every push to `main` builds the site and publishes it to GitHub Pages through `.github/workflows/deploy.yml`.
