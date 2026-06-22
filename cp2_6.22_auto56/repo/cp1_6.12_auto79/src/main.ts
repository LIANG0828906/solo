import { Simulation, SimulationParams } from './core/simulation';
import { Renderer } from './renderer/renderer';
import { StatsPanel } from './ui/panel';
import { Controls, Snapshot } from './ui/controls';

const defaultParams: SimulationParams = {
    planktonSpawnInterval: 3,
    bigFishPredationRadius: 100,
    smallFishBreedingThreshold: 4
};

function main(): void {
    const sceneCanvas = document.getElementById('sceneCanvas') as HTMLCanvasElement;
    const statsCanvas = document.getElementById('statsCanvas') as HTMLCanvasElement;
    const controlsContainer = document.getElementById('controlsContainer') as HTMLElement;

    const simulation = new Simulation(defaultParams);
    const renderer = new Renderer(sceneCanvas);
    const statsPanel = new StatsPanel(statsCanvas);
    const controls = new Controls(controlsContainer, defaultParams);

    controls.setOnParamChange((params) => {
        simulation.setParams(params);
        simulation.reset();
    });

    controls.setOnSaveSnapshot(() => {
        const thumbnail = renderer.getThumbnail();
        controls.addSnapshot(simulation.creatures, thumbnail);
    });

    controls.setOnRestoreSnapshot((snapshot: Snapshot) => {
        simulation.creatures = JSON.parse(JSON.stringify(snapshot.creatures));
        renderer.startFadeIn();
    });

    let lastTime = performance.now();

    function gameLoop(currentTime: number): void {
        const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
        lastTime = currentTime;

        simulation.update(dt);

        renderer.draw(simulation.creatures, dt);

        const population = simulation.getPopulationStats();
        const predationHistory = simulation.getPredationSuccessRate();
        const fluctuation = simulation.getPopulationFluctuation();
        statsPanel.draw(population, predationHistory, fluctuation);

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
}

main();
