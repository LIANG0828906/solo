import { Customer, MaterialBottle, Cauldron, Potion, PotionRecipe, GoldFlyEffect, POTION_RECIPES } from './entities';

export type GameEventType = 
  | 'goldChanged' 
  | 'customerServed' 
  | 'customerLeft'
  | 'potionBrewed'
  | 'upgradeAvailable'
  | 'levelUp';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class GameState {
  gold: number;
  level: number;
  customers: Customer[];
  currentRecipeStep: number;
  currentRecipe: PotionRecipe | null;
  selectedMaterial: MaterialBottle | null;
  brewedPotion: Potion | null;
  showUpgradeModal: boolean;
  modalScale: number;
  goldScale: number;
  goldFlyEffects: GoldFlyEffect[];
  customerArea: Rect;
  cauldronArea: Rect;
  cabinetArea: Rect;
  headerHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  isMobile: boolean;

  private listeners: Map<GameEventType, Function[]>;
  private goldForNextLevel: number;
  private customerSpawnTimer: number;
  private maxCustomers: number;

  constructor() {
    this.gold = 0;
    this.level = 1;
    this.customers = [];
    this.currentRecipeStep = 0;
    this.currentRecipe = null;
    this.selectedMaterial = null;
    this.brewedPotion = null;
    this.showUpgradeModal = false;
    this.modalScale = 0;
    this.goldScale = 1;
    this.goldFlyEffects = [];
    this.goldForNextLevel = 100;
    this.customerSpawnTimer = 0;
    this.maxCustomers = 3;
    this.headerHeight = 60;
    this.canvasWidth = 1200;
    this.canvasHeight = 800;
    this.isMobile = false;
    this.customerArea = { x: 0, y: 0, width: 0, height: 0 };
    this.cauldronArea = { x: 0, y: 0, width: 0, height: 0 };
    this.cabinetArea = { x: 0, y: 0, width: 0, height: 0 };
    this.listeners = new Map();
  }

  addEventListener(type: GameEventType, callback: Function): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);
  }

  removeEventListener(type: GameEventType, callback: Function): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(type: GameEventType, data?: any): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      for (const cb of callbacks) {
        cb(data);
      }
    }
  }

  updateLayout(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.isMobile = width < 768;

    if (this.isMobile) {
      const contentHeight = height - this.headerHeight;
      const sectionHeight = contentHeight / 3;
      this.customerArea = {
        x: 10,
        y: this.headerHeight + 10,
        width: width - 20,
        height: sectionHeight - 15
      };
      this.cauldronArea = {
        x: 10,
        y: this.headerHeight + sectionHeight + 10,
        width: width - 20,
        height: sectionHeight - 15
      };
      this.cabinetArea = {
        x: 10,
        y: this.headerHeight + sectionHeight * 2 + 10,
        width: width - 20,
        height: sectionHeight - 15
      };
    } else {
      const contentWidth = width;
      const contentY = this.headerHeight;
      const contentHeight = height - this.headerHeight;
      this.customerArea = {
        x: 10,
        y: contentY + 10,
        width: contentWidth * 0.3 - 15,
        height: contentHeight - 20
      };
      this.cauldronArea = {
        x: contentWidth * 0.3 + 5,
        y: contentY + 10,
        width: contentWidth * 0.4 - 10,
        height: contentHeight - 20
      };
      this.cabinetArea = {
        x: contentWidth * 0.7 + 5,
        y: contentY + 10,
        width: contentWidth * 0.3 - 15,
        height: contentHeight - 20
      };
    }
  }

  update(deltaTime: number): void {
    this.customerSpawnTimer += deltaTime;
    if (this.customerSpawnTimer >= 3 && this.customers.filter(c => c.state === 'waiting').length < this.maxCustomers) {
      this.spawnCustomer();
      this.customerSpawnTimer = 0;
    }

    if (this.goldScale > 1) {
      this.goldScale = Math.max(1, this.goldScale - deltaTime * 5);
    }

    if (this.showUpgradeModal) {
      const targetScale = 1;
      this.modalScale += (targetScale - this.modalScale) * deltaTime * 8;
    } else if (this.modalScale > 0) {
      this.modalScale -= deltaTime * 8;
      if (this.modalScale < 0) this.modalScale = 0;
    }

    this.goldFlyEffects = this.goldFlyEffects.filter(effect => effect.update(deltaTime));

    this.customers = this.customers.filter(customer => {
      const alive = customer.update(deltaTime);
      if (!alive && customer.state === 'leaving') {
        this.emit('customerLeft', customer);
      }
      return alive;
    });

    if (this.brewedPotion) {
      const alive = this.brewedPotion.update(deltaTime);
      if (!alive && this.brewedPotion.targetCustomer) {
        this.serveCustomer(this.brewedPotion.targetCustomer);
        this.brewedPotion = null;
      }
    }
  }

  spawnCustomer(): void {
    const recipe = POTION_RECIPES[Math.floor(Math.random() * POTION_RECIPES.length)];
    const waitingCustomers = this.customers.filter(c => c.state === 'waiting');
    const slot = waitingCustomers.length;
    
    let spawnX: number, spawnY: number;
    if (this.isMobile) {
      const spacing = this.customerArea.width / Math.min(this.maxCustomers + 1, 4);
      spawnX = this.customerArea.x + spacing * (slot + 1);
      spawnY = this.customerArea.y + this.customerArea.height / 2 + 20;
    } else {
      spawnX = this.customerArea.x + this.customerArea.width / 2;
      spawnY = this.customerArea.y + 100 + slot * 120;
    }

    const customer = new Customer(spawnX - 100, spawnY, recipe);
    customer.targetPosition = { x: spawnX, y: spawnY };
    this.customers.push(customer);
  }

  selectMaterial(bottle: MaterialBottle | null): void {
    if (this.selectedMaterial && this.selectedMaterial !== bottle) {
      this.selectedMaterial.isSelected = false;
    }
    this.selectedMaterial = bottle;
    if (bottle) {
      bottle.isSelected = true;
    }
  }

  addMaterialToCauldron(cauldron: Cauldron, bottle: MaterialBottle): boolean {
    if (!this.currentRecipe) {
      const waitingCustomer = this.customers.find(c => c.state === 'waiting');
      if (waitingCustomer) {
        this.currentRecipe = waitingCustomer.order;
        this.currentRecipeStep = 0;
      } else {
        return false;
      }
    }

    const expectedMaterial = this.currentRecipe.ingredients[this.currentRecipeStep];
    if (bottle.type === expectedMaterial) {
      cauldron.addIngredient(bottle.type, bottle.position.x, bottle.position.y);
      this.currentRecipeStep++;
      
      if (this.currentRecipeStep >= this.currentRecipe.ingredients.length) {
        this.brewPotion(cauldron);
      }
      return true;
    } else {
      cauldron.wrongIngredient();
      this.currentRecipeStep = 0;
      this.currentRecipe = null;
      return false;
    }
  }

  private brewPotion(cauldron: Cauldron): void {
    if (!this.currentRecipe) return;
    
    this.brewedPotion = new Potion(
      cauldron.position.x,
      cauldron.position.y - cauldron.size.height / 2 - 30,
      this.currentRecipe
    );
    
    cauldron.clear();
    this.emit('potionBrewed', this.brewedPotion);
  }

  deliverPotionToCustomer(customer: Customer): void {
    if (!this.brewedPotion || this.brewedPotion.isFlying) return;
    if (this.brewedPotion.recipe.id !== customer.order.id) return;
    
    this.brewedPotion.flyTo(customer);
  }

  private serveCustomer(customer: Customer): void {
    const [minGold, maxGold] = customer.order.reward;
    const goldEarned = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;
    
    customer.state = 'served';
    
    this.goldFlyEffects.push(new GoldFlyEffect(
      customer.position.x,
      customer.position.y,
      this.canvasWidth / 2 + 100,
      this.headerHeight / 2,
      goldEarned
    ));

    setTimeout(() => {
      this.gold += goldEarned;
      this.goldScale = 1.2;
      this.emit('goldChanged', this.gold);
      
      if (this.gold >= this.goldForNextLevel && !this.showUpgradeModal) {
        this.showUpgradeModal = true;
        this.emit('upgradeAvailable', this.level + 1);
      }
    }, 400);

    this.currentRecipe = null;
    this.currentRecipeStep = 0;
    this.emit('customerServed', { customer, goldEarned });
  }

  levelUp(): void {
    this.level++;
    this.goldForNextLevel += 100 * this.level;
    this.showUpgradeModal = false;
    this.maxCustomers = Math.min(5, 3 + Math.floor(this.level / 2));
    this.emit('levelUp', this.level);
  }

  closeUpgradeModal(): void {
    this.showUpgradeModal = false;
  }

  resetRecipe(): void {
    this.currentRecipe = null;
    this.currentRecipeStep = 0;
  }

  getGoldPosition(): { x: number; y: number } {
    return {
      x: this.canvasWidth / 2 + 100,
      y: this.headerHeight / 2
    };
  }
}
