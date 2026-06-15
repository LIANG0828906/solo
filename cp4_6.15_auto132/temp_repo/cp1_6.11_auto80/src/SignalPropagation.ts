import * as THREE from 'three';
import { NeuronNode, NeuronConnection, NeuronNetwork } from './NeuronNetwork';

interface SignalPulse {
    id: number;
    mesh: THREE.Mesh;
    trail: THREE.Mesh[];
    connection: NeuronConnection;
    progress: number;
    speed: number;
    direction: 'forward' | 'backward';
    depth: number;
    triggeredMidpoint: boolean;
    active: boolean;
}

interface ShockWave {
    id: number;
    mesh: THREE.Mesh;
    position: THREE.Vector3;
    life: number;
    maxLife: number;
    startRadius: number;
    endRadius: number;
    startColor: THREE.Color;
    endColor: THREE.Color;
    active: boolean;
}

interface FlowLine {
    id: number;
    line: THREE.Line;
    points: THREE.Vector3[];
    life: number;
    maxLife: number;
    active: boolean;
}

export class SignalPropagation {
    private scene: THREE.Scene;
    private network: NeuronNetwork;
    private pulses: SignalPulse[] = [];
    private shockWaves: ShockWave[] = [];
    private flowLines: FlowLine[] = [];
    
    private pulsePool: SignalPulse[] = [];
    private shockWavePool: ShockWave[] = [];
    private flowLinePool: FlowLine[] = [];
    
    private maxPulses: number = 50;
    private maxShockWaves: number = 30;
    private maxFlowLines: number = 100;
    
    private pulseIdCounter: number = 0;
    private shockWaveIdCounter: number = 0;
    private flowLineIdCounter: number = 0;
    
    private nextSignalTime: number = 0;
    private signalIntervalMin: number = 2000;
    private signalIntervalMax: number = 4000;
    private pulseSpeed: number = 0.08;
    private minCascadeDepth: number = 3;
    
    private pulseRadius: number = 0.3;
    private trailLength: number = 5;
    
    private onMidpointCallback?: (connection: NeuronConnection) => void;

    constructor(scene: THREE.Scene, network: NeuronNetwork) {
        this.scene = scene;
        this.network = network;
        this.scheduleNextSignal();
    }

    public setOnMidpointCallback(callback: (connection: NeuronConnection) => void): void {
        this.onMidpointCallback = callback;
    }

    private scheduleNextSignal(): void {
        const delay = Math.random() * (this.signalIntervalMax - this.signalIntervalMin) + this.signalIntervalMin;
        this.nextSignalTime = performance.now() + delay;
    }

    private createPulse(connection: NeuronConnection, direction: 'forward' | 'backward', depth: number): SignalPulse | null {
        if (this.pulses.length >= this.maxPulses) {
            return null;
        }

        let pulse: SignalPulse;

        if (this.pulsePool.length > 0) {
            pulse = this.pulsePool.pop()!;
            pulse.connection = connection;
            pulse.direction = direction;
            pulse.depth = depth;
            pulse.progress = 0;
            pulse.triggeredMidpoint = false;
            pulse.active = true;
            pulse.id = this.pulseIdCounter++;
            pulse.mesh.visible = true;
            for (const t of pulse.trail) {
                t.visible = true;
            }
        } else {
            const geometry = new THREE.SphereGeometry(this.pulseRadius, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00FFCC,
                transparent: true,
                opacity: 0.9
            });
            const mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);

            const trail: THREE.Mesh[] = [];
            for (let i = 0; i < this.trailLength; i++) {
                const trailGeo = new THREE.SphereGeometry(this.pulseRadius * (1 - (i + 1) * 0.15), 12, 12);
                const trailMat = new THREE.MeshBasicMaterial({
                    color: 0x00FFCC,
                    transparent: true,
                    opacity: 0.3 * (1 - (i + 1) / this.trailLength)
                });
                const trailMesh = new THREE.Mesh(trailGeo, trailMat);
                this.scene.add(trailMesh);
                trail.push(trailMesh);
            }

            pulse = {
                id: this.pulseIdCounter++,
                mesh,
                trail,
                connection,
                progress: 0,
                speed: this.pulseSpeed,
                direction,
                depth,
                triggeredMidpoint: false,
                active: true
            };
        }

        this.pulses.push(pulse);
        this.updatePulsePosition(pulse);
        return pulse;
    }

    private createShockWave(position: THREE.Vector3): ShockWave | null {
        if (this.shockWaves.length >= this.maxShockWaves) {
            return null;
        }

        let shockWave: ShockWave;

        if (this.shockWavePool.length > 0) {
            shockWave = this.shockWavePool.pop()!;
            shockWave.position.copy(position);
            shockWave.mesh.position.copy(position);
            shockWave.life = 0;
            shockWave.active = true;
            shockWave.id = this.shockWaveIdCounter++;
            shockWave.mesh.visible = true;
        } else {
            const geometry = new THREE.SphereGeometry(0.5, 32, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00FFCC,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            this.scene.add(mesh);

            shockWave = {
                id: this.shockWaveIdCounter++,
                mesh,
                position: position.clone(),
                life: 0,
                maxLife: 0.6,
                startRadius: 0.5,
                endRadius: 2.0,
                startColor: new THREE.Color(0x00FFCC),
                endColor: new THREE.Color(0xFF6B6B),
                active: true
            };
        }

        this.shockWaves.push(shockWave);
        return shockWave;
    }

    private createFlowLine(connection: NeuronConnection): FlowLine | null {
        if (this.flowLines.length >= this.maxFlowLines) {
            return null;
        }

        let flowLine: FlowLine;
        const points = [connection.startNode.position.clone(), connection.endNode.position.clone()];

        if (this.flowLinePool.length > 0) {
            flowLine = this.flowLinePool.pop()!;
            const geometry = flowLine.line.geometry as THREE.BufferGeometry;
            const positions = new Float32Array(points.length * 3);
            for (let i = 0; i < points.length; i++) {
                positions[i * 3] = points[i].x;
                positions[i * 3 + 1] = points[i].y;
                positions[i * 3 + 2] = points[i].z;
            }
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.attributes.position.needsUpdate = true;
            flowLine.points = points;
            flowLine.life = 0;
            flowLine.active = true;
            flowLine.id = this.flowLineIdCounter++;
            flowLine.line.visible = true;
        } else {
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0xFFD700,
                transparent: true,
                opacity: 0.7
            });
            const line = new THREE.Line(geometry, material);
            this.scene.add(line);

            flowLine = {
                id: this.flowLineIdCounter++,
                line,
                points,
                life: 0,
                maxLife: 1.5,
                active: true
            };
        }

        this.flowLines.push(flowLine);
        return flowLine;
    }

    private updatePulsePosition(pulse: SignalPulse): void {
        const { connection, progress, direction } = pulse;
        const start = direction === 'forward' ? connection.startNode.position : connection.endNode.position;
        const end = direction === 'forward' ? connection.endNode.position : connection.startNode.position;

        const position = new THREE.Vector3().lerpVectors(start, end, progress);
        pulse.mesh.position.copy(position);

        for (let i = 0; i < pulse.trail.length; i++) {
            const trailProgress = Math.max(0, progress - (i + 1) * 0.05);
            const trailPos = new THREE.Vector3().lerpVectors(start, end, trailProgress);
            pulse.trail[i].position.copy(trailPos);
        }
    }

    private triggerSignal(startNode: NeuronNode, depth: number = 0): void {
        const connections = this.network.getNodeConnections(startNode);
        if (connections.length === 0) return;

        const numToTrigger = Math.min(
            Math.floor(Math.random() * 3) + 1,
            connections.length
        );

        const shuffled = [...connections].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, numToTrigger);

        for (const conn of selected) {
            const direction: 'forward' | 'backward' = 
                conn.startNode.id === startNode.id ? 'forward' : 'backward';
            
            this.createPulse(conn, direction, depth);
            this.createFlowLine(conn);
        }
    }

    private onPulseReachEnd(pulse: SignalPulse): void {
        const endNode = pulse.direction === 'forward' 
            ? pulse.connection.endNode 
            : pulse.connection.startNode;

        this.createShockWave(endNode.position);

        if (pulse.depth < this.minCascadeDepth || Math.random() > 0.3) {
            this.triggerSignal(endNode, pulse.depth + 1);
        }
    }

    private returnPulseToPool(pulse: SignalPulse): void {
        pulse.active = false;
        pulse.mesh.visible = false;
        for (const t of pulse.trail) {
            t.visible = false;
        }
        this.pulsePool.push(pulse);
    }

    private returnShockWaveToPool(shockWave: ShockWave): void {
        shockWave.active = false;
        shockWave.mesh.visible = false;
        this.shockWavePool.push(shockWave);
    }

    private returnFlowLineToPool(flowLine: FlowLine): void {
        flowLine.active = false;
        flowLine.line.visible = false;
        this.flowLinePool.push(flowLine);
    }

    public update(deltaTime: number, paused: boolean): void {
        const now = performance.now();

        if (!paused && now >= this.nextSignalTime) {
            const randomNode = this.network.nodes[Math.floor(Math.random() * this.network.nodes.length)];
            this.triggerSignal(randomNode, 0);
            this.scheduleNextSignal();
        }

        if (paused) return;

        for (let i = this.pulses.length - 1; i >= 0; i--) {
            const pulse = this.pulses[i];
            if (!pulse.active) continue;

            pulse.progress += pulse.speed * deltaTime * 60 / pulse.connection.length;

            if (!pulse.triggeredMidpoint && pulse.progress >= 0.45 && pulse.progress <= 0.55) {
                pulse.triggeredMidpoint = true;
                if (this.onMidpointCallback) {
                    this.onMidpointCallback(pulse.connection);
                }
            }

            if (pulse.progress >= 1) {
                pulse.progress = 1;
                this.updatePulsePosition(pulse);
                this.onPulseReachEnd(pulse);
                this.returnPulseToPool(pulse);
                this.pulses.splice(i, 1);
                continue;
            }

            this.updatePulsePosition(pulse);
        }

        for (let i = this.shockWaves.length - 1; i >= 0; i--) {
            const shockWave = this.shockWaves[i];
            if (!shockWave.active) continue;

            shockWave.life += deltaTime;
            const t = shockWave.life / shockWave.maxLife;

            if (t >= 1) {
                this.returnShockWaveToPool(shockWave);
                this.shockWaves.splice(i, 1);
                continue;
            }

            const radius = shockWave.startRadius + (shockWave.endRadius - shockWave.startRadius) * t;
            shockWave.mesh.scale.setScalar(radius / shockWave.startRadius);

            const color = shockWave.startColor.clone().lerp(shockWave.endColor, t);
            (shockWave.mesh.material as THREE.MeshBasicMaterial).color.copy(color);
            (shockWave.mesh.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - t);
        }

        for (let i = this.flowLines.length - 1; i >= 0; i--) {
            const flowLine = this.flowLines[i];
            if (!flowLine.active) continue;

            flowLine.life += deltaTime;
            const t = flowLine.life / flowLine.maxLife;

            if (t >= 1) {
                this.returnFlowLineToPool(flowLine);
                this.flowLines.splice(i, 1);
                continue;
            }

            (flowLine.line.material as THREE.LineBasicMaterial).opacity = 0.7 * (1 - t);
        }
    }

    public setPerformanceMode(low: boolean): void {
        if (low) {
            this.maxShockWaves = 8;
        } else {
            this.maxShockWaves = 30;
        }
    }

    public getActivePulses(): number {
        return this.pulses.filter(p => p.active).length;
    }

    public getActiveShockWaves(): number {
        return this.shockWaves.filter(s => s.active).length;
    }
}
