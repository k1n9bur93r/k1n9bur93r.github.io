import gsap from 'gsap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
export class CameraSystem {
    constructor(scene, renderer) {
      this.scene = scene;
      this.renderer = renderer;
      this.cameras = new Map();
      this.currentCamera = null;
      this.defaultCamera = null;
      this.defaultAnimation = null;
      this.orbitControls = null;
      this.isSequencePlaying = false;
      this.useOrbitControls = false;
      this.smoothTransitions = false;
      this.transitionDuration = 1.0; // Default duration for smooth transitions
      
      this.timeline = gsap.timeline({
        paused: true,
        onComplete: () => {
          this.isSequencePlaying = false;
          this.switchToDefaultCamera();
        }
      });
  
      // Setup keyboard controls
      this.setupKeyboardControls();
    }
  
    setupKeyboardControls() {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'o' || e.key === 'O') {
          this.toggleOrbitControls();
        }
      });
    }
  
    setDefaultCamera(name, cameraConfig) {
      const camera = this.addCamera(name, cameraConfig);
      this.defaultCamera = camera;
  
      // Setup OrbitControls if enabled
      if (cameraConfig.useOrbitControls) {
        this.setupOrbitControls(camera);
      }
      
      if (cameraConfig.defaultAnimation) {
        this.setupDefaultAnimation(camera, cameraConfig.defaultAnimation);
      }
      
      if (!this.currentCamera) {
        this.currentCamera = camera;
      }
      
      return camera;
    }
  
    setupOrbitControls(camera) {
      if (this.orbitControls) {
        this.orbitControls.dispose();
      }
  
      this.orbitControls = new OrbitControls(camera, this.renderer.domElement);
      this.orbitControls.enableDamping = true;
      this.orbitControls.dampingFactor = 0.05;
      this.orbitControls.enabled = this.useOrbitControls;
  
      // Store initial camera position for switching back from orbit controls
      camera.userData.defaultPosition = camera.position.clone();
      camera.userData.defaultRotation = camera.rotation.clone();
    }
  
    toggleOrbitControls() {
      this.useOrbitControls = !this.useOrbitControls;
      
      if (this.orbitControls) {
        this.orbitControls.enabled = this.useOrbitControls;
        
        // If disabling orbit controls, smoothly return to default animation
        if (!this.useOrbitControls && this.defaultAnimation && !this.isSequencePlaying) {
          const camera = this.defaultCamera;
          if (camera.userData.defaultPosition) {
            this.smoothTransitionCamera(
              camera,
              camera.userData.defaultPosition,
              camera.userData.defaultRotation,
              () => {
                if (this.defaultAnimation) {
                  this.defaultAnimation.play();
                }
              }
            );
          }
        } else if (this.useOrbitControls && this.defaultAnimation) {
          this.defaultAnimation.pause();
        }
      }
  
      console.log(`Orbit Controls ${this.useOrbitControls ? 'Enabled' : 'Disabled'}`);
    }
  
    setSmoothTransitions(enabled, duration = 1.0) {
      this.smoothTransitions = enabled;
      this.transitionDuration = duration;
    }
  
    smoothTransitionCamera(camera, targetPosition, targetRotation, onComplete) {
      if (!this.smoothTransitions) {
        camera.position.copy(targetPosition);
        if (targetRotation) camera.rotation.copy(targetRotation);
        if (onComplete) onComplete();
        return;
      }
  
      gsap.to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: this.transitionDuration,
        ease: 'power2.inOut',
        onComplete: () => {
          if (targetRotation) {
            gsap.to(camera.rotation, {
              x: targetRotation.x,
              y: targetRotation.y,
              z: targetRotation.z,
              duration: this.transitionDuration / 2,
              ease: 'power2.inOut',
              onComplete: () => {
                if (onComplete) onComplete();
              }
            });
          } else if (onComplete) {
            onComplete();
          }
        }
      });
    }
  
    switchCamera(fromCamera, toCamera, onComplete) {
      if (this.smoothTransitions) {
        const targetPos = toCamera.position.clone();
        const targetRot = toCamera.rotation.clone();
        
        this.smoothTransitionCamera(fromCamera, targetPos, targetRot, () => {
          this.currentCamera = toCamera;
          if (onComplete) onComplete();
        });
      } else {
        this.currentCamera = toCamera;
        if (onComplete) onComplete();
      }
    }
  
  
    setupDefaultAnimation(camera, animationConfig) {
      const {
        radius = 10,
        height = 2,
        speed = 1,
        lookAt = new THREE.Vector3(0, 0, 0)
      } = animationConfig;
  
      // Create a timeline for the orbital animation
      this.defaultAnimation = gsap.timeline({
        paused: true,
        repeat: -1, // Infinite repeat
        ease: "none"
      });
  
      // Current angle of rotation
      let currentAngle = Math.atan2(
        camera.position.z - lookAt.z,
        camera.position.x - lookAt.x
      );
  
      // Current radius from look at point (ignoring height)
      const currentRadius = Math.sqrt(
        Math.pow(camera.position.x - lookAt.x, 2) +
        Math.pow(camera.position.z - lookAt.z, 2)
      );
  
      // Animation object to track position
      const animationObject = {
        angle: currentAngle,
        radius: currentRadius,
        height: camera.position.y
      };
  
      // Create the orbital animation
      this.defaultAnimation.to(animationObject, {
        angle: currentAngle + Math.PI * 2, // Full rotation
        duration: 10 / speed, // Base duration modified by speed
        ease: "none",
        onUpdate: () => {
          // Update camera position
          camera.position.x = lookAt.x + Math.cos(animationObject.angle) * animationObject.radius;
          camera.position.z = lookAt.z + Math.sin(animationObject.angle) * animationObject.radius;
          camera.position.y = lookAt.y + height;
          
          // Make camera look at the target
          camera.lookAt(lookAt);
        }
      });
    }


  switchToDefaultCamera() {
    if (this.defaultCamera) {
      if (this.currentCamera !== this.defaultCamera) {
        this.switchCamera(this.currentCamera, this.defaultCamera, () => {
          if (!this.useOrbitControls && this.defaultAnimation) {
            this.defaultAnimation.play();
          }
        });
      } else if (!this.useOrbitControls && this.defaultAnimation) {
        this.defaultAnimation.play();
      }
    }
  }


  addCamera(name, cameraConfig) {
    const camera = new THREE.PerspectiveCamera(
      cameraConfig.fov || 75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    if (cameraConfig.position) {
      camera.position.set(
        cameraConfig.position.x,
        cameraConfig.position.y,
        cameraConfig.position.z
      );
    }
    
    if (cameraConfig.lookAt) {
      camera.lookAt(
        new THREE.Vector3(
          cameraConfig.lookAt.x,
          cameraConfig.lookAt.y,
          cameraConfig.lookAt.z
        )
      );
    }
    
    this.cameras.set(name, camera);
    return camera;
  }


  addCameraTransition({
    fromCamera,
    toCamera,
    duration = 2,
    position = null,
    rotation = null,
    ease = 'power2.inOut',
    timeOffset = 0
  }) {
    const from = this.getCamera(fromCamera);
    const to = this.getCamera(toCamera);
    
    if (!from || !to) {
      console.error('Invalid camera names provided');
      return;
    }

    if (this.defaultAnimation) {
      this.defaultAnimation.pause();
    }

    if (this.smoothTransitions) {
      // For smooth transitions, we'll animate the camera directly
      this.timeline.add(() => {
        this.switchCamera(from, to);
      }, timeOffset);
    } else {
      // Original transition logic
      const transitionObject = {
        posX: from.position.x,
        posY: from.position.y,
        posZ: from.position.z,
        rotX: from.rotation.x,
        rotY: from.rotation.y,
        rotZ: from.rotation.z
      };

      this.timeline.to(transitionObject, {
        duration,
        ...position && {
          posX: position.x,
          posY: position.y,
          posZ: position.z,
        },
        ...rotation && {
          rotX: rotation.x,
          rotY: rotation.y,
          rotZ: rotation.z,
        },
        ease,
        onUpdate: () => {
          from.position.set(
            transitionObject.posX,
            transitionObject.posY,
            transitionObject.posZ
          );
          from.rotation.set(
            transitionObject.rotX,
            transitionObject.rotY,
            transitionObject.rotZ
          );
        },
        onComplete: () => {
          this.currentCamera = to;
        }
      }, timeOffset);
    }
  }

  update() {
    if (this.orbitControls && this.useOrbitControls) {
      this.orbitControls.update();
    }
  }

  getCamera(name) {
    return this.cameras.get(name);
  }

  getCurrentCamera() {
    return this.currentCamera;
  }

  play() {
    this.isSequencePlaying = true;
    if (this.defaultAnimation) {
      this.defaultAnimation.pause();
    }
    this.timeline.play();
  }

  pause() {
    this.isSequencePlaying = false;
    this.timeline.pause();
  }

  reset() {
    this.isSequencePlaying = false;
    this.timeline.restart();
    this.switchToDefaultCamera();
  }
}