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

const lines = [
    new THREE.Vector3(0.1326785274285962, 0.16940600308218734, 0.2207985337205497),
    new THREE.Vector3 (0.43391914850649715, 0.5540347035346163, 0.7221116604196978)
]


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
    // console.log({e: event.clientX, y: event.clientY})
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1; // Flip the y-axis
    raycaster.setFromCamera(mouse, camera);

    if (headRef.current) {
      // Find the actual head mesh within the GLTF scene
      const headMesh = headRef.current.getObjectByProperty('type', 'Mesh');
      
      if (headMesh) {
        const intersects = raycaster.intersectObject(headMesh, false); // Only check intersections with the head mesh
        if (intersects.length > 0) {
          const point = intersects[0].point;

          // Remove all existing lines
          headRef.current.children = headRef.current.children.filter(child => !(child instanceof THREE.Line));

          // Calculate direction from the center (0, 0, 0) to the clicked point
          const direction = point.clone().sub(new THREE.Vector3(0, 0, 0)).normalize();
          const distance = .7; // Length of the line
          const endPoint = point.clone().add(direction.multiplyScalar(distance));

          headRef.current.add(createSphere(point)); // Add sphere to the head reference
          headRef.current.add(createLine(point, endPoint));
        }
      }
    }
  }

  // Some utility functions
  const createLine = (startPoint: THREE.Vector3, endPoint: THREE.Vector3) => {
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
    const line = new THREE.Line(geometry, material);
    return line
  }

  const createSphere = (point:THREE.Vector3) => {
    const sphereGeometry = new THREE.SphereGeometry(0.004, 16, 16); // Small sphere
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Red color
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(point);
    return sphere
  }

  useEffect(() => {
    // window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleClick);
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
  const ghostRef = useRef<THREE.Object3D>(null)
  const fixedPoint: [number, number, number] = [.3, .5, 0];

  return (
    <Canvas
      style={{ height: '100vh' }}
      camera={{ position: [1, 0, 1], fov: 45 }}
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={1.6} />
      <pointLight position={[10, 10, 10]} />
      <Head headRef={headRef} rotationSpeed={0} rotation={1} position={COMMON_POSITION} />
      <OrbitControls />
      <EffectComposer>
        <DepthOfField focusDistance={0} focalLength={0.006} bokehScale={.2} height={480} />
        <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
        <Pixelation granularity = {1}/>
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  )
}