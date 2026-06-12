import { PopulationStats } from '../core/simulation';

export class StatsPanel {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }

    draw(
        population: PopulationStats,
        predationHistory: number[],
        fluctuation: PopulationStats
    ): void {
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.fillStyle = '#2A2A2A';
        this.ctx.fillRect(0, 0, w, h);

        const barWidth = w * 0.3;
        const chartWidth = w * 0.3;
        const controlsWidth = w * 0.4;

        this.drawBarChart(0, 0, barWidth, h, population);
        this.drawLineChart(barWidth, 0, chartWidth, h, predationHistory, fluctuation);
    }

    private drawBarChart(
        x: number,
        y: number,
        w: number,
        h: number,
        population: PopulationStats
    ): void {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText('种群数量', x + 10, y + 18);

        const padding = { top: 30, right: 15, bottom: 20, left: 35 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        const maxVal = Math.max(population.fish, population.bigFish, population.plankton, 1);
        const items = [
            { label: '小蓝鱼', value: population.fish, color: '#3B82F6' },
            { label: '大鱼', value: population.bigFish, color: '#F97316' },
            { label: '浮游', value: population.plankton, color: '#22C55E' }
        ];

        const barWidth = chartW / items.length * 0.6;
        const gap = chartW / items.length * 0.4;

        this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const gy = y + padding.top + (chartH / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x + padding.left, gy);
            this.ctx.lineTo(x + padding.left + chartW, gy);
            this.ctx.stroke();

            this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
            this.ctx.font = '10px sans-serif';
            const val = Math.round(maxVal - (maxVal / 4) * i);
            this.ctx.fillText(String(val), x + 4, gy + 3);
        }

        items.forEach((item, i) => {
            const barX = x + padding.left + (gap + barWidth) * i + gap / 2;
            const barH = (item.value / maxVal) * chartH;
            const barY = y + padding.top + chartH - barH;

            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(barX, barY, barWidth, barH);

            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '10px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(String(item.value), barX + barWidth / 2, barY - 4);
            this.ctx.fillText(item.label, barX + barWidth / 2, y + padding.top + chartH + 14);
            this.ctx.textAlign = 'start';
        });
    }

    private drawLineChart(
        x: number,
        y: number,
        w: number,
        h: number,
        predationHistory: number[],
        fluctuation: PopulationStats
    ): void {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText('捕食成功率 (60s)', x + 10, y + 18);

        const padding = { top: 30, right: 15, bottom: 45, left: 35 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const gy = y + padding.top + (chartH / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x + padding.left, gy);
            this.ctx.lineTo(x + padding.left + chartW, gy);
            this.ctx.stroke();
        }

        const maxVal = Math.max(...predationHistory, 1);
        this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
        this.ctx.font = '10px sans-serif';
        for (let i = 0; i <= 4; i++) {
            const gy = y + padding.top + (chartH / 4) * i;
            const val = Math.round(maxVal - (maxVal / 4) * i);
            this.ctx.fillText(String(val), x + 4, gy + 3);
        }

        this.ctx.strokeStyle = '#EF4444';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        const points = predationHistory.length > 0 ? predationHistory : [0];
        const stepX = chartW / Math.max(points.length - 1, 1);

        points.forEach((val, i) => {
            const px = x + padding.left + i * stepX;
            const py = y + padding.top + chartH - (val / maxVal) * chartH;
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        });
        this.ctx.stroke();

        const fluctY = y + padding.top + chartH + 8;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px sans-serif';
        this.ctx.fillText('波动指数:', x + 10, fluctY + 10);

        const fluctItems = [
            { label: '鱼', val: fluctuation.fish.toFixed(1), color: '#3B82F6' },
            { label: '大鱼', val: fluctuation.bigFish.toFixed(1), color: '#F97316' },
            { label: '浮游', val: fluctuation.plankton.toFixed(1), color: '#22C55E' }
        ];

        let fx = x + 75;
        for (const item of fluctItems) {
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(fx, fluctY + 3, 8, 8);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(`${item.label}:${item.val}`, fx + 12, fluctY + 10);
            fx += 55;
        }
    }
}
