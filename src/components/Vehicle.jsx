import * as THREE from "three";
import { useRef, Suspense, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  useGLTF,
  BakeShadows,
  ContactShadows,
  OrbitControls,
} from "@react-three/drei";
import styled from "styled-components";
import useCustomMaterialUpdater from "@/hook/useCustomMaterialUpdater";

function Model({ wireframeMode, rotationRef, selectedColor, ...props }) {
  const { scene, materials } = useGLTF("/Porsche911.glb");

  const materialName = "Material.004";
  const wireframeProperties = {
    color: "#498aeb",
    wireframe: true,
    opacity: 0.05,
    transparent: true,
  };

  useCustomMaterialUpdater(
    scene,
    materials,
    wireframeMode,
    materialName,
    wireframeProperties,
    selectedColor
  );
  useFrame(() => {
    scene.rotation.copy(rotationRef.current.rotation);
  });

  return <primitive object={scene} {...props} />;
}

function MovingSpots({ positions = [2, 0, 2, 0, 2, 0, 2, 0] }) {
  const group = useRef();
  useFrame(
    (state, delta) =>
      (group.current.position.z += delta * 8) > 60 &&
      (group.current.position.z = -60)
  );
  return (
    <group rotation={[0, 0.5, 0]}>
      <group ref={group}>
        {positions.map((x, i) => (
          <Lightformer
            key={i}
            form="circle"
            intensity={3}
            rotation={[Math.PI / 2, 0, 0]}
            position={[x, 4, i * 4]}
            scale={[3, 1, 1]}
          />
        ))}
      </group>
    </group>
  );
}

function RotatingLight() {
  const lightRef = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    lightRef.current.position.set(
      10 * Math.sin(t / 2),
      20,
      10 * Math.cos(t / 2)
    );
  });
  return (
    <spotLight
      ref={lightRef}
      angle={0.3}
      penumbra={1}
      castShadow
      intensity={2}
      shadow-bias={-0.0001}
      shadow-mapSize={[2048, 2048]}
    />
  );
}

function RotatingContactShadows({ rotationRef }) {
  useFrame(() => {
    rotationRef.current.rotation.y = rotationRef.current.rotation.y;
  });

  return (
    <ContactShadows
      rotation={[Math.PI / 2, 0, 0]} // Ensure the shadow is horizontal on the ground
      position={[0, -0.53, 0]}
      scale={10}
      blur={2}
      opacity={1.5}
      far={10}
    />
  );
}

function RotatingComponent({ rotationRef }) {
  useFrame((state, delta) => {
    rotationRef.current.rotation.y += delta * 0.05; // Adjust rotation speed as needed
  });
  return null;
}

export default function Vehicle({ selectedColor }) {
  const [wireframeMode, setWireframeMode] = useState(false);
  const rotationRef = useRef(new THREE.Object3D());

  const toggleWireframeMode = () => {
    setWireframeMode((mode) => !mode);
  };

  return (
    <Suspense fallback={null}>
      <div className="wrapper">
        <CanvasWrapper>
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: [-3, 1, 3], fov: 35 }}
          >
            <Model
              scale={0.8}
              position={[0, -0.44, 0]}
              rotation={[0, Math.PI / 5, 0]}
              wireframeMode={wireframeMode}
              rotationRef={rotationRef}
              selectedColor={selectedColor}
            />
            <RotatingLight />
            <spotLight
              position={[-10, 20, -10]}
              angle={0.3}
              penumbra={1}
              castShadow
              intensity={1.5}
              shadow-bias={-0.0001}
              shadow-mapSize={[2048, 2048]}
            />
            <ambientLight intensity={0.3} />
            <RotatingContactShadows rotationRef={rotationRef} />
            <Environment frames={Infinity} resolution={128}>
              <Lightformer
                intensity={0.7}
                form="circle"
                rotation-x={Math.PI / 2}
                position={[0, 5, 0]}
                scale={[15, 15, 15]}
              />
              <MovingSpots />
              <Lightformer
                intensity={1}
                form="circle"
                rotation-x={Math.PI / 4}
                position={[5, 5, -10]}
                scale={[10, 10, 1]}
              />
              <Lightformer
                intensity={1}
                form="circle"
                rotation-z={Math.PI / 3}
                position={[-10, 3, 5]}
                scale={[15, 10, 1]}
              />
              <Lightformer
                intensity={1}
                form="circle"
                rotation-z={Math.PI / 3}
                position={[10, 5, 5]}
                scale={[15, 10, 1]}
              />
              <Lightformer
                intensity={1}
                form="circle"
                rotation-z={Math.PI / 3}
                position={[-5, 5, 10]}
                scale={[15, 10, 1]}
              />
            </Environment>
            <BakeShadows />
            <OrbitControls
              enableDamping
              dampingFactor={0.2}
              rotateSpeed={0.5}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2}
            />
            <RotatingComponent rotationRef={rotationRef} />
          </Canvas>
        </CanvasWrapper>
        <ButtonWrapper>
          <ButtonShape onClick={toggleWireframeMode}>
            Wireframe Mode
          </ButtonShape>
        </ButtonWrapper>
      </div>
    </Suspense>
  );
}

const CanvasWrapper = styled.div`
  display: block;
  width: 100%;
  height: 1000px;
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
  }
`;
const ButtonShape = styled.div`
  color: #ffffff;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  background-color: #272e37;
  padding: 8px 12px 8px 12px;
  border-radius: 16px;
  height: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:hover {
    background-color: #5493f0;
  }
`;
