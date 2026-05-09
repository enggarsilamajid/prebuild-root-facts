import {
  useEffect,
  useRef,
  useState,
} from 'react';

import Header from './components/Header';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';

import { useAppState }
  from './hooks/useAppState';

import { DetectionService }
  from './services/DetectionService';

import { CameraService }
  from './services/CameraService';

import { RootFactsService }
  from './services/RootFactsService';

import {
  APP_CONFIG,
  isValidDetection,
} from './utils/config';

function App() {
  const { state, actions } =
    useAppState();

  const detectionCleanupRef =
    useRef(null);

  const isRunningRef =
    useRef(false);

  const [currentTone, setCurrentTone] =
    useState('normal');

  useEffect(() => {
    const initializeServices =
      async () => {
        try {
          const detector =
            new DetectionService();

          const camera =
            new CameraService();

          const generator =
            new RootFactsService();

          actions.setModelStatus(
            'Loading detection model...',
          );

          await detector.loadModel(
            (progress, status) => {
              actions.setModelStatus(
                status,
              );
            },
          );

          actions.setModelStatus(
            'Loading AI generator...',
          );

          await generator.loadModel(
            (progress, status) => {
              actions.setModelStatus(
                status,
              );
            },
          );

          actions.setServices({
            detector,
            camera,
            generator,
          });

          actions.setModelStatus(
            'AI model is ready',
          );
        } catch (error) {
          console.error(error);

          actions.setError(
            'Failed to load AI model',
          );
        }
      };

    initializeServices();

    return () => {
      stopDetection();

      if (state.services.camera) {
        state.services.camera.stopCamera();
      }
    };
  }, []);

  const stopDetection = () => {
    isRunningRef.current = false;

    if (detectionCleanupRef.current) {
      clearTimeout(
        detectionCleanupRef.current,
      );

      detectionCleanupRef.current = null;
    }
  };

  const resetPredictionState = async () => {
    stopDetection();

    actions.setDetectionResult(null);

    actions.setFunFactData(null);

    actions.setAppState('idle');

    const {
      detector,
      generator,
      camera,
    } = state.services;

    if (camera) {
      camera.stopCamera();
    }

    if (generator) {
      generator.isGenerating = false;
    }

    if (detector && detector.model) {
      detector.model.resetStates?.();
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  };

  const startDetectionLoop =
    async () => {
      const {
        detector,
        generator,
        camera,
      } = state.services;

      if (
        !detector ||
        !camera ||
        !generator
      ) {
        return;
      }

      const detectFrame =
        async () => {
          if (
            !isRunningRef.current
          ) {
            return;
          }

          if (
            !camera.isReady()
          ) {
            detectionCleanupRef.current =
              setTimeout(
                detectFrame,
                APP_CONFIG.detectionRetryInterval,
              );

            return;
          }

          try {
            const result =
              await detector.predict(
                camera.video,
              );

            if (
              isValidDetection(
                result,
              )
            ) {
              stopDetection();

              actions.setAppState(
                'analyzing',
              );

              actions.setDetectionResult(
                result,
              );

              await new Promise(
                (resolve) => {
                  setTimeout(
                    resolve,
                    APP_CONFIG.analyzingDelay,
                  );
                },
              );

              const fact =
                await generator.generateFacts(
                  result.className,
                );

              actions.setFunFactData(
                fact,
              );

              actions.setAppState(
                'result',
              );

              actions.setRunning(
                false,
              );

              isRunningRef.current =
                false;

              camera.stopCamera();

              return;
            }

            detectionCleanupRef.current =
              setTimeout(
                detectFrame,
                1000 /
                (camera.config?.fps ||
                  30),
              );
          } catch (error) {
            console.error(error);

            actions.setError(
              'Failed to predict',
            );
          }
        };

      detectFrame();
    };

  const handleToggleCamera =
    async () => {
      const camera =
        state.services.camera;

      if (!camera) {
        return;
      }

      try {
        if (state.isRunning) {
          stopDetection();

          camera.stopCamera();

          actions.setRunning(
            false,
          );

          actions.resetResults();

          return;
        }

        await resetPredictionState();

        await camera.startCamera();

        actions.setRunning(true);

        actions.setAppState(
          'idle',
        );

        isRunningRef.current =
          true;

        startDetectionLoop();
      } catch (error) {
        console.error(error);

        actions.setError(
          'Failed to run camera',
        );
      }
    };

  const handleToneChange =
    (tone) => {
      setCurrentTone(tone);

      if (
        state.services.generator
      ) {
        state.services.generator
          .setTone(tone);
      }
    };

  const handleCopyFact =
    async () => {
      if (
        !state.funFactData
      ) {
        return;
      }

      try {
        await navigator.clipboard
          .writeText(
            state.funFactData,
          );

        alert(
          'Facts is copied!',
        );
      } catch (error) {
        console.error(error);
      }
    };

  return (
    <div className="app-container">
      <Header
        modelStatus={
          state.modelStatus
        }
      />

      <main className="main-content">
        <CameraSection
          isRunning={
            state.isRunning
          }
          onToggleCamera={
            handleToggleCamera
          }
          onToneChange={
            handleToneChange
          }
          services={
            state.services
          }
          modelStatus={
            state.modelStatus
          }
          error={state.error}
          currentTone={
            currentTone
          }
        />

        <InfoPanel
          appState={
            state.appState
          }
          detectionResult={
            state.detectionResult
          }
          funFactData={
            state.funFactData
          }
          error={state.error}
          onCopyFact={
            handleCopyFact
          }
        />
      </main>

      <footer className="footer">
        <p>
          Powered by TensorFlow.js
          & Transformers.js
        </p>
      </footer>
    </div>
  );
}

export default App;
