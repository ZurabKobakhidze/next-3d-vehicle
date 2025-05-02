import * as THREE from "three";
import { useRef, Suspense, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
import { BatteryIcon, ChasisIcon, EngineIcon, WheelIcon } from "./icons";
import { motion, AnimatePresence } from "framer-motion";
import JEASINGS from "jeasings";
import { WheelMarker } from "./click-dots";

function Model({
  wireframeMode,
  rotationRef,
  selectedColor,
  highlight,
  ...props
}) {
  const { scene, materials } = useGLTF("/KenworthTest.glb");

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
    selectedColor,
    highlight
  );
  useFrame(() => {
    scene.rotation.copy(rotationRef.current.rotation);
  });

  return <primitive object={scene} {...props} />;
}

function StaticSpots({
  y = 4, // height above the ground
  radius = 2, // how far out from the center each spot is
  count = 6, // number of circles
}) {
  // angles around a circle
  const angles = useMemo(
    () => [...Array(count)].map((_, i) => (i / count) * Math.PI * 2),
    [count]
  );

  return (
    // tip the whole ring so circles face downwards
    <group rotation={[Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      {angles.map((a, i) => (
        <Lightformer
          key={i}
          form="circle"
          intensity={3}
          position={[radius * Math.cos(a), 0, radius * Math.sin(a)]}
          scale={[3, 1, 1]}
        />
      ))}
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
      position={[0, -0.6505, 0]}
      scale={10}
      blur={2}
      opacity={1.5}
      far={10}
    />
  );
}

function RotatingComponent({ rotationRef, active }) {
  useFrame((state, delta) => {
    if (active) rotationRef.current.rotation.y += delta * -0.05;
  });
  return null;
}

function JEasingLoop() {
  useFrame(() => JEASINGS.update());
  return null;
}

function flyTo(point /* THREE.Vector3 */, camera, controls, distance = 3) {
  // where should the camera end up?
  const dir = new THREE.Vector3()
    .subVectors(camera.position, controls.target) // current view direction
    .normalize();
  const newCamPos = new THREE.Vector3()
    .copy(point)
    .addScaledVector(dir, distance); // pull back <distance> metres

  // animate camera.position
  new JEASINGS.JEasing(camera.position)
    .to(newCamPos, 800)
    .easing(JEASINGS.Cubic.InOut)
    .start();

  // animate orbit target
  new JEASINGS.JEasing(controls.target)
    .to(point, 800)
    .easing(JEASINGS.Cubic.InOut)
    .start();
}

function DiagnosticPreset({ active, distance = 6 }) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!active || !controls) return;

    // 1️⃣  where should the camera look?
    const target = new THREE.Vector3(0, -0.3, 0); //  (x, y, z)

    // 2️⃣  where should the camera stand?
    const yaw = THREE.MathUtils.degToRad(5); // left‑front
    const pitch = THREE.MathUtils.degToRad(20); // 20° above horizon

    const r = distance;
    const offset = new THREE.Vector3(
      r * Math.cos(pitch) * Math.sin(yaw), // x
      r * Math.sin(pitch), // y
      r * Math.cos(pitch) * Math.cos(yaw) // z
    );

    camera.position.copy(target).add(offset);
    camera.updateProjectionMatrix();

    controls.target.copy(target);
    controls.update();
  }, [active, distance]);

  return null;
}

// ⬅─ helper that sits INSIDE <Canvas>
function CameraRig({ fly, distance = 2 }) {
  const { camera, controls } = useThree(); // <- now it’s legal
  useEffect(() => {
    if (!fly) return;
    const { point } = fly; // point = THREE.Vector3
    // same helper you already wrote …
    flyTo(point, camera, controls, distance);
  }, [fly]);
  return null;
}

export default function Vehicle({ selectedColor }) {
  /* --- UI state (outside) ------------------------------------ */
  const [wireframeMode, setWireframeMode] = useState(false);
  const [fly, setFly] = useState(null); // <── NEW
  const [highlight, setHighlight] = useState(null);
  const rotationRef = useRef(new THREE.Object3D());
  const controls = useRef();

  /* turn the controller on/off whenever wireframeMode changes */
  useEffect(() => {
    if (!controls.current) return;
    controls.current.enabled = !wireframeMode; // ⇐ freeze when diagnostic is ON
  }, [wireframeMode]);

  // put this right next to the yaw/pitch constants you already have
  const camYaw = THREE.MathUtils.degToRad(-35); // camera turns −35° around Y
  const camPitch = THREE.MathUtils.degToRad(20); // camera 20° up

  /* ------------------------------------------------------------------- */
  /* reset the model the moment Diagnostic switches on                   */
  useEffect(() => {
    if (wireframeMode) {
      /* Face the truck toward the camera: reverse the camera’s yaw.
       We leave X‑rot & Z‑rot at 0 because the truck itself isn’t pitched. */
      rotationRef.current.rotation.set(
        0, // X  (no nose‑up / nose‑down)
        camYaw, // Y  (turn to face the camera)
        0 // Z
      );
    }
  }, [wireframeMode, camYaw]);

  const toggleWireframeMode = () => {
    setHighlight(null);
    setWireframeMode((m) => !m);
  };

  return (
    <Suspense fallback={null}>
      <div className="wrapper">
        <CanvasWrapper>
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ fov: 45, position: [-3, 1, 3] }}
          >
            <DiagnosticPreset active={wireframeMode} distance={4} />
            <Model
              scale={0.4}
              position={[0, -0.65, 0]}
              rotation={[0, Math.PI / 5, 0]}
              wireframeMode={wireframeMode}
              rotationRef={rotationRef}
              selectedColor={selectedColor}
              highlight={highlight} /* <── NEW  */
            />
            <JEasingLoop />
            <CameraRig fly={fly} />
            {/* {wireframeMode && (
              <WheelMarker
                pos={new THREE.Vector3(1, 0.5, 1)}
                onClick={(p) => setFly({ point: p })}
              />
            )} */}
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
              <StaticSpots y={4} radius={2.5} count={8} />
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
              makeDefault
              enableDamping
              enabled={!wireframeMode} // ← same effect
              ref={controls}
              enablePan={false}
            />
            <RotatingComponent
              active={!wireframeMode}
              rotationRef={rotationRef}
            />
          </Canvas>
        </CanvasWrapper>
        <ButtonWrapper>
          <AnimatePresence initial={false}>
            {wireframeMode && (
              <>
                <IconDiv
                  key="Chasis"
                  onClick={() =>
                    setHighlight((h) => (h === "Chasis" ? null : "Chasis"))
                  }
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChasisIcon />
                </IconDiv>
                <IconDiv
                  key="engine"
                  onClick={() =>
                    setHighlight((h) => (h === "engine" ? null : "engine"))
                  }
                  initial={{ opacity: 0, x: 7 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 7 }}
                  transition={{ duration: 0.3 }}
                >
                  <EngineIcon />
                </IconDiv>
              </>
            )}
          </AnimatePresence>
          <ButtonShape onClick={() => setWireframeMode((m) => !m)}>
            Diagnostic
          </ButtonShape>
          <AnimatePresence initial={false}>
            {wireframeMode && (
              <>
                <IconDiv
                  key="battery"
                  initial={{ opacity: 0, x: -7 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -7 }}
                  transition={{ duration: 0.3 }}
                  onClick={() =>
                    setHighlight((h) => (h === "battery" ? null : "battery"))
                  } /* <── NEW */
                >
                  <BatteryIcon />
                </IconDiv>
                <IconDiv
                  key="wheel"
                  onClick={() =>
                    setHighlight((h) => (h === "tier" ? null : "tier"))
                  }
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <WheelIcon />
                </IconDiv>
              </>
            )}
          </AnimatePresence>
        </ButtonWrapper>
      </div>
    </Suspense>
  );
}

const IconDiv = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #0f1113;
  border-radius: 12px;
  cursor: pointer;
  &:hover {
    background-color: #5493f0;
  }
`;

const CanvasWrapper = styled.div`
  display: block;

  width: 100%;
  height: 900px;
  /* border-top-left-radius: 600px;
  border-top-right-radius: 600px;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px; */
  overflow: hidden;
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  gap: 12px;
  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
  }
`;
const ButtonShape = styled.div`
  color: #ffffff;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  background-color: #0f1113;
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
