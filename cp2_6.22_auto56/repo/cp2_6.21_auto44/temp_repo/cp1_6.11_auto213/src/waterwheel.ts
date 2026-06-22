import * as THREE from 'three';

export class WaterWheel {
    public group: THREE.Group;
    public blades: THREE.Mesh[] = [];
    public axle: THREE.Mesh;
    public rotationAngle: number = 0;
    public angularVelocity: number = 0;
    public isDragging: boolean = false;
    public dialGroup: THREE.Group;
    public indicatorLine: THREE.Line;
    
    private waterFlowForce: number = 0.002;
    private damping: number = 0.5;
    private bladeCount: number = 12;
    private wheelRadius: number = 4;
    private lastMouseAngle: number = 0;
    private supports: THREE.Mesh[] = [];

    constructor() {
        this.group = new THREE.Group();
        this.dialGroup = new THREE.Group();
        
        this.createAxle();
        this.createBlades();
        this.createSupports();
        this.createDial();
        this.positionComponents();
    }

    private createAxle(): void {
        const axleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 32);
        const axleMaterial = new THREE.MeshStandardMaterial({
            color: 0x696969,
            roughness: 0.8,
            metalness: 0.3
        });
        this.axle = new THREE.Mesh(axleGeometry, axleMaterial);
        this.axle.rotation.z = Math.PI / 2;
        this.axle.castShadow = true;
        this.axle.receiveShadow = true;
        this.group.add(this.axle);
    }

    private createBlades(): void {
        const bladeMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B5A2B,
            roughness: 0.7,
            metalness: 0.1
        });

        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0xCD853F,
            roughness: 0.6,
            metalness: 0.2
        });

        for (let i = 0; i < this.bladeCount; i++) {
            const angle = (i / this.bladeCount) * Math.PI * 2;
            const bladeGroup = new THREE.Group();

            const curveShape = new THREE.Shape();
            const bladeWidth = 1.2;
            const bladeThickness = 0.15;
            const bladeLength = 2.5;

            curveShape.moveTo(-bladeLength / 2, -bladeThickness / 2);
            curveShape.lineTo(bladeLength / 2, -bladeThickness / 2);
            curveShape.quadraticCurveTo(bladeLength / 2 + 0.2, 0, bladeLength / 2, bladeThickness / 2);
            curveShape.lineTo(-bladeLength / 2, bladeThickness / 2);
            curveShape.quadraticCurveTo(-bladeLength / 2 - 0.2, 0, -bladeLength / 2, -bladeThickness / 2);

            const extrudeSettings = {
                depth: bladeWidth,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.02,
                bevelSegments: 1
            };

            const bladeGeometry = new THREE.ExtrudeGeometry(curveShape, extrudeSettings);
            const blade = new THREE.Mesh(bladeGeometry, i % 2 === 0 ? bladeMaterial : accentMaterial);
            blade.castShadow = true;
            blade.receiveShadow = true;
            blade.position.z = -bladeWidth / 2;
            bladeGroup.add(blade);

            const woodLineMaterial = new THREE.LineBasicMaterial({ color: 0x5C4033 });
            for (let j = 0; j < 3; j++) {
                const woodLinePoints: THREE.Vector3[] = [];
                const yOffset = -0.05 + j * 0.05;
                woodLinePoints.push(new THREE.Vector3(-bladeLength / 2 + 0.2, yOffset, bladeWidth * 0.25));
                woodLinePoints.push(new THREE.Vector3(bladeLength / 2 - 0.2, yOffset, bladeWidth * 0.25));
                const woodLineGeometry = new THREE.BufferGeometry().setFromPoints(woodLinePoints);
                const woodLine = new THREE.Line(woodLineGeometry, woodLineMaterial);
                bladeGroup.add(woodLine);

                const woodLine2Points: THREE.Vector3[] = [];
                woodLine2Points.push(new THREE.Vector3(-bladeLength / 2 + 0.2, yOffset, -bladeWidth * 0.25));
                woodLine2Points.push(new THREE.Vector3(bladeLength / 2 - 0.2, yOffset, -bladeWidth * 0.25));
                const woodLine2Geometry = new THREE.BufferGeometry().setFromPoints(woodLine2Points);
                const woodLine2 = new THREE.Line(woodLine2Geometry, woodLineMaterial);
                bladeGroup.add(woodLine2);
            }

            bladeGroup.position.x = Math.cos(angle) * this.wheelRadius;
            bladeGroup.position.y = Math.sin(angle) * this.wheelRadius;
            bladeGroup.rotation.z = angle + Math.PI / 2;

            this.blades.push(blade);
            this.group.add(bladeGroup);
        }
    }

    private createSupports(): void {
        const supportMaterial = new THREE.MeshStandardMaterial({
            color: 0x5C4033,
            roughness: 0.8,
            metalness: 0.1
        });

        const supportHeight = 5;

        for (let side = -1; side <= 1; side += 2) {
            const supportGroup = new THREE.Group();

            const verticalPostGeometry = new THREE.CylinderGeometry(0.2, 0.25, supportHeight, 8);
            const verticalPost = new THREE.Mesh(verticalPostGeometry, supportMaterial);
            verticalPost.position.y = supportHeight / 2;
            verticalPost.castShadow = true;
            verticalPost.receiveShadow = true;
            supportGroup.add(verticalPost);

            const diagonalGeometry = new THREE.CylinderGeometry(0.12, 0.12, supportHeight * 0.7, 8);
            const diagonal1 = new THREE.Mesh(diagonalGeometry, supportMaterial);
            diagonal1.position.set(1.2, supportHeight * 0.4, 0);
            diagonal1.rotation.z = -Math.PI / 4;
            diagonal1.castShadow = true;
            supportGroup.add(diagonal1);

            const diagonal2 = new THREE.Mesh(diagonalGeometry, supportMaterial);
            diagonal2.position.set(-1.2, supportHeight * 0.4, 0);
            diagonal2.rotation.z = Math.PI / 4;
            diagonal2.castShadow = true;
            supportGroup.add(diagonal2);

            const baseGeometry = new THREE.BoxGeometry(2, 0.3, 1.5);
            const base = new THREE.Mesh(baseGeometry, supportMaterial);
            base.position.y = 0.15;
            base.castShadow = true;
            base.receiveShadow = true;
            supportGroup.add(base);

            supportGroup.position.z = side * 1.5;
            this.supports.push(verticalPost);
            this.group.add(supportGroup);
        }
    }

    private createDial(): void {
        const dialRadius = 1.5;

        const dialBackGeometry = new THREE.CircleGeometry(dialRadius, 64);
        const dialBackMaterial = new THREE.MeshBasicMaterial({
            color: 0x2F1810,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const dialBack = new THREE.Mesh(dialBackGeometry, dialBackMaterial);
        dialBack.position.z = 2;
        this.dialGroup.add(dialBack);

        const tickMaterial = new THREE.LineBasicMaterial({ color: 0xFFD700 });
        for (let i = 0; i < 36; i++) {
            const angle = (i * 10 * Math.PI) / 180;
            const innerRadius = dialRadius - 0.1;
            const outerRadius = dialRadius;

            const points: THREE.Vector3[] = [
                new THREE.Vector3(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius, 2.01),
                new THREE.Vector3(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius, 2.01)
            ];
            const tickGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const tick = new THREE.Line(tickGeometry, tickMaterial);
            this.dialGroup.add(tick);
        }

        const indicatorPoints: THREE.Vector3[] = [
            new THREE.Vector3(0, 0, 2.02),
            new THREE.Vector3(0, dialRadius - 0.15, 2.02)
        ];
        const indicatorGeometry = new THREE.BufferGeometry().setFromPoints(indicatorPoints);
        const indicatorMaterial = new THREE.LineBasicMaterial({ color: 0xFF4500, linewidth: 2 });
        this.indicatorLine = new THREE.Line(indicatorGeometry, indicatorMaterial);
        this.dialGroup.add(this.indicatorLine);

        this.group.add(this.dialGroup);
    }

    private positionComponents(): void {
        this.group.position.y = 5;
    }

    public update(deltaTime: number, isWaterFlowing: boolean): void {
        if (!this.isDragging) {
            if (isWaterFlowing) {
                const bladeUnderWater = this.checkBladesUnderWater();
                if (bladeUnderWater) {
                    this.angularVelocity += this.waterFlowForce * deltaTime * 60;
                }
            }

            this.angularVelocity *= (1 - this.damping * deltaTime);
            this.rotationAngle += this.angularVelocity * deltaTime;
        }

        this.group.rotation.z = this.rotationAngle;
        this.indicatorLine.rotation.z = this.rotationAngle;
    }

    private checkBladesUnderWater(): boolean {
        const waterLevelY = 1;
        for (let i = 0; i < this.bladeCount; i++) {
            const bladeAngle = this.rotationAngle + (i / this.bladeCount) * Math.PI * 2;
            const bladeY = 5 + Math.sin(bladeAngle) * this.wheelRadius;
            if (bladeY < waterLevelY + 2 && bladeY > waterLevelY - 1) {
                return true;
            }
        }
        return false;
    }

    public getRPM(): number {
        return (this.angularVelocity * 60) / (Math.PI * 2);
    }

    public getAngle(): number {
        let angle = this.rotationAngle % (Math.PI * 2);
        if (angle < 0) angle += Math.PI * 2;
        return (angle * 180) / Math.PI;
    }

    public startDrag(mouseAngle: number): void {
        this.isDragging = true;
        this.lastMouseAngle = mouseAngle;
        this.angularVelocity = 0;
    }

    public updateDrag(mouseAngle: number): void {
        if (this.isDragging) {
            const deltaAngle = mouseAngle - this.lastMouseAngle;
            this.rotationAngle += deltaAngle;
            this.angularVelocity = deltaAngle;
            this.lastMouseAngle = mouseAngle;
        }
    }

    public endDrag(): void {
        this.isDragging = false;
    }

    public reset(): void {
        this.rotationAngle = 0;
        this.angularVelocity = 0;
        this.isDragging = false;
    }

    public getWorldPosition(): THREE.Vector3 {
        return this.group.position.clone();
    }

    public getWheelRadius(): number {
        return this.wheelRadius;
    }
}
