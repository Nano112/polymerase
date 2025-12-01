/**
 * Schematic provider utilities
 * Uses nucleation SchematicWrapper for WASM-based schematic operations
 */

/**
 * Schematic wrapper interface (compatible with nucleation)
 */
export interface SchematicWrapper {
  set_block(x: number, y: number, z: number, blockType?: string): void;
  get_block(x: number, y: number, z: number): string;
  to_schematic(): Uint8Array;
  to_litematic(): Uint8Array;
  size?: { x: number; y: number; z: number };
}

export type SchematicClass = new () => SchematicWrapper;

/**
 * Asynchronously initializes the nucleation library and returns the SchematicWrapper class.
 * @returns The constructor for creating schematics.
 * @throws Error if nucleation WASM cannot be loaded
 */
export async function initializeSchematicProvider(): Promise<SchematicClass> {
  const nucleation = await import('nucleation');
  
  if (typeof nucleation.default === 'function') {
    await nucleation.default();
  }
  
  return nucleation.SchematicWrapper as SchematicClass;
}

/**
 * Utility functions for working with schematics
 */
export const SchematicUtils = {
  /**
   * Create a filled box of blocks
   */
  fillBox(
    schematic: SchematicWrapper,
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    blockType: string
  ): void {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const minZ = Math.min(z1, z2);
    const maxZ = Math.max(z1, z2);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          schematic.set_block(x, y, z, blockType);
        }
      }
    }
  },

  /**
   * Create a hollow box of blocks
   */
  hollowBox(
    schematic: SchematicWrapper,
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    blockType: string
  ): void {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const minZ = Math.min(z1, z2);
    const maxZ = Math.max(z1, z2);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const isEdge =
            x === minX || x === maxX ||
            y === minY || y === maxY ||
            z === minZ || z === maxZ;
          if (isEdge) {
            schematic.set_block(x, y, z, blockType);
          }
        }
      }
    }
  },

  /**
   * Create a sphere of blocks
   */
  sphere(
    schematic: SchematicWrapper,
    cx: number, cy: number, cz: number,
    radius: number,
    blockType: string,
    hollow = false
  ): void {
    const r2 = radius * radius;
    const innerR2 = hollow ? (radius - 1) * (radius - 1) : 0;

    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          const d2 = x * x + y * y + z * z;
          if (d2 <= r2 && (!hollow || d2 >= innerR2)) {
            schematic.set_block(cx + x, cy + y, cz + z, blockType);
          }
        }
      }
    }
  },

  /**
   * Create a cylinder of blocks
   */
  cylinder(
    schematic: SchematicWrapper,
    cx: number, cy: number, cz: number,
    radius: number, height: number,
    blockType: string,
    hollow = false
  ): void {
    const r2 = radius * radius;
    const innerR2 = hollow ? (radius - 1) * (radius - 1) : 0;

    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        const d2 = x * x + z * z;
        if (d2 <= r2 && (!hollow || d2 >= innerR2)) {
          for (let y = 0; y < height; y++) {
            schematic.set_block(cx + x, cy + y, cz + z, blockType);
          }
        }
      }
    }
  },
} as const;

