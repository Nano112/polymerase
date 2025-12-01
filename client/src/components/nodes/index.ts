/**
 * Node type exports
 */

import CodeNode from './CodeNode';
import InputNode from './InputNode';
import SchematicNode from './SchematicNode';
import ViewerNode from './ViewerNode';

export const nodeTypes = {
  code: CodeNode,
  // Unified input node - handles all data types
  input: InputNode,
  // Legacy support for specific input types
  static_input: InputNode,
  number_input: InputNode,
  text_input: InputNode,
  boolean_input: InputNode,
  select_input: InputNode,
  // Viewer node - accepts any input
  viewer: ViewerNode,
  // Schematic nodes
  schematic_input: SchematicNode,
  schematic_output: SchematicNode,
  schematic_viewer: SchematicNode,  // Legacy - use 'viewer' instead
};

export { CodeNode, InputNode, SchematicNode, ViewerNode };
