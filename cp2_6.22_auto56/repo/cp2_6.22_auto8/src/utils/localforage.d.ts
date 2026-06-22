import 'localforage';

declare module 'localforage' {
  interface LocalForage {
    createInstance(config?: LocalForageOptions): LocalForage;
  }
}

export {};
