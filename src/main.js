import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { createLandscape, createTower } from './Tower.js';
import './styles.css';

const canvas = document.querySelector('#scene');
const automatedBrowser = navigator.webdriver === true;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07100d);
scene.fog = new THREE.FogExp2(0x0b1712, 0.018);

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 140);
camera.position.set(18, 12, 26);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: !automatedBrowser, powerPreference: 'high-performance', alpha: false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(automatedBrowser ? 1 : Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = !automatedBrowser;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 9;
controls.maxDistance = 48;
controls.minPolarAngle = Math.PI * 0.18;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 9.4, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.27;
controls.enablePan = false;

scene.add(new THREE.HemisphereLight(0x9ab5a7, 0x11150f, 1.15));
const keyLight = new THREE.DirectionalLight(0xffdfaa, 3.5);
keyLight.position.set(-13, 24, 15);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(automatedBrowser ? 512 : 2048, automatedBrowser ? 512 : 2048);
keyLight.shadow.camera.left = -18; keyLight.shadow.camera.right = 18;
keyLight.shadow.camera.top = 28; keyLight.shadow.camera.bottom = -8;
keyLight.shadow.camera.near = 3; keyLight.shadow.camera.far = 70;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x6f9c83, 2.3);
rimLight.position.set(13, 14, -18); scene.add(rimLight);
const warmLight = new THREE.PointLight(0xd5a45d, 22, 20, 2);
warmLight.position.set(2, 5, 7); scene.add(warmLight);

scene.add(createLandscape());
const tower = createTower();
tower.root.position.y = 0.05;
scene.add(tower.root);

function createAtmosphere() {
  const starCount = 600;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const radius = 45 + Math.random() * 50;
    const angle = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 8 + Math.random() * 50;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xc9d4ca, size: .07, transparent: true, opacity: .45, depthWrite: false }));
  scene.add(stars);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.1, 32, 32), new THREE.MeshBasicMaterial({ color: 0xd9d9c6 }));
  moon.position.set(-36, 31, -50); scene.add(moon);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(3.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0x9eb5a4, transparent: true, opacity: .07, side: THREE.BackSide }));
  moon.add(halo);
  return stars;
}
const stars = createAtmosphere();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let selected = null;
let selectionBox = null;
let currentMode = 'explore';
let isCinematic = false;
let cinematicTimeline = null;
let userInteracted = false;

const views = {
  front: { position: [0, 11.4, 38], target: [0, 10.8, 0] },
  high: { position: [17, 24, 19], target: [0, 10, 0] },
  detail: { position: [8.5, 15.5, 11], target: [0, 14, 0] },
  hero: { position: [18, 12, 26], target: [0, 9.4, 0] },
};

function moveCamera(name, duration = 1.6) {
  const view = views[name];
  if (!view) return;
  gsap.to(camera.position, { x: view.position[0], y: view.position[1], z: view.position[2], duration, ease: 'power3.inOut' });
  gsap.to(controls.target, { x: view.target[0], y: view.target[1], z: view.target[2], duration, ease: 'power3.inOut' });
}

function setComponentPositions(exploded, duration = 1.2) {
  Object.values(tower.components).forEach((component, index) => {
    const target = exploded ? component.userData.explode : component.userData.home;
    gsap.to(component.position, { x: target.x, y: target.y, z: target.z, duration, delay: index * .045, ease: 'power3.inOut' });
  });
}

function setXray(active, opacity = .38) {
  tower.shellMaterials.forEach((material) => {
    material.transparent = active;
    material.opacity = active ? opacity : 1;
    material.depthWrite = !active;
    material.needsUpdate = true;
  });
  tower.components.floors.visible = true;
}

function showStage(stage) {
  setComponentPositions(false, .6);
  Object.values(tower.components).forEach((component) => {
    const visible = component.userData.stage <= stage;
    if (visible) {
      component.visible = true;
      gsap.fromTo(component.scale, { x: .82, y: .82, z: .82 }, { x: 1, y: 1, z: 1, duration: .65, ease: 'back.out(1.35)' });
    } else {
      component.visible = false;
    }
  });
  document.querySelectorAll('[data-stage]').forEach((button) => button.classList.toggle('active', Number(button.dataset.stage) === stage));
}

function resetComponents() {
  Object.values(tower.components).forEach((component) => { component.visible = true; component.scale.setScalar(1); });
  setXray(false);
  setComponentPositions(false, .9);
}

function showDetail(component) {
  if (!component) return;
  selected = component;
  if (selectionBox) scene.remove(selectionBox);
  selectionBox = new THREE.BoxHelper(component, 0xc6a968);
  selectionBox.material.transparent = true;
  selectionBox.material.opacity = .72;
  selectionBox.userData.ignoreRaycast = true;
  scene.add(selectionBox);
  const entries = Object.values(tower.components);
  const index = entries.indexOf(component) + 1;
  document.querySelector('.detail-number').textContent = String(index).padStart(2, '0');
  document.querySelector('.detail-title').textContent = component.userData.label;
  document.querySelector('.detail-text').textContent = component.userData.description;
  gsap.to('#detail-card', { autoAlpha: 1, x: 0, duration: .45, ease: 'power2.out' });
  document.querySelector('#detail-card').classList.add('visible');
}

function closeDetail() {
  if (selectionBox) { scene.remove(selectionBox); selectionBox.geometry.dispose(); selectionBox.material.dispose(); selectionBox = null; }
  selected = null;
  document.querySelector('#detail-card').classList.remove('visible');
  gsap.to('#detail-card', { autoAlpha: 0, x: 20, duration: .3 });
}

function switchMode(mode) {
  if (isCinematic) return;
  currentMode = mode;
  resetComponents();
  closeDetail();
  document.querySelectorAll('.mode').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  document.querySelector('#build-panel').classList.toggle('visible', mode === 'build');
  document.querySelector('#xray-panel').classList.toggle('visible', mode === 'xray');
  gsap.to('#build-panel', { autoAlpha: mode === 'build' ? 1 : 0, y: mode === 'build' ? 0 : 15, duration: .35 });
  gsap.to('#xray-panel', { autoAlpha: mode === 'xray' ? 1 : 0, y: mode === 'xray' ? 0 : 15, duration: .35 });
  if (mode === 'explode') setComponentPositions(true, 1.35);
  if (mode === 'build') showStage(5);
  if (mode === 'xray') setXray(true, Number(document.querySelector('#opacity').value) / 100);
}

function enterExperience() {
  document.body.classList.add('exploring');
  document.querySelector('#workspace').classList.add('active');
  controls.autoRotate = false;
  const timeline = gsap.timeline();
  timeline.to('.hero', { autoAlpha: 0, x: -35, duration: .7, ease: 'power2.in' })
    .to('.object-card,.hint', { autoAlpha: 0, duration: .35 }, '<')
    .to('#workspace', { autoAlpha: 1, duration: .6 }, '-=.2');
  moveCamera('front', 1.7);
}

function exitCinematic(finish = true) {
  if (cinematicTimeline) cinematicTimeline.kill();
  isCinematic = false;
  document.body.classList.remove('cinematic');
  document.querySelector('#skip').classList.remove('visible');
  gsap.to('#skip,#cinematic-title', { autoAlpha: 0, duration: .3, onComplete: () => { document.querySelector('#cinematic-title').style.visibility = 'hidden'; } });
  controls.enabled = true;
  resetComponents();
  if (finish) moveCamera('hero', 1.3);
}

function playCinematic() {
  if (isCinematic) return;
  isCinematic = true;
  closeDetail();
  resetComponents();
  controls.enabled = false;
  document.body.classList.add('cinematic');
  document.querySelector('#skip').classList.add('visible');
  gsap.to('#skip', { autoAlpha: 1, duration: .4, delay: .5 });
  const parts = Object.values(tower.components);
  cinematicTimeline = gsap.timeline({ onComplete: () => exitCinematic(false) });
  cinematicTimeline
    .to(camera.position, { x: 23, y: 17, z: 33, duration: 1.6, ease: 'power3.inOut' }, 0)
    .to(controls.target, { x: 0, y: 10, z: 0, duration: 1.6, ease: 'power3.inOut' }, 0)
    .to(parts.map((part) => part.position), { x: (i) => parts[i].userData.explode.x * 1.35, y: (i) => parts[i].userData.explode.y * 1.15, z: (i) => parts[i].userData.explode.z * 1.35, duration: 1.7, stagger: .07, ease: 'power3.inOut' }, .45)
    .to(tower.root.rotation, { y: Math.PI * .72, duration: 2, ease: 'sine.inOut' }, .25)
    .to(parts.map((part) => part.position), { x: 0, y: 0, z: 0, duration: 1.75, stagger: { each: .08, from: 'end' }, ease: 'back.inOut(1.25)' }, 2.7)
    .to(camera.position, { x: -18, y: 13, z: 24, duration: 2.4, ease: 'power2.inOut' }, 3.7)
    .to(tower.root.rotation, { y: Math.PI * 2, duration: 3.2, ease: 'sine.inOut' }, 3.5)
    .set('#cinematic-title', { visibility: 'visible' }, 5.2)
    .to('#cinematic-title', { autoAlpha: 1, duration: 1 }, 5.2)
    .fromTo('#cinematic-title strong', { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out' }, 5.35)
    .to('#cinematic-title', { autoAlpha: 0, duration: .8 }, 7.1)
    .to(camera.position, { x: 18, y: 12, z: 26, duration: 1.2, ease: 'power2.inOut' }, 7.0)
    .to(controls.target, { x: 0, y: 9.4, z: 0, duration: 1.2 }, 7.0);
}

function pick(event) {
  if (isCinematic || !document.body.classList.contains('exploring')) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(tower.selectables, false).find((item) => item.object.visible);
  if (hit?.object.userData.component) showDetail(hit.object.userData.component);
}

canvas.addEventListener('pointerdown', () => { userInteracted = false; });
canvas.addEventListener('pointermove', (event) => { if (event.buttons) userInteracted = true; });
canvas.addEventListener('pointerup', (event) => { if (!userInteracted) pick(event); });
controls.addEventListener('start', () => { controls.autoRotate = false; });
document.querySelector('#explore').addEventListener('click', enterExperience);
document.querySelectorAll('.mode').forEach((button) => button.addEventListener('click', () => switchMode(button.dataset.mode)));
document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => moveCamera(button.dataset.view)));
document.querySelectorAll('[data-stage]').forEach((button) => button.addEventListener('click', () => showStage(Number(button.dataset.stage))));
document.querySelector('#opacity').addEventListener('input', (event) => { const value = Number(event.target.value); document.querySelector('#xray-panel output').textContent = `${value}%`; setXray(true, value / 100); });
document.querySelector('.detail-close').addEventListener('click', closeDetail);
document.querySelector('#revive').addEventListener('click', playCinematic);
document.querySelector('#skip').addEventListener('click', () => exitCinematic(true));

const sheet = document.querySelector('#info-sheet');
function openSheet(anchor) {
  sheet.style.visibility = 'visible';
  gsap.to(sheet, { xPercent: 0, duration: .65, ease: 'power3.inOut', onComplete: () => { if (anchor) document.querySelector(`#${anchor}`)?.scrollIntoView({ behavior: 'smooth' }); } });
}
function closeSheet() { gsap.to(sheet, { xPercent: 102, duration: .55, ease: 'power3.inOut', onComplete: () => { sheet.style.visibility = 'hidden'; } }); }
document.querySelector('#info-open').addEventListener('click', () => openSheet('about'));
document.querySelector('#info-close').addEventListener('click', closeSheet);
const menuButton = document.querySelector('.menu-button');
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') === 'true'; menuButton.setAttribute('aria-expanded', String(!open)); document.querySelector('#museum-menu').classList.toggle('open', !open); });
document.querySelectorAll('[data-scroll]').forEach((button) => button.addEventListener('click', () => { document.querySelector('#museum-menu').classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); openSheet(button.dataset.scroll); }));
addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeDetail(); closeSheet(); if (isCinematic) exitCinematic(true); } });

let frameCount = 0;
let sampleStart = performance.now();
let qualityReduced = false;
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  controls.update();
  stars.rotation.y = elapsed * .006;
  warmLight.intensity = 20 + Math.sin(elapsed * .8) * 2.5;
  if (selectionBox && selected) selectionBox.update();
  renderer.render(scene, camera);
  frameCount++;
  if (frameCount === 180) {
    const fps = 180 / ((performance.now() - sampleStart) / 1000);
    if (fps < 44 && !qualityReduced) {
      qualityReduced = true;
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.15));
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.map?.dispose(); keyLight.shadow.map = null;
      document.querySelector('.quality b').textContent = 'адаптивное';
    }
  }
}

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, qualityReduced ? 1.15 : 1.75));
}
addEventListener('resize', resize);

function finishLoading() {
  const progress = { value: 0 };
  gsap.to(progress, { value: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => {
    const value = Math.round(progress.value);
    document.querySelector('.loader-value').textContent = `${value}%`;
    document.querySelector('.loader-track i').style.width = `${value}%`;
  }, onComplete: () => {
    gsap.to('.loader', { autoAlpha: 0, duration: .8, ease: 'power2.inOut', onComplete: () => document.querySelector('.loader').remove() });
    gsap.from('.hero>*', { y: 18, opacity: 0, stagger: .11, duration: .8, delay: .2, ease: 'power3.out' });
  } });
}

animate();
finishLoading();

window.__APP_READY__ = true;
window.__TOWER_API__ = { switchMode, showStage, playCinematic, exitCinematic, moveCamera };

addEventListener('beforeunload', () => {
  renderer.dispose();
  scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    mats.filter(Boolean).forEach((material) => material.dispose());
  });
});
