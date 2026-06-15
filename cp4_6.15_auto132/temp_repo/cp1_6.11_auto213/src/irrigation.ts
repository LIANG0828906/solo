import * as THREE from 'three';

interface FieldCell {
    mesh: THREE.Mesh;
    moisture: number;
    targetMoisture: number;
    row: number;
    col: number;
    gateId: number;
}

export class IrrigationSystem {
    public group: THREE.Group;
    private fieldGrid: FieldCell[][] = [];
    private gridSize: number = 8;
    private cellSize: number = 0.8;
    private dryColor: THREE.Color = new THREE.Color(0x8B7355);
    private wetColor: THREE.Color = new THREE.Color(0x3C6E47);
    private transitionDuration: number = 2;
    private totalFields: number;
    private gateFieldMapping: Map<number, { row: number; startCol: number; endCol: number }> = new Map();

    constructor() {
        this.group = new THREE.Group();
        this.totalFields = this.gridSize * this.gridSize;
        this.createFieldGrid();
        this.setupGateFieldMapping();
    }

    private createFieldGrid(): void {
        const fieldMaterial = new THREE.MeshStandardMaterial({
            color: this.dryColor,
            roughness: 0.9,
            metalness: 0.0
        });

        const gridGeometry = new THREE.PlaneGeometry(this.cellSize * 0.9, this.cellSize * 0.9);

        const totalWidth = this.gridSize * this.cellSize;
        const startX = 11 - totalWidth / 2 + this.cellSize / 2;
        const startZ = -this.gridSize * this.cellSize / 2 + this.cellSize / 2;

        for (let row = 0; row < this.gridSize; row++) {
            this.fieldGrid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cellGeometry = gridGeometry.clone();
                const cellMaterial = fieldMaterial.clone();

                const cell = new THREE.Mesh(cellGeometry, cellMaterial);
                cell.rotation.x = -Math.PI / 2;
                cell.position.set(
                    startX + col * this.cellSize,
                    0.01,
                    startZ + row * this.cellSize
                );
                cell.receiveShadow = true;

                const gateId = Math.floor(row / (this.gridSize / 7));
                const finalGateId = Math.min(gateId, 6);

                this.fieldGrid[row][col] = {
                    mesh: cell,
                    moisture: 0,
                    targetMoisture: 0,
                    row,
                    col,
                    gateId: finalGateId
                };

                this.group.add(cell);
            }
        }

        this.createFieldBorders();
        this.createGround();
    }

    private createFieldBorders(): void {
        const borderMaterial = new THREE.MeshStandardMaterial({
            color: 0x5C4033,
            roughness: 0.8
        });

        const totalWidth = this.gridSize * this.cellSize;
        const borderThickness = 0.1;
        const borderHeight = 0.15;

        const horizontalBorderGeometry = new THREE.BoxGeometry(totalWidth + borderThickness * 2, borderHeight, borderThickness);
        const verticalBorderGeometry = new THREE.BoxGeometry(borderThickness, borderHeight, totalWidth + borderThickness * 2);

        const centerX = 11;
        const centerZ = 0;

        const topBorder = new THREE.Mesh(horizontalBorderGeometry, borderMaterial);
        topBorder.position.set(centerX, borderHeight / 2, centerZ - totalWidth / 2 - borderThickness / 2);
        topBorder.castShadow = true;
        topBorder.receiveShadow = true;
        this.group.add(topBorder);

        const bottomBorder = new THREE.Mesh(horizontalBorderGeometry, borderMaterial);
        bottomBorder.position.set(centerX, borderHeight / 2, centerZ + totalWidth / 2 + borderThickness / 2);
        bottomBorder.castShadow = true;
        bottomBorder.receiveShadow = true;
        this.group.add(bottomBorder);

        const leftBorder = new THREE.Mesh(verticalBorderGeometry, borderMaterial);
        leftBorder.position.set(centerX - totalWidth / 2 - borderThickness / 2, borderHeight / 2, centerZ);
        leftBorder.castShadow = true;
        leftBorder.receiveShadow = true;
        this.group.add(leftBorder);

        const rightBorder = new THREE.Mesh(verticalBorderGeometry, borderMaterial);
        rightBorder.position.set(centerX + totalWidth / 2 + borderThickness / 2, borderHeight / 2, centerZ);
        rightBorder.castShadow = true;
        rightBorder.receiveShadow = true;
        this.group.add(rightBorder);

        for (let i = 1; i < this.gridSize; i++) {
            const dividerGeometry = new THREE.BoxGeometry(totalWidth + borderThickness * 2, borderHeight * 0.6, borderThickness * 0.6);
            const divider = new THREE.Mesh(dividerGeometry, borderMaterial);
            const zPos = centerZ - totalWidth / 2 + i * this.cellSize;
            divider.position.set(centerX, borderHeight * 0.3, zPos);
            divider.castShadow = true;
            this.group.add(divider);
        }

        for (let i = 1; i < this.gridSize; i++) {
            const dividerGeometry = new THREE.BoxGeometry(borderThickness * 0.6, borderHeight * 0.6, totalWidth + borderThickness * 2);
            const divider = new THREE.Mesh(dividerGeometry, borderMaterial);
            const xPos = centerX - totalWidth / 2 + i * this.cellSize;
            divider.position.set(xPos, borderHeight * 0.3, centerZ);
            divider.castShadow = true;
            this.group.add(divider);
        }
    }

    private createGround(): void {
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x6B4423,
            roughness: 0.9
        });

        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.group.add(ground);
    }

    private setupGateFieldMapping(): void {
        const rowsPerGate = Math.ceil(this.gridSize / 7);
        for (let gateId = 0; gateId < 7; gateId++) {
            const startRow = gateId * rowsPerGate;
            const endRow = Math.min(startRow + rowsPerGate, this.gridSize) - 1;
            this.gateFieldMapping.set(gateId, {
                row: gateId,
                startCol: 0,
                endCol: this.gridSize - 1
            });
        }
    }

    public update(deltaTime: number, gateFlows: Map<number, number>): void {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.fieldGrid[row][col];
                const gateId = cell.gateId;
                const flow = gateFlows.get(gateId) || 0;

                if (flow > 0) {
                    cell.targetMoisture = Math.min(1, cell.targetMoisture + flow * deltaTime * 0.3);
                }

                if (cell.moisture < cell.targetMoisture) {
                    cell.moisture = Math.min(
                        cell.targetMoisture,
                        cell.moisture + deltaTime / this.transitionDuration
                    );
                    this.updateCellColor(cell);
                }

                if (flow > 0 && cell.moisture > 0.5) {
                    this.spreadMoisture(row, col, deltaTime);
                }
            }
        }
    }

    private spreadMoisture(row: number, col: number, deltaTime: number): void {
        const neighbors = [
            { r: row - 1, c: col },
            { r: row + 1, c: col },
            { r: row, c: col - 1 },
            { r: row, c: col + 1 }
        ];

        for (const neighbor of neighbors) {
            if (neighbor.r >= 0 && neighbor.r < this.gridSize &&
                neighbor.c >= 0 && neighbor.c < this.gridSize) {
                const neighborCell = this.fieldGrid[neighbor.r][neighbor.c];
                const currentCell = this.fieldGrid[row][col];

                if (neighborCell.moisture < currentCell.moisture - 0.1) {
                    neighborCell.targetMoisture = Math.min(
                        1,
                        neighborCell.targetMoisture + deltaTime * 0.1
                    );
                }
            }
        }
    }

    private updateCellColor(cell: FieldCell): void {
        const material = cell.mesh.material as THREE.MeshStandardMaterial;
        const newColor = this.dryColor.clone().lerp(this.wetColor, cell.moisture);
        material.color.copy(newColor);
    }

    public getIrrigatedPercentage(): number {
        let irrigatedCount = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.fieldGrid[row][col].moisture >= 0.9) {
                    irrigatedCount++;
                }
            }
        }
        return (irrigatedCount / this.totalFields) * 100;
    }

    public getIrrigatedCount(): number {
        let count = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.fieldGrid[row][col].moisture >= 0.9) {
                    count++;
                }
            }
        }
        return count;
    }

    public getTotalFields(): number {
        return this.totalFields;
    }

    public reset(): void {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.fieldGrid[row][col];
                cell.moisture = 0;
                cell.targetMoisture = 0;
                this.updateCellColor(cell);
            }
        }
    }

    public getFieldForGate(gateId: number): { row: number; col: number } {
        const zPos = -this.gridSize * this.cellSize / 2 + this.cellSize / 2 + gateId * this.cellSize;
        const row = Math.min(gateId, this.gridSize - 1);
        return { row, col: 0 };
    }
}
