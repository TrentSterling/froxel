# Development history

This repository starts from `froxel_500_v3_bench.html`, supplied by Trent Sterling from a ChatGPT project.

The local ChatGPT export was searched for Froxel references. The relevant conversation, **Threejs Froxel Point Lights**, documents the progression from many point lights and a spatial lighting approximation to surface-resolved clustered shading, three demonstration scenes, inspection tools, and the V3 receipt collector. The older **Understanding Froxels in Rendering** conversation also appears in the export.

The V3 benchmark discussion identified that SH pixel still traverses candidate lights per surface pixel, while Hybrid preserves individual specular in selected cases. The bigger shortcut in the earlier spatial field was not equivalent to V3's surface lighting. Earlier chat measurements used software WebGL rendering; they are not presented here as native hardware measurements.

V5 is the repository handoff and user-interface revision. It retains the renderer and receipt method, replaces the canvas-drawn application controls with native HTML controls, makes benchmarking opt-in, adds responsive and touch interactions, and adds sharing metadata, an actual rendered OG capture, and repeatable browser verification.

The original V3 import is retained as the first Git commit. Chat transcripts, personal exports, and unrelated history remain outside the public repository.
