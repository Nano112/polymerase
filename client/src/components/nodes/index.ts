/**
 * Node type exports
 */

import CodeNode from './CodeNode';
import InputNode from './InputNode';
import SchematicNode from './SchematicNode';
import ViewerNode from './ViewerNode';
import FileInputNode from './FileInputNode';
import FileOutputNode from './FileOutputNode';

export const nodeTypes = {
  // Core nodes
  code: CodeNode,
  
  // Universal file I/O nodes
  file_input: FileInputNode,
  file_output: FileOutputNode,
  
  // Unified input node - handles primitive data types
  input: InputNode,
  
  // Viewer node - accepts any input
  viewer: ViewerNode,
  
  // Legacy support for specific input types
  static_input: InputNode,
  number_input: InputNode,
  text_input: InputNode,
  boolean_input: InputNode,
  select_input: InputNode,
  
  // Legacy schematic nodes (deprecated - use file_input/file_output)
  schematic_input: SchematicNode,
  schematic_output: SchematicNode,
  schematic_viewer: SchematicNode,
};

export { CodeNode, InputNode, SchematicNode, ViewerNode, FileInputNode, FileOutputNode };
