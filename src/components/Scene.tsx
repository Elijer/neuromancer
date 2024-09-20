'use client'

import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, Html, shaderMaterial, Line } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { Bloom, DepthOfField, EffectComposer, Noise, Vignette, Pixelation} from '@react-three/postprocessing'
// import { PixelShader } from './PixelShader' // Import your pixelation shader

function rs(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
  }
  return result;
}

// const leftCheek = new THREE.Vector3(-0.039458695095002924, -0.10709741010463492, 0.3406214929063679)
const leftCheek = new THREE.Vector3(-0.13387806699892646, 0.014327565317412194, 0.20939167882526202)
const left = new THREE.Vector3(-0.22751814121389952, -0.12368236302753433, -0.1006747466060659)
const right = new THREE.Vector3(-0.12052034749763463, -0.15626142092286543, 0.05779202555795464)
const middle = new THREE.Vector3(-0.2530505438841223, -0.09404771745442653, -0.03146541427720597)
const j = new THREE.Vector3(-0.14238047758174494, -0.033618556977726755, 0.24307151883098613)

const I1mtrw = new THREE.Vector3(-0.008799414719261045, -0.036326783454822875, 0.18751678631826557)
const iJURO1 = new THREE.Vector3(-0.20674355764810753, 0.10657629996936646, 0.12533683596361272)
const umC4IJ = new THREE.Vector3(-0.2642604125663619, 0.1082316560420562, 0.06175445377430765)
const Xkc3Ms = new THREE.Vector3(-0.2667550539249058, 0.07220476253570385, 0.04697470878310967)
const SwKbbU = new THREE.Vector3(-0.28933962714712425, 0.07095806440333097, 0.014082186993880579)
const r77Elb = new THREE.Vector3(-0.28592057164332435, 0.08183808387915192, -0.01756040616886327)
const joa4T = new THREE.Vector3(-0.283803042915634, 0.08254346497747989, -0.03644796053712594)
const qNn8pX = new THREE.Vector3(-0.2801137315605013, 0.07328967495797079, -0.04114980214107232)
const NtHN3n = new THREE.Vector3(-0.2699902776463776, 0.046776921170830654, -0.04587745033628626)
const qRVTqW = new THREE.Vector3(-0.25960274090758234, 0.025443580014920197, -0.05940135592048283)
const O77j2 = new THREE.Vector3(-0.2544097384623837, 0.014570118344008787, -0.06618042311032102)
const xqilsN = new THREE.Vector3(-0.2536448770038223, -0.007749338141212814, -0.07101806817413304)

const vectorArray = [
  new THREE.Vector3(-0.008799414719261045, -0.036326783454822875, 0.18751678631826557),
  new THREE.Vector3(-0.20674355764810753, 0.10657629996936646, 0.12533683596361272),
  new THREE.Vector3(-0.2642604125663619, 0.1082316560420562, 0.06175445377430765),
  new THREE.Vector3(-0.2667550539249058, 0.07220476253570385, 0.04697470878310967),
  new THREE.Vector3(-0.28933962714712425, 0.07095806440333097, 0.014082186993880579),
  new THREE.Vector3(-0.28592057164332435, 0.08183808387915192, -0.01756040616886327),
  new THREE.Vector3(-0.283803042915634, 0.08254346497747989, -0.03644796053712594),
  new THREE.Vector3(-0.2801137315605013, 0.07328967495797079, -0.04114980214107232),
  new THREE.Vector3(-0.2699902776463776, 0.046776921170830654, -0.04587745033628626),
  new THREE.Vector3(-0.25960274090758234, 0.025443580014920197, -0.05940135592048283),
  new THREE.Vector3(-0.2544097384623837, 0.014570118344008787, -0.06618042311032102),
  new THREE.Vector3(-0.2536448770038223, -0.007749338141212814, -0.07101806817413304)
];

interface LineToHeadProps {
  headRef: React.RefObject<THREE.Object3D>;
  clickedPoint: THREE.Vector3 | null;
  distance: number;
}

const LineToHead: React.FC<LineToHeadProps> = ({ headRef, clickedPoint, distance }) => {
  const lineRef = useRef<THREE.Line>(null);

  useFrame(() => {
    if (lineRef.current && headRef.current && clickedPoint) {
      const vertexPosition = clickedPoint.clone();
      vertexPosition.applyMatrix4(headRef.current.matrixWorld);
      const direction = vertexPosition.clone().normalize(); // Normalize the direction
      const fixedPoint = vertexPosition.clone().add(direction.multiplyScalar(distance)); // Calculate the fixed point
      lineRef.current.geometry.setFromPoints([vertexPosition, fixedPoint]); // Use the fixed point
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color="white" />
    </line>
  );
};

interface HeadProps {
  headRef: React.RefObject<THREE.Object3D>;
  position?: [number, number, number];
  rotationSpeed?: number,
  rotation?: number,
}

const COMMON_POSITION: HeadProps["position"] = [0, 0, 0]

function Head({
  position = [0, 0, 0],
  rotationSpeed = .2,
  rotation = 3,
  headRef
}: HeadProps) {

  const gltf = useLoader(GLTFLoader, 'elijah2.glb')
  const { camera } = useThree();
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2();
  const blackHeadRef = useRef<THREE.Object3D>()

  const handleClick = (event: { clientX: number; clientY: number }) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    // mouse.y = (event.clientY / window.innerHeight) * 2 - 1 // unflipped axis
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1; // Flip the y-axis
    raycaster.setFromCamera(mouse, camera);
    if (headRef.current) {
      const intersects = raycaster.intersectObject(headRef.current, true);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        console.log(`const ${rs()} = new Vector3(${point.x}, ${point.y}, ${point.z})`);
        
        // Clear previous spheres if needed
        // ... (optional code to remove previous spheres)

        // Add a small sphere at the intersection point
        const sphereGeometry = new THREE.SphereGeometry(0.02, 16, 16); // Small sphere
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(point); // Set position to the intersection point
        headRef.current.add(sphere); // Add sphere to the head reference
      }
    }
  }

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, []);

  useFrame((state, delta) => {
    if (headRef.current) {
      // headRef.current.rotation.y -= delta * rotationSpeed;
    }
  });

  useEffect(() => {
    if (headRef.current) {
      // headRef.current.rotation.y = Math.PI / rotation;
    }
  }, [gltf]);

  return (
    <>
      <primitive object={gltf.scene} ref={headRef} position={position} />
      <primitive
        object={gltf.scene.clone()}
        ref={blackHeadRef}
        attach="geometry"
        material={new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })}
        
        scale={[0.95, 0.95, 0.95]}
      />
    </>
  )
}

export default function HeadScene() {
  const headRef = useRef<THREE.Object3D>(null);
  const fixedPoint: [number, number, number] = [.3, .5, 0];

  return (
    <Canvas
      style={{ height: '100vh' }}
      camera={{ position: [1, 0, 1], fov: 45 }}
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={1.6} />
      <pointLight position={[10, 10, 10]} />
      <LineToHead headRef={headRef} distance={1} clickedPoint={new THREE.Vector3(0.12859558194816623, -0.16657560549170713, 0.011645711369334844)} />
      {/* <LineToHead headRef={headRef} distance={1} clickedPoint={leftCheek} />
      <LineToHead headRef={headRef} distance={1} clickedPoint={left} />
      <LineToHead headRef={headRef} distance={1} clickedPoint={right} />
      <LineToHead headRef={headRef} distance={1} clickedPoint={middle} />
      <LineToHead headRef={headRef} distance=.2} clickedPoint={j} />
      {vectorArray.map((v, index) => (
        <LineToHead key={index} headRef={headRef} distance={.2} clickedPoint={v} />
      ))} */}
      {/* <Head headRef={headRef} rotationSpeed={.2} rotation={-15} position={COMMON_POSITION} /> */}
      <Head headRef={headRef} rotationSpeed={0} rotation={1} position={COMMON_POSITION} />
      <OrbitControls />
      <EffectComposer>
        <DepthOfField focusDistance={0} focalLength={0.006} bokehScale={.2} height={480} />
        <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
        {/* <Pixelation granularity = {20}/> */}
        {/* <Noise opacity={0.02} /> */}
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  )
}