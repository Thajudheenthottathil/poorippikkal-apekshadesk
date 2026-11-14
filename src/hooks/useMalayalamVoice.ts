import { useState, useRef, useCallback, useEffect } from 'react';
import {
  mergeSpeechRecognitionPieces,
  normalizeSpokenMalayalamTranscript,
} from '../utils/languageTranslator';

export interface RecordedAudioPayload {
  audioBase64: string;
  mimeType: string;
  audioUrl?: string;
  durationFormatted: string;
  backupTranscript?: string;
  fieldContextLabel?: string;
  fileName?: string;
}

interface UseMalayalamVoiceOptions {
  onAudioReady: (payload: RecordedAudioPayload) => void;
  onError?: (errorMessage: string) => void;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function useMalayalamVoice({ onAudioReady, onError }: UseMalayalamVoiceOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const shouldSendOnStopRef = useRef<boolean>(false);
  const durationAtStopRef = useRef<number>(0);
  const fieldContextLabelRef = useRef<string | undefined>(undefined);

  // Continuous SpeechRecognition refs (captures BOTH final and interim speech without mic hardware conflict)
  const bgRecognitionRef = useRef<any>(null);
  const completedSessionsFinalRef = useRef<string>('');
  const currentSessionFinalRef = useRef<string>('');
  const currentInterimRef = useRef<string>('');
  const isRecordingActiveRef = useRef<boolean>(false);
  const usingPureSpeechRecognitionRef = useRef<boolean>(false);

  const getCombinedTranscript = () => {
    const merged = mergeSpeechRecognitionPieces([
      completedSessionsFinalRef.current,
      currentSessionFinalRef.current,
      currentInterimRef.current,
    ]);
    return normalizeSpokenMalayalamTranscript(merged);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopBgRecognition = () => {
    isRecordingActiveRef.current = false;
    if (bgRecognitionRef.current) {
      try {
        bgRecognitionRef.current.onend = null;
        bgRecognitionRef.current.stop();
      } catch {
        // Ignore
      }
      bgRecognitionRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
      stopBgRecognition();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const speechRecFailedRef = useRef<boolean>(false);

  const isAppleDeviceOrSafari = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isAppleHW =
      /Mac|iPhone|iPad|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua);
    return isAppleHW || isSafariBrowser;
  };

  // MediaRecorder starter (used directly on macOS/iOS/Safari and whenever SpeechRecognition is blocked/unsupported)
  const startFallbackMediaRecorder = async (preAcquiredStream?: MediaStream) => {
    const stream =
      preAcquiredStream ||
      (await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      }));
    streamRef.current = stream;

    const supportedMime =
      typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
        ? MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : ''
        : '';

    const recorder = supportedMime
      ? new MediaRecorder(stream, { mimeType: supportedMime })
      : new MediaRecorder(stream);

    audioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      clearTimer();
      stopBgRecognition();
      setIsRecording(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (!shouldSendOnStopRef.current) {
        audioChunksRef.current = [];
        setLiveTranscript('');
        return;
      }

      const finalMime = recorder.mimeType || supportedMime || 'audio/mp4';
      const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
      const capturedBackupText = getCombinedTranscript();
      const capturedFieldLabel = fieldContextLabelRef.current;
      const durationFormatted = formatDuration(Math.max(1, durationAtStopRef.current));

      if (audioBlob.size < 200 && !capturedBackupText) {
        onError?.('വോയ്‌സ് റെക്കോർഡ് വളരെ ചെറുതാണ്. ദയവായി മൈക്ക് അമർത്തി സംസാരിക്കുക.');
        return;
      }

      const audioUrl = audioBlob.size >= 200 ? URL.createObjectURL(audioBlob) : undefined;

      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        const base64String =
          resultStr?.split(',')[1] ||
          'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        setLiveTranscript('');
        onAudioReady({
          audioBase64: base64String,
          mimeType: finalMime.split(';')[0] || 'audio/mp4',
          audioUrl,
          durationFormatted,
          backupTranscript: capturedBackupText || undefined,
          fieldContextLabel: capturedFieldLabel,
        });
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current = recorder;
    recorder.start(250);
  };

  // 1. Start Recording Voice
  // - On macOS / iOS / Safari (or when forceMediaRecorder / speechRecFailedRef is true), uses getUserMedia + MediaRecorder directly so clicking "Allow" works immediately!
  // - On Android / Windows Chrome, tries SpeechRecognition first and automatically falls back to getUserMedia + MediaRecorder if SpeechRecognition errors out.
  const startRecording = useCallback(
    async (
      fieldContextLabel?: string,
      forceMediaRecorder?: boolean,
      preAcquiredStream?: MediaStream
    ) => {
      if (isRecording) return;

      fieldContextLabelRef.current = fieldContextLabel;
      shouldSendOnStopRef.current = false;
      completedSessionsFinalRef.current = '';
      currentSessionFinalRef.current = '';
      currentInterimRef.current = '';
      setLiveTranscript('');
      setRecordingSeconds(0);
      durationAtStopRef.current = 0;
      isRecordingActiveRef.current = true;

      const startTimerInterval = () => {
        clearTimer();
        timerRef.current = window.setInterval(() => {
          setRecordingSeconds((prev) => {
            const next = prev + 1;
            durationAtStopRef.current = next;
            return next;
          });
        }, 1000);
      };

      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      const preferMediaRecorderDirect =
        Boolean(forceMediaRecorder) ||
        Boolean(preAcquiredStream) ||
        speechRecFailedRef.current ||
        isAppleDeviceOrSafari();

      if (SpeechRecognitionAPI && !preferMediaRecorderDirect) {
        try {
          usingPureSpeechRecognitionRef.current = true;
          const rec = new SpeechRecognitionAPI();
          rec.lang = 'ml-IN';
          rec.continuous = true;
          rec.interimResults = true;
          rec.maxAlternatives = 1;

          rec.onresult = (ev: any) => {
            const finalPieces: string[] = [];
            const interimPieces: string[] = [];
            for (let i = 0; i < ev.results.length; i++) {
              const transcriptPiece = (ev.results[i][0]?.transcript || '').trim();
              if (!transcriptPiece) continue;
              if (ev.results[i].isFinal) {
                finalPieces.push(transcriptPiece);
              } else {
                interimPieces.push(transcriptPiece);
              }
            }
            currentSessionFinalRef.current = mergeSpeechRecognitionPieces(finalPieces);
            currentInterimRef.current = mergeSpeechRecognitionPieces(interimPieces);
            const fullNow = getCombinedTranscript();
            if (fullNow) {
              setLiveTranscript(fullNow);
            }
          };

          rec.onerror = async (ev: any) => {
            const errCode = String(ev?.error || '').toLowerCase();
            if (
              errCode === 'not-allowed' ||
              errCode === 'service-not-allowed' ||
              errCode === 'language-not-supported' ||
              errCode === 'audio-capture' ||
              errCode === 'network'
            ) {
              speechRecFailedRef.current = true;
              usingPureSpeechRecognitionRef.current = false;
              stopBgRecognition();
              // Automatically fall back to MediaRecorder (getUserMedia) so browser "Allow" works directly!
              try {
                isRecordingActiveRef.current = true;
                await startFallbackMediaRecorder();
                setIsRecording(true);
                startTimerInterval();
              } catch {
                isRecordingActiveRef.current = false;
                clearTimer();
                setIsRecording(false);
                onError?.(
                  'മൈക്രോഫോൺ അനുമതി ലഭ്യമല്ല. താഴെ കാണുന്ന വിൻഡോയിൽ "Direct Allow" അമർത്തുക.'
                );
              }
            }
          };

          rec.onend = () => {
            const mergedSession = getCombinedTranscript();

            completedSessionsFinalRef.current = mergedSession;
            currentSessionFinalRef.current = '';
            currentInterimRef.current = '';

            if (isRecordingActiveRef.current && usingPureSpeechRecognitionRef.current) {
              try {
                rec.start();
              } catch {
                // Ignore restart errors
              }
            }
          };

          bgRecognitionRef.current = rec;
          rec.start();
          setIsRecording(true);
          startTimerInterval();
          return;
        } catch {
          speechRecFailedRef.current = true;
          usingPureSpeechRecognitionRef.current = false;
        }
      }

      // Direct MediaRecorder path (macOS, iOS, Safari, Firefox, or SpeechRecognition fallback)
      try {
        usingPureSpeechRecognitionRef.current = false;
        await startFallbackMediaRecorder(preAcquiredStream);
        setIsRecording(true);
        startTimerInterval();
      } catch {
        setIsRecording(false);
        onError?.(
          'മൈക്രോഫോൺ അനുമതി ലഭ്യമല്ല. താഴെ കാണുന്ന വിൻഡോയിൽ "Direct Allow" അമർത്തുക.'
        );
      }
    },
    [isRecording, onAudioReady, onError]
  );

  // 2. Finish & Send Voice Note
  const finishAndSendRecording = useCallback(() => {
    if (!isRecording) return;
    shouldSendOnStopRef.current = true;
    isRecordingActiveRef.current = false;

    if (usingPureSpeechRecognitionRef.current) {
      clearTimer();
      if (bgRecognitionRef.current) {
        try {
          bgRecognitionRef.current.onend = null;
          bgRecognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }

      // Wait 280ms so the browser flushes the last spoken word into onresult
      window.setTimeout(() => {
        const finalSpokenText = getCombinedTranscript();
        const capturedFieldLabel = fieldContextLabelRef.current;
        const durationFormatted = formatDuration(Math.max(1, durationAtStopRef.current));

        bgRecognitionRef.current = null;
        setIsRecording(false);
        setLiveTranscript('');

        onAudioReady({
          // Minimal valid WAV header placeholder when using direct browser SpeechRecognition
          audioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
          mimeType: 'audio/wav',
          durationFormatted,
          backupTranscript: finalSpokenText || undefined,
          fieldContextLabel: capturedFieldLabel,
        });
      }, 280);
      return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      stopBgRecognition();
      mediaRecorderRef.current.stop();
    }
  }, [isRecording, onAudioReady]);

  // 3. Cancel / Discard Recording (Trash button)
  const cancelRecording = useCallback(() => {
    shouldSendOnStopRef.current = false;
    stopBgRecognition();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearTimer();
    setIsRecording(false);
    setRecordingSeconds(0);
    setLiveTranscript('');
  }, []);

  // 4. Process Uploaded Audio File (.ogg, .opus, .mp3, .m4a, .wav from WhatsApp)
  const processUploadedAudioFile = useCallback(
    (file: File) => {
      if (!file) return;
      const audioUrl = URL.createObjectURL(file);
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      let mimeType = file.type;
      if (!mimeType || mimeType === 'application/octet-stream') {
        if (ext === 'ogg' || ext === 'opus') mimeType = 'audio/ogg';
        else if (ext === 'mp3') mimeType = 'audio/mp3';
        else if (ext === 'm4a' || ext === 'mp4' || ext === 'aac') mimeType = 'audio/mp4';
        else if (ext === 'wav') mimeType = 'audio/wav';
        else mimeType = 'audio/webm';
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        const base64String = resultStr?.split(',')[1];
        if (!base64String) {
          onError?.('ഓഡിയോ ഫയൽ വായിക്കാൻ സാധിച്ചില്ല.');
          return;
        }
        onAudioReady({
          audioBase64: base64String,
          mimeType: mimeType.split(';')[0],
          audioUrl,
          durationFormatted: 'Audio File',
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    },
    [onAudioReady, onError]
  );

  return {
    isRecording,
    recordingSeconds,
    formattedTimer: formatDuration(recordingSeconds),
    liveTranscript,
    startRecording,
    finishAndSendRecording,
    cancelRecording,
    processUploadedAudioFile,
  };
}
