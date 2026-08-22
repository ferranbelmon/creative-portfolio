import * as THREE from "three";

export type FloatingSphere = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  bounds: number;
};

const SPHERE_COUNT = 8;
const SPHERE_COLOR = 0x050505;

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function createFloatingSpheres(bounds = 3.1): FloatingSphere[] {
  const spheres: FloatingSphere[] = [];
  const geometry = new THREE.SphereGeometry(1, 36, 36);
  const material = new THREE.MeshBasicMaterial({
    color: SPHERE_COLOR,
    transparent: false,
  });

  for (let i = 0; i < SPHERE_COUNT; i += 1) {
    const radius = randomRange(0.28, 0.72);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(radius);
    mesh.position.set(
      randomRange(-bounds * 0.65, bounds * 0.65),
      randomRange(-bounds * 0.48, bounds * 0.48),
      randomRange(-bounds * 0.4, bounds * 0.4),
    );

    const speed = randomRange(0.35, 1.05);
    const velocity = new THREE.Vector3(
      randomRange(-1, 1),
      randomRange(-1, 1),
      randomRange(-1, 1),
    )
      .normalize()
      .multiplyScalar(speed);

    spheres.push({ mesh, velocity, bounds });
  }

  return spheres;
}

export function updateFloatingSpheres(
  spheres: FloatingSphere[],
  delta: number,
  reducedMotion: boolean,
) {
  const dt = reducedMotion ? delta * 0.15 : delta;

  for (const sphere of spheres) {
    const { mesh, velocity, bounds } = sphere;
    mesh.position.addScaledVector(velocity, dt);

    const axes: Array<"x" | "y" | "z"> = ["x", "y", "z"];
    for (const axis of axes) {
      const limit = bounds * (axis === "z" ? 0.45 : axis === "y" ? 0.55 : 0.7);
      if (mesh.position[axis] > limit || mesh.position[axis] < -limit) {
        velocity[axis] *= -1;
        mesh.position[axis] = THREE.MathUtils.clamp(
          mesh.position[axis],
          -limit,
          limit,
        );
      }
    }

    mesh.rotation.x += velocity.y * delta * 0.35;
    mesh.rotation.y += velocity.x * delta * 0.35;
  }
}

export function disposeFloatingSpheres(spheres: FloatingSphere[]) {
  if (spheres.length === 0) return;
  spheres[0].mesh.geometry.dispose();
  (spheres[0].mesh.material as THREE.Material).dispose();
}
