import { useState, useCallback } from 'react';
import { Layer } from '@/components/LayersPanel';

export const useLayers = (initialImageUrl: string) => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>('');

  const createLayer = useCallback((name: string, isBackground = false): Layer => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions immediately (don't wait for image load)
    const canvasSize = 1200;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    if (isBackground && initialImageUrl && ctx) {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Handle CORS for images
      img.onload = () => {
        // Clear canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scale to fit image in canvas while maintaining aspect ratio
        const scale = Math.min(canvasSize / img.width, canvasSize / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Center the scaled image
        const x = (canvasSize - scaledWidth) / 2;
        const y = (canvasSize - scaledHeight) / 2;

        console.log("🖼️ Drawing image:", {
          originalSize: `${img.width}x${img.height}`,
          scaledSize: `${scaledWidth}x${scaledHeight}`,
          position: `${x},${y}`,
          canvasSize
        });

        // Draw the scaled and centered image
        ctx.drawImage(img, 0, 0, img.width, img.height, x, y, scaledWidth, scaledHeight);
      };
      img.onerror = () => {
        console.error("❌ Failed to load image:", initialImageUrl);
      };
      img.src = initialImageUrl;
    }

    return {
      id: `layer-${Date.now()}-${Math.random()}`,
      name,
      visible: true,
      opacity: 100,
      canvas
    };
  }, [initialImageUrl]);

  const initializeLayers = useCallback(() => {
    const backgroundLayer = createLayer('Background', true);
    setLayers([backgroundLayer]);
    setActiveLayerId(backgroundLayer.id);
  }, [createLayer]);

  const addLayer = useCallback(() => {
    const newLayer = createLayer(`Layer ${layers.length + 1}`);
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  }, [createLayer, layers.length]);

  const deleteLayer = useCallback((layerId: string) => {
    setLayers(prev => {
      const filtered = prev.filter(layer => layer.id !== layerId);
      if (filtered.length === 0) return prev; // Don't delete the last layer
      
      // If we deleted the active layer, select another one
      if (layerId === activeLayerId) {
        const index = prev.findIndex(layer => layer.id === layerId);
        const newActiveIndex = Math.min(index, filtered.length - 1);
        setActiveLayerId(filtered[newActiveIndex].id);
      }
      
      return filtered;
    });
  }, [activeLayerId]);

  const duplicateLayer = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    const newCanvas = document.createElement('canvas');
    const newCtx = newCanvas.getContext('2d');
    newCanvas.width = layer.canvas.width;
    newCanvas.height = layer.canvas.height;
    newCtx?.drawImage(layer.canvas, 0, 0);

    const duplicatedLayer: Layer = {
      id: `layer-${Date.now()}-${Math.random()}`,
      name: `${layer.name} Copy`,
      visible: layer.visible,
      opacity: layer.opacity,
      canvas: newCanvas
    };

    setLayers(prev => [...prev, duplicatedLayer]);
    setActiveLayerId(duplicatedLayer.id);
  }, [layers]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
  }, []);

  const moveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const index = prev.findIndex(layer => layer.id === layerId);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index + 1 : index - 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newLayers = [...prev];
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
      return newLayers;
    });
  }, []);

  const renameLayer = useCallback((layerId: string, newName: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, name: newName }
        : layer
    ));
  }, []);

  const changeLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, opacity }
        : layer
    ));
  }, []);

  const rasterizeAll = useCallback(() => {
    if (layers.length <= 1) return;

    const firstLayer = layers[0];
    const ctx = firstLayer.canvas.getContext('2d');
    if (!ctx) return;

    // Clear the first layer
    ctx.clearRect(0, 0, firstLayer.canvas.width, firstLayer.canvas.height);

    // Draw all layers onto the first layer
    layers.forEach(layer => {
      if (layer.visible) {
        ctx.globalAlpha = layer.opacity / 100;
        ctx.drawImage(layer.canvas, 0, 0);
      }
    });

    ctx.globalAlpha = 1;
    
    // Keep only the first layer
    setLayers([{ ...firstLayer, name: 'Merged Layer', opacity: 100 }]);
    setActiveLayerId(firstLayer.id);
  }, [layers]);

  const rasterizeVisible = useCallback(() => {
    const visibleLayers = layers.filter(layer => layer.visible);
    if (visibleLayers.length <= 1) return;

    const firstVisible = visibleLayers[0];
    const ctx = firstVisible.canvas.getContext('2d');
    if (!ctx) return;

    // Clear the first visible layer
    ctx.clearRect(0, 0, firstVisible.canvas.width, firstVisible.canvas.height);

    // Draw all visible layers onto the first visible layer
    visibleLayers.forEach(layer => {
      ctx.globalAlpha = layer.opacity / 100;
      ctx.drawImage(layer.canvas, 0, 0);
    });

    ctx.globalAlpha = 1;

    // Remove other visible layers, keep invisible ones
    const invisibleLayers = layers.filter(layer => !layer.visible);
    const mergedLayer = { ...firstVisible, name: 'Merged Visible', opacity: 100 };
    
    setLayers([...invisibleLayers, mergedLayer]);
    setActiveLayerId(mergedLayer.id);
  }, [layers]);

  const flattenImage = useCallback(() => {
    rasterizeAll();
  }, [rasterizeAll]);

  const getActiveLayer = useCallback(() => {
    return layers.find(layer => layer.id === activeLayerId);
  }, [layers, activeLayerId]);

  return {
    layers,
    activeLayerId,
    initializeLayers,
    addLayer,
    deleteLayer,
    duplicateLayer,
    toggleLayerVisibility,
    setActiveLayerId,
    moveLayer,
    renameLayer,
    changeLayerOpacity,
    rasterizeAll,
    rasterizeVisible,
    flattenImage,
    getActiveLayer
  };
};
