const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..'), artifacts = path.join(__dirname, 'artifacts');
fs.mkdirSync(artifacts, {recursive:true});
const target = process.env.FROXEL_URL || pathToFileURL(path.join(root, 'index.html')).href;
const checks=[], errors=[];
function check(name,condition){assert.ok(condition,name);checks.push(name);console.log('PASS',name);}
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome',args:['--ignore-gpu-blocklist','--enable-unsafe-webgpu','--use-angle=d3d11']});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(target);await page.waitForFunction(()=>window.FroxelUI,{},{timeout:90000});
    check('playground opens without benchmark overlay',await page.locator('#receipts').isHidden());
    await page.waitForTimeout(800);await page.screenshot({path:path.join(artifacts,'desktop.png')});
    const initial=await page.evaluate(()=>FROXEL.getStats());console.log('ADAPTER',initial.backend,initial.adapter);
    check('500 initial lights',initial.lights===500);
    for(let scene=0;scene<3;scene++){
      await page.locator(`[data-scene="${scene}"]`).click();
      for(let mode=0;mode<3;mode++){
        await page.locator(`[data-mode="${mode}"]`).click();await page.waitForTimeout(100);
        check(`scene ${scene}, shading mode ${mode}`,await page.evaluate(([s,m])=>FROXEL.state.scene===s&&FROXEL.state.mode===m&&FROXEL.backend.errors.length===0,[scene,mode]));
      }
    }
    await page.locator('[data-scene="0"]').click();await page.locator('[data-mode="0"]').click();
    await page.locator('#lightCount').fill('1024');await page.locator('#lightCount').press('Tab');
    check('native keyboard number control and Tab',await page.evaluate(()=>FROXEL.state.count===1024&&FROXEL.state.workspace==='play'));
    await page.locator('#controls').click();await page.locator('#fog').check();await page.waitForTimeout(300);
    check('fog enabled',await page.evaluate(()=>FROXEL.state.fog));await page.locator('#fog').uncheck();
    await page.locator('#closeDrawer').click();await page.locator('#hideUI').click();await page.waitForTimeout(250);
    check('hide UI has recovery control',await page.locator('.restore-ui').isVisible());await page.locator('.restore-ui').click();
    await page.locator('[data-workspace="explain"]').click();await page.waitForFunction(()=>!FROXEL.busy);
    await page.locator('[data-stage="5"]').click();check('specular explanation channel',await page.evaluate(()=>FROXEL.state.debug===5));
    await page.locator('[data-stage="0"]').click();await page.locator('#matrix').click();await page.waitForFunction(()=>FROXEL.matrix?.active&&!FROXEL.busy,{},{timeout:60000});
    check('GPU froxel inspector opens',await page.evaluate(()=>FROXEL.matrix.info().population>0));
    await page.screenshot({path:path.join(artifacts,'explain.png')});await page.locator('#inside').click();
    await page.locator('[data-workspace="test"]').click();await page.locator('[data-test="opposing"]').click();
    check('controlled opposing-light test',await page.evaluate(()=>FROXEL.state.count===2&&FROXEL.state.test===2));
    await page.locator('[data-workspace="play"]').click();await page.evaluate(()=>{FROXEL.reset();FROXEL.state.scale=.5;FROXEL.resize();});
    await page.locator('#benchmark').click();check('benchmark opens on request',await page.locator('#receipts').isVisible());
    const before=await page.evaluate(()=>({state:structuredClone(FROXEL.state),position:FROXEL.camera.position.toArray()}));
    await page.locator('#receiptCurrent').click();await page.waitForFunction(()=>window.ReceiptUI.report?.complete,{},{timeout:180000});
    const report=await page.evaluate(()=>ReceiptUI.report);fs.writeFileSync(path.join(artifacts,'hardware-receipts.json'),JSON.stringify(report,null,2));
    check('current-view benchmark completes nine blocks',report.complete&&report.results.length===9);
    check('paired native GPU timestamp samples',report.results.every(r=>r.stats.total.n===60));
    const after=await page.evaluate(()=>({state:structuredClone(FROXEL.state),position:FROXEL.camera.position.toArray()}));
    check('benchmark restores count, mode, resolution and camera',before.state.count===after.state.count&&before.state.mode===after.state.mode&&before.state.scale===after.state.scale&&JSON.stringify(before.position)===JSON.stringify(after.position));
    for(const [id,ext] of [['receiptJSON','.json'],['receiptCSV','.csv']]){
      const download=page.waitForEvent('download');await page.locator('#'+id).click();const d=await download;await d.saveAs(path.join(artifacts,'export'+ext));check(ext+' export is nonempty',fs.statSync(path.join(artifacts,'export'+ext)).size>100);
    }
    await page.screenshot({path:path.join(artifacts,'benchmark.png')});
    await page.locator('#receiptSweep').click();await page.waitForFunction(()=>FROXELBench.running);await page.locator('#receiptCancel').click();await page.waitForFunction(()=>!FROXELBench.running,{},{timeout:60000});
    check('sweep cancellation restores interactive state',await page.evaluate(()=>!FROXEL.state.manual&&!FROXELBench.running));
    await page.locator('#receiptClose').click();
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{FROXEL.reset();FROXEL.state.scale=.5;FROXEL.resize();});await page.waitForTimeout(500);
    await page.screenshot({path:path.join(artifacts,'mobile.png')});
    check('mobile controls fit viewport',await page.locator('.dock').evaluate(el=>el.getBoundingClientRect().right<=innerWidth&&el.getBoundingClientRect().left>=0));
    await page.locator('#controls').click();await page.screenshot({path:path.join(artifacts,'mobile-controls.png')});
    check('mobile drawer scrolls within viewport',await page.locator('#drawer').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));
    await page.locator('#closeDrawer').click();
    await page.goto(target+(target.includes('?')?'&':'?')+'webgl');await page.waitForFunction(()=>window.FroxelUI,{},{timeout:90000});
    check('WebGL2 fallback initializes',await page.evaluate(()=>FROXEL.backend.api==='webgl2'&&FROXEL.backend.errors.length===0));
    await page.waitForTimeout(250);await page.screenshot({path:path.join(artifacts,'webgl.png')});
    check('no runtime or console errors',errors.length===0);
    fs.writeFileSync(path.join(artifacts,'smoke.json'),JSON.stringify({checks,errors,initial},null,2));
    console.log(`COMPLETE ${checks.length} checks passed`);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);console.error('Collected errors:',errors);process.exitCode=1;});
