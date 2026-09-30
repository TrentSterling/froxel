const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const path=require('node:path');const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({headless:true,channel:'chrome',args:['--ignore-gpu-blocklist','--enable-unsafe-webgpu','--use-angle=d3d11']});
 try{
  const p=await b.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await p.goto(pathToFileURL(path.join(root,'index.html')).href);await p.waitForFunction(()=>window.FroxelUI);
  await p.evaluate(()=>{FROXEL.state.paused=true;FROXEL.state.time=16;FROXEL.state.clean=true;});
  await p.waitForTimeout(500);
  await p.addStyleTag({content:'.restore-ui{display:none!important}'});
  await p.evaluate(()=>{
   const el=document.createElement('div');el.style.cssText='position:fixed;inset:0;z-index:10;pointer-events:none;font-family:Segoe UI,sans-serif;color:#eef4f2;background:linear-gradient(180deg,rgba(8,16,17,.7),transparent 45%,transparent 75%,rgba(8,16,17,.85))';
   el.innerHTML='<div style="position:absolute;left:42px;top:24px"><div style="font-size:76px;letter-spacing:-4px;font-weight:750;line-height:1.1">FROXEL<span style="font-size:17px;letter-spacing:1px;color:#b9efd1;margin-left:15px">V5</span></div><div style="font-size:23px;font-weight:400;letter-spacing:-.3px;margin-top:8px">Lighting, exposed.</div></div><div style="position:absolute;left:44px;bottom:28px;font-size:16px;font-weight:550">500 point lights · Three scenes · Real GPU benchmarks</div><div style="position:absolute;right:40px;bottom:27px;font-size:17px;color:#b9efd1">tront.xyz/froxel</div>';
   document.body.append(el);
  });
  await p.screenshot({path:path.join(root,'og-image.png')});console.log('Captured 1200 x 630 og-image.png from running WebGPU demo');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
