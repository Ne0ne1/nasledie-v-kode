import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createTower } from '../src/Tower.js';

class NodeFileReader {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
  async readAsDataURL(blob) {
    const buffer = Buffer.from(await blob.arrayBuffer());
    this.result = `data:${blob.type};base64,${buffer.toString('base64')}`;
    this.onloadend?.();
  }
}
globalThis.FileReader ??= NodeFileReader;

const outputDir = path.resolve('exports');
await fs.mkdir(outputDir, { recursive: true });

const { root } = createTower();
root.name = 'NasledieVKode_StylizedVainakhTower';
root.userData = {
  title: 'Наследие в коде',
  description: 'Стилизованная архитектурная модель вайнахской башни',
  generator: 'Three.js procedural geometry',
};
root.traverse((object) => {
  if (object.userData?.component) delete object.userData.component;
});

const exportScene = new THREE.Scene();
exportScene.name = 'CompetitionModel';
exportScene.add(root);
const exporter = new GLTFExporter();
const arrayBuffer = await exporter.parseAsync(exportScene, {
  binary: true,
  trs: true,
  onlyVisible: false,
  includeCustomExtensions: true,
});

const glbPath = path.join(outputDir, 'nasledie-v-kode-tower.glb');
const buffer = Buffer.from(arrayBuffer);
await fs.writeFile(glbPath, buffer);

const magic = buffer.toString('utf8', 0, 4);
const version = buffer.readUInt32LE(4);
const declaredLength = buffer.readUInt32LE(8);
const jsonLength = buffer.readUInt32LE(12);
const jsonType = buffer.toString('utf8', 16, 20);
if (magic !== 'glTF' || version !== 2 || declaredLength !== buffer.length || jsonType !== 'JSON') {
  throw new Error('GLB validation failed: invalid header or JSON chunk');
}
const json = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength).trim());
const manifest = {
  file: path.basename(glbPath),
  bytes: buffer.length,
  glbVersion: version,
  scenes: json.scenes?.length ?? 0,
  nodes: json.nodes?.length ?? 0,
  meshes: json.meshes?.length ?? 0,
  materials: json.materials?.length ?? 0,
  accessors: json.accessors?.length ?? 0,
  extensionsUsed: json.extensionsUsed ?? [],
  note: 'Standard glTF PBR materials; browser lighting and fog are not embedded.',
};
if (!manifest.meshes || !manifest.materials || !manifest.nodes) throw new Error('GLB validation failed: model content is empty');
await fs.writeFile(path.join(outputDir, 'nasledie-v-kode-tower.manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`GLB exported and validated: ${glbPath} (${manifest.meshes} meshes, ${manifest.materials} materials)`);
