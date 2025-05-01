import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

function useCustomMaterialUpdater(
  scene,
  materials,
  wireframeMode,
  materialName,
  wireframeProperties,
  selectedColor,
  highlight  
) {
  const originals = useRef({});

  // one reusable yellow wireframe for highlighting the chosen part
  const highlightMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffaf11',
        wireframe: true,
        polygonOffset: true,          // avoid z-fighting
        polygonOffsetFactor: -1,
      }),
    []
  );

  const diagnosticWire = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: wireframeProperties.color,
        wireframe: wireframeProperties.wireframe,
        opacity: wireframeProperties.opacity,
        transparent: wireframeProperties.transparent,
      }),
    [wireframeProperties]
  );

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return;
    
      if (!originals.current[child.uuid])
        originals.current[child.uuid] = child.material;
    
      const original = originals.current[child.uuid];
      let nextMat = original;                       // default look
    
      if (wireframeMode) {
        // global blue
        nextMat = diagnosticWire;
    
        // but if this mesh’s ORIGINAL material equals the highlighted one,
        // override with the yellow outline
        if (highlight && original === materials[highlight]) {
          nextMat = highlightMaterial;
        }
      }
    
      child.material = nextMat;
    });
    

    // clean-up when component unmounts
    return () =>
      scene.traverse((child) => {
        if (child.isMesh && originals.current[child.uuid]) {
          child.material = originals.current[child.uuid];
        }
      });
  }, [
    scene,
    materials,
    wireframeMode,
    diagnosticWire,
    highlight,          // <── rerun when user picks another part
  ]);
}

export default useCustomMaterialUpdater;
