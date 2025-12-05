/**
 * Polymerase - Node-based Minecraft Schematic Execution Engine
 */

import { ReactFlowProvider } from '@xyflow/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Editor } from './components/editor/Editor';
import { Home } from './components/Home';
import { Documentation } from './components/Documentation';

const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ReactFlowProvider>
				<BrowserRouter>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/docs" element={<Documentation />} />
						<Route path="/editor" element={<Editor />} />
						<Route path="/flow/:flowId" element={<Editor />} />
					</Routes>
				</BrowserRouter>
			</ReactFlowProvider>
		</QueryClientProvider>
	);
}

export default App;
