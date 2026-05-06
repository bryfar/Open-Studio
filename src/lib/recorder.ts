export interface RecordingOptions {
  audio: 'none' | 'system' | 'microphone';
}

export interface RecordingResult {
  blob: Blob;
  duration: number;
  width: number;
  height: number;
}

export class ScreenRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private stream: MediaStream | null = null;

  async start(options: RecordingOptions = { audio: 'none' }): Promise<void> {
    const displayMedia = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'monitor',
      },
      audio: options.audio === 'system',
    });

    let audioStream: MediaStream | null = null;
    if (options.audio === 'microphone') {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    const tracks = [...displayMedia.getTracks()];
    if (audioStream) {
      tracks.push(...audioStream.getAudioTracks());
    }

    this.stream = new MediaStream(tracks);
    const preferredTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    const supportedType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
    this.mediaRecorder = supportedType
      ? new MediaRecorder(this.stream, { mimeType: supportedType })
      : new MediaRecorder(this.stream);

    this.chunks = [];
    this.startTime = Date.now();

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.start(1000);

    displayMedia.getVideoTracks()[0].onended = () => {
      this.stop();
    };
  }

  async stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        const duration = (Date.now() - this.startTime) / 1000;

        const tracks = this.stream?.getVideoTracks();
        const videoTrack = tracks?.[0];
        const settings = videoTrack?.getSettings();

        this.stream?.getTracks().forEach((track) => track.stop());
        this.mediaRecorder = null;
        this.chunks = [];

        resolve({
          blob,
          duration,
          width: settings?.width || 1920,
          height: settings?.height || 1080,
        });
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  getRecordingTime(): number {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }
}

export const screenRecorder = new ScreenRecorder();