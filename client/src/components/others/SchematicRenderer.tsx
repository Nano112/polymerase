import { SchematicRenderer as Renderer } from 'schematic-renderer';
import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * SchematicRenderer component - renders schematic binary data (Uint8Array/ArrayBuffer)
 * Expects binary .schem format data, not WASM objects.
 */
const SchematicRenderer = ({ schematic }: { schematic: Uint8Array | ArrayBuffer }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<Renderer | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const lastLoadedDataRef = useRef<string | null>(null); // Stores hash of last loaded schematic

    const initializeRenderer = useCallback(async () => {
        if (!canvasRef.current) return;
        if (isInitialized) return;

        try {
            setIsLoading(true);
            setError(null);

            const renderer = new Renderer(canvasRef.current, {}, {
                vanillaPack: async () => {
                    const response = await fetch("/pack.zip");
                    const buffer = await response.arrayBuffer();
                    return new Blob([buffer], { type: "application/zip" });
                },
            }, {
                backgroundColor: '#1a1a1a',
                showCameraPathVisualization: false,
                enableInteraction: true,
                showGrid: true,
                callbacks: {
                    onRendererInitialized: () => {
                        console.log('🎨 SchematicRenderer initialized (Callback)');
                        rendererRef.current = renderer; // Ensure ref is set here or before
                        setIsInitialized(true);
                        setIsLoading(false);
                    },
                    onSchematicLoaded: (schematicName: string) => {
                        console.log(`📦 Schematic loaded: ${schematicName}`);
                        setIsLoading(false);
                    },
                },
            });

            rendererRef.current = renderer;

        } catch (err) {
            setError('Failed to initialize schematic renderer.');
            console.error(err);
            setIsLoading(false);
        }
    }, [isInitialized]);

    // Generate a simple hash of schematic data for comparison
    const getSchematicHash = useCallback((data: Uint8Array | ArrayBuffer): string => {
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        // Hash based on length + samples from start, middle, end
        const len = bytes.byteLength;
        const mid = Math.floor(len / 2);
        const samples = [
            len,
            bytes[0] || 0,
            bytes[1] || 0,
            bytes[mid] || 0,
            bytes[mid + 1] || 0,
            bytes[len - 2] || 0,
            bytes[len - 1] || 0,
        ];
        return samples.join('-');
    }, []);

    const loadSchematics = useCallback(async () => {
        const renderer = rendererRef.current;

        if (!isInitialized || !renderer || !schematic) {
            console.log('📦 Not ready to load:', { isInitialized, hasRenderer: !!renderer, hasSchematic: !!schematic });
            return;
        }
        
        // Check if schematicManager is ready
        if (!renderer.schematicManager) {
            console.log('📦 SchematicManager not ready yet, will retry...');
            return;
        }
        
        // Skip if schematic data hasn't changed
        const newHash = getSchematicHash(schematic);
        if (newHash === lastLoadedDataRef.current) {
            console.log('📦 Schematic data unchanged, skipping reload');
            return;
        }

        console.log('📦 Loading new schematic, hash:', newHash);
        setIsLoading(true);
        setError(null);

        // Convert to ArrayBuffer for the renderer FIRST (before any async operations)
        let dataToLoad: ArrayBuffer;
        
        if (schematic instanceof Uint8Array) {
            dataToLoad = schematic.slice().buffer;
        } else if (schematic instanceof ArrayBuffer) {
            dataToLoad = schematic;
        } else {
            setError('Invalid schematic format');
            setIsLoading(false);
            return;
        }

        const schematicId = `schematic_${Date.now()}`;

        try {
            // Clear existing schematics before loading new one
            if (lastLoadedDataRef.current !== null && renderer.schematicManager.removeAllSchematics) {
                console.log('🗑️ Clearing previous schematics...');
                renderer.schematicManager.removeAllSchematics();
                // Wait a frame for the clear to take effect
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
            
            console.log('📦 Loading schematic data...');
            await renderer.schematicManager.loadSchematic(schematicId, dataToLoad);
            
            // Store hash of successfully loaded data
            lastLoadedDataRef.current = newHash;
            
            console.log('✅ Schematic loaded successfully');
            setIsLoading(false);
        } catch (loadError) {
            console.error('❌ Failed to load schematic:', loadError);
            setError('Failed to load schematic');
            setIsLoading(false);
        }
    }, [isInitialized, schematic, getSchematicHash]);

    // Handle canvas resize
    const handleResize = useCallback(() => {
        rendererRef.current?.renderManager?.updateCanvasSize();
    }, []);

    useEffect(() => {
        console.log('Initializing SchematicRenderer...');
        const timer = setTimeout(initializeRenderer, 100);
        return () => clearTimeout(timer);
    }, [initializeRenderer]);

    // Load schematic when ready - with retry logic
    useEffect(() => {
        if (!schematic) return;
        
        // If not initialized yet, wait for initialization
        if (!isInitialized) {
            console.log('📦 Waiting for renderer to initialize before loading schematic...');
            return;
        }
        
        // Try to load, with a small delay to ensure schematicManager is ready
        const timer = setTimeout(() => {
            loadSchematics();
        }, 50);
        
        return () => clearTimeout(timer);
    }, [schematic, isInitialized, loadSchematics]);

    // Handle resize
    useEffect(() => {
        const resizeObserver = new ResizeObserver(handleResize);
        const parentEl = canvasRef.current?.parentElement;
        if (parentEl) {
            resizeObserver.observe(parentEl);
        }
        return () => resizeObserver.disconnect();
    }, [handleResize]);



    if (error) {
        return <div className="flex items-center justify-center h-full text-red-400 text-xs">Error: {error}</div>;
    }
    
    return (
        <div 
            className="relative w-full h-full nodrag nopan"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80 z-10">
                    <span className="text-neutral-400 text-xs">Loading...</span>
                </div>
            )}
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
}

export default SchematicRenderer;