import { test, expect } from '@playwright/test';

const sizes = [[360,780],[390,844],[768,1024],[1024,768],[1440,900],[844,390]];
async function noOverlap(page, selectors) {
  const problems = await page.evaluate((selectors) => {
    const nodes = selectors.map(s => [s, document.querySelector(s)]).filter(([,el]) => el);
    const visible = nodes.filter(([,el]) => {
      const s = getComputedStyle(el);
      return s.visibility !== 'hidden' && Number(s.opacity) > .9;
    });
    const result = [];
    for (let i=0;i<visible.length;i++) {
      const [name,el] = visible[i], a = el.getBoundingClientRect();
      if(a.left < -2 || a.right > innerWidth+2 || a.top < -2 || a.bottom > innerHeight+2) result.push(name+' outside viewport');
      for(let j=i+1;j<visible.length;j++) {
        const [other,node] = visible[j], b = node.getBoundingClientRect();
        if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>2 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2) result.push(name+' overlaps '+other);
      }
    }
    return result;
  },selectors);
  expect(problems).toEqual([]);
}
for (const [width,height] of sizes) {
  test('layout and controls '+width+'x'+height, async ({page}) => {
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    page.on('console', e=> { if(e.type()==='error' && /WebGL|shader|THREE/.test(e.text())) errors.push(e.text()); });
    await page.setViewportSize({width,height});
    await page.goto('/');
    await expect(page.locator('.loader')).toBeHidden({timeout:15000});
    await page.waitForTimeout(900);
    await noOverlap(page,['.topbar','.overline','h1','.hero-copy','.primary-button','.scene-footer']);
    await page.screenshot({path:'test-results/hero-'+width+'.png'});
    await page.locator('#explore').click();
    await page.waitForTimeout(1800);
    for(const mode of ['explode','build','xray']) {
      await page.locator('[data-mode="'+mode+'"]').click();
      await page.waitForTimeout(1700);
      await noOverlap(page,['.mode-panel','#revive','#build-panel','#xray-panel','.topbar','.scene-footer']);
    }
    await page.evaluate(()=>window.__TOWER_API__.selectComponent('deck1'));
    await page.waitForTimeout(600);
    await noOverlap(page,['.mode-panel','#revive','#detail-card','#xray-panel','.topbar','.scene-footer']);
    await page.screenshot({path:'test-results/interior-'+width+'.png'});
    await page.locator('#info-open').click();
    await page.waitForTimeout(800);
    await expect(page.locator('#info-sheet')).toBeInViewport({ratio:.95});
    const overflow = await page.locator('#info-sheet').evaluate(el=>el.scrollWidth-el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({path:'test-results/info-'+width+'.png'});
    await page.locator('#info-close').click();
    await expect(page.locator('#info-sheet')).toBeHidden();
    await page.locator('.brand').click();
    await expect(page.locator('.hero')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
