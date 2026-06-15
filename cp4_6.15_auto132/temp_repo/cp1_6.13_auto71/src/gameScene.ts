import Phaser from 'phaser';
import {
  SpellSystem,
  SpellProjectile,
  SPELL_CONFIGS,
  FUSION_MAP,
  SpellElement,
  SpellSlotState,
  FusionEffect,
  CooldownUpdateEvent,
} from './playerModule/spellSystem';
import { AIController } from './aiModule/aiController';

interface Character {
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  halo: Phaser.GameObjects.Graphics;
  body: Phaser.GameObjects.Graphics;
  name: string;
  damageFlash: number;
  haloPulse: number;
}

interface SpellIcon {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  border: Phaser.GameObjects.Graphics;
  cooldownOverlay: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Text;
  cooldownText: Phaser.GameObjects.Text;
  element: SpellElement;
  index: number;
  rotationTween: Phaser.Tweens.Tween | null;
  pulseTween: Phaser.Tweens.Tween | null;
  scaleTween: Phaser.Tweens.T