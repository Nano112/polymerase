/**
 * Polymerase - Node-based Minecraft Schematic Execution Engine
 */

import { ReactFlowProvider } from '@xyflow/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Editor } from './components/editor/Editor';

const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ReactFlowProvider>
				<Editor />
			</ReactFlowProvider>
		</QueryClientProvider>
	);
}

export default App;
