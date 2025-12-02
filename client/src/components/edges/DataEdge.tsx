/**
 * DataEdge - Custom edge that shows data flow state
 * Green when source has computed data, neutral otherwise
 */

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { useFlowStore } from '../../store/flowStore';

const DataEdge = memo(({
  id,
  source,
  target: _target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
}: EdgeProps) => {
  const nodeCache = useFlowStore((state) => state.nodeCache);
  const sourceCache = nodeCache[source];

  const isReady = sourceCache?.status === 'completed';
  const isStale = sourceCache?.status === 'stale';
  const isRunning = sourceCache?.status === 'running';
  const isError = sourceCache?.status === 'error';

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  // Determine edge color based on state
  let strokeColor = '#525252';
  let strokeWidth = 2;
  let animated = false;

  if (isReady) {
    strokeColor = '#22c55e'; // green-500
    strokeWidth = 2.5;
  } else if (isRunning) {
    strokeColor = '#f59e0b'; // amber-500
    strokeWidth = 2.5;
    animated = true;
  } else if (isStale) {
    strokeColor = '#6b7280'; // gray-500
    strokeWidth = 2;
  } else if (isError) {
    strokeColor = '#ef4444'; // red-500
    strokeWidth = 2;
  }

  if (selected) {
    strokeWidth = 3;
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          transition: 'stroke 0.3s ease, stroke-width 0.2s ease',
        }}
        className={animated ? 'animated-edge' : ''}
      />

      {/* Status indicator at midpoint */}
      {(isReady || isRunning || isError) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="flex items-center justify-center"
          >
            <div
              className={`
                w-3 h-3 rounded-full border-2 border-neutral-900
                transition-all duration-300
                ${isReady ? 'bg-green-500 shadow-lg shadow-green-500/50' : ''}
                ${isRunning ? 'bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50' : ''}
                ${isError ? 'bg-red-500 shadow-lg shadow-red-500/50' : ''}
              `}
            />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

DataEdge.displayName = 'DataEdge';

export default DataEdge;

