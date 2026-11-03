import * as THREE from 'three';

const stonePalette = [0xb7aa94, 0x999485, 0xc3b49a, 0x8d928c, 0xa89b85];

function seeded(index) {
  const value = Math.sin(index * 91.173 + 17.31) * 43758.5453;
  return value - Math.floor(value);
}

function frustumGeometry(bottom, top, height, depthBottom = bottom, depthTop = top) {
  const y0 = -height / 2;
  const y1 = height / 2;
  const xb = bottom / 2, xt = top / 2, zb = depthBottom / 2, zt = depthTop / 2;
  const positions = new Float32Array([
    -xb,y0, zb, xb,y0, zb, xt,y1, zt, -xt,y1, zt,
     xb,y0,-zb,-xb,y0,-zb,-xt,y1,-zt, xt,y1,-zt,
    -xb,y0,-zb,-xb,y0, zb,-xt,y1, zt,-xt,y1,-zt,
     xb,y0, zb, xb,y0,-zb, xt,y1,-zt, xt,y1, zt,
    -xt,y1, zt, xt,y1, zt, xt,y1,-zt,-xt,y1,-zt,
    -xb,y0,-zb, xb,y0,-zb, xb,y0, zb,-xb,y0, zb,
  ]);
  const indices = [];
  for (let face = 0; face < 6; face++) {
    const i = face * 4;
    indices.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function assignComponent(object, component) {
  object.traverse((child) => {
    if (child.isMesh) child.userData.component = component;
  });
}

function createStoneCourses({ yStart, yEnd, widthStart, widthEnd, name, material, seedOffset = 0 }) {
  const group = new THREE.Group();
  group.name = name;
  const courseHeight = 0.43;
  const courses = Math.floor((yEnd - yStart) / courseHeight);
  const blocksPerSide = 8;
  const count = courses * blocksPerSide * 4;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0, 0.02);
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let index = 0;

  for (let course = 0; course < courses; course++) {
    const t = course / Math.max(1, courses - 1);
    const y = yStart + course * courseHeight + courseHeight / 2;
    const width = THREE.MathUtils.lerp(widthStart, widthEnd, t);
    const inset = width * 0.012;
    for (let face = 0; face < 4; face++) {
      for (let block = 0; block < blocksPerSide; block++) {
        const n = seedOffset + index;
        const blockWidth = width / blocksPerSide * (0.91 + seeded(n) * 0.12);
        const offset = (block - (blocksPerSide - 1) / 2) * (width / blocksPerSide);
        const stagger = course % 2 ? width / blocksPerSide / 2 : 0;
        const along = THREE.MathUtils.clamp(offset + stagger, -width * 0.44, width * 0.44);
        const depth = 0.19 + seeded(n + 2) * 0.13;
        dummy.position.set(0, y + (seeded(n + 3) - 0.5) * 0.035, 0);
        dummy.rotation.set((seeded(n + 4) - 0.5) * 0.03, (seeded(n + 5) - 0.5) * 0.025, (seeded(n + 6) - 0.5) * 0.025);
        if (face === 0) { dummy.position.x = along; dummy.position.z = width / 2 + inset; dummy.scale.set(blockWidth, courseHeight * 0.91, depth); }
        if (face === 1) { dummy.position.x = width / 2 + inset; dummy.position.z = -along; dummy.rotation.y += Math.PI / 2; dummy.scale.set(blockWidth, courseHeight * 0.91, depth); }
        if (face === 2) { dummy.position.x = -along; dummy.position.z = -width / 2 - inset; dummy.rotation.y += Math.PI; dummy.scale.set(blockWidth, courseHeight * 0.91, depth); }
        if (face === 3) { dummy.position.x = -width / 2 - inset; dummy.position.z = along; dummy.rotation.y -= Math.PI / 2; dummy.scale.set(blockWidth, courseHeight * 0.91, depth); }
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        color.setHex(stonePalette[Math.floor(seeded(n + 7) * stonePalette.length)]);
        color.multiplyScalar(0.88 + seeded(n + 8) * 0.20);
        mesh.setColorAt(index, color);
        index++;
      }
    }
  }
  mesh.count = index;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  group.add(mesh);
  return group;
}

function createOpening(width, height, material, trimMaterial) {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height * 0.16);
  shape.quadraticCurveTo(width / 2, height / 2, 0, height / 2);
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height * 0.16);
  shape.closePath();
  const inset = new THREE.Mesh(new THREE.ShapeGeometry(shape, 10), material);
  inset.position.z = 0.025;
  group.add(inset);
  const sideGeo = new THREE.BoxGeometry(0.16, height * 0.72, 0.13);
  const lintelGeo = new THREE.TorusGeometry(width / 2 + 0.03, 0.08, 5, 18, Math.PI);
  const left = new THREE.Mesh(sideGeo, trimMaterial);
  const right = left.clone();
  left.position.set(-width / 2 - 0.07, -height * 0.13, 0.07);
  right.position.set(width / 2 + 0.07, -height * 0.13, 0.07);
  const arch = new THREE.Mesh(lintelGeo, trimMaterial);
  arch.rotation.z = 0;
  arch.position.set(0, height * 0.14, 0.07);
  [left, right, arch].forEach((mesh) => { mesh.castShadow = true; group.add(mesh); });
  return group;
}

// Lightweight furnishings stay attached to their floor during every animation.
function furnishLevel(deck, y, level, materials) {
  const interior = new THREE.Group();
  interior.name = 'Условная обстановка уровня ' + (level + 1);
  interior.position.y = y + .11;
  deck.add(interior);
  const describe = (object, label, description) => {
    object.userData.exhibit = true;
    object.userData.label = label;
    object.userData.description = description + ' Предмет показан в условной художественной обстановке.';
    return object;
  };
  const groupRecent = (start, label, description) => {
    const group = new THREE.Group();
    const items = interior.children.slice(start);
    interior.add(group);
    items.forEach((item) => group.add(item));
    return describe(group, label, description);
  };
  const box = (w, h, d, x, cy, z, material = materials.furniture) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, cy, z);
    mesh.castShadow = mesh.receiveShadow = true;
    interior.add(mesh);
    return mesh;
  };
  const vessel = (x, z, scale = 1) => {
    const profile = [[.18,0],[.29,.08],[.36,.35],[.31,.57],[.16,.69],[.16,.79],[.20,.81]];
    const pot = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r,h]) => new THREE.Vector2(r,h)), 14), materials.clay);
    pot.position.set(x, 0, z); pot.scale.setScalar(scale);
    pot.castShadow = pot.receiveShadow = true;
    interior.add(pot);
    describe(pot, 'Глиняный кувшин', 'Сосуд с узким горлом и округлым туловом для хранения воды и припасов. Тёмная полость подчёркивает открытое горлышко.');
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.18, .035, 6, 14), materials.clay);
    rim.rotation.x = Math.PI / 2; rim.position.y = .80; pot.add(rim);
    const hollow = new THREE.Mesh(new THREE.CircleGeometry(.145, 14), materials.dark);
    hollow.rotation.x = -Math.PI / 2; hollow.position.y = .73; pot.add(hollow);
  };
  // Chest with lid, iron straps and latch.
  if (level === 0 || level === 2) {
    const chestStart = interior.children.length;
    box(1.35,.66,.72,-.9,.33,-1.25);
    box(1.43,.12,.79,-.9,.72,-1.25);
    for (const x of [-1.36,-.44]) box(.07,.7,.74,x,.35,-1.25,materials.iron);
    box(.12,.18,.05,-.9,.57,-.86,materials.iron);
    groupRecent(chestStart, 'Деревянный сундук', 'Ящик для хранения одежды и домашних вещей. Крышка, металлические полосы и защёлка выполнены отдельными деталями.');
    vessel(1.1, .75, 1.15); vessel(1.65,.2,.8);
  }
  // Low table and bench on the living and observation levels.
  if (level === 1 || level === 3) {
    const tableStart = interior.children.length;
    box(1.65,.12,.85,-.55,.93,-.65);
    for (const x of [-1.2,.1]) for (const z of [-.96,-.34]) box(.12,.87,.12,x,.435,z);
    groupRecent(tableStart, 'Низкий деревянный стол', 'Небольшой стол на четырёх ножках организует пространство для еды и повседневных занятий.');
    const benchStart = interior.children.length;
    box(1.7,.14,.43,-.55,.5,.55);
    for (const x of [-1.2,.1]) box(.13,.43,.32,x,.215,.55);
    groupRecent(benchStart, 'Деревянная скамья', 'Простая переносная скамья с узким сиденьем и двумя опорами.');
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(.22,12,6,0,Math.PI*2,Math.PI/2,Math.PI/2),materials.clay);
    bowl.position.set(-.55,1.2,-.65); interior.add(bowl); describe(bowl, 'Глиняная чаша', 'Небольшая открытая посуда для еды и домашних нужд.');
    vessel(-1.6,1.15,.85);
  }
  if (level === 0) {
    for (let i=0;i<2;i++) {
      const sack = new THREE.Mesh(new THREE.SphereGeometry(1,12,8),materials.fabric);
      sack.scale.set(.32,.46,.29); sack.position.set(-1.5+i*.65,.43,1.3);
      describe(sack, 'Мешок с припасами', 'Тканевый мешок иллюстрирует хранение сухих продуктов на нижнем уровне.');
      sack.castShadow = sack.receiveShadow = true; interior.add(sack);
      box(.12,.12,.12,-1.5+i*.65,.9,1.3,materials.fabric);
    }
  }
  if (level === 2) {
    const bedStart = interior.children.length;
    box(1.75,.06,1.05,-.6,.04,.7,materials.rug);
    box(.55,.16,.78,-1.15,.14,.7,materials.fabric);
    for (const z of [.22,1.18]) box(1.72,.015,.045,-.6,.08,z,materials.fabric);
    groupRecent(bedStart, 'Спальный настил', 'Тканевая подстилка с подушкой показывает место для отдыха на деревянном перекрытии.');
  }
  if (level === 0) {
    const mill = new THREE.Group();
    mill.position.set(.35,.18,1.25); interior.add(mill);
    for (let i=0;i<2;i++) {
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(.43,.46,.17,20),materials.trim);
      stone.position.y=i*.18; stone.castShadow=stone.receiveShadow=true; mill.add(stone);
    }
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.3,8),materials.furniture);
    handle.position.set(.28,.4,0); mill.add(handle);
    const eye = new THREE.Mesh(new THREE.CircleGeometry(.08,12),materials.dark);
    eye.rotation.x=-Math.PI/2; eye.position.y=.27; mill.add(eye);
    describe(mill, 'Ручные жернова', 'Два каменных диска служат для размола зерна. Верхний диск вращают за деревянную рукоять; зерно подают через центральное отверстие.');
  }
  if (level === 1) {
    const bucket = new THREE.Group(); bucket.position.set(1.4,0,1.25); interior.add(bucket);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.3,.23,.55,12,1,true),materials.furniture);
    body.position.y=.28; body.castShadow=true; bucket.add(body);
    for (const y of [.12,.46]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(.23+y*.12,.022,5,12),materials.iron);
      hoop.rotation.x=Math.PI/2; hoop.position.y=y; bucket.add(hoop);
    }
    const bail = new THREE.Mesh(new THREE.TorusGeometry(.29,.025,5,16,Math.PI),materials.iron);
    bail.position.y=.54; bucket.add(bail);
    describe(bucket, 'Деревянное ведро', 'Сосуд с металлическими обручами и дугообразной ручкой для переноски воды. Открытый верх позволяет увидеть внутренний объём.');
  }
  if (level < 3) {
    const ladder = new THREE.Group(); ladder.position.set(1.45,0,-1.0);
    ladder.rotation.x = -.12; interior.add(ladder);
    describe(ladder, 'Межэтажная лестница', 'Две деревянные стойки соединены поперечными ступенями. Лестница ведёт к люку следующего перекрытия.');
    const height = level === 2 ? 3.55 : 3.95;
    for (const x of [-.34,.34]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(.11,height,.12),materials.furniture);
      rail.position.set(x,height/2,0); rail.castShadow=true; ladder.add(rail);
    }
    for (let step=0;step<10;step++) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.72,8),materials.furniture);
      rung.rotation.z=Math.PI/2; rung.position.y=.25+step*(height-.45)/9; rung.castShadow=true; ladder.add(rung);
    }
  }
}

export function createTower() {
  const root = new THREE.Group();
  root.name = 'VainakhTower';
  const selectables = [];
  const shellMaterials = [];
  const materials = {
    core: new THREE.MeshStandardMaterial({ color: 0x625e54, roughness: 1, metalness: 0 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.97 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xb9aa8f, roughness: 0.94 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x050807, roughness: 1, side: THREE.DoubleSide }),
    wood: new THREE.MeshStandardMaterial({ color: 0x3a2d20, roughness: 0.92 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x747e80, roughness: 0.96 }),
    furniture: new THREE.MeshStandardMaterial({ color: 0xa0784e, roughness: .93 }),
    clay: new THREE.MeshStandardMaterial({ color: 0xb5714e, roughness: 1, side: THREE.DoubleSide }),
    fabric: new THREE.MeshStandardMaterial({ color: 0xb4a486, roughness: 1 }),
    rug: new THREE.MeshStandardMaterial({ color: 0x774d43, roughness: 1 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x353c3e, roughness: .75, metalness: .5 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xd5b96f, transparent: true, opacity: 0.55 }),
  };
  shellMaterials.push(materials.core, materials.stone, materials.trim, materials.roof);

  const components = {};
  const makeComponent = (key, label, description, stage, explode) => {
    const group = new THREE.Group();
    group.name = key;
    group.userData = { key, label, description, stage, explode, home: new THREE.Vector3() };
    components[key] = group;
    root.add(group);
    return group;
  };

  const base = makeComponent('base', 'Каменное основание', 'Массивное основание визуально связывает башню со скальным рельефом.', 1, new THREE.Vector3(0, -1.6, 0));
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 5.1, 1.35, 7), materials.core);
  plinth.position.y = 0.3; plinth.scale.z = 0.88; plinth.castShadow = plinth.receiveShadow = true; base.add(plinth);
  for (let i = 0; i < 3; i++) {
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(6.9 - i * .25, .22, 6.9 - i * .25), materials.trim);
    ledge.position.y = .92 + i * .19; ledge.rotation.y = i * .03; ledge.castShadow = true; base.add(ledge);
  }

  const lower = makeComponent('lower', 'Нижний объём', 'Слегка сужающиеся стены образуют устойчивый силуэт и защищённый нижний ярус.', 2, new THREE.Vector3(-6, 0, 0));
  const lowerCore = new THREE.Mesh(frustumGeometry(6.5, 5.25, 10.4), materials.core);
  lowerCore.position.y = 6.25; lowerCore.castShadow = lowerCore.receiveShadow = true; lower.add(lowerCore);
  lower.add(createStoneCourses({ yStart: 1.2, yEnd: 11.35, widthStart: 6.55, widthEnd: 5.27, name: 'Lower masonry', material: materials.stone }));

  const upper = makeComponent('upper', 'Верхний объём', 'Более узкий верхний ярус завершает вертикальную композицию башни.', 2, new THREE.Vector3(6, .8, 0));
  const upperCore = new THREE.Mesh(frustumGeometry(5.25, 4.5, 7.3), materials.core);
  upperCore.position.y = 15.1; upperCore.castShadow = upperCore.receiveShadow = true; upper.add(upperCore);
  upper.add(createStoneCourses({ yStart: 11.45, yEnd: 18.65, widthStart: 5.24, widthEnd: 4.51, name: 'Upper masonry', material: materials.stone, seedOffset: 1000 }));

  const openings = makeComponent('openings', 'Архитектурные проёмы', 'Узкие проёмы и вход создают ритм фасада. Их форма показана в стилизованном виде.', 2, new THREE.Vector3(0, 0, 5));
  const openingData = [
    { y: 3.5, w: 1.35, h: 2.75, face: 0 }, { y: 8.1, w: .72, h: 1.5, face: 0 }, { y: 13.1, w: .65, h: 1.35, face: 0 }, { y: 16.2, w: .62, h: 1.25, face: 0 },
    { y: 6.1, w: .58, h: 1.25, face: 1 }, { y: 10.2, w: .62, h: 1.3, face: 1 }, { y: 14.6, w: .58, h: 1.18, face: 1 },
    { y: 7.7, w: .55, h: 1.2, face: 2 }, { y: 12.3, w: .6, h: 1.28, face: 2 }, { y: 16.4, w: .55, h: 1.15, face: 2 },
    { y: 5.2, w: .58, h: 1.2, face: 3 }, { y: 9.4, w: .6, h: 1.3, face: 3 }, { y: 14.1, w: .56, h: 1.18, face: 3 },
  ];
  openingData.forEach((item) => {
    const widthAtY = THREE.MathUtils.lerp(6.5, 4.5, (item.y - 1.2) / 17.4);
    const opening = createOpening(item.w, item.h, materials.dark, materials.trim);
    opening.position.y = item.y;
    if (item.face === 0) opening.position.z = widthAtY / 2 + .17;
    if (item.face === 1) { opening.position.x = widthAtY / 2 + .17; opening.rotation.y = Math.PI / 2; }
    if (item.face === 2) { opening.position.z = -widthAtY / 2 - .17; opening.rotation.y = Math.PI; }
    if (item.face === 3) { opening.position.x = -widthAtY / 2 - .17; opening.rotation.y = -Math.PI / 2; }
    openings.add(opening);
  });

  const floors = makeComponent('floors', 'Внутренние перекрытия', 'Внутренние уровни показаны как условная визуализация для изучения конструкции.', 3, new THREE.Vector3(0, 0, -5));
  [4.8, 8.7, 12.6, 16.1].forEach((y, index) => {
    const width = THREE.MathUtils.lerp(5.65, 4.25, y / 19);
    const deck = new THREE.Group();
    deck.name = 'Настил ' + (index + 1);
    for (let plank = 0; plank < 9; plank++) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(width / 9 - .018, .22, index > 0 && plank >= 6 ? width - 1.15 : width), materials.wood);
      board.position.set((plank - 4) * width / 9, y, index > 0 && plank >= 6 ? .575 : 0);
      board.castShadow = board.receiveShadow = true;
      deck.add(board);
    }
    furnishLevel(deck, y, index, materials);
    floors.add(deck);
    for (let beam = -2; beam <= 2; beam++) {
      const timber = new THREE.Mesh(new THREE.BoxGeometry(width + .35, .12, .13), materials.wood);
      timber.position.set(0, y - .21, beam * width / 5); timber.castShadow = true; floors.add(timber);
    }
  });
  const interiorColumn = new THREE.Mesh(new THREE.CylinderGeometry(.18, .24, 15, 8), materials.wood);
  interiorColumn.position.y = 8.7; floors.add(interiorColumn);

  const crown = makeComponent('crown', 'Верхние выступы', 'Выступающие каменные элементы формируют выразительный венец башни.', 4, new THREE.Vector3(-3.2, 2.5, 0));
  const crownBand = new THREE.Mesh(new THREE.BoxGeometry(4.85, .42, 4.85), materials.trim);
  crownBand.position.y = 18.95; crownBand.castShadow = true; crown.add(crownBand);
  const corbelGeo = new THREE.BoxGeometry(.48, .62, .78);
  const corbels = new THREE.InstancedMesh(corbelGeo, materials.trim, 20);
  const dummy = new THREE.Object3D(); let ci = 0;
  for (let face = 0; face < 4; face++) for (let i = 0; i < 5; i++) {
    const p = -1.85 + i * .925;
    dummy.position.set(0, 19.18, 0); dummy.rotation.set(0, 0, 0);
    if (face === 0) { dummy.position.x = p; dummy.position.z = 2.47; }
    if (face === 1) { dummy.position.x = 2.47; dummy.position.z = -p; dummy.rotation.y = Math.PI / 2; }
    if (face === 2) { dummy.position.x = -p; dummy.position.z = -2.47; dummy.rotation.y = Math.PI; }
    if (face === 3) { dummy.position.x = -2.47; dummy.position.z = p; dummy.rotation.y = -Math.PI / 2; }
    dummy.updateMatrix(); corbels.setMatrixAt(ci++, dummy.matrix);
  }
  corbels.castShadow = true; crown.add(corbels);

  const roof = makeComponent('roof', 'Ступенчатое завершение', 'Ступенчатое пирамидальное завершение усиливает вертикаль силуэта.', 4, new THREE.Vector3(3.2, 2.5, 0));
  for (let level = 0; level < 6; level++) {
    const size = 4.7 - level * .7;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(size, .5, size), materials.roof);
    slab.position.y = 19.55 + level * .47; slab.rotation.y = level % 2 ? .018 : -.018; slab.castShadow = slab.receiveShadow = true; roof.add(slab);
  }
  const cap = new THREE.Mesh(new THREE.OctahedronGeometry(.34, 0), materials.trim);
  cap.position.y = 22.45; cap.scale.y = 1.7; cap.castShadow = true; roof.add(cap);

  const aura = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.7, .03, 64), materials.glow);
  aura.position.y = 1.08; aura.userData.ignoreRaycast = true; base.add(aura);

  // Reuse the assembled geometry; each educational part gets its own exploded offset.
  const detach = (key, label, description, stage, offset, objects) => {
    const part = makeComponent(key, label, description, stage, offset);
    objects.forEach((object) => part.add(object));
    return part;
  };
  const floorParts = [...floors.children];
  floors.userData.label = 'Нижний уровень · припасы';
  floors.userData.description = 'Сундук, сосуды и мешки размещены на деревянном настиле. Лестница ведёт к следующему уровню. Обстановка — художественная интерпретация, не историческая реконструкция.';
  floors.userData.explode.set(0, .6, 6);
  for (let level = 0; level < 4; level++) {
    const deck = floorParts[level * 6];
    if (level > 0) detach('deck' + level, ['', 'Жилой уровень · стол и скамья', 'Уровень отдыха · настил и сундук', 'Верхний уровень · наблюдение'][level],
      'Мебель, глиняная посуда и деревянный настил помогают представить масштаб внутреннего пространства. Люк оставляет место для подъёма. Обстановка показана условно.',
      3, new THREE.Vector3(0, .6 + level * .35, 6), [deck]);
    detach('beams' + level, 'Балки уровня ' + (level + 1),
      'Пять поперечных деревянных балок показаны отдельно от настила, чтобы объяснить опору площадки. Схема условная.',
      3, new THREE.Vector3(0, -.45, 6), floorParts.slice(level * 6 + 1, level * 6 + 6));
  }
  detach('support', 'Центральная опора', 'Вертикальная деревянная опора связывает внутренние уровни цифровой модели. Она не является утверждением об устройстве конкретной исторической башни.',
    3, new THREE.Vector3(3, 0, 5), [interiorColumn]);
  const roofParts = [...roof.children];
  roof.userData.label = 'Нижняя плита покрытия';
  roof.userData.description = 'Нижняя ступень служит основанием пирамидального завершения. В разборе каждая ступень показана отдельно.';
  for (let level = 1; level < 6; level++) {
    detach('roofStep' + level, 'Ступень покрытия ' + (level + 1),
      'Последовательное уменьшение каменных ступеней создаёт пирамидальный силуэт завершения.',
      4, new THREE.Vector3(3.2 + level * .4, 2.5 + level * .55, 0), [roofParts[level]]);
  }
  detach('finial', 'Верхушка покрытия', 'Завершающий каменный элемент подчёркивает вертикальную ось стилизованной башни.',
    4, new THREE.Vector3(5.6, 6, 0), [cap]);
  detach('corbels', 'Каменные консоли', 'Выступающие камни вынесены отдельно от опоясывающей плиты. Так видны их ритм и расположение по четырём сторонам.',
    4, new THREE.Vector3(-3.2, 3.8, 0), [corbels]);
  crown.userData.label = 'Опоясывающая плита';
  crown.userData.description = 'Горизонтальная плита отделяет стены от ступенчатого завершения. Консоли показаны самостоятельной группой.';
  detach('entrance', 'Входная арка', 'Арочный вход с каменным обрамлением отделён от остальных проёмов для рассмотрения его формы.',
    2, new THREE.Vector3(-3, 0, 7), [openings.children[0]]);

  Object.values(components).forEach((component) => {
    assignComponent(component, component);
    component.traverse((child) => { if (child.isMesh && !child.userData.ignoreRaycast) selectables.push(child); });
  });

  // Furniture inherits its floor transform, but has an independent picking card.
  const exhibits = [];
  root.traverse((object) => { if (object.userData.exhibit) exhibits.push(object); });
  exhibits.forEach((object) => assignComponent(object, object));
  root.scale.set(0.88, 1.08, 0.88);
  return { root, components, selectables, shellMaterials, materials };
}

export function createLandscape() {
  const group = new THREE.Group();
  const groundGeometry = new THREE.PlaneGeometry(90, 90, 70, 70);
  const position = groundGeometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i);
    const d = Math.sqrt(x * x + y * y);
    const noise = Math.sin(x * .31) * Math.cos(y * .27) * .48 + Math.sin((x + y) * .13) * .7;
    position.setZ(i, (d < 8 ? noise * .08 : noise * (0.32 + d / 100)) - .38);
  }
  groundGeometry.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeometry, new THREE.MeshStandardMaterial({ color: 0x444c43, roughness: 1, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; group.add(ground);

  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x26322b, roughness: 1, flatShading: true });
  for (let ring = 0; ring < 3; ring++) {
    const points = [];
    const radius = 25 + ring * 10;
    for (let i = 0; i <= 48; i++) {
      const angle = i / 48 * Math.PI * 2;
      const variation = 1 + Math.sin(angle * (5 + ring) + ring) * .16 + Math.sin(angle * 11.3) * .08;
      points.push(new THREE.Vector3(Math.cos(angle) * radius * variation, -1.2, Math.sin(angle) * radius * variation));
      points.push(new THREE.Vector3(Math.cos(angle) * radius * .84 * variation, 4 + ring * 2.8 + Math.sin(angle * 7) * 2.2, Math.sin(angle) * radius * .84 * variation));
    }
    const vertices = [], indices = [];
    points.forEach((p) => vertices.push(p.x, p.y, p.z));
    for (let i = 0; i < 48; i++) { const a = i * 2; indices.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const layerMaterial = rockMaterial.clone();
    layerMaterial.color.setHex([0x42535b, 0x516975, 0x66818d][ring]);
    const mountain = new THREE.Mesh(geometry, layerMaterial); mountain.scale.y = 0.42; mountain.receiveShadow = true; group.add(mountain);
  }
  return group;
}
