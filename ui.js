/* V5 interface. Rendering and paired GPU receipt collection remain in index.html. */
(async () => {
  while (!window.FROXEL || !window.ReceiptUI) await new Promise(r => setTimeout(r, 60));
  const F = window.FROXEL, S = F.state, $ = id => document.getElementById(id);
  const root = document.createElement('main'); root.id = 'interface';
  root.innerHTML = `
    <header class="topbar">
      <a class="wordmark" href="https://tront.xyz/" aria-label="Froxel by Tront, back to tront.xyz">FROXEL<small>V5</small></a>
      <nav aria-label="Workspace"><button data-workspace="play" aria-pressed="true">Play</button><button data-workspace="explain" aria-pressed="false">Explain</button><button data-workspace="test" aria-pressed="false">Test</button></nav>
      <div class="links"><a href="https://github.com/TrentSterling/froxel" target="_blank" rel="noopener">Source ↗</a><button class="benchmark" id="benchmark">Benchmark ↗</button></div>
    </header>
    <nav class="scene-switch" aria-label="Scene"><button data-scene="0" aria-pressed="true">Hall</button><button data-scene="1" aria-pressed="false">Studio</button><button data-scene="2" aria-pressed="false">Courtyard</button></nav>
    <section class="scene-caption"><h1 id="sceneTitle">Lighting, exposed.</h1><p id="sceneDescription">500 moving lights. Every surface responds.</p></section>
    <aside class="telemetry" aria-label="Live renderer statistics"><strong id="fps">...</strong> <span>fps</span><small id="backend">Connecting to GPU</small><small class="gpu-detail" id="gpu">GPU timing pending</small></aside>
    <section class="dock" aria-label="Lighting controls">
      <div><label class="control-label" for="lightCount">Point lights</label><input class="count-input" id="lightCount" type="number" min="1" max="8192" step="1" value="500"></div>
      <div><div class="control-label">Shading model</div><div class="segmented" aria-label="Shading model"><button data-mode="0" aria-pressed="true" title="Evaluate each contributing light at the surface">Full GGX</button><button data-mode="1" aria-pressed="false" title="Combine incoming light directions at each surface">SH pixel</button><button data-mode="2" aria-pressed="false" title="Keep individual specular for polished surfaces and important lights">Hybrid</button></div></div>
      <div class="range-control"><label class="control-label" for="radius">Light range <output id="radiusValue">4.4 m</output></label><input id="radius" type="range" min="1" max="12" step=".1" value="4.4"></div>
      <div class="dock-actions"><button id="pause" aria-pressed="false">Pause</button><button id="controls" class="outline" aria-expanded="false" aria-controls="drawer">Controls</button><button id="hideUI" title="Hide interface (H)">Hide UI</button></div>
    </section>
    <aside class="drawer" id="drawer" aria-label="Scene controls" hidden>
      <header><h2 id="drawerTitle">Make it yours.</h2><button id="closeDrawer" aria-label="Close controls">✕</button></header>
      <div id="playPanel">
        <p>Throw a light into the room, paint a surface, or grab a light and move it.</p>
        <div class="segmented"><button data-tool="0" aria-pressed="true">Throw</button><button data-tool="1" aria-pressed="false">Paint</button><button data-tool="2" aria-pressed="false">Grab</button></div>
        <div class="grid field"><button id="color">Change color</button><button id="clearLights">Clear added lights</button></div>
        <div class="toggle-row"><label for="markers">Light markers</label><input type="checkbox" id="markers" checked></div>
        <div class="toggle-row"><label for="fog">Volumetric fog</label><input type="checkbox" id="fog"></div>
        <div class="toggle-row"><label for="tour">Orbit camera</label><input type="checkbox" id="tour"></div>
        <div class="grid"><button id="home">Home camera</button><button id="reset">Reset scene</button></div>
        <details open><summary>Movement & tools</summary><p>WASD to move · Q / E for height · right-drag to look · click to use your tool · wheel to change range · Space to pause · H to hide UI.</p><p>On touch screens, drag the scene to look and tap to use a tool. Use Orbit camera for a hands-free tour.</p></details>
        <details><summary>About this experiment</summary><p>Surface-resolved clustered lighting with lossless light-index bitsets. No shadows or geometric occlusion. This is a desktop browser experiment, not a Quest or WebXR performance claim.</p><div id="sources"></div></details>
      </div>
      <div id="explainPanel" hidden>
        <p>Pick a surface in the scene. Follow the material, its candidate lights, and the resulting highlight.</p>
        <div class="grid" id="stages"></div><p id="stageDescription"></p>
        <button id="matrix" class="outline">Step outside the camera ↗</button>
        <div id="matrixControls" hidden><p>Right-drag to orbit. Click a cell. The source camera and light lists stay frozen.</p><label class="field control-label" for="slice">Depth slice</label><input id="slice" type="range" min="0" max="23" step="1"><div class="grid field"><button id="previousLight">Previous light</button><button id="nextLight">Next light</button><button id="overview">Overview</button><button id="focusCell">Focus cell</button><button id="exportCell">Save cell JSON</button><button id="inside">Back inside</button></div></div>
        <p class="data-readout" id="probe">Click a surface to inspect its light list.</p>
        <div id="materialControls"><label class="field control-label" for="roughness">Selected roughness</label><input id="roughness" type="range" min=".12" max="1" step=".01"><label class="field control-label" for="metallic">Selected metallic</label><input id="metallic" type="range" min="0" max="1" step=".01"><button id="restoreMaterial">Restore material</button></div>
        <button id="refreshProbe" class="outline">Refresh selection</button>
        <details><summary>The short version</summary><p>Froxels select the light indices. Lighting is evaluated at the exact surface position, so a coarse light list does not make the surface illumination blocky.</p><code>cell = clusterAt(surfacePosition)\nids = GPU_lightMask[cell]\nfor (id in ids) shadeAtSurface(id)</code></details>
      </div>
      <div id="testPanel" hidden>
        <p>Change one condition at a time. Inspect the image, then measure the GPU work.</p>
        <div class="grid"><button data-test="one">One light</button><button data-test="opposing">Opposing colors</button><button data-test="overlap">500 overlapping</button><button data-test="boundary">Cell boundaries</button></div>
        <label class="field control-label" for="layout">Light distribution</label><select id="layout"><option>Spread</option><option>Swarm</option><option>Pile</option><option>Procession</option><option>Waves</option><option>Turbine</option></select>
        <label class="field control-label" for="channel">Shading channel</label><select id="channel"><option value="0">Final lighting</option><option value="1">Light counts</option><option value="9">Depth</option><option value="3">Normals</option><option value="7">Roughness</option><option value="8">Metallic</option><option value="5">Specular only</option><option value="4">Tile overlay</option></select>
        <label class="field control-label" for="quality">Cluster detail</label><select id="quality"><option value="0">Fast · 12 × 7 × 16</option><option value="1" selected>Balanced · 20 × 12 × 24</option><option value="2">Fine · 24 × 14 × 24</option></select>
        <label class="field control-label" for="resolution">Render resolution</label><select id="resolution"><option value=".5">50%</option><option value=".75">75%</option><option value="1" selected>100%</option></select>
        <label class="field control-label" for="exposure">Exposure</label><input id="exposure" type="range" min=".25" max="2.5" step=".05" value="1.1">
        <label class="field control-label" for="normalDetail">Normal detail</label><input id="normalDetail" type="range" min="0" max="2" step=".05" value="1">
        <details open><summary>Compare & verify</summary><div class="grid field"><button id="compareSH">GGX / SH wipe</button><button id="compareCull">Clustered / all lights</button><button id="gridCheck">Check all grids</button><button id="saveReport">Save report</button></div><p id="testResult" class="data-readout"></p></details>
        <div id="comparisonControls" hidden><label class="control-label" for="wipe">Image wipe</label><input id="wipe" type="range" min="0" max="1" step=".01" value=".5"><div class="grid"><button id="difference">Difference view</button><button id="closeComparison">Close comparison</button></div><p id="comparisonResult" class="data-readout"></p></div>
      </div>
    </aside>
    <div class="status" role="status" id="status" hidden></div>
    <footer class="footnote"><a href="https://tront.xyz/">An experiment by Trent Sterling ↗</a><span class="desktop-help"><span class="key">WASD</span> move · <span class="key">Right-drag</span> look · <span class="key">Click</span> throw a light</span><span class="mobile-controls">Drag to look · Tap to light</span></footer>`;
  document.body.append(root);
  const restore = document.createElement('button'); restore.className = 'restore-ui'; restore.textContent = 'Show controls · H'; restore.hidden = true; restore.onclick = () => S.clean = false; document.body.append(restore);
  let drawerOpen = false, lastWorkspace = '', lastStage = -1, lastPin = null;
  const descriptions = ['Each froxel stores candidate light indices. The surface is still shaded at its exact position.', 'The selected mesh’s base color, without lighting. Edit its roughness and metallic response below.', 'Actual shading normals. The white arrow marks the geometric normal at the selected point.', 'Candidate lights come from the GPU mask. Range and facing tests happen at the surface.', 'Diffuse, ambient and emissive contributions, with specular disabled.', 'Specular only. Full GGX preserves separate highlights; SH combines directions into an approximate lobe.', 'The final material response. Optional fog uses spatially sampled lighting.'];
  $('stages').innerHTML = ['Froxels','Material','Normals','Lights','Diffuse','Specular','Final'].map((n,i)=>`<button data-stage="${i}" aria-pressed="false">${n}</button>`).join('');
  for (const r of F.resources) { const a = document.createElement('a'); a.className='resource'; a.href=r.url; a.target='_blank'; a.rel='noopener'; a.textContent=r.title+' ↗'; $('sources').append(a); }
  function drawer(open) { drawerOpen=open; $('drawer').hidden=!open; root.classList.toggle('drawer-open',open); $('controls').setAttribute('aria-expanded',open); S.drawerHidden=!open; }
  function workspace(name) { F.setWorkspace(name); drawer(name!=='play'); sync(); }
  function save(data,name) { const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})), a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000); }
  function action(id, fn) { $(id).onclick=()=>{if(!FROXELBench.running&&!F.busy){fn();sync();}}; }
  root.querySelectorAll('[data-workspace]').forEach(b=>b.onclick=()=>workspace(b.dataset.workspace));
  root.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>{F.setScene(+b.dataset.scene);sync();});
  root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{S.mode=+b.dataset.mode;sync();});
  root.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{S.tool=+b.dataset.tool;sync();});
  root.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{F.setStage(+b.dataset.stage);sync();});
  root.querySelectorAll('[data-test]').forEach(b=>b.onclick=()=>{F.applyTest(b.dataset.test);sync();});
  action('controls',()=>drawer(!drawerOpen)); action('closeDrawer',()=>{drawer(false);$('controls').focus();});
  action('hideUI',()=>{S.clean=true;}); action('pause',()=>S.paused=!S.paused);
  action('home',()=>{F.home();S.sweep=false;S.tour=false;});action('reset',()=>{F.reset();drawer(false);});
  action('clearLights',()=>F.orbs.splice(0)); action('color',()=>S.color=(S.color+1)%5);
  action('matrix',()=>F.openMatrix());action('inside',()=>F.matrix?.close());
  action('previousLight',()=>F.matrix?.selectLight(-1));action('nextLight',()=>F.matrix?.selectLight(1));
  action('overview',()=>F.matrix?.overview());action('focusCell',()=>F.matrix?.focusCell());action('exportCell',()=>F.exportCell());
  action('restoreMaterial',()=>F.restoreMaterial());action('refreshProbe',()=>F.refreshProbe());
  action('compareSH',()=>F.compare('sh')); action('compareCull',()=>F.compare('culling'));action('gridCheck',()=>F.gridSweep());
  action('saveReport',()=>save(F.comparison?.meta||F.testResult||F.getStats(),'froxel-v5-report.json'));
  action('difference',()=>{if(F.comparison)F.comparison.view=F.comparison.view==='wipe'?'difference':'wipe';});action('closeComparison',()=>F.closeComparison());
  $('benchmark').onclick=()=>{ReceiptUI.show();$('receiptCurrent').focus();};
  $('lightCount').onchange=()=>{const n=Number($('lightCount').value);F.setCount(Number.isFinite(n)?Math.max(1,Math.min(8192,Math.round(n))):500);sync();};
  for(const key of ['radius','exposure','normalDetail']) $(key).oninput=()=>{S[key]=+$(key).value;sync();};
  for(const key of ['markers','fog','tour']) $(key).onchange=()=>{S[key]=$(key).checked;sync();};
  $('layout').onchange=()=>{S.layout=$('layout').selectedIndex;S.test=0;};
  $('channel').onchange=()=>{S.debug=+$('channel').value;S.specular=true;};
  $('quality').onchange=()=>F.setQuality(+$('quality').value);
  $('resolution').onchange=()=>{S.scale=+$('resolution').value;F.resize();};
  $('roughness').oninput=()=>F.editMaterial('rough',+$('roughness').value);$('metallic').oninput=()=>F.editMaterial('metal',+$('metallic').value);
  $('slice').oninput=()=>F.matrix?.makeSlice(+$('slice').value);$('wipe').oninput=()=>{if(F.comparison)F.comparison.wipe=+$('wipe').value;};
  function value(id,v){if(document.activeElement!==$(id))$(id).value=v;}
  function sync(){
    const receiptVisible=!$('receipts').hidden;
    root.hidden=S.clean&&!receiptVisible;restore.hidden=!S.clean||receiptVisible;
    if(lastWorkspace!==S.workspace){lastWorkspace=S.workspace;['play','explain','test'].forEach(w=>$(w+'Panel').hidden=w!==S.workspace);$('drawerTitle').textContent={play:'Make it yours.',explain:'Follow the light.',test:'Put it to the test.'}[S.workspace];if(S.workspace!=='play')drawer(true);}
    for(const [attr, val] of [['workspace',S.workspace],['scene',S.scene],['mode',S.mode],['tool',S.tool],['stage',S.stage]])root.querySelectorAll(`[data-${attr}]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[attr]===String(val))));
    value('lightCount',S.count);value('radius',S.radius);$('radiusValue').textContent=S.radius.toFixed(1)+' m';
    $('pause').textContent=S.paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',S.paused);
    $('sceneTitle').textContent=['Lighting, exposed.','A study in specular.','Light beyond walls.'][S.scene];$('sceneDescription').textContent=`${(S.count+F.orbs.length).toLocaleString()} lights · ${['Industrial hall','Material studio','Open courtyard'][S.scene]}`;
    for(const key of ['markers','fog','tour'])$(key).checked=S[key];
    for(const key of ['exposure','normalDetail','quality'])value(key,S[key]);value('channel',S.debug);value('resolution',S.scale);$('layout').selectedIndex=S.layout;
    const colors=['Cyan','Orange','Green','Violet','Warm white'];$('color').textContent=colors[S.color]+' light';
    if(lastStage!==S.stage){lastStage=S.stage;$('stageDescription').textContent=descriptions[S.stage];}
    const matrix=F.matrix?.active;$('matrixControls').hidden=!matrix;$('matrix').hidden=!!matrix;
    root.querySelector('.scene-caption').hidden=!!matrix||!!F.comparison||(drawerOpen&&innerWidth<=600);
    if(matrix){const i=F.matrix.info();$('probe').textContent=`${i.population} lights → ${i.candidates.length} candidates\nCell [${i.cell.join(', ')}]\nSelected light: ${i.selectedLight??'none'}`;$('slice').max=F.matrix.data.uniforms.cluster[2]-1;value('slice',F.matrix.slice);}
    else {const p=F.probeInfo;$('probe').textContent=p?`${F.pin?.mesh.name||'Surface'}\n${p.candidates.length} candidates · ${p.inRange.length} in range\n${p.facing.length} facing the surface`:'Click a surface to inspect its light list.';}
    $('materialControls').hidden=!F.pin||!!matrix;
    if(F.pin!==lastPin){lastPin=F.pin;if(lastPin){value('roughness',lastPin.mesh.userData.surface.rough);value('metallic',lastPin.mesh.userData.surface.metal);}}
    const c=F.comparison;$('comparisonControls').hidden=!c;if(c)$('comparisonResult').textContent=`Max RGB difference: ${c.diff.max} / 255\nChanged pixels: ${c.diff.changedPixels.toLocaleString()}`;
    if(F.testResult)$('testResult').textContent=F.testResult.allExact?'All three grids: exact image match.':'Grid check found image differences. Save the report.';
    const notice=F.busy||F.notice;
    $('status').hidden=!notice;$('status').textContent=notice||'';
    const stats=F.getStats();$('fps').textContent=Number.isFinite(stats.fps)?Math.round(stats.fps):'…';$('backend').textContent=F.backend.api==='webgpu'?'WebGPU · compute':'WebGL2 · textures';
    const g=stats.gpuMs;$('gpu').textContent=g.prepare!=null&&g.render!=null?`${(g.prepare+g.render).toFixed(2)} ms GPU · latest sample`:'GPU timestamps unavailable';
    root.querySelectorAll('button,input,select').forEach(el=>{el.disabled=!!F.busy||FROXELBench.running;});
    $('receipts').querySelector('.empty-results').hidden=$('receiptRows').children.length>0;
  }
  // DOM controls own their keys; canvas movement never steals form editing or Tab.
  window.addEventListener('keydown',e=>{
    if(e.key==='Tab'){e.stopImmediatePropagation();return;}
    if(!$('receipts').hidden){e.stopImmediatePropagation();if(e.key==='Escape'){if(FROXELBench.running)FROXELBench.cancel();else{ReceiptUI.hide();$('benchmark').focus();}}return;}
    if(e.target.closest('button,input,select,summary,a')){e.stopImmediatePropagation();if(e.key==='Escape'){drawer(false);$('controls').focus();}return;}
    if(e.key==='Escape'&&drawerOpen){drawer(false);sync();}
  },true);
  // Pointer gestures stay on the scene. Touch drag looks; a stationary tap uses the active tool.
  const hud=$('hud');let touch=null;
  hud.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;e.stopImmediatePropagation();hud.setPointerCapture(e.pointerId);touch={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};},{capture:true});
  hud.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'||!touch)return;e.stopImmediatePropagation();const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch.moved ||= Math.hypot(e.clientX-touch.startX,e.clientY-touch.startY)>8;if(touch.moved)F.touchLook(dx,dy);touch.x=e.clientX;touch.y=e.clientY;},{capture:true});
  hud.addEventListener('pointerup',e=>{if(e.pointerType!=='touch'||!touch)return;e.stopImmediatePropagation();if(!touch.moved)F.touchTap(e.clientX,e.clientY);touch=null;},{capture:true});
  hud.addEventListener('pointercancel',()=>touch=null);
  const receipt=$('receipts');receipt.setAttribute('aria-label','GPU benchmark');
  receipt.querySelector('h1').textContent='Measure the difference.';
  const eyebrow=document.createElement('div');eyebrow.className='bench-title';eyebrow.textContent='FROXEL / GPU BENCHMARK';receipt.prepend(eyebrow);
  const intro=receipt.querySelector('#receiptAdapter + p');if(intro&&!intro.classList.contains('note'))intro.textContent='Compare three shading models on your GPU. Export the raw timings or a compact CSV.';
  const methodology=document.createElement('details');methodology.innerHTML='<summary>Test conditions & measurement method</summary>';
  const condition=[...receipt.querySelectorAll('p')].find(p=>p.querySelector('strong'));
  if(condition){const note=condition.nextElementSibling;condition.before(methodology);methodology.append(condition);if(note?.classList.contains('note'))methodology.append(note);}
  const empty=document.createElement('p');empty.className='empty-results';empty.textContent='No results yet. Compare your current view, or run the controlled sweep to test range, resolution and effects.';receipt.querySelector('.scroll').before(empty);
  $('receiptFilter').setAttribute('aria-label','Filter benchmark results');$('receiptProgress').setAttribute('aria-label','Benchmark progress');$('receiptStatus').setAttribute('role','status');
  if(!(F.backend.timestamps||F.backend.ext))$('receiptStatus').textContent='GPU timestamps are unavailable in this browser. Runs can export CPU submission measurements; GPU durations will be marked unavailable.';
  window.FroxelUI={sync,workspace,drawer};sync();setInterval(sync,200);
})();
