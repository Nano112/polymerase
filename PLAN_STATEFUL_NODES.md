# Detailed Implementation Plan: Stateful Nodes & Enhanced Types

This document outlines the comprehensive architectural changes required to introduce **Stateful Nodes** and **Expressive IO Types** to the Polymerase ecosystem.

**Core Philosophy:**
1.  **Backward Compatibility:** Stateless nodes remain the default. Stateful features are strictly opt-in.
2.  **Headless First:** All logic is implemented in `packages/core` (Polymerase Engine) first, ensuring flows run identically in the browser, CLI, or server.
3.  **Pinned Execution:** Stateful nodes with non-serializable data (API connections, WASM instances) are "pinned" to their worker/process.

---

## Part 1: Synthase Updates (The Runtime)

The `synthase` package (the sandboxed script runner) needs to support a new execution lifecycle while maintaining 100% compatibility with existing scripts.

### 1. Execution Lifecycle & Hooks
We introduce a lifecycle model. A module is considered **Stateful** if it exports an `init` function.

*   **`init(inputs, context)`**:
    *   **Trigger:** Called ONCE when the node is first executed, or after a reset.
    *   **Purpose:** Initialize memory, establish API connections, or pre-calculate constants.
    *   **Returns:** The initial `state` object.
*   **`main(inputs, context, state)`**:
    *   **Trigger:** Called on every execution (input change or tick).
    *   **Signature:** Receives the `state` as the 3rd argument.
    *   **Returns:**
        *   Legacy: `{ ...outputs }` (State is preserved as-is).
        *   Stateful: `{ outputs: {...}, state: {...} }` (State is updated).
*   **`destroy(state)`** (New):
    *   **Trigger:** Called when the node is deleted, the flow stops, or state is reset.
    *   **Purpose:** Cleanup resources (close sockets, free memory).

### 2. Backward Compatibility Logic
The runner will perform introspection on the module:
```typescript
// Pseudo-code in Runner
if (module.init || module.destroy) {
    // Mode: Stateful
    let state = previousState;
    if (!state) {
        state = await module.init(inputs, context);
    }
    const result = await module.main(inputs, context, state);
    return processResult(result); // Handle { outputs, state }
} else {
    // Mode: Stateless (Legacy)
    // Execute exactly as before, ignoring state arguments
    return module.default(inputs, context);
}
```

### 3. Enhanced Type Builder (`t`)
We replace the rigid JSON IO definition with a fluent Builder API. This allows for rich validation and UI hints.

*   **Implementation:** A standalone `TypeBuilder` class in `synthase`.
*   **Features:**
    *   `t.string().email().placeholder("user@example.com")`
    *   `t.number().min(0).max(100).slider().step(0.1)`
    *   `t.object({ ... }).collapsible()`
    *   `t.any().ref("MyCustomType")` (For external type references)
*   **Compatibility:** The engine will check `if (io instanceof TypeBuilder)` vs `if (typeof io === 'object')`. Both will be supported.

---

## Part 2: Polymerase Core (The Orchestrator)

The `packages/core` library (the headless engine) manages the flow execution, state storage, and time.

### 1. State Management (The `NodeStateStore`)
We need a robust store for node state that handles both serializable data (counters) and non-serializable objects (API clients).

*   **Storage:** `Map<NodeId, StateObject>` living inside the `Engine` instance.
*   **Persistence:**
    *   **Serializable State:** Can be saved/loaded with the flow (e.g., "Save Game").
    *   **Non-Serializable State:** (e.g., DB Connections) Cannot be saved. On reload, `init` must run again.
*   **Reset Logic:**
    *   `engine.resetNode(nodeId)`: Calls `destroy(state)`, deletes state from Map, forces `init` on next run.

### 2. Stateful APIs & "Pinned" Execution
How do we handle a node that wraps a database connection?
*   **The Problem:** You can't pass a TCP socket between the Worker and the Main thread (UI).
*   **The Solution:** **Pinned Nodes**.
    *   If a node creates non-transferable state in `init`, it is marked as "Pinned".
    *   The Engine ensures subsequent runs of this node happen in the **same** worker instance.
    *   **UI Inspection:** When the UI asks to "view state", the worker must provide a *sanitized summary* (e.g., `{ status: "connected", host: "localhost" }`) instead of the real object.

### 3. Time & Ticking
Stateful nodes often need to run on a loop (Simulation).
*   **`Engine.tick(delta)`:** A new method to advance the simulation.
*   **Clock Node:** A core node that emits the current timestamp/delta every tick.
*   **Execution Mode:**
    *   **Event-Driven:** (Current) Runs only on input change.
    *   **Game Loop:** (New) Runs `tick()` continuously (requestAnimationFrame or setImmediate).

---

## Part 3: Polymerase Client (The UI)

The Editor needs to visualize time and state.

### 1. Visualizing State
*   **State Inspector:** A new panel (or tab in Properties) showing the live JSON state of the selected node.
*   **Visual Cues:**
    *   **State Dot:** A small indicator on nodes that are holding state.
    *   **Dirty State:** Visual feedback when state changes.

### 2. Time-Based Viewers
Since data now changes over time, Viewers need to evolve.
*   **History Buffer:** Viewers should optionally buffer the last N values.
*   **Graph Viewer:** A new viewer type that plots numeric values over time (Line Chart).
*   **Log Viewer:** A scrolling console for text outputs.

### 3. Enhanced Input Panels
Refactor `NodePropertiesPanel` to use a **Recursive Schema Renderer**.
*   **Dynamic Forms:** The UI builds the form based on the `t` schema.
*   **Validation:** Real-time validation based on `.min()`, `.regex()`, etc.
*   **Custom Widgets:**
    *   `t.color()` -> Color Picker.
    *   `t.code()` -> Mini Monaco Editor.
    *   `t.file()` -> File Dropzone.

---

## Implementation Roadmap

### Phase 1: Synthase Core (The Foundation)
- [ ] **Type System:** Implement `TypeBuilder` and export `t`.
- [ ] **Parser Update:** Detect `init` and `destroy` exports.
- [ ] **Runner Update:** Implement the `init -> main -> destroy` lifecycle.
- [ ] **State Handling:** Implement the `{ outputs, state }` return signature logic.

### Phase 2: Polymerase Core (Headless Engine)
- [ ] **State Store:** Add `nodeState` map to `Engine` class.
- [ ] **Lifecycle Management:** Implement `resetNode` and state persistence logic.
- [ ] **Pinned Execution:** Ensure stateful nodes stick to their workers.
- [ ] **Tick Loop:** Add `tick()` method and `ClockNode` implementation.

### Phase 3: UI & Visualization
- [ ] **Monaco Integration:** Inject `t` definitions for autocomplete.
- [ ] **Schema Renderer:** Build the recursive form generator for new inputs.
- [ ] **State Inspector:** Add UI to view/reset node state.
- [ ] **Graph Viewer:** Implement a simple time-series plotter.

### Phase 4: Migration & Cleanup
- [ ] **Refactor Core Nodes:** Update standard library nodes to use `t` schema.
- [ ] **Documentation:** Write guides for "Creating Stateful Nodes".
