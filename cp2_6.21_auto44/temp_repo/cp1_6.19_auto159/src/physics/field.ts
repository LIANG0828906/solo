export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export class ElectromagneticField {
  electricStrength: number = 1.5;
  magneticStrength: number = 2.0;
  electricDirection: Vec3 = { x: 0, y: 0, z: 1 };

  getElectricField(): Vec3 {
    return {
      x: this.electricStrength * this.electricDirection.x,
      y: this.electricStrength * this.electricDirection.y,
      z: this.electricStrength * this.electricDirection.z,
    };
  }

  getMagneticField(): Vec3 {
    return { x: 0, y: 0, z: this.magneticStrength };
  }

  getForce(q: number, vx: number, vy: number, vz: number): Vec3 {
    const E = this.getElectricField();
    const B = this.getMagneticField();

    const vxBx = vy * B.z - vz * B.y;
    const vxBy = vz * B.x - vx * B.z;
    const vxBz = vx * B.y - vy * B.x;

    return {
      x: q * (E.x + vxBx),
      y: q * (E.y + vxBy),
      z: q * (E.z + vxBz),
    };
  }
}
