'use client'

import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, Html, shaderMaterial, Line } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { Bloom, DepthOfField, EffectComposer, Noise, Vignette, Pixelation} from '@react-three/postprocessing'
// import { PixelShader } from './PixelShader' // Import your pixelation shader

const leftCheek = new THREE.Vector3(-0.039458695095002924, -0.10709741010463492, 0.3406214929063679)

const PixelShader = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    pixelSize: { value: 5.0 }, // Adjust this value for more or less pixelation
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float pixelSize;
    varying vec2 vUv;

    void main() {
      vec2 uv = floor(vUv * pixelSize) / pixelSize; // Pixelate the UV coordinates
      gl_FragColor = texture2D(tDiffuse, uv); // Sample the texture
    }
  `,
});

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
      const direction = vertexPosition.clone().normalize();
      const fixedPoint = vertexPosition.clone().add(direction.multiplyScalar(distance));
      lineRef.current.geometry.setFromPoints([vertexPosition, fixedPoint]);
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
    mouse.y = (event.clientY / window.innerHeight) * 2 - 1
    raycaster.setFromCamera(mouse, camera);
    if (headRef.current) {
      const intersects = raycaster.intersectObject(headRef.current, true);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        console.log('Clicked Point:', point);
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
      headRef.current.rotation.y -= delta * rotationSpeed;
    }
  });

  useEffect(() => {
    if (headRef.current) {
      headRef.current.rotation.y = Math.PI / rotation;
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
      <LineToHead headRef={headRef} distance={1} clickedPoint={leftCheek} />
      <Head headRef={headRef} rotationSpeed={.2} rotation={-15} position={COMMON_POSITION} />
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