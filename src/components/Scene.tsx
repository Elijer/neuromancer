'use client'

// Here is a claude explanation on how to split layers into diff post-processing treatments:
// https://claude.site/artifacts/fad27bbd-d337-4fb7-8518-66229ca356c0

import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, Html, shaderMaterial, Line, Text} from '@react-three/drei'
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

const BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );

let counter = 1

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

interface TextyProps {
  start: THREE.Vector3
  end: THREE.Vector3
  text: string
  size: number
}

const Texty = ({ start, end, text, size=.2}: TextyProps) => {
  // Calculate the direction vector of the line
  const direction = new THREE.Vector3().subVectors(end, start).normalize();

  // Calculate a perpendicular vector in the XY plane
  const perpendicular = new THREE.Vector3(0, 0, 0).normalize();

  // Calculate the rotation to align with the perpendicular vector
  const rotation = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1, 0, 0), // Assuming text is initially oriented along x-axis
      perpendicular
    )
  );

  return (
    <>
      <Text
        position={[end.x, end.y, end.z]}
        rotation={rotation.toArray()}
        fontSize={size}
        color="white"
        anchorX="left"
        anchorY="middle"
      >
        {text}
      </Text>
    </>
  );
};

interface PointyProps {
  surfacePoint: THREE.Vector3
  distance: number
  text: string
}


const Pointy = ({ surfacePoint, distance = 0.5, text}: PointyProps) => {
    const direction = surfacePoint.clone().sub(new THREE.Vector3(0, 0, 0)).normalize();
    let endPoint = surfacePoint.clone().add(direction.multiplyScalar(distance));
    // headRef.current.add(createSphere(surfacePoint)); // Add sphere to the head reference
    // headRef.current.add(createLine(surfacePoint, endPoint));
    return (
      <>
        <Line points={[surfacePoint, endPoint]}>
          <bufferGeometry />
          <lineBasicMaterial color="white" />
        </Line>
        {/* <Text color="white" anchorX = {-endPoint.x} anchorY = {-endPoint.y} fontSize={.1}>
          hello world!
        </Text> */}
        <Sphere position={[surfacePoint.x, surfacePoint.y, surfacePoint.z]} />
        <Texty start={surfacePoint} end={endPoint} text={text} size={.02}/>
      </>
    )
}

const Sphere = ({ position = [0, 0, 0] }: { position?: [number, number, number] }) => {
  return (
    <mesh position = {position}>
      <sphereGeometry args={[0.004, 16, 16]} />
      {/* <meshStandardMaterial color="#FFFFFF" /> */}
    </mesh>
  )
}

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
          console.log(`// # Point ${counter++}`)
          console.log(`["Earlobe", new THREE.Vector3(${point.x}, ${point.y}, ${point.z})]`)
        }
      }
    }
  }


  // Some utility functions
  const createLine = (startPoint: THREE.Vector3, endPoint: THREE.Vector3) => {
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
    console.log(startPoint, endPoint)
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
    window.addEventListener('click', handleClick);
    // window.addEventListener('mousemove', handleClick);
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
    // if (headRef.current) {
    //   let startPoint = new THREE.Vector3(0.16430219587027595, 0.03152010742767164, 0.025099439953131242)
    //   createPoint(startPoint, .325)
    // }
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

const pointyData: [string, THREE.Vector3][] = [
  ["Earlobe", new THREE.Vector3(0.16430219587027595, 0.03152010742767164, 0.025099439953131242)],
  ["Temple", new THREE.Vector3(0.153400328099506, 0.1542746766889238, 0.1679021056599207)],
  ["Eyeball", new THREE.Vector3(0.08787825050002396, 0.12246210235241728, 0.20802164659473688)],
  ["Frontal Noggins", new THREE.Vector3(0.16103867707038733, 0.27772983755964753, 0.13477927477915885)],
  ["Occipital Lobe", new THREE.Vector3(0.1350212943129172, 0.049238632025043305, -0.22230318318486086)],
  ["Hear Stuff", new THREE.Vector3(0.16184143763880432, 0.07877416649431757, -0.005378855068934096)]

]

const MultiPointy = ({ distance = 0.3 }) => {
  return (
    <>
      {pointyData.map(([text, position], index) => (
        <Pointy
          key={index}
          surfacePoint={position}
          distance={distance}
          text={text}
        />
      ))}
    </>
  );
};

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
        <Pixelation granularity = {4}/>
        <Bloom luminanceThreshold={.6} luminanceSmoothing={0.8} height={250} />
        <DepthOfField focusDistance={2} focalLength={0.006} bokehScale={.1} height={100} />
        <Noise opacity={0.06} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
      <MultiPointy />
    </Canvas>
  )
}