import * as THREE from 'three';

export class ParticleSystem {
    constructor(options = {}) {
      const {
        maxParticleCount = 50,
        sphere, // THREE.Mesh with SphereGeometry
        scene,
        particleTexturePath = './src/diamond_particle.png',
        particleScale = { x: 0.03, y: 0.05, z: 0.05 },
        lifespanRange = { min: 1000, max: 3000 },
        floatSpeed = 0.01,
        minRadius = null // If not provided, will be calculated from sphere
      } = options;
      // Dependencies
      this.scene = scene;
      this.sphere = sphere;
      this.sphereGeometry = sphere.geometry;
      
      // System properties
      this.maxParticleCount = maxParticleCount;
      this.activeParticles = [];
      this.spawnCenter = sphere.position.clone();
      this.particleScale = particleScale;
      this.lifespanRange = lifespanRange;
      this.floatSpeed = floatSpeed;
      this.minRadius = minRadius || this.sphereGeometry.parameters.radius / 2;
      
      // Animation properties
      this.isAnimating = false;
      this.rafId = null;
  
      // Load texture
      this.particleTexture = new THREE.TextureLoader().load(particleTexturePath);
    }
  
    spawnParticle() {
      const particleMaterial = new THREE.SpriteMaterial({ 
        map: this.particleTexture, 
        transparent: true 
      });
      const particleSprite = new THREE.Sprite(particleMaterial);
  
      // Scale the particle
      particleSprite.scale.set(
        this.particleScale.x,
        this.particleScale.y,
        this.particleScale.z
      );
  
      // Generate random spherical coordinates
      const maxRadius = this.sphereGeometry.parameters.radius;
      const minRadiusSquared = this.minRadius * this.minRadius;
      const maxRadiusSquared = maxRadius * maxRadius;
      
      const radius = Math.sqrt(
        Math.random() * (maxRadiusSquared - minRadiusSquared) + minRadiusSquared
      );
      const theta = Math.random() * Math.PI * 2; // Azimuthal angle (0 to 2π)
      const phi = Math.acos(2 * Math.random() - 1); // Polar angle (0 to π)
  
      // Convert spherical to Cartesian coordinates and apply center offset
      particleSprite.position.set(
        radius * Math.sin(phi) * Math.cos(theta) + this.spawnCenter.x,
        radius * Math.sin(phi) * Math.sin(theta) + this.spawnCenter.y,
        radius * Math.cos(phi) + this.spawnCenter.z
      );
  
      // Set particle lifecycle properties
      particleSprite.creationTime = performance.now();
      particleSprite.lifespan = THREE.MathUtils.randFloat(
        this.lifespanRange.min,
        this.lifespanRange.max
      );
      particleSprite.elapsedTime = 0;
  
      this.activeParticles.push(particleSprite);
      this.scene.add(particleSprite);
    }
  
    initialize() {
      // Create initial particle pool
      for (let i = 0; i < this.maxParticleCount; i++) {
        this.spawnParticle();
      }
      this.scene
    }
  
    updateParticles = () => {
      const currentTime = performance.now();
      this.activeParticles.forEach((particle, index) => {
        const elapsedTime = currentTime - particle.creationTime;
  
        // Check if particle should be respawned
        if (elapsedTime >= particle.lifespan) {
          this.scene.remove(particle);
          this.activeParticles.splice(index, 1);
          this.spawnParticle();
        }
  
        // Update particle position (float effect)
        particle.position.y += this.floatSpeed * (elapsedTime / 100000);
      });
  
      if (this.isAnimating) {
        this.rafId = requestAnimationFrame(this.updateParticles);
      }
    }
  
    start() {
      if (!this.isAnimating) {
        this.isAnimating = true;
        this.updateParticles();
      }
    }
  
    stop() {
      this.isAnimating = false;
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
  
    dispose() {
      this.stop();
      // Clean up particles
      this.activeParticles.forEach(particle => {
        this.scene.remove(particle);
        particle.material.dispose();
      });
      this.activeParticles = [];
      // Dispose of texture
      this.particleTexture.dispose();
    }
  
    // Helper methods
    setSpawnCenter(position) {
      this.spawnCenter.copy(position);
    }
  
    updateSphere(sphere) {
      this.sphere = sphere;
      this.sphereGeometry = sphere.geometry;
      this.setSpawnCenter(sphere.position);
    }
  }