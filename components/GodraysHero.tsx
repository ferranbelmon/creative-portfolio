"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  bloomBlurFragmentShader,
  bloomCompositeFragmentShader,
  bloomExtractFragmentShader,
  emissiveHaloFragmentShader,
  fullscreenVertexShader,
  occlusionBlurFragmentShader,
  rgbGodraysFragmentShader,
} from "@/lib/godrays/shaders";
import {
  createFloatingSpheres,
  disposeFloatingSpheres,
  updateFloatingSpheres,
} from "@/lib/godrays/spheres";
import { applyHeroTuning, heroTuning } from "@/lib/godrays/hero-tuning";

function createFullscreenQuad(material: THREE.ShaderMaterial) {
  return new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
}

export function GodraysHero() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = 0;
    let height = 0;
    let running = true;
    let raf = 0;
    let lastTime = 0;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const lightTarget = new THREE.Vector2(0.5, 0.5);
    const lightCurrent = new THREE.Vector2(0.5, 0.5);
    const pointer = { active: false };

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.debug.checkShaderErrors = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 60);
    camera.position.set(0, 0, 11);

    const spheres = createFloatingSpheres();
    for (const sphere of spheres) {
      scene.add(sphere.mesh);
    }

    const occlusionMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const rtOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    };

    const occlusionTarget = new THREE.WebGLRenderTarget(1, 1, {
      ...rtOptions,
      depthBuffer: true,
    });
    const blurredOcclusionTarget = new THREE.WebGLRenderTarget(1, 1, rtOptions);
    const emissiveHaloTarget = new THREE.WebGLRenderTarget(1, 1, rtOptions);
    const compositeTarget = new THREE.WebGLRenderTarget(1, 1, rtOptions);
    const bloomHalfTarget = new THREE.WebGLRenderTarget(1, 1, rtOptions);
    const bloomBlurTarget = new THREE.WebGLRenderTarget(1, 1, rtOptions);

    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const occlusionBlurUniforms = {
      tOcclusion: { value: occlusionTarget.texture },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uBlurRadius: { value: 12 },
    };
    const occlusionBlurMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertexShader,
      fragmentShader: occlusionBlurFragmentShader,
      uniforms: occlusionBlurUniforms,
      depthWrite: false,
      depthTest: false,
    });
    const occlusionBlurQuad = createFullscreenQuad(occlusionBlurMaterial);

    const emissiveHaloUniforms = {
      tOcclusion: { value: occlusionTarget.texture },
      tBlurred: { value: blurredOcclusionTarget.texture },
      uHaloGain: { value: 1 },
      uOccCutoff: { value: 0.9 },
      uHaloPow: { value: 0.88 },
    };
    const emissiveHaloMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertexShader,
      fragmentShader: emissiveHaloFragmentShader,
      uniforms: emissiveHaloUniforms,
      depthWrite: false,
      depthTest: false,
    });
    const emissiveHaloQuad = createFullscreenQuad(emissiveHaloMaterial);

    const godraysUniforms = {
      tHalo: { value: emissiveHaloTarget.texture },
      uLightPos: { value: lightCurrent.clone() },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uChromaticOrigin: { value: 0 },
      uChromaticShift: { value: 0 },
      uExposure: { value: 1 },
      uDecay: { value: 0.976 },
      uFalloffPow: { value: 1.18 },
      uRgbGain: { value: new THREE.Vector3(1, 1, 1) },
    };
    const godraysMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertexShader,
      fragmentShader: rgbGodraysFragmentShader,
      uniforms: godraysUniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const godraysQuad = createFullscreenQuad(godraysMaterial);

    const bloomExtractUniforms = {
      tComposite: { value: compositeTarget.texture },
      uThreshold: { value: 0.18 },
      uSoftness: { value: 0.42 },
    };
    const bloomExtractMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertexShader,
      fragmentShader: bloomExtractFragmentShader,
      uniforms: bloomExtractUniforms,
      depthWrite: false,
      depthTest: false,
    });
    const bloomExtractQuad = createFullscreenQuad(bloomExtractMaterial);

    const bloomBlurUniforms = {
      tInput: { value: bloomHalfTarget.texture },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uDirection: { value: new THREE.Vector2(1, 0) },
      uBlurRadius: { value: 5.5 },
    };
    const bloomBlurMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertexShader,
      fragmentShader: bloomBlurFragmentShader,
      uniforms: bloomBlurUniforms,
      depthWrite: false,
      depthTest: false,
    });
    const bloomBlurQuad = createFullscreenQuad(bloomBlurMaterial);

    const bloomCompositeUniforms = {
      tComposite: { value: compositeTarget.texture },
      tBloom: { value: bloomBlurTarget.texture },
      uBloomStrength: { value: 1.15 },
    };
    const bloomCompositeMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertexShader,
      fragmentShader: bloomCompositeFragmentShader,
      uniforms: bloomCompositeUniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    });
    const bloomCompositeQuad = createFullscreenQuad(bloomCompositeMaterial);

    const occlusionBlurScene = new THREE.Scene();
    occlusionBlurScene.add(occlusionBlurQuad);
    const emissiveHaloScene = new THREE.Scene();
    emissiveHaloScene.add(emissiveHaloQuad);
    const godraysScene = new THREE.Scene();
    godraysScene.add(godraysQuad);
    const bloomExtractScene = new THREE.Scene();
    bloomExtractScene.add(bloomExtractQuad);
    const bloomBlurScene = new THREE.Scene();
    bloomBlurScene.add(bloomBlurQuad);
    const bloomCompositeScene = new THREE.Scene();
    bloomCompositeScene.add(bloomCompositeQuad);

    const tuningUniforms = {
      occlusionBlur: occlusionBlurUniforms,
      emissiveHalo: emissiveHaloUniforms,
      godrays: godraysUniforms,
      bloomExtract: bloomExtractUniforms,
      bloomBlur: bloomBlurUniforms,
      bloomComposite: bloomCompositeUniforms,
    };

    function resizeTargets() {
      occlusionTarget.setSize(width, height);
      blurredOcclusionTarget.setSize(width, height);
      emissiveHaloTarget.setSize(width, height);
      compositeTarget.setSize(width, height);
      const bloomW = Math.max(1, Math.floor(width * 0.5));
      const bloomH = Math.max(1, Math.floor(height * 0.5));
      bloomHalfTarget.setSize(bloomW, bloomH);
      bloomBlurTarget.setSize(bloomW, bloomH);
      bloomBlurUniforms.uResolution.value.set(bloomW, bloomH);
    }

    function resize() {
      width = Math.max(1, mount!.clientWidth);
      height = Math.max(1, mount!.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, true);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      occlusionBlurUniforms.uResolution.value.set(width, height);
      godraysUniforms.uResolution.value.set(width, height);
      applyHeroTuning(tuningUniforms, width, height);
      resizeTargets();
    }

    function syncLightUniforms() {
      godraysUniforms.uLightPos.value.copy(lightCurrent);
    }

    function updateLightOrigin() {
      if (!pointer.active) {
        lightTarget.set(0.5, 0.5);
      }

      if (!reducedMotion) {
        lightCurrent.lerp(lightTarget, heroTuning.lightSmooth);
      } else {
        lightCurrent.copy(lightTarget);
      }

      syncLightUniforms();
    }

    function onPointerMove(event: PointerEvent) {
      const box = mount!.getBoundingClientRect();
      const mouseX = THREE.MathUtils.clamp(
        (event.clientX - box.left) / width,
        0,
        1,
      );
      const mouseY = THREE.MathUtils.clamp(
        1 - (event.clientY - box.top) / height,
        0,
        1,
      );
      lightTarget.x = 0.5 - (mouseX - 0.5) * heroTuning.mouseInfluence;
      lightTarget.y = 0.5 - (mouseY - 0.5) * heroTuning.mouseInfluence;
      pointer.active = true;
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    function frame(time: number) {
      if (!running) return;

      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0.016;
      lastTime = time;

      updateFloatingSpheres(spheres, delta, reducedMotion);
      updateLightOrigin();
      applyHeroTuning(tuningUniforms, width, height);

      renderer.setRenderTarget(occlusionTarget);
      renderer.setClearColor(0x000000, 1);
      scene.overrideMaterial = occlusionMaterial;
      renderer.render(scene, camera);
      scene.overrideMaterial = null;

      renderer.setRenderTarget(blurredOcclusionTarget);
      renderer.setClearColor(0x000000, 1);
      renderer.render(occlusionBlurScene, postCamera);

      renderer.setRenderTarget(emissiveHaloTarget);
      renderer.setClearColor(0x000000, 1);
      renderer.render(emissiveHaloScene, postCamera);

      renderer.setRenderTarget(compositeTarget);
      renderer.setClearColor(0x000000, 0);
      renderer.render(scene, camera);

      renderer.autoClear = false;
      renderer.render(godraysScene, postCamera);
      renderer.autoClear = true;

      // Bloom post-FX: extract bright → blur H/V at half-res → composite to screen
      renderer.setRenderTarget(bloomHalfTarget);
      renderer.setClearColor(0x000000, 1);
      renderer.render(bloomExtractScene, postCamera);

      bloomBlurUniforms.tInput.value = bloomHalfTarget.texture;
      bloomBlurUniforms.uDirection.value.set(1, 0);
      renderer.setRenderTarget(bloomBlurTarget);
      renderer.render(bloomBlurScene, postCamera);

      bloomBlurUniforms.tInput.value = bloomBlurTarget.texture;
      bloomBlurUniforms.uDirection.value.set(0, 1);
      renderer.setRenderTarget(bloomHalfTarget);
      renderer.render(bloomBlurScene, postCamera);

      bloomCompositeUniforms.tBloom.value = bloomHalfTarget.texture;
      renderer.setRenderTarget(null);
      renderer.setClearColor(0x000000, 0);
      renderer.render(bloomCompositeScene, postCamera);

      raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);

    window.addEventListener("resize", resize, { passive: true });
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(mount);
    mount.addEventListener("pointermove", onPointerMove, { passive: true });
    mount.addEventListener("pointerleave", onPointerLeave);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      resizeObserver.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerleave", onPointerLeave);
      disposeFloatingSpheres(spheres);
      occlusionMaterial.dispose();
      occlusionBlurMaterial.dispose();
      emissiveHaloMaterial.dispose();
      bloomExtractMaterial.dispose();
      bloomBlurMaterial.dispose();
      bloomCompositeMaterial.dispose();
      godraysMaterial.dispose();
      occlusionBlurQuad.geometry.dispose();
      emissiveHaloQuad.geometry.dispose();
      bloomExtractQuad.geometry.dispose();
      bloomBlurQuad.geometry.dispose();
      bloomCompositeQuad.geometry.dispose();
      godraysQuad.geometry.dispose();
      occlusionTarget.dispose();
      blurredOcclusionTarget.dispose();
      emissiveHaloTarget.dispose();
      compositeTarget.dispose();
      bloomHalfTarget.dispose();
      bloomBlurTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={mountRef} className="absolute inset-0 overflow-hidden" aria-hidden />
  );
}
