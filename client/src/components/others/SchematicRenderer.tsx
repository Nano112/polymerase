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
                    onSchematicLoaded: (schematicName) => {
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

    const loadSchematics = useCallback(async () => {
        const renderer = rendererRef.current;

        if (!isInitialized || !renderer || !schematic) return;

        setIsLoading(true);
        setError(null);

        const schematicId = `schematic_${Date.now()}`;

        try {
            // Convert to ArrayBuffer for the renderer
            let dataToLoad: ArrayBuffer;
            
            if (schematic instanceof Uint8Array) {
                dataToLoad = schematic.slice().buffer;
            } else if (schematic instanceof ArrayBuffer) {
                dataToLoad = schematic;
            } else {
                throw new Error(`Invalid schematic format: Expected Uint8Array or ArrayBuffer`);
            }

            await renderer.schematicManager?.loadSchematic(schematicId, dataToLoad);
        } catch (loadError) {
            console.error('❌ Failed to load schematic:', loadError);
            setError('Failed to load schematic');
        }




    }, [isInitialized, schematic]);

    // Handle canvas resize
    const handleResize = useCallback(() => {
        rendererRef.current?.renderManager?.updateCanvasSize();
    }, []);

    useEffect(() => {
        console.log('Initializing SchematicRenderer...');
        const timer = setTimeout(initializeRenderer, 100);
        return () => clearTimeout(timer);
    }, [initializeRenderer]);

    useEffect(() => {
        if (schematic) {
            loadSchematics();
        }
    }, [schematic, loadSchematics]);

    // Handle resize
    useEffect(() => {
        const resizeObserver = new ResizeObserver(handleResize);
        const parentEl = canvasRef.current?.parentElement;
        if (parentEl) {
            resizeObserver.observe(parentEl);
        }
        return () => resizeObserver.disconnect();
    }, [handleResize]);



    if (isLoading) {
        return <div>Loading schematic...</div>;
    }
    if (error) {
        return <div>Error: {error}</div>;
    }
    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', border: '1px solid #ccc' }}
        />
    );
}

export default SchematicRenderer;