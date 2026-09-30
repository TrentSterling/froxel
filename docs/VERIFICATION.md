# V5 release verification

Verified on 2026-09-30 using installed Chrome, Playwright 1.58.2, and the machine's NVIDIA Blackwell adapter. GPU adapter details are reported by the browser as `nvidia / blackwell`.

## Browser suite

`qa/smoke.cjs`: **28 checks passed**, no collected page or console errors.

Covered the three scenes and three main shading modes, keyboard number entry and Tab navigation, fog, UI hide/restore, specular explanation, the frozen GPU froxel inspector, a controlled two-light test, benchmark entry, exports, state restoration, cancellation, phone layout, and the explicit WebGL2 fallback.

The current-view hardware benchmark completed nine blocks with 60 valid paired GPU timing samples per block: **540 samples total**. This verification run used a 720 × 450 render target (50% of a 1440 × 900 CSS viewport), 500 lights and 4.4 m range. It validates the collector, not a universal performance claim.

## Inspection and input

`qa/inspection.cjs`: **9 checks passed**, no collected page errors.

- Clustered versus all-light reference: **0 maximum RGB-byte difference, 0 changed pixels** at the tested 600 × 400 hall view.
- Three cluster grids, compared against an all-light reference at 400 × 267: **all exact**, 0 changed pixels in each capture.
- GGX versus SH produced different images, as expected; difference-view controls worked.
- Actual emulated touch gestures rotated the camera and added a light.
- The benchmark fitted the phone viewport.
- Hybrid with fog and markers produced 12 valid paired GPU samples.

Native WebGPU testing exposed an inherited V3 diagnostic capture race: awaiting queue completion before copying the presentation canvas could allow its backing image to be discarded. V5 copies the submitted image in the same task before awaiting completion. This changes diagnostic capture timing, not the lighting shader or benchmark pass timing.

## Lighting preservation

Frozen WebGPU renders of the original supplied V3 benchmark HTML and V5 were pixel-identical for Full GGX, SH pixel and Hybrid in a 640 × 400 hall view at simulation time 16. This is a focused regression check, not proof for every possible setting.

SHA-256 hashes of the matching canvas PNG data URLs, in that order:

```text
9f3416ff24abbe312d8a106d69a28beff51930fc5c99eb9ade96dfe23b3777e4
21f36ee5ea2c85aabae10a4e8351f51e78860d58fff107dc8473ac3fb09f2f64
5ec82f7d0c8d8254e9781b2b25b81470c97f955b2543f867b2c4a354fc2f08d9
```

## Visual review and reproduction

Desktop (1440 × 900), phone (390 × 844), inspector, benchmark, and phone-controls screenshots were captured and inspected. The OG image is a 1200 × 630 capture of the running WebGPU scene with a capture-only title overlay.

```sh
npm ci
npm test
node qa/inspection.cjs
node qa/capture.cjs
```

Raw receipts, screenshots, and JSON verification output remain in ignored `qa/artifacts/`. The public demo can generate fresh receipts for each visitor. No headset hardware or WebXR validation was performed.
