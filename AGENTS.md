# Froxel

Standalone static demo. No build step. Preserve the bundled Three.js license and the distinction between surface-resolved shading and spatial lighting approximations.

Read README.md and docs/HISTORY.md. The original V3 import is the first Git commit. Personal chat history stays outside this repo.

Run `npm test` with Chrome and a hardware adapter supporting WebGPU timestamp queries. The suite writes receipts and screenshots to ignored `qa/artifacts/`. Use `FROXEL_URL` to target a deployment and `PLAYWRIGHT_MODULE` to reuse an installed dependency. Do not advertise desktop or software results as Quest results.

The scene must open unobstructed. Keep native keyboard navigation, mobile controls, benchmark cancellation, exports, state restoration, and WebGL2 fallback working. No fake performance numbers. Update version and verification notes for releases.

Pages uses `main` at `/`, inheriting `tront.xyz` from the account website. Do not add a project CNAME.
