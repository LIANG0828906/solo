import { SimulationParams } from '../core/simulation';
import { Creature } from '../entities/creature';

export interface Snapshot {
    id: number;
    creatures: Creature[];
    thumbnailData: ImageData;
    timestamp: number;
}

export class Controls {
    private container: HTMLElement;
    private params: SimulationParams;
    private onParamChange?: (params: Partial<SimulationParams>) => void;
    private onSaveSnapshot?: () => void;
    private onRestoreSnapshot?: (snapshot: Snapshot) => void;
    private snapshots: Snapshot[] = [];
    private maxSnapshots = 5;
    private snapshotIdCounter = 0;
    private paramChangeTimer?: ReturnType<typeof setTimeout>;

    constructor(container: HTMLElement, initialParams: SimulationParams) {
        this.container = container;
        this.params = { ...initialParams };
        this.buildUI();
    }

    setOnParamChange(callback: (params: Partial<SimulationParams>) => void): void {
        this.onParamChange = callback;
    }

    setOnSaveSnapshot(callback: () => void): void {
        this.onSaveSnapshot = callback;
    }

    setOnRestoreSnapshot(callback: (snapshot: Snapshot) => void): void {
        this.onRestoreSnapshot = callback;
    }

    addSnapshot(creatures: Creature[], thumbnail: ImageData): void {
        const snapshot: Snapshot = {
            id: this.snapshotIdCounter++,
            creatures: JSON.parse(JSON.stringify(creatures)),
            thumbnailData: thumbnail,
            timestamp: Date.now()
        };

        this.snapshots.push(snapshot);
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }

        this.renderSnapshots();
    }

    private buildUI(): void {
        this.container.innerHTML = '';
        this.container.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 0 20px;
            box-sizing: border-box;
            gap: 10px;
        `;

        const title = document.createElement('div');
        title.textContent = '参数调节';
        title.style.cssText = 'color: #FFFFFF; font-size: 12px; font-family: sans-serif; margin-bottom: 4px;';
        this.container.appendChild(title);

        this.createSlider(
            '浮游生物刷新间隔',
            'planktonSpawnInterval',
            this.params.planktonSpawnInterval,
            1,
            8,
            0.1,
            '秒'
        );
        this.createSlider(
            '大鱼捕食半径',
            'bigFishPredationRadius',
            this.params.bigFishPredationRadius,
            50,
            150,
            1,
            'px'
        );
        this.createSlider(
            '小蓝鱼繁殖阈值',
            'smallFishBreedingThreshold',
            this.params.smallFishBreedingThreshold,
            2,
            6,
            1,
            '条'
        );

        const snapshotContainer = document.createElement('div');
        snapshotContainer.id = 'snapshot-container';
        snapshotContainer.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 150px;
            display: flex;
            gap: 8px;
            z-index: 100;
        `;
        document.body.appendChild(snapshotContainer);

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存快照';
        saveBtn.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 260px;
            padding: 8px 16px;
            background: linear-gradient(135deg, #3B82F6, #2563EB);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-family: sans-serif;
            transition: transform 0.15s ease;
            z-index: 100;
        `;
        saveBtn.addEventListener('mousedown', () => {
            saveBtn.style.transform = 'scale(0.95)';
        });
        saveBtn.addEventListener('mouseup', () => {
            saveBtn.style.transform = 'scale(1)';
        });
        saveBtn.addEventListener('mouseleave', () => {
            saveBtn.style.transform = 'scale(1)';
        });
        saveBtn.addEventListener('click', () => {
            if (this.onSaveSnapshot) this.onSaveSnapshot();
        });
        document.body.appendChild(saveBtn);
    }

    private createSlider(
        label: string,
        paramKey: keyof SimulationParams,
        value: number,
        min: number,
        max: number,
        step: number,
        unit: string
    ): void {
        const row = document.createElement('div');
        row.style.cssText = 'position: relative; display: flex; align-items: center; gap: 10px;';

        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        labelEl.style.cssText = `
            color: #FFFFFF;
            font-size: 11px;
            font-family: sans-serif;
            width: 110px;
            flex-shrink: 0;
        `;

        const sliderWrap = document.createElement('div');
        sliderWrap.style.cssText = 'position: relative; flex: 1; height: 24px;';

        const track = document.createElement('div');
        track.style.cssText = `
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 6px;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.15);
            border-radius: 3px;
        `;

        const fill = document.createElement('div');
        fill.style.cssText = `
            position: absolute;
            top: 50%;
            left: 0;
            height: 6px;
            transform: translateY(-50%);
            background: linear-gradient(90deg, #3B82F6, #60A5FA);
            border-radius: 3px;
        `;

        const thumb = document.createElement('div');
        thumb.style.cssText = `
            position: absolute;
            top: 50%;
            width: 20px;
            height: 20px;
            background: #FFFFFF;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            cursor: pointer;
            transition: width 0.1s ease, height 0.1s ease, box-shadow 0.1s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;

        const valueLabel = document.createElement('div');
        valueLabel.style.cssText = `
            position: absolute;
            top: -18px;
            left: 0;
            transform: translateX(-50%);
            color: #FFFFFF;
            font-size: 10px;
            font-family: sans-serif;
            background: rgba(59, 130, 246, 0.9);
            padding: 2px 6px;
            border-radius: 3px;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.15s ease;
            pointer-events: none;
        `;

        const updatePosition = () => {
            const percent = (value - min) / (max - min);
            thumb.style.left = `${percent * 100}%`;
            fill.style.width = `${percent * 100}%`;
            valueLabel.style.left = `${percent * 100}%`;
            valueLabel.textContent = `${value.toFixed(step < 1 ? 1 : 0)}${unit}`;
        };
        updatePosition();

        let isDragging = false;

        const startDrag = (e: MouseEvent) => {
            e.preventDefault();
            isDragging = true;
            thumb.style.width = '24px';
            thumb.style.height = '24px';
            thumb.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.8), 0 2px 4px rgba(0,0,0,0.3)';
            valueLabel.style.opacity = '1';
            handleDrag(e);
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
        };

        const handleDrag = (e: MouseEvent) => {
            if (!isDragging) return;
            const rect = sliderWrap.getBoundingClientRect();
            let percent = (e.clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent));
            let newValue = min + percent * (max - min);
            newValue = Math.round(newValue / step) * step;
            newValue = Math.max(min, Math.min(max, newValue));
            value = newValue;
            (this.params as Record<string, number>)[paramKey] = value;
            updatePosition();
            this.scheduleParamChange();
        };

        const stopDrag = () => {
            isDragging = false;
            thumb.style.width = '20px';
            thumb.style.height = '20px';
            thumb.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            setTimeout(() => {
                if (!isDragging) valueLabel.style.opacity = '0';
            }, 300);
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);
        };

        thumb.addEventListener('mousedown', startDrag);
        track.addEventListener('mousedown', startDrag);

        sliderWrap.appendChild(track);
        sliderWrap.appendChild(fill);
        sliderWrap.appendChild(thumb);
        sliderWrap.appendChild(valueLabel);
        row.appendChild(labelEl);
        row.appendChild(sliderWrap);
        this.container.appendChild(row);
    }

    private scheduleParamChange(): void {
        if (this.paramChangeTimer) {
            clearTimeout(this.paramChangeTimer);
        }
        this.paramChangeTimer = setTimeout(() => {
            if (this.onParamChange) {
                this.onParamChange({ ...this.params });
            }
        }, 100);
    }

    private renderSnapshots(): void {
        const container = document.getElementById('snapshot-container');
        if (!container) return;

        container.innerHTML = '';

        for (const snapshot of this.snapshots) {
            const wrap = document.createElement('div');
            wrap.style.cssText = `
                position: relative;
                cursor: pointer;
                transition: transform 0.15s ease;
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 4px;
                overflow: hidden;
            `;

            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 90;
            const ctx = canvas.getContext('2d')!;
            ctx.putImageData(snapshot.thumbnailData, 0, 0);

            wrap.addEventListener('mousedown', () => {
                wrap.style.transform = 'scale(0.92)';
            });
            wrap.addEventListener('mouseup', () => {
                wrap.style.transform = 'scale(1)';
            });
            wrap.addEventListener('mouseleave', () => {
                wrap.style.transform = 'scale(1)';
            });
            wrap.addEventListener('click', () => {
                if (this.onRestoreSnapshot) {
                    this.onRestoreSnapshot(snapshot);
                }
            });

            wrap.appendChild(canvas);
            container.appendChild(wrap);
        }
    }
}
