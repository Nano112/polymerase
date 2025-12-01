/**
 * Schematic provider utilities
 * Handles both real nucleation SchematicWrapper and mock fallback
 */

import type { SchematicMetadata } from '../types/index.js';

/**
 * Mock schematic class for when nucleation WASM is not available
 */
export class MockSchematic {
  private blocks: Map<string, string> = new Map();
  private _size: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };

  constructor() {
    // Mock schematic - nucleation WASM not available
  }

  set_block(x: number, y: number, z: number, blockType = 'minecraft:air'): void {
    const key = `${x},${y},${z}`;
    this.blocks.set(key, blockType);
    
    // Track dimensions
    this._size.x = Math.max(this._size.x, x + 1);
    this._size.y = Math.max(this._size.y, y + 1);
    this._size.z = Math.max(this._size.z, z + 1);
  }

  get_block(x: number, y: number, z: number): string {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key) || 'minecraft:air';
  }

  has_block(x: number, y: number, z: number): boolean {
    const key = `${x},${y},${z}`;
    return this.blocks.has(key);
  }

  get size(): { x: number; y: number; z: number } {
    return { ...this._size };
  }

  /**
   * Mock the to_schematic method that the real SchematicWrapper would have.
   */
  to_schematic(): Uint8Array {
    const mockSchematicData = {
      format: 'mock',
      warning: 'This is a mock schematic - nucleation was not available.',
      blocks: Array.from(this.blocks.entries()),
      size: this._size,
    };
    return new TextEncoder().encode(JSON.stringify(mockSchematicData, null, 2));
  }

  getSummary(): SchematicMetadata {
    return {
      blockCount: this.blocks.size,
      dimensions: this._size,
    };
  }

  /**
   * Iterate over all blocks
   */
  forEachBlock(callback: (x: number, y: number, z: number, blockType: string) => void): void {
    for (const [key, blockType] of this.blocks) {
      const [x, y, z] = key.split(',').map(Number);
      callback(x, y, z, blockType);
    }
  }

  /**
   * Clear all blocks
   */
  clear(): void {
    this.blocks.clear();
    this._size = { x: 0, y: 0, z: 0 };
  }

  /**
   * Get block count
   */
  getBlockCount(): number {
    return this.blocks.size;
  }
}

/**
 * Schematic wrapper interface (compatible with nucleation)
 */
export interface SchematicWrapper {
  set_block(x: number, y: number, z: number, blockType?: string): void;
  get_block(x: number, y: number, z: number): string;
  to_schematic(): Uint8Array;
  size?: { x: number; y: number; z: number };
}

export type SchematicClass = new () => SchematicWrapper;

/**
 * Check if we're in a browser environment with WASM support
 */
function hasWasmSupport(): boolean {
  try {
    return typeof WebAssembly === 'object' &&
           typeof WebAssembly.instantiate === 'function';
  } catch {
    return false;
  }
}

/**
 * Asynchronously initializes the nucleation library and returns the appropriate
 * Schematic class (real or mock).
 * @returns The constructor for creating schematics.
 */
export async function initializeSchematicProvider(): Promise<SchematicClass> {
  if (!hasWasmSupport()) {
    return MockSchematic as unknown as SchematicClass;
  }

  try {
    const nucleation = await import('nucleation');
    
    if (typeof nucleation.default === 'function') {
      await nucleation.default();
    }
    
    return nucleation.SchematicWrapper as SchematicClass;
  } catch {
    return MockSchematic as unknown as SchematicClass;
  }
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

