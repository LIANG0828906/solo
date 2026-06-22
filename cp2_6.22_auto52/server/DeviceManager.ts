export interface DeviceState {
  on: boolean;
  mode?: string;
  temperature?: number;
}

export interface Device {
  id: string;
  name: string;
  type: 'light' | 'ac' | 'curtain';
  room: string;
  state: DeviceState;
}

const ROOMS = ['living', 'bedroom', 'kitchen', 'bathroom'] as const;

const DEVICE_TEMPLATES: {
  type: 'light' | 'ac' | 'curtain';
  nameSuffix: string;
  defaultState: DeviceState;
}[] = [
  { type: 'light', nameSuffix: 'Light', defaultState: { on: false } },
  {
    type: 'ac',
    nameSuffix: 'AC',
    defaultState: { on: false, mode: 'cooling', temperature: 24 },
  },
  { type: 'curtain', nameSuffix: 'Curtain', defaultState: { on: false } },
];

function createDevices(): Device[] {
  const devices: Device[] = [];
  for (const room of ROOMS) {
    for (const template of DEVICE_TEMPLATES) {
      const id = `${room}-${template.type}`;
      devices.push({
        id,
        name: `${room.charAt(0).toUpperCase() + room.slice(1)} ${template.nameSuffix}`,
        type: template.type,
        room,
        state: { ...template.defaultState },
      });
    }
  }
  return devices;
}

export class DeviceManager {
  private devices: Device[];

  constructor() {
    this.devices = createDevices();
  }

  getDevices(): Device[] {
    return this.devices;
  }

  getDevice(id: string): Device | undefined {
    return this.devices.find((d) => d.id === id);
  }

  toggleDevice(id: string): Device | null {
    const device = this.devices.find((d) => d.id === id);
    if (!device) return null;
    device.state.on = !device.state.on;
    return device;
  }

  setDeviceMode(id: string, mode: string): Device | null {
    const device = this.devices.find((d) => d.id === id);
    if (!device) return null;
    device.state.mode = mode;
    return device;
  }

  setDeviceValue(id: string, key: string, value: number): Device | null {
    const device = this.devices.find((d) => d.id === id);
    if (!device) return null;
    (device.state as Record<string, unknown>)[key] = value;
    return device;
  }
}
