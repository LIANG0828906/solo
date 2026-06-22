import * as THREE from 'three';

export interface PlateInfo {
  name: string;
  speed: string;
  elevation: string;
}

export interface PlateData {
  id: number;
  name: string;
  color: THREE.Color;
  baseSpeed: number;
  baseElevation: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  cp1Lat: number;
  cp1Lng: number;
  cp2Lat: number;
  cp2Lng: number;
  size: number;
  irregularity: number;
  rotationSpeed: number;
}

export interface CityData {
  lat: number;
  lng: number;
  plateId: number;
  phase: number;
}

export const PLATE_NAMES = [
  '太平洋板块',
  '亚欧板块',
  '非洲板块',
  '北美板块',
  '南美板块',
  '南极板块',
  '澳大利亚板块',
  '印度板块',
  '纳斯卡板块',
  '加勒比板块'
];

export const COLOR_GRADIENT = {
  start: new THREE.Color(0xD4A574),
  end: new THREE.Color(0x6B8E6B)
};
