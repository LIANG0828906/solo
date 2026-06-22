import * as THREE from 'three';
import { SceneManager } from './sceneManager';
import { PhysicsSystem, createPhysicsBody } from './physicsSystem';
import { AnimationTimeline, Easing, createNumberInterpolator, createColorInterpolator } from './animationTimeline';
import { EffectManager } from './effectManager';
import {
  IBuilding,
  BuildingStyle,
  BuildingStyleConfig,
  AnimationState,
  LODLevel,
  GROWTH_INTERVAL,
  FLOOR_HEIGHT,
  GRID_SIZE,
  CELL_SIZE,
  MAX_BUILDINGS_BEFORE_MERGE,
  BUILDING_BASE_WIDTH,
  BUILDING_BASE_DEPTH,
  STYLE_CONFIGS,
  generateBuildingId,
  getRandomStyle,
  getRandomFloors,
  gridToWorld,
  getRandomWindowToggleTime,
  IWindowLightState
} from '../models/buildingConfig';

export class BuildingManager {
  buildings: IBuilding[] = [];
  sceneManager: SceneManager;
  physicsSystem: PhysicsSystem;
  effectManager: EffectManager | null = null;
  private occupiedCells: Set<string> = new Set();
  private lodMergedMeshes: Map<BuildingStyle, THREE.Mesh> = new Map();
  private isMerged: boolean = false;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.physicsSystem = new PhysicsSystem();
  }

  setEffectManager(effectManager: EffectManager): void {
    this.effectManager = effectManager;
  }

  placeBuilding(gridX: number, gridZ: number): IBuilding | null {
    const cellKey = `${gridX},${gridZ}`;
    if (this.occupiedCells.has(cellKey)) {
      return null;
    }

    const style = getRandomStyle();
    const targetFloors = getRandomFloors();
    const targetHeight = targetFloors * FLOOR_HEIGHT;
    const worldPos = gridToWorld(gridX, gridZ);
    const width = BUILDING_BASE_WIDTH + Math.random() * 0.3;
    const depth = BUILDING_BASE_DEPTH + Math.random() * 0.3;

    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(worldPos.x, 0, worldPos.z);
    buildingGroup.scale.y = 0.01;

    const physicsBody = createPhysicsBody(
      generateBuildingId(),
      worldPos.x,
      worldPos.z,
      width / 2,
      depth / 2,
      1 + targetFloors * 0.1,
      false,
      0.15
    );

    const building: IBuilding = {
      id: physicsBody.id,
      position: { x: worldPos.x, z: worldPos.z },
      targetHeight,
      currentHeight: 0,
      style,
      isGrowing: false,
      isComplete: false,
      mesh: buildingGroup,
      floors: [],
      decorativeMeshes: [],
      windowLights: [],
      windowStates: new Map(),
      animationState: AnimationState.SPAWNING,
      physicsBody,
      growthProgress: 0,
      lastGrowthTime: 0,
      targetFloor: targetFloors,
      currentFloor: 0,
      spawnAnimation: {
        startTime: Date.now(),
        duration: 800,
        isComplete: false
      },
      pushOffset: { x: 0, z: 0 },
      lodLevel: LODLevel.HIGH,
      width,
      depth
    };

    this.createBuildingGeometry(building);
    this.createWindowStates(building);
    this.createGrowthTimeline(building);

    this.sceneManager.getScene().add(buildingGroup);
    this.buildings.push(building);
    this.physicsSystem.addBody(physicsBody);
    this.occupiedCells.add(cellKey);

    this.physicsSystem.applyRadialImpulse(worldPos.x, worldPos.z, 5, 0.8, building.id);
    this.sceneManager.focusOnPosition(worldPos.x, worldPos.z, targetHeight);

    return building;
  }

  private createWindowStates(building: IBuilding): void {
    const windowsPerFloor = 8;
    const totalWindows = building.targetFloor * windowsPerFloor;
    
    for (let i = 0; i < totalWindows; i++) {
      const shouldLight = Math.random() > 0.6;
      const warmColors = [0xffcc33, 0xffaa33, 0xffee99, 0xffdd66];
      const baseColor = new THREE.Color(STYLE_CONFIGS[building.style].windowColor);
      const nightColor = new THREE.Color(warmColors[Math.floor(Math.random() * warmColors.length)]);

      const state: IWindowLightState = {
        targetBrightness: shouldLight ? 0.8 + Math.random() * 0.2 : 0,
        currentBrightness: 0,
        toggleInterval: getRandomWindowToggleTime(),
        nextToggleTime: Math.random() * 5,
        color: baseColor.clone(),
        baseColor: nightColor
      };
      building.windowStates.set(i, state);
    }
  }

  private createGrowthTimeline(building: IBuilding): void {
    const timeline = new AnimationTimeline();

    timeline.addTrack<number>(
      'spawnScale',
      [
        { time: 0, value: 0.01 },
        { time: 0.8, value: 1, easing: Easing.elasticOut }
      ],
      createNumberInterpolator(),
      (value) => {
        building.mesh.scale.y = value;
      }
    );

    timeline.addCallback(0.8, () => {
      building.spawnAnimation.isComplete = true;
      building.animationState = AnimationState.GROWING_FLOOR;
      building.isGrowing = true;
      building.lastGrowthTime = performance.now();
    });

    building.growthTimeline = timeline;
    timeline.play();
  }

  private createBuildingGeometry(building: IBuilding): void {
    const styleConfig = STYLE_CONFIGS[building.style];

    for (let i = 0; i < building.targetFloor; i++) {
      const floorHeight = FLOOR_HEIGHT;
      const widthVariation = 1 - (i / building.targetFloor) * 0.15;
      const floorWidth = building.width * widthVariation;
      const floorDepth = building.depth * widthVariation;

      const floorGeometry = new THREE.BoxGeometry(floorWidth, floorHeight * 0.95, floorDepth);
      const floorMaterial = this.createFloorMaterial(styleConfig);
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.position.y = i * floorHeight + floorHeight / 2;
      floorMesh.castShadow = true;
      floorMesh.receiveShadow = true;
      floorMesh.visible = false;

      const edgesGeometry = new THREE.EdgesGeometry(floorGeometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: styleConfig.edgeColor,
        transparent: true,
        opacity: 0.8
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      edges.position.copy(floorMesh.position);
      edges.visible = false;

      this.createWindowLightsForFloor(building, floorWidth, floorHeight, floorDepth, i, styleConfig);

      building.floors.push(floorMesh);
      building.mesh.add(floorMesh);
      building.mesh.add(edges);
      building.decorativeMeshes.push(edges);
    }

    this.createStyleSpecificDecorations(building, styleConfig);
    this.createBeaconLight(building, styleConfig);
    this.createBuildingBase(building, styleConfig);
  }

  private createFloorMaterial(styleConfig: BuildingStyleConfig): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: styleConfig.bodyColor,
      roughness: styleConfig.roughness,
      metalness: styleConfig.metalness,
      envMapIntensity: 0.5
    });
  }

  private createWindowLightsForFloor(
    building: IBuilding,
    width: number,
    height: number,
    depth: number,
    floorIndex: number,
    styleConfig: BuildingStyleConfig
  ): void {
    const windowSize = 0.2;
    const windowSpacing = 0.4;
    const yOffset = floorIndex * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
    const windowsPerSide = Math.floor((width) / windowSpacing) - 1;

    const windowMaterial = new THREE.MeshBasicMaterial({
      color: styleConfig.windowColor,
      transparent: true,
      opacity: 0
    });

    let windowIndex = 0;
    const windowsPerFloor = 8;
    const baseWindowIndex = floorIndex * windowsPerFloor;

    for (let side = 0; side < 4; side++) {
      const isFrontBack = side < 2;
      const dimension = isFrontBack ? width : depth;
      const maxWindows = Math.min(Math.floor(dimension / windowSpacing) - 1, 3);
      
      for (let w = 0; w < maxWindows; w++) {
        if (windowIndex >= windowsPerFloor) break;
        
        const windowGeo = new THREE.PlaneGeometry(windowSize, windowSize * 1.5);
        const windowMesh = new THREE.Mesh(windowGeo, windowMaterial.clone());
        
        const offset = (w - (maxWindows - 1) / 2) * windowSpacing;
        
        if (side === 0) {
          windowMesh.position.set(offset, yOffset, depth / 2 + 0.01);
        } else if (side === 1) {
          windowMesh.position.set(offset, yOffset, -depth / 2 - 0.01);
          windowMesh.rotation.y = Math.PI;
        } else if (side === 2) {
          windowMesh.position.set(width / 2 + 0.01, yOffset, offset);
          windowMesh.rotation.y = Math.PI / 2;
        } else {
          windowMesh.position.set(-width / 2 - 0.01, yOffset, offset);
          windowMesh.rotation.y = -Math.PI / 2;
        }
        
        windowMesh.visible = false;
        building.windowLights.push(windowMesh);
        building.mesh.add(windowMesh);
        windowIndex++;
      }
    }
  }

  private createStyleSpecificDecorations(building: IBuilding, styleConfig: BuildingStyleConfig): void {
    const geometry = styleConfig.geometry;

    if (building.style === BuildingStyle.CLASSICAL_STONE && geometry.columnCount > 0) {
      this.createClassicalColumns(building, styleConfig);
    }

    if (building.style === BuildingStyle.FUTURISTIC_METAL && geometry.hasAngularPanels) {
      this.createFuturisticPanels(building, styleConfig);
    }

    if (building.style === BuildingStyle.MODERN_GLASS) {
      this.createModernGlassDetails(building, styleConfig);
    }

    if (geometry.hasCornice) {
      this.createCornice(building, styleConfig);
    }

    if (geometry.hasRoofStructure && geometry.roofAntennaCount > 0) {
      this.createRoofAntennas(building, styleConfig);
    }
  }

  private createClassicalColumns(building: IBuilding, styleConfig: BuildingStyleConfig): void {
    const geometry = styleConfig.geometry;
    const columnHeight = building.targetHeight * geometry.columnHeightRatio;
    const columnsPerSide = Math.floor(geometry.columnCount / 2);
    const spacingX = building.width / (columnsPerSide + 1);
    const spacingZ = building.depth / 2;

    const columnMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(styleConfig.bodyColor).multiplyScalar(0.85),
      roughness: 0.85,
      metalness: 0.05
    });

    for (let side = 0; side < 2; side++) {
      const zOffset = side === 0 ? spacingZ : -spacingZ;
      
      for (let i = 0; i < columnsPerSide; i++) {
        const columnGeometry = new THREE.CylinderGeometry(
          geometry.columnRadius,
          geometry.columnRadius * 1.1,
          columnHeight,
          12
        );
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.set(
          (i - (columnsPerSide - 1) / 2) * spacingX,
          columnHeight / 2 + styleConfig.geometry.baseHeight,
          zOffset
        );
        column.castShadow = true;
        column.visible = false;
        
        const capGeometry = new THREE.CylinderGeometry(
          geometry.columnRadius * 1.4,
          geometry.columnRadius,
          0.08,
          12
        );
        const capTop = new THREE.Mesh(capGeometry, columnMaterial);
        capTop.position.set(
          column.position.x,
          columnHeight + styleConfig.geometry.baseHeight + 0.04,
          column.position.z
        );
        capTop.visible = false;

        const baseGeometry = new THREE.CylinderGeometry(
          geometry.columnRadius * 1.3,
          geometry.columnRadius * 1.5,
          0.1,
          12
        );
        const base = new THREE.Mesh(baseGeometry, columnMaterial);
        base.position.set(
          column.position.x,
          styleConfig.geometry.baseHeight + 0.05,
          column.position.z
        );
        base.visible = false;

        building.mesh.add(column);
        building.mesh.add(capTop);
        building.mesh.add(base);
        building.decorativeMeshes.push(column, capTop, base);
      }
    }
  }

  private createFuturisticPanels(building: IBuilding, styleConfig: BuildingStyleConfig): void {
    const geometry = styleConfig.geometry;
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: styleConfig.accentColor,
      roughness: 0.15,
      metalness: 0.95,
      emissive: styleConfig.edgeColor,
      emissiveIntensity: 0.1
    });

    const panelsPerFloor = 2;
    for (let floor = 0; floor < building.targetFloor; floor += 3) {
      const y = floor * FLOOR_HEIGHT + FLOOR_HEIGHT * 1.5;
      
      for (let side = 0; side < 4; side++) {
        for (let p = 0; p < panelsPerFloor; p++) {
          const panelGeometry = new THREE.BoxGeometry(
            geometry.panelWidth * 0.3,
            geometry.panelHeight * 0.8,
            geometry.panelDepth * 2
          );
          const panel = new THREE.Mesh(panelGeometry, panelMaterial);
          
          const offsetX = (p - (panelsPerFloor - 1) / 2) * (building.width / 3);
          const angle = geometry.panelAngle * (side % 2 === 0 ? 1 : -1);
          
          if (side === 0) {
            panel.position.set(offsetX, y, building.depth / 2 + 0.05);
            panel.rotation.x = angle;
          } else if (side === 1) {
            panel.position.set(offsetX, y, -building.depth / 2 - 0.05);
            panel.rotation.x = -angle;
          } else if (side === 2) {
            panel.position.set(building.width / 2 + 0.05, y, offsetX);
            panel.rotation.z = -angle;
          } else {
            panel.position.set(-building.width / 2 - 0.05, y, offsetX);
            panel.rotation.z = angle;
          }
          
          panel.visible = false;
          building.mesh.add(panel);
          building.decorativeMeshes.push(panel);
        }
      }
    }

    const stripMaterial = new THREE.MeshBasicMaterial({
      color: styleConfig.edgeColor,
      transparent: true,
      opacity: 0.7
    });

    for (let floor = 0; floor < building.targetFloor; floor += 2) {
      const stripGeometry = new THREE.BoxGeometry(building.width + 0.05, 0.02, building.depth + 0.05);
      const strip = new THREE.Mesh(stripGeometry, stripMaterial);
      strip.position.y = (floor + 1) * FLOOR_HEIGHT;
      strip.visible = false;
      building.mesh.add(strip);
      building.decorativeMeshes.push(strip);
    }
  }

  private createModernGlassDetails(building: IBuilding, styleConfig: BuildingStyleConfig): void {
    const stripMaterial = new THREE.MeshBasicMaterial({
      color: styleConfig.edgeColor,
      transparent: true,
      opacity: 0.5
    });

    for (let floor = 0; floor < building.targetFloor; floor++) {
      const y = (floor + 0.5) * FLOOR_HEIGHT;
      
      for (let side = 0; side < 4; side++) {
        const isFrontBack = side < 2;
        const width = isFrontBack ? building.width : building.depth;
        const stripGeometry = new THREE.BoxGeometry(width, 0.015, 0.01);
        const strip = new THREE.Mesh(stripGeometry, stripMaterial);
        
        if (side === 0) {
          strip.position.set(0, y, building.depth / 2 + 0.02);
        } else if (side === 1) {
          strip.position.set(0, y, -building.depth / 2 - 0.02);
        } else if (side === 2) {
          strip.position.set(building.width / 2 + 0.02, y, 0);
          strip.rotation.y = Math.PI / 2;
        } else {
          strip.position.set(-building.width / 2 - 0.02, y, 0);
          strip.rotation.y = Math.PI / 2;
        }
        
        strip.visible = false;
        building.mesh.add(strip);
        building.decorativeMeshes.push(strip);
      }
    }
  }

  private createCornice(building: IBuilding, styleConfig: BuildingStyleConfig): void {
    const geometry = styleConfig.geometry;
    const totalHeight = building.targetHeight;
    const corniceGeometry = new THREE.BoxGeometry(
      building.width + geometry.corniceOverhang * 2,
      geometry.corniceHeight,
      building.depth + geometry.corniceOverhang * 2
    );
    const corniceMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(styleConfig.bodyColor).multiplyScalar(0.75),
      roughness: styleConfig.roughness,
      metalness: styleConfig.metalness
    });
    const cornice = new THREE.Mesh(corniceGeometry, corniceMaterial);
    cornice.position.y = totalHeight + geometry.corniceHeight / 2;
    cornice.castShadow = true;
    cornice.visible = false;

    const edgesGeometry = new THREE.EdgesGeometry(corniceGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: styleConfig.edgeColor,
      transparent: true,
      opacity: 0.7
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edges.position.copy(cornice.position);
    edges.visible = false;

    building.mesh.add(cornice);
    building.mesh.add(edges);
    building.decorativeMeshes.push(cornice, edges);
  }

  private createRoofAntennas(building: IBuilding, styleConfig: BuildingStyleConfig): void {
    const geometry = styleConfig.geometry;
    const totalHeight = building.targetHeight;
    const antennaMaterial = new THREE.MeshStandardMaterial({
      color: styleConfig.edgeColor,
      metalness: 0.95,
      roughness: 0.1,
      emissive: styleConfig.edgeColor,
      emissiveIntensity: 0.2
    });

    for (let i = 0; i < geometry.roofAntennaCount; i++) {
      const angle = (i / geometry.roofAntennaCount) * Math.PI * 2;
      const radius = Math.min(building.width, building.depth) * 0.3;
      const height = 0.8 + Math.random() * 1.5;
      
      const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.04, height, 6);
      const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
      antenna.position.set(
        Math.cos(angle) * radius,
        totalHeight + height / 2 + styleConfig.geometry.corniceHeight,
        Math.sin(angle) * radius
      );
      antenna.visible = false;

      const tipGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const tipMaterial = new THREE.MeshBasicMaterial({
        color: styleConfig.accentColor,
        transparent: true,
        opacity: 0.8
      });
      const tip = new THREE.Mesh(tipGeometry, tipMaterial);
      tip.position.set(
        antenna.position.x,
        totalHeight + height + styleConfig.geometry.corniceHeight,
        antenna.position.z
      );
      tip.visible = false;

      building.mesh.add(antenna);
      building.mesh.add(tip);
      building.decorativeMeshes.push(antenna, tip);
    }
  }

  private createBeaconLight(building: IBuilding, styleConfig: BuildingStyleConfig): void {
    const beaconY = building.targetHeight + styleConfig.geometry.corniceHeight + 1;
    
    const beaconGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const beaconMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0
    });
    const beaconMesh = new THREE.Mesh(beaconGeometry, beaconMaterial);
    beaconMesh.position.y = beaconY;
    beaconMesh.visible = false;
    
    const beaconLight = new THREE.PointLight(0xffff00, 0, 15);
    beaconLight.position.y = beaconY;
    beaconLight.castShadow = false;

    building.beaconLight = beaconLight;
    building.beaconMesh = beaconMesh;
    building.mesh.add(beaconMesh);
    building.mesh.add(beaconLight);

    const supportGeometry = new THREE.CylinderGeometry(0.05, 0.08, 1, 8);
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: styleConfig.edgeColor,
      metalness: 0.9,
      roughness: 0.2
    });
    const supportMesh = new THREE.Mesh(supportGeometry, supportMaterial);
    supportMesh.position.y = beaconY - 0.5;
    supportMesh.visible = false;
    building.mesh.add(supportMesh);
    building.decorativeMeshes.push(supportMesh);
  }

  private createBuildingBase(building: IBuilding, styleConfig: BuildingStyleConfig): void {
    const geometry = styleConfig.geometry;
    if (!geometry.hasBase) return;

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(styleConfig.bodyColor).multiplyScalar(0.5),
      roughness: 0.9,
      metalness: 0.1
    });

    for (let step = 0; step < geometry.baseStepCount; step++) {
      const stepRatio = 1 - step * 0.15;
      const stepHeight = geometry.baseHeight / geometry.baseStepCount;
      const stepGeometry = new THREE.BoxGeometry(
        building.width * stepRatio + 0.2 * step,
        stepHeight * 0.9,
        building.depth * stepRatio + 0.2 * step
      );
      const stepMesh = new THREE.Mesh(stepGeometry, baseMaterial);
      stepMesh.position.y = step * stepHeight + stepHeight / 2;
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      
      building.mesh.add(stepMesh);
      building.decorativeMeshes.push(stepMesh);
    }
  }

  updateGrowth(deltaTime: number): void {
    this.physicsSystem.update(deltaTime);

    for (const building of this.buildings) {
      if (building.growthTimeline && building.growthTimeline.playing) {
        building.growthTimeline.update(deltaTime);
      }

      building.mesh.position.x = building.physicsBody.position.x;
      building.mesh.position.z = building.physicsBody.position.z;
      building.position.x = building.physicsBody.position.x;
      building.position.z = building.physicsBody.position.z;

      if (building.animationState === AnimationState.GROWING_FLOOR && building.isGrowing) {
        const now = performance.now();
        if (now - building.lastGrowthTime >= GROWTH_INTERVAL && building.currentFloor < building.targetFloor) {
          this.addFloor(building);
          building.lastGrowthTime = now;
        }

        const targetHeight = building.currentFloor * FLOOR_HEIGHT;
        building.currentHeight += (targetHeight - building.currentHeight) * 0.1;
      }
    }
  }

  private addFloor(building: IBuilding): void {
    if (building.currentFloor >= building.targetFloor) {
      building.isComplete = true;
      building.isGrowing = false;
      building.animationState = AnimationState.COMPLETE;
      this.activateBeaconLight(building);
      this.revealDecorations(building);
      this.checkAndMergeLOD();
      return;
    }

    const floorMesh = building.floors[building.currentFloor];
    if (floorMesh) {
      floorMesh.visible = true;
      floorMesh.scale.set(0.8, 0.8, 0.8);
      
      const edges = building.mesh.children.find(
        child => child instanceof THREE.LineSegments && 
        Math.abs(child.position.y - floorMesh.position.y) < 0.1
      ) as THREE.LineSegments;
      
      if (edges) {
        edges.visible = true;
      }

      const windowStartIndex = building.currentFloor * 8;
      const windowEndIndex = Math.min(windowStartIndex + 8, building.windowLights.length);
      for (let wi = windowStartIndex; wi < windowEndIndex; wi++) {
        if (building.windowLights[wi]) {
          building.windowLights[wi].visible = true;
        }
      }

      const startTime = performance.now();
      const duration = 300;
      
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const scale = 0.8 + eased * 0.2;
        floorMesh.scale.set(scale, scale, scale);
        
        const mat = floorMesh.material as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color(STYLE_CONFIGS[building.style].edgeColor);
        mat.emissiveIntensity = (1 - progress) * 0.5;
        
        if (edges) {
          const edgeMat = edges.material as THREE.LineBasicMaterial;
          edgeMat.opacity = 0.4 + eased * 0.4;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          mat.emissiveIntensity = 0;
        }
      };
      animate();

      if (this.effectManager) {
        const floorY = building.currentFloor * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
        this.effectManager.triggerFloorGrowthSparks(
          new THREE.Vector3(building.position.x, floorY, building.position.z),
          FLOOR_HEIGHT
        );
      }
    }

    building.currentFloor++;
    building.growthProgress = building.currentFloor / building.targetFloor;
  }

  private revealDecorations(building: IBuilding): void {
    let delay = 0;
    for (const deco of building.decorativeMeshes) {
      setTimeout(() => {
        if (!deco.visible) {
          deco.visible = true;
          const mat = (deco as THREE.Mesh).material;
          if (mat && (mat as THREE.Material).transparent) {
            (mat as THREE.MeshBasicMaterial).opacity = 0;
            const startTime = performance.now();
            const anim = () => {
              const p = Math.min((performance.now() - startTime) / 400, 1);
              (mat as THREE.MeshBasicMaterial).opacity = p * 0.8;
              if (p < 1) requestAnimationFrame(anim);
            };
            anim();
          }
        }
      }, delay);
      delay += 30;
    }
  }

  private activateBeaconLight(building: IBuilding): void {
    if (building.beaconLight && building.beaconMesh) {
      building.beaconLight.visible = true;
      building.beaconMesh.visible = true;
      
      const startTime = performance.now();
      const duration = 1000;
      
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        building.beaconLight!.intensity = eased * 2;
        (building.beaconMesh!.material as THREE.MeshBasicMaterial).opacity = eased;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }
  }

  checkAndMergeLOD(): void {
    const completeBuildings = this.buildings.filter(b => b.isComplete && b.lodLevel === LODLevel.HIGH);
    
    if (this.buildings.length < MAX_BUILDINGS_BEFORE_MERGE) {
      if (this.isMerged) {
        this.clearMergedMeshes();
      }
      return;
    }

    if (completeBuildings.length < 10) return;

    this.performLODMerge(completeBuildings);
  }

  private performLODMerge(buildings: IBuilding[]): void {
    this.clearMergedMeshes();

    const styleGroups: Map<BuildingStyle, IBuilding[]> = new Map();
    
    for (const b of buildings) {
      const list = styleGroups.get(b.style) || [];
      list.push(b);
      styleGroups.set(b.style, list);
    }

    for (const [style, styleBuildings] of styleGroups) {
      if (styleBuildings.length < 3) continue;
      
      const mergedMesh = this.mergeBuildingGroup(styleBuildings, style);
      if (mergedMesh) {
        this.lodMergedMeshes.set(style, mergedMesh);
        this.sceneManager.getScene().add(mergedMesh);
        
        for (const b of styleBuildings) {
          b.mesh.visible = false;
          b.lodLevel = LODLevel.MERGED;
        }
      }
    }

    this.isMerged = true;
  }

  private mergeBuildingGroup(buildings: IBuilding[], style: BuildingStyle): THREE.Mesh | null {
    if (buildings.length === 0) return null;

    const styleConfig = STYLE_CONFIGS[style];
    const geometries: THREE.BufferGeometry[] = [];
    const tempMatrix = new THREE.Matrix4();

    for (const building of buildings) {
      building.mesh.updateMatrixWorld(true);

      for (const floor of building.floors) {
        if (!floor.visible) continue;
        
        const cloned = floor.geometry.clone();
        tempMatrix.copy(floor.matrixWorld);
        cloned.applyMatrix4(tempMatrix);
        geometries.push(cloned);
      }
    }

    if (geometries.length === 0) return null;

    const mergedGeometry = this.mergeGeometries(geometries);
    const mergedMaterial = new THREE.MeshStandardMaterial({
      color: styleConfig.bodyColor,
      roughness: Math.min(styleConfig.roughness + 0.2, 1),
      metalness: Math.max(styleConfig.metalness - 0.2, 0)
    });

    const mergedMesh = new THREE.Mesh(mergedGeometry, mergedMaterial);
    mergedMesh.castShadow = true;
    mergedMesh.receiveShadow = true;

    geometries.forEach(g => g.dispose());

    return mergedMesh;
  }

  private mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    let totalPositions = 0;
    let totalNormals = 0;
    let totalUvs = 0;
    let totalIndices = 0;

    for (const geo of geometries) {
      totalPositions += geo.attributes.position.count * 3;
      totalNormals += geo.attributes.normal.count * 3;
      totalUvs += geo.attributes.uv ? geo.attributes.uv.count * 2 : 0;
      totalIndices += geo.index ? geo.index.count : geo.attributes.position.count;
    }

    const positions = new Float32Array(totalPositions);
    const normals = new Float32Array(totalNormals);
    const uvs = totalUvs > 0 ? new Float32Array(totalUvs) : null;
    const indices = new Uint32Array(totalIndices);

    let posOffset = 0;
    let normOffset = 0;
    let uvOffset = 0;
    let idxOffset = 0;
    let vertexOffset = 0;

    for (const geo of geometries) {
      const posAttr = geo.attributes.position.array as Float32Array;
      positions.set(posAttr, posOffset);
      posOffset += posAttr.length;

      const normAttr = geo.attributes.normal.array as Float32Array;
      normals.set(normAttr, normOffset);
      normOffset += normAttr.length;

      if (uvs && geo.attributes.uv) {
        const uvAttr = geo.attributes.uv.array as Float32Array;
        uvs.set(uvAttr, uvOffset);
        uvOffset += uvAttr.length;
      }

      if (geo.index) {
        const idxAttr = geo.index.array as Uint32Array;
        for (let i = 0; i < idxAttr.length; i++) {
          indices[idxOffset + i] = idxAttr[i] + vertexOffset;
        }
        idxOffset += idxAttr.length;
      } else {
        for (let i = 0; i < geo.attributes.position.count; i++) {
          indices[idxOffset + i] = i + vertexOffset;
        }
        idxOffset += geo.attributes.position.count;
      }

      vertexOffset += geo.attributes.position.count;
    }

    const result = new THREE.BufferGeometry();
    result.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    result.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    if (uvs) {
      result.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }
    result.setIndex(new THREE.BufferAttribute(indices, 1));

    return result;
  }

  private clearMergedMeshes(): void {
    for (const [style, mesh] of this.lodMergedMeshes) {
      this.sceneManager.getScene().remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.lodMergedMeshes.clear();

    for (const b of this.buildings) {
      if (b.lodLevel === LODLevel.MERGED) {
        b.mesh.visible = true;
        b.lodLevel = LODLevel.HIGH;
      }
    }
    this.isMerged = false;
  }

  getBuildings(): IBuilding[] {
    return this.buildings;
  }

  getBuildingCount(): number {
    return this.buildings.length;
  }

  dispose(): void {
    this.clearMergedMeshes();
    
    for (const building of this.buildings) {
      this.sceneManager.getScene().remove(building.mesh);
      building.floors.forEach(floor => {
        floor.geometry.dispose();
        (floor.material as THREE.Material).dispose();
      });
      building.windowLights.forEach(light => {
        light.geometry.dispose();
        (light.material as THREE.Material).dispose();
      });
      building.decorativeMeshes.forEach(deco => {
        if ((deco as THREE.Mesh).geometry) {
          (deco as THREE.Mesh).geometry.dispose();
        }
        if ((deco as THREE.Mesh).material) {
          const mat = (deco as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach(m => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });
      if (building.beaconLight) {
        building.beaconLight.dispose();
      }
      if (building.growthTimeline) {
        building.growthTimeline.dispose();
      }
    }
    this.buildings = [];
    this.occupiedCells.clear();
    this.physicsSystem.dispose();
  }
}
