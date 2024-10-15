import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

function useCustomMaterialUpdater(
  scene,
  materials,
  wireframeMode,
  materialName,
  wireframeProperties,
  selectedColor,
) {
  const originalMaterialsRef = useRef({});

  const wireframeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: wireframeProperties.color,
        wireframe: wireframeProperties.wireframe,
        opacity: wireframeProperties.opacity,
        transparent: wireframeProperties.transparent,
      }),
    [wireframeProperties],
  );

  useEffect(() => {
    const currentOriginalMaterials = originalMaterialsRef.current;

    if (materials[materialName]) {
      materials[materialName].color.set(selectedColor);
    }

    scene.traverse((child) => {
      if (child.isMesh) {
        if (!currentOriginalMaterials[child.name]) {
          currentOriginalMaterials[child.name] = child.material;
        }
        child.material = wireframeMode
          ? wireframeMaterial
          : currentOriginalMaterials[child.name];
      }
    });

    return () => {
      scene.traverse((child) => {
        if (child.isMesh && currentOriginalMaterials[child.name]) {
          child.material = currentOriginalMaterials[child.name];
        }
      });
    };
  }, [
    scene,
    materials,
    wireframeMode,
    wireframeMaterial,
    selectedColor,
    materialName,
  ]);
}

export default useCustomMaterialUpdater;
