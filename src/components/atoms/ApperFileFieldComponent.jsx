import { useState, useEffect, useRef, useMemo } from 'react';

const ApperFileFieldComponent = ({ elementId, config }) => {
  // State management for UI-driven values
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs for tracking lifecycle and preventing memory leaks
  const mountedRef = useRef(false);
  const elementIdRef = useRef(elementId);
  const existingFilesRef = useRef([]);

  // Update elementIdRef when elementId changes
  useEffect(() => {
    elementIdRef.current = elementId;
  }, [elementId]);

  // Memoized existingFiles to prevent unnecessary re-renders
  const memoizedExistingFiles = useMemo(() => {
    if (!config.existingFiles || !Array.isArray(config.existingFiles)) {
      return [];
    }
    
    // Detect actual changes by comparing length and first file's ID/id
    const current = config.existingFiles;
    const previous = existingFilesRef.current;
    
    if (current.length !== previous.length) {
      return current;
    }
    
    if (current.length > 0 && previous.length > 0) {
      const currentFirstId = current[0].Id || current[0].id;
      const previousFirstId = previous[0].Id || previous[0].id;
      if (currentFirstId !== previousFirstId) {
        return current;
      }
    }
    
    return previous;
  }, [config.existingFiles]);

  // Initial Mount Effect
  useEffect(() => {
    const initializeSDK = async () => {
      let attempts = 0;
      const maxAttempts = 50;
      
      try {
        // Wait for ApperSDK to load - 50 attempts × 100ms = 5 seconds max
        while (!window.ApperSDK && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.ApperSDK) {
          throw new Error('ApperSDK not loaded. Please ensure the SDK script is included before this component.');
        }
        
        const { ApperFileUploader } = window.ApperSDK;
        if (!ApperFileUploader) {
          throw new Error('ApperFileUploader not available in ApperSDK.');
        }
        
        // Set the element ID reference
        elementIdRef.current = `file-uploader-${elementId}`;
        
        // Mount the file field with full config
        await ApperFileUploader.FileField.mount(elementIdRef.current, {
          ...config,
          existingFiles: memoizedExistingFiles
        });
        
        mountedRef.current = true;
        setIsReady(true);
        setError(null);
        
      } catch (error) {
        console.error('Error initializing ApperFileFieldComponent:', error);
        setError(error.message);
        setIsReady(false);
      }
    };
    
    initializeSDK();
    
    // Cleanup on component destruction
    return () => {
      try {
        if (window.ApperSDK && mountedRef.current && elementIdRef.current) {
          const { ApperFileUploader } = window.ApperSDK;
          ApperFileUploader.FileField.unmount(elementIdRef.current);
        }
      } catch (error) {
        console.error('Error unmounting ApperFileFieldComponent:', error);
      }
      
      mountedRef.current = false;
      elementIdRef.current = null;
      existingFilesRef.current = [];
    };
  }, [elementId, config.fieldKey, config.tableName, config.apperProjectId, config.apperPublicKey]);

  // File Update Effect
  useEffect(() => {
    const updateFiles = async () => {
      // Early returns for safety checks
      if (!isReady || !window.ApperSDK || !config.fieldKey) {
        return;
      }
      
      try {
        const { ApperFileUploader } = window.ApperSDK;
        
        // Deep equality check with JSON.stringify
        const currentFilesString = JSON.stringify(memoizedExistingFiles);
        const existingFilesString = JSON.stringify(existingFilesRef.current);
        
        if (currentFilesString === existingFilesString) {
          return; // No changes detected
        }
        
        // Update the reference
        existingFilesRef.current = memoizedExistingFiles;
        
        // Format detection - check for .Id vs .id property
        let filesToUpdate = memoizedExistingFiles;
        
        if (memoizedExistingFiles.length > 0 && memoizedExistingFiles[0].Id !== undefined) {
          // API format detected, convert to UI format
          filesToUpdate = ApperFileUploader.toUIFormat(memoizedExistingFiles);
        }
        
        // Conditional update or clear
        if (filesToUpdate.length > 0) {
          await ApperFileUploader.FileField.updateFiles(config.fieldKey, filesToUpdate);
        } else {
          await ApperFileUploader.FileField.clearField(config.fieldKey);
        }
        
      } catch (error) {
        console.error('Error updating files in ApperFileFieldComponent:', error);
        setError(error.message);
      }
    };
    
    updateFiles();
  }, [memoizedExistingFiles, isReady, config.fieldKey]);

  // Error UI
  if (error) {
    return (
      <div className="p-4 border border-error-200 bg-error-50 rounded-lg">
        <div className="flex items-center space-x-2 text-error-600">
          <span className="font-medium">File Upload Error:</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main container with unique ID */}
      <div 
        id={`file-uploader-${elementId}`}
        className="min-h-[120px] border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 p-4"
      >
        {/* Loading UI when not ready */}
        {!isReady && (
          <div className="flex items-center justify-center h-24">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <span className="text-slate-600">Initializing file uploader...</span>
            </div>
          </div>
        )}
        
        {/* When ready, SDK takes over this container */}
      </div>
    </div>
  );
};

export default ApperFileFieldComponent;