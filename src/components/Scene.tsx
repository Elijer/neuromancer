'use client'

// Here is a claude explanation on how to split layers into diff post-processing treatments:
// https://claude.site/artifacts/fad27bbd-d337-4fb7-8518-66229ca356c0

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useLoader, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Line, Text} from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { Bloom, DepthOfField, EffectComposer, Noise, Vignette, Pixelation} from '@react-three/postprocessing'

const COMMON_POSITION: HeadProps["position"] = [0, 0, 0]

let counter = 1

// ---------- TEXTY ----------
interface TextyProps {
  start: THREE.Vector3
  end: THREE.Vector3
  text: string
  link: string
  size: number
}

const Texty = ({ end, text, link, size=.2}: TextyProps) => {
  const textRef = useRef<THREE.Mesh>()
  const [hovered, setHovered] = useState(false)
  const { camera, raycaster, mouse} = useThree()

  useFrame(() => {
    if (textRef.current){
      // textRef.current.layers.set(1) // set to layer 1 where no postprocessing happens
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObject(textRef.current)

      if (intersects.length > 0){
        if (!hovered){
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }
      } else if (hovered){
        setHovered(false)
        document.body.style.cursor = 'default'
      }

    }
  })

  const handleClick = useCallback(() => {
    if (hovered){
      window.open(
        link,
        "_blank"
      )
    }
  }, [hovered, text])

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
        color={hovered ? "pink" : "white"}
        anchorX="left"
        anchorY="middle"
        ref={textRef}
        onClick={handleClick}
      >
        {text}
      </Text>
    </>
  );
};

// ---------- POINTY ----------

interface PointyProps {
  surfacePoint: THREE.Vector3
  distance: number
  text: string
  link: string
}

const Pointy = ({ surfacePoint, distance = 0.5, text, link}: PointyProps) => {
    const transp = .2
    const pointyRef = useRef()
    const direction = surfacePoint.clone().sub(new THREE.Vector3(0, 0, 0)).normalize();
    const endPoint = surfacePoint.clone().add(direction.multiplyScalar(distance));
    return (
      <>
        <Line
        points={[surfacePoint, endPoint]}
        color="white"
        lineWidth={.7}
        transparent
        opacity={transp}
        ref = {pointyRef}
        />
        <Spherey position={[surfacePoint.x, surfacePoint.y, surfacePoint.z]}/>
        <Texty start={surfacePoint} end={endPoint} text={text} link={link} size={.02}/>
      </>
    )
}


// ---------- SPHEREY ----------
const Spherey = ({ position = [0, 0, 0]}: { position?: [number, number, number]}) => {
  const sphereyRef = useRef<THREE.Mesh>(null)
  return (
    <mesh position = {position} ref={sphereyRef}>
      <sphereGeometry args={[0.002, 16, 16]} />
      <meshBasicMaterial transparent opacity={0.5} color="white" />
      {/* <meshStandardMaterial/> */}
    </mesh>
  )
}

interface HeadProps {
  headRef: React.RefObject<THREE.Object3D>;
  position?: [number, number, number];
}

const createSphere = (point:THREE.Vector3, color: string) => {
  const sphereGeometry = new THREE.SphereGeometry(0.004, 16, 16); // Small sphere
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: color }); // Red color
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.copy(point);
  return sphere
}

// Some utility functions
const createLine = (startPoint: THREE.Vector3, endPoint: THREE.Vector3) => {
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
  const line = new THREE.Line(geometry, material);
  return line
}

function Head({
  position = [0, 0, 0],
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
          // headRef.current.children = headRef.current.children.filter(child => !(child instanceof THREE.SphereGeometry));

          // Calculate direction from the center (0, 0, 0) to the clicked point
          const direction = point.clone().sub(new THREE.Vector3(0, 0, 0)).normalize();
          const distance = .5; // Length of the line
          const endPoint = point.clone().add(direction.multiplyScalar(distance));

          // headRef.current.add(createSphere(point, "white")); // Add sphere to the head reference
          // headRef.current.add(createLine(point, endPoint));
          console.log(`// # Point ${counter++}`)
          console.log(`["Earlobe", new THREE.Vector3(${point.x}, ${point.y}, ${point.z})]`)
        }
      }
    }
  }

  // Tracing markers
  // const handleMouseMove = useCallback((event: MouseEvent) => {
  //   // Update mouse coordinates
  //   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  //   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  //   // Update raycaster with new mouse position
  //   raycaster.setFromCamera(mouse, camera);

  //   if (headRef.current) {
  //     const headMesh = headRef.current.getObjectByProperty('type', 'Mesh');
  //     if (headMesh) {
  //       const intersects = raycaster.intersectObject(headMesh, false);
  //       if (intersects.length > 0) {
  //         const point = intersects[0].point;
  //         const sphere = createSphere(point, "white");
  //         headRef.current.add(sphere);
  //       }
  //     }
  //   }
  // }, []);

  // useEffect(() => {
  //   window.addEventListener('mousemove', handleMouseMove);
  //   return () => {
  //     window.removeEventListener('mousemove', handleMouseMove);
  //   };
  // }, [handleMouseMove]);

  useEffect(() => {
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [handleClick]);

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

const pointyData: [string, string, THREE.Vector3][] = [
  // ["Earlobe", "https://soundcloud.com/eliahuu", new THREE.Vector3(0.16430219587027595, 0.03152010742767164, 0.025099439953131242)],
  ["Creative Juices 🧃", "https://app.milanote.com/1R4bQg1yx7aY2T/portfolio?p=waxm3Jjmsfr", new THREE.Vector3(0.06721929875667991, 0.23346401426491137, 0.23841362530782648)],
  ["Visual 👀", "https://www.youtube.com/watch?v=fgHN1FExtks", new THREE.Vector3(0.08787825050002396, 0.12246210235241728, 0.20802164659473688)],
  ["Frontal Noggins 📝", "https://elijer.github.io/garden/", new THREE.Vector3(0.16103867707038733, 0.27772983755964753, 0.13477927477915885)],
  ["Occipital Lobe 👾", "https://jungle.rcdis.co/", new THREE.Vector3(0.1350212943129172, 0.049238632025043305, -0.22230318318486086)],
  ["Temporal Lobe 🎶", "https://soundcloud.com/eliahuu", new THREE.Vector3(0.16184143763880432, 0.07877416649431757, -0.005378855068934096)],
  ["Words 📌", "https://docs.google.com/document/d/1FXKPwPN55yYVhz2CUO49jBsTiVZgWb4LclZDcI-8ono/edit?usp=sharing", new THREE.Vector3(0.03909280037606001, -0.028731984034480407, 0.2522260502858189)],
  // ["Dreams 😎", "https://thelegend.web.app/", new THREE.Vector3(0.06721929875667991, 0.23346401426491137, 0.23841362530782648)],
  ["Inner Ear 🌊", "https://sedson.itch.io/form-of-danger", new THREE.Vector3(0.14433940790038902, -0.004384316486964579, 0.013327227922421914)],
  ["Cerebellum 🧗🏼‍♂️", "https://www.youtube.com/watch?v=hmXGn7jZNiU", new THREE.Vector3(0.11771430375222991, -0.08123222789600626, -0.07324406478480261)]
]

const MultiPointy = ({ distance = 0.2 }) => {
  return (
    <>
      {pointyData.map(([text, link, position], index) => (
        <Pointy
          key={index}
          surfacePoint={position}
          distance={distance}
          text={text}
          link={link}
        />
      ))}
    </>
  );
};

export default function HeadScene() {
  const headRef = useRef<THREE.Object3D>(null);

  return (
    <Canvas
      style={{ height: '100vh' }}
      camera={{ position: [1, 0, 1.8], fov: 45 }}
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={1.6} />
      <pointLight position={[10, 10, 10]} />
        <Head headRef={headRef} position={COMMON_POSITION} />
        <MultiPointy />
      <OrbitControls autoRotate={true} autoRotateSpeed={-.2}/>
      <EffectComposer>
        <Pixelation granularity = {0}/>
        <Bloom luminanceThreshold={.6} luminanceSmoothing={0.8} height={250} />
        <DepthOfField focusDistance={2} focalLength={0.006} bokehScale={.1} height={100} />
        {/* <Noise opacity={0.06} /> */}
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  )
}