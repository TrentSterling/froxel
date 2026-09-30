const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');const out=path.join(__dirname,'artifacts');
const url=process.env.FROXEL_URL||pathToFileURL(path.join(root,'index.html')).href;
(async()=>{
 const b=await chromium.launch({headless:true,channel:'chrome',args:['--ignore-gpu-blocklist','--enable-unsafe-webgpu','--use-angle=d3d11']});
 const errors=[];const checks=[];const check=(n,c)=>{assert.ok(c,n);checks.push(n);console.log('PASS',n);};
 try{
  const p=await b.newPage({viewport:{width:1200,height:800},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.waitForFunction(()=>window.FroxelUI);
  await p.evaluate(()=>{FROXEL.state.scale=.5;FROXEL.resize();});
  await p.locator('[data-workspace="test"]').click();await p.locator('#compareCull').click();await p.waitForFunction(()=>!!FROXEL.comparison&&!FROXEL.busy,{},{timeout:60000});
  const cull=await p.evaluate(()=>({max:FROXEL.comparison.diff.max,changed:FROXEL.comparison.diff.changedPixels}));
  check('clustered/all-light comparison is pixel exact',cull.max===0&&cull.changed===0);console.log('CULLING',cull);
  await p.locator('#difference').click();check('difference view toggle',await p.evaluate(()=>FROXEL.comparison.view==='difference'));
  await p.locator('#closeComparison').click();await p.locator('#compareSH').click();await p.waitForFunction(()=>!!FROXEL.comparison&&!FROXEL.busy,{},{timeout:60000});
  check('GGX/SH image comparison available',await p.evaluate(()=>FROXEL.comparison.diff.changedPixels>0));await p.locator('#closeComparison').click();
  await p.locator('#gridCheck').click();await p.waitForFunction(()=>!!FROXEL.testResult&&!FROXEL.busy,{},{timeout:60000});
  const grid=await p.evaluate(()=>FROXEL.testResult);console.log('GRID',JSON.stringify(grid));check('all three grid comparisons are pixel exact',grid.rows.length===3&&grid.allExact);
  await p.locator('[data-workspace="play"]').click();
  await p.setViewportSize({width:390,height:844});
  const q=await p.evaluate(()=>FROXEL.camera.quaternion.toArray());const cdp=await p.context().newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:160,y:350}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:210,y:360}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  check('touch drag rotates camera',await p.evaluate(old=>JSON.stringify(FROXEL.camera.quaternion.toArray())!==JSON.stringify(old),q));
  const count=await p.evaluate(()=>FROXEL.orbs.length);await p.touchscreen.tap(190,400);check('touch tap adds a light',await p.evaluate(n=>FROXEL.orbs.length===n+1,count));
  await p.locator('#controls').click();await p.locator('#reset').click();await p.waitForTimeout(200);
  await p.locator('#benchmark').click();check('mobile benchmark fits page',await p.locator('#receipts').evaluate(el=>el.scrollWidth===el.clientWidth));await p.screenshot({path:path.join(out,'mobile-benchmark.png')});await p.locator('#receiptClose').click();
  await p.setViewportSize({width:1200,height:800});await p.locator('#controls').click();await p.locator('#fog').check();await p.locator('#closeDrawer').click();
  await p.evaluate(()=>{FROXEL.state.paused=true;FROXEL.state.time=16;});
  const receipt=await p.evaluate(()=>FROXELBench.run([{case:'Fog and markers',mode:2,count:500,fog:true,markers:true,size:[600,400]}],{warmup:5,samples:12,requireVisible:true}));
  check('fog/marker passes produce complete receipts',receipt.complete&&receipt.results[0].stats.total.n===12);
  check('inspection and touch have no page errors',errors.length===0);
  fs.writeFileSync(path.join(out,'inspection.json'),JSON.stringify({checks,errors,cull,grid,fogReceipt:receipt},null,2));console.log('COMPLETE',checks.length,'inspection checks passed');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
