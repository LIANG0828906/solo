export interface InputState {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    rewind: boolean;
}

export class InputManager {
    private scene: Phaser.Scene;
    private keys: { [key: string]: Phaser.Input.Keyboard.Key };
    private state: InputState;
    private rewindPressed: boolean = false;
    private onRewindCallback: (() => void) | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.state = {
            up: false,
            down: false,
            left: false,
            right: false,
            rewind: false,
        };

        this.keys = {
            W: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            T: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T),
        };

        this.keys.T.on('down', () => {
            this.rewindPressed = true;
            if (this.onRewindCallback) {
                this.onRewindCallback();
            }
        });
    }

    setRewindCallback(callback: () => void): void {
        this.onRewindCallback = callback;
    }

    update(): InputState {
        this.state.up = this.keys.W.isDown;
        this.state.down = this.keys.S.isDown;
        this.state.left = this.keys.A.isDown;
        this.state.right = this.keys.D.isDown;
        this.state.rewind = this.rewindPressed;
        return this.state;
    }

    consumeRewindPress(): boolean {
        const pressed = this.rewindPressed;
        this.rewindPressed = false;
        return pressed;
    }

    getState(): InputState {
        return this.state;
    }

    destroy(): void {
        Object.values(this.keys).forEach((key) => {
            key.destroy();
        });
    }
}
