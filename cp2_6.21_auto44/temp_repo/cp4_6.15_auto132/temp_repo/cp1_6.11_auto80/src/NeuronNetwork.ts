import * as THREE from 'three';

export interface NeuronNode {
    id: number;
    mesh: THREE.Mesh;
    position: THREE.Vector3;
    connections: NeuronConnection[];
    baseScale: number;
    phase: number;
}

export interface NeuronConnection {
    id: number;
    mesh: THREE.Mesh;
    startNode: NeuronNode;
    endNode: NeuronNode;
    midPoint: THREE.Vector3;
    length: number;
}

export class NeuronNetwork {
    public nodes: NeuronNode[] = [];
    public connections: NeuronConnection[] = [];
    private group: THREE.Group;
    private spaceSize: number = 30;
    private minDistance: number = 8;
    private neuronRadius: number = 0.5;
    private tubeRadius: number = 0.15;
    private nodeCount: number;

    constructor(scene: THREE.Scene, nodeCount?: number) {
        this.group = new THREE.Group();
        scene.add(this.group);
        this.nodeCount = nodeCount ?? Math.floor(Math.random() * 21) + 40;
        this.generateNetwork();
    }

    private generateNetwork(): void {
        this.generateNodes();
        this.generateConnections();
    }

    private generateNodes(): void {
        const halfSpace = this.spaceSize / 2;

        for (let i = 0; i < this.nodeCount; i++) {
            const position = new THREE.Vector3(
                (Math.random() * this.spaceSize - halfSpace) * 0.95,
                (Math.random() * this.spaceSize - halfSpace) * 0.95,
                (Math.random() * this.spaceSize - halfSpace) * 0.95
            );

            position.x += (Math.random() - 0.5) * 0.5;
            position.y += (Math.random() - 0.5) * 0.5;
            position.z += (Math.random() - 0.5) * 0.5;

            const geometry = new THREE.SphereGeometry(this.neuronRadius, 32, 32);
            
            const material = new THREE.MeshPhongMaterial({
                color: 0x9B59B6,
                transparent: true,
                opacity: 0.85,
                emissive: 0x9B59B6,
                emissiveIntensity: 0.4,
                shininess: 100
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            mesh.userData = { type: 'neuron', id: i };

            this.group.add(mesh);

            this.nodes.push({
                id: i,
                mesh,
                position: position.clone(),
                connections: [],
                baseScale: 1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    private generateConnections(): void {
        let connectionId = 0;
        const colorStart = new THREE.Color(0x4A90D9);
        const colorEnd = new THREE.Color(0x7B3FA2);

        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const nodeA = this.nodes[i];
                const nodeB = this.nodes[j];
                const distance = nodeA.position.distanceTo(nodeB.position);

                if (distance < this.minDistance && distance > 1.5) {
                    const path = new THREE.LineCurve3(
                        nodeA.position.clone(),
                        nodeB.position.clone()
                    );

                    const tubeGeometry = new THREE.TubeGeometry(path, 20, this.tubeRadius, 8, false);

                    const colors = new Float32Array(tubeGeometry.attributes.position.count * 3);
                    const vertexCount = tubeGeometry.attributes.position.count;
                    
                    for (let v = 0; v < vertexCount; v++) {
                        const t = v / vertexCount;
                        const color = colorStart.clone().lerp(colorEnd, t);
                        colors[v * 3] = color.r;
                        colors[v * 3 + 1] = color.g;
                        colors[v * 3 + 2] = color.b;
                    }
                    tubeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

                    const material = new THREE.MeshPhongMaterial({
                        vertexColors: true,
                        transparent: true,
                        opacity: 0.7,
                        side: THREE.DoubleSide
                    });

                    const mesh = new THREE.Mesh(tubeGeometry, material);
                    mesh.userData = { type: 'connection', id: connectionId };
                    this.group.add(mesh);

                    const midPoint = new THREE.Vector3().addVectors(
                        nodeA.position,
                        nodeB.position
                    ).multiplyScalar(0.5);

                    const connection: NeuronConnection = {
                        id: connectionId,
                        mesh,
                        startNode: nodeA,
                        endNode: nodeB,
                        midPoint: midPoint.clone(),
                        length: distance
                    };

                    this.connections.push(connection);
                    nodeA.connections.push(connection);
                    nodeB.connections.push(connection);
                    connectionId++;
                }
            }
        }
    }

    public update(deltaTime: number, time: number, paused: boolean): void {
        if (paused) return;

        for (const node of this.nodes) {
            const breathScale = 1 + Math.sin(time * 0.5 + node.phase) * 0.03;
            node.mesh.scale.setScalar(breathScale);
        }
    }

    public getNodeById(id: number): NeuronNode | undefined {
        return this.nodes.find(n => n.id === id);
    }

    public getNodeConnections(node: NeuronNode): NeuronConnection[] {
        return node.connections;
    }

    public getGroup(): THREE.Group {
        return this.group;
    }
}
