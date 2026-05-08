import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';
import { useAppState } from './hooks/useAppState';

import { DetectionService } from './services/DetectionService';
import { CameraService } from './services/CameraService';
import { RootFactsService } from './services/RootFactsService';

import { APP_CONFIG, isValidDetection } from './utils/config';

function App() {
  const { state, actions } = useAppState();

  const detectionCleanupRef = useRef(null);
  const isRunningRef = useRef(false);
  const lastPredictionRef = useRef(null);

  const [currentTone, setCurrentTone] = useState('normal');

  useEffect(() => {
    let mounted = true;

    const initializeServices = async () => {
      try {
        actions.setModelStatus('Menunggu Model AI...');
        actions.setError(null);

        const detector = new DetectionService();
        const camera = new CameraService();
        const generator = new RootFactsService();

        actions.setServices({
          detector,
          camera,
          generator,
        });

        await detector.loadModel((progress, message) => {
          if (!mounted) return;

          actions.setModelStatus(message || `Memuat model... ${progress}%`);
        });

        await generator.loadModel((progress, message) => {
          if (!mounted) return;

          actions.setModelStatus(message || `Memuat AI... ${progress}%`);
        });

        if (!mounted) return;

        actions.setModelStatus('Model AI Siap');
      } catch (error) {
        console.error(error);

        actions.setError(error.message);
        actions.setModelStatus('Gagal Memuat Model');
      }
    };

    initializeServices();

    return () => {
      mounted = false;

      if (detectionCleanupRef.current) {
        detectionCleanupRef.current();
      }

      if (state.services.camera) {
        state.services.camera.stopCamera();
      }
    };
  }, []);

  const startDetectionLoop = () => {
    const detector = state.services.detector;
    const camera = state.services.camera;
    const generator = state.services.generator;

    if (!detector || !camera || !generator) {
      return;
    }

    const detect = async () => {
      if (!isRunningRef.current) {
        return;
      }

      try {
        if (!camera.isReady()) {
          requestAnimationFrame(detect);

          return;
        }

        const result = await detector.predict(camera.video);

        if (isValidDetection(result)) {
          const samePrediction =
            lastPredictionRef.current === result.className;

          if (!samePrediction) {
            lastPredictionRef.current = result.className;

            actions.setAppState('result');
            actions.setDetectionResult(result);
            actions.setFunFactData(null);

            const generatedFact = await generator.generateFacts(
              result.className,
            );

            actions.setFunFactData(generatedFact);
          }
        }

        setTimeout(() => {
          requestAnimationFrame(detect);
        }, APP_CONFIG.detectionRetryInterval);
      } catch (error) {
        console.error(error);

        actions.setError(error.message);

        requestAnimationFrame(detect);
      }
    };

    detect();

    detectionCleanupRef.current = () => {
      isRunningRef.current = false;
    };
  };

  const handleToggleCamera = async () => {
    const camera = state.services.camera;

    if (!camera) {
      return;
    }

    try {
      if (state.isRunning) {
        isRunningRef.current = false;

        camera.stopCamera();

        actions.setRunning(false);
        actions.resetResults();

        return;
      }

      actions.setAppState('analyzing');

      await camera.startCamera();

      isRunningRef.current = true;

      actions.setRunning(true);

      startDetectionLoop();
    } catch (error) {
      console.error(error);

      actions.setError(error.message);

      actions.setRunning(false);
    }
  };

  const handleToneChange = (tone) => {
    setCurrentTone(tone);

    if (state.services.generator) {
      state.services.generator.setTone(tone);
    }
  };

  const handleCopyFact = async () => {
    try {
      if (!state.funFactData) {
        return;
      }

      await navigator.clipboard.writeText(state.funFactData);

      alert('Fakta berhasil disalin');
    } catch (error) {
      console.error(error);

      actions.setError('Gagal menyalin fakta');
    }
  };

  return (
    <div className="app-container">
      <Header modelStatus={state.modelStatus} />

      <main className="main-content">
        <CameraSection
          isRunning={state.isRunning}
          onToggleCamera={handleToggleCamera}
          onToneChange={handleToneChange}
          services={state.services}
          modelStatus={state.modelStatus}
          error={state.error}
          currentTone={currentTone}
        />

        <InfoPanel
          appState={state.appState}
          detectionResult={state.detectionResult}
          funFactData={state.funFactData}
          error={state.error}
          onCopyFact={handleCopyFact}
        />
      </main>

      <footer className="footer">
        <p>Powered by TensorFlow.js & Transformers.js</p>
      </footer>

      {state.error && (
        <div
          style={{
            position: 'fixed',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '380px',
            padding: '0.875rem 1rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            color: '#991b1b',
            fontSize: '0.8125rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: 1000,
          }}
        >
          <strong>Error:</strong> {state.error}

          <button
            onClick={() => actions.setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#991b1b',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;