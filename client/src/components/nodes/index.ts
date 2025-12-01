/**
 * Node type exports
 */

import CodeNode from './CodeNode';
import InputNode from './InputNode';
import SchematicNode from './SchematicNode';

export const nodeTypes = {
  code: CodeNode,
  static_input: InputNode,
  number_input: InputNode,
  text_input: InputNode,
  boolean_input: InputNode,
  schematic_input: SchematicNode,
  schematic_output: SchematicNode,
  schematic_viewer: SchematicNode,
};

export { CodeNode, InputNode, SchematicNode };

