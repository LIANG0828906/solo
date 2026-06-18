const Constants = {
    CANVAS: {
        WIDTH: 800,
        HEIGHT: 600,
        BG_COLOR: '#0A0A1A',
        BORDER_COLOR: 'rgba(255, 255, 255, 0.125)',
        BORDER_WIDTH: 2
    },

    PLAYER: {
        SIZE: 24,
        COLOR: '#00BFFF',
        SPEED: 4,
        SHOOT_COOLDOWN: 200,
        MAX_TILT: 15,
        TILT_TRANSITION: 0.1
    },

    BULLET: {
        PLAYER_RADIUS: 4,
        PLAYER_COLOR: '#00BFFF',
        PLAYER_SPEED: 8,
        ENEMY_RADIUS: 3,
        ENEMY_COLOR: '#FF4444',
        ENEMY_SPEED: 3
    },

    ENEMY: {
        RADIUS: 16,
        COLOR: '#FF4444',
        SPEED: 1.5,
        SHOOT_COOLDOWN: 2000,
        SPAWN_INTERVAL: 1500,
        MIN_SPAWN_INTERVAL: 300,
        MAX_SPEED: 3,
        SPEED_INCREMENT: 0.3,
        SPAWN_INTERVAL_DECREMENT: 100
    },

    BOSS: {
        RADIUS: 40,
        COLOR: '#FF2222',
        HEALTH: 100,
        SPEED: 1,
        SHOOT_COOLDOWN: 1000,
        BULLET_COUNT: 3,
        SPREAD_ANGLE: 15
    },

    WAVE: {
        ENEMIES_PER_WAVE_PROGRESS: 30,
        BOSS_EVERY: 5
    },

    EFFECTS: {
        EXPLOSION_PARTICLES: 20,
        EXPLOSION_COLOR: '#FFD700',
        EXPLOSION_DURATION: 500,
        WARNING_DURATION: 300,
        WARNING_FLASHES: 3,
        VICTORY_FLASH_DURATION: 1000
    },

    UI: {
        SCORE_COLOR: '#FFFFFF',
        SCORE_FONT_SIZE: 24,
        SCORE_SHADOW: 'rgba(0, 0, 0, 0.5)',
        GAME_OVER_FONT_SIZE: 48,
        GAME_OVER_COLOR: '#FF4444',
        GAME_OVER_OVERLAY: 'rgba(0, 0, 0, 0.5)',
        RESTART_FONT_SIZE: 20,
        RESTART_COLOR: '#00BFFF',
        RESTART_HOVER_COLOR: '#FFD700'
    },

    GAME: {
        FPS: 60,
        RESTART_DELAY: 2000
    },

    KEYS: {
        UP: ['ArrowUp', 'KeyW'],
        DOWN: ['ArrowDown', 'KeyS'],
        LEFT: ['ArrowLeft', 'KeyA'],
        RIGHT: ['ArrowRight', 'KeyD'],
        SHOOT: ['Space']
    }
};
