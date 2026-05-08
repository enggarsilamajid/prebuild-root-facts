export class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.config = {
      fps: 30,
      facingMode: 'environment',
      devices: [],
    };
  }

  setVideoElement(videoElement) {
    this.video = videoElement;
  }

  setCanvasElement(canvasElement) {
    this.canvas = canvasElement;
  }

  async loadCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput',
      );

      this.config.devices = videoDevices;

      return videoDevices;
    } catch (error) {
      console.error('Gagal memuat daftar kamera:', error);

      return [];
    }
  }

  getConstraints(selectedCameraId = null) {
    const frameRate = this.config.fps || 30;

    if (selectedCameraId) {
      return {
        audio: false,
        video: {
          deviceId: {
            exact: selectedCameraId,
          },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: {
            ideal: frameRate,
            max: frameRate,
          },
        },
      };
    }

    return {
      audio: false,
      video: {
        facingMode: this.config.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: {
          ideal: frameRate,
          max: frameRate,
        },
      },
    };
  }

  async startCamera(selectedCameraId = null) {
    try {
      if (!this.video) {
        throw new Error('Elemen video belum tersedia');
      }

      this.stopCamera();

      const constraints = this.getConstraints(selectedCameraId);

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      this.video.srcObject = this.stream;

      await this.video.play();

      return true;
    } catch (error) {
      console.error('Gagal memulai kamera:', error);

      throw new Error(
        'Kamera tidak dapat diakses. Pastikan izin kamera diberikan.',
      );
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());

      this.stream = null;
    }

    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }
  }

  setFPS(fps) {
    this.config.fps = Number(fps);
  }

  isActive() {
    return !!this.stream;
  }

  isReady() {
    return (
      this.video &&
      this.video.readyState >= 2 &&
      this.video.videoWidth > 0
    );
  }
}