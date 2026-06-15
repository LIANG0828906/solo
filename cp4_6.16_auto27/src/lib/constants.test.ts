import { describe, it, expect } from 'vitest';
import { minutesToTime, snapToSlot, clampMinutes } from './constants';

describe('minutesToTime', () => {
  it('converts 0 minutes to 00:00', () => {
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('converts 60 minutes to 01:00', () => {
    expect(minutesToTime(60)).toBe('01:00');
  });

  it('converts 90 minutes to 01:30', () => {
    expect(minutesToTime(90)).toBe('01:30');
  });

  it('converts 1439 minutes to 23:59', () => {
    expect(minutesToTime(1439)).toBe('23:59');
  });

  it('converts 30 minutes to 00:30', () => {
    expect(minutesToTime(30)).toBe('00:30');
  });

  it('converts 120 minutes to 02:00', () => {
    expect(minutesToTime(120)).toBe('02:00');
  });

  it('converts 720 minutes to 12:00', () => {
    expect(minutesToTime(720)).toBe('12:00');
  });

  it('converts 5 minutes to 00:05', () => {
    expect(minutesToTime(5)).toBe('00:05');
  });
});

describe('snapToSlot', () => {
  it('snaps 0 to 0', () => {
    expect(snapToSlot(0)).toBe(0);
  });

  it('snaps 7 to 0 (rounds down)', () => {
    expect(snapToSlot(7)).toBe(0);
  });

  it('snaps 8 to 15 (rounds up)', () => {
    expect(snapToSlot(8)).toBe(15);
  });

  it('snaps 20 to 15 (rounds down)', () => {
    expect(snapToSlot(20)).toBe(15);
  });

  it('snaps 22 to 15 (rounds down, 22 is closer to 15 than 30)', () => {
    expect(snapToSlot(22)).toBe(15);
  });

  it('snaps 23 to 30 (rounds up, 23 is closer to 30 than 15)', () => {
    expect(snapToSlot(23)).toBe(30);
  });

  it('snaps 15 to 15', () => {
    expect(snapToSlot(15)).toBe(15);
  });

  it('snaps 30 to 30', () => {
    expect(snapToSlot(30)).toBe(30);
  });

  it('snaps 45 to 45', () => {
    expect(snapToSlot(45)).toBe(45);
  });

  it('snaps 60 to 60', () => {
    expect(snapToSlot(60)).toBe(60);
  });

  it('snaps 100 to 105 (rounds up from 100 to 105)', () => {
    expect(snapToSlot(100)).toBe(105);
  });
});

describe('clampMinutes', () => {
  it('clamps negative values to 0', () => {
    expect(clampMinutes(-1)).toBe(0);
    expect(clampMinutes(-100)).toBe(0);
  });

  it('clamps values above 1440 to 1440', () => {
    expect(clampMinutes(1441)).toBe(1440);
    expect(clampMinutes(2000)).toBe(1440);
  });

  it('returns values within 0-1440 unchanged', () => {
    expect(clampMinutes(0)).toBe(0);
    expect(clampMinutes(720)).toBe(720);
    expect(clampMinutes(1440)).toBe(1440);
    expect(clampMinutes(500)).toBe(500);
  });
});
