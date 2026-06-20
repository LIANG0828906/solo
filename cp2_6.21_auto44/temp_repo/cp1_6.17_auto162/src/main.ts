import './MoleculeData';
import './ConstraintSolver';
import { SceneManager } from './SceneManager';
import { UIController } from './UIController';
import { moleculeData, eventBus } from './MoleculeData';
import { constraintSolver } from './ConstraintSolver';

(function bootstrap() {
  const scene = new SceneManager('scene-container');
  void new UIController(scene);

  const initialMolecule = moleculeData.getMolecule();
  if (initialMolecule) {
    eventBus.emit('molecule:changed', initialMolecule);
    const res = constraintSolver.solve(initialMolecule);
    eventBus.emit('constraint:result', res);
  }

  window.addEventListener('beforeunload', () => {
    scene.dispose();
  });
})();
