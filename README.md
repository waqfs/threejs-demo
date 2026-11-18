# Three.js Playground

## Run locally

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Run `npm run build` to generate the static site in `dist/`. Use `npm run preview` to serve that build locally.

## Links for the slides

Append the fragment to the published site URL. Each opens a separate draft saved in the current browser. **Reset** restores the active preset's starter code.

| Slide | Preset | Link fragment | Try this |
| --- | --- | --- | --- |
| 2 | Viewpoint | `#viewpoint` | Change the camera's z position from 5 to 8. |
| 3 | Mesh | `#mesh` | Double the box width or turn off wireframe. |
| 4 | Position | `#position` | Change x from 2 to −2. The gray cube marks the origin. |
| 5–6 | Animation | `#animation` | Change 0.001 to 0.002 and compare the speed. |
| 7 | Your turn | `#your-turn` | Make the cube blue, move it left, and turn it around x. |
| 8 | Debugging | `#debugging` | Find the missing line that makes the cube visible. |

`#playground` opens the free playground. Edit starter code in [`src/presets.js`](src/presets.js).

## Writing sketches

The editor provides `THREE`, `scene`, and `camera` with the camera starting at z = 5. Put mesh creation and initial transforms at the top level. That code runs once when the preview updates. Define `function animate(time)` to change properties every frame. Time is in milliseconds since the sketch started, and the playground draws the frame after your function runs.

To paste the animation exactly as shown on slide 6, use `renderer.setAnimationLoop(animate)` and draw with `renderer.render(scene, camera)` inside the callback. Registering the callback this way gives the sketch control over when each frame is drawn.

The preview requires WebGL 2.

## Publish on GitHub Pages

Push the project to a repository with a `main` branch. In **Settings → Pages**, set **Source** to **GitHub Actions**, then run **Deploy playground to GitHub Pages** from the Actions tab. Subsequent pushes to `main` rebuild and deploy automatically. The build uses relative asset paths for GitHub Pages project URLs.
