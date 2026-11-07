# Hardik Agrawal — Portfolio

[Live portfolio](https://hardik-portfolio-mu.vercel.app)

A technical portfolio with a real-time Three.js sculpture, Figma-style cursor assembly, interactive project details, and a Web Audio equation study.

## Development

Use Node.js 22.13 or later.

```sh
npm install
npm run dev
```

Run `npm run build` for production and `npm start` to serve it. Deploy to Vercel using the Next.js preset; no environment variables are required.

## Source

- `app/page.tsx`: content, project dialogs, and sound study.
- `app/portfolio-data.ts`: verified project descriptions and GitHub archive.
- `app/scene-3d.tsx`: real-time geometry and interaction.
- `app/swarm-rebuild.tsx`: original selection, resize, drag, and snap choreography.
- `public/projects`: development blueprint and prototype capture.

## Motion references

The original cursor choreography was inspired by [Joel Califa’s Swarm](https://califa.github.io/swarm-site/) and [Dhvanil Patel’s Swarm Rebuild](https://github.com/DhvanilPatel/swarm-cursors). The animation was implemented independently; no extension code is embedded.

Project descriptions reflect public repositories and development work reviewed on 7 November 2026. Cover illustrations are labeled; development prototypes are not presented as released games.
