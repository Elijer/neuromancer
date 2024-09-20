'use client'

import React, { useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, extend, Object3DNode } from '@react-three/fiber'
import { OrbitControls, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// Custom shader material
// const WireframeMaterial = shaderMaterial(
//   {
//     color: new THREE.Color(1, 1, 1),
//   },
//   // Vertex Shader
//   `
//     varying vec3 vNormal;
//     void main() {
//       vNormal = normalize(normalMatrix * normal);
//       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
//   `,
//   // Fragment Shader
//   `
//     uniform vec3 color;
//     varying vec3 vNormal;
//     void main() {
//       float intensity = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
//       if (intensity > 0.05) {
//         gl_FragColor = vec4(color, 1.0);
//       } else {
//         discard;
//       }
//     }
//   `
// )

// extend({ WireframeMaterial })

// Extend JSX.IntrinsicElements to include custom material
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wireframeMaterial': Object3DNode<typeof WireframeMaterial & { color: THREE.Color }, typeof WireframeMaterial & { color: THREE.Color }>
    }
  }
}

function Head({ position = [0, -1.5, 0] }: { position?: [number, number, number] }) {
  const gltf = useLoader(GLTFLoader, 'elijah2.glb')
  const headRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (headRef.current) {
      headRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <group ref={headRef} position={position}>
      <mesh geometry={gltf.scenes[0].children[0].geometry}>
        <wireframeMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}


export default function HeadScene() {
  return (
    <Canvas
    style={{ height: '100vh' }}
    camera={{position: [0, 0, 2], fov: 45 }}
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={1.6} />
      <pointLight position={[10, 10, 10]} />
      <Head />
      {/* <OrbitControls /> */}
    </Canvas>
  )
}