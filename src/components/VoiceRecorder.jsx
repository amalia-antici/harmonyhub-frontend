import { useState, useRef, useEffect } from 'react';
import './VoiceRecorder.css';

export default function VoiceRecorder({ onRecordingComplete }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  const toBase64 = (blob) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop()); // release microphone
        const base64 = await toBase64(blob);
        onRecordingComplete(base64);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setTimeLeft(60);

      // Countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Hard stop at 60s
      setTimeout(() => stopRecording(), 60000);
    } catch {
      alert('Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const discard = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTimeLeft(60);
    onRecordingComplete(null);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div className="voice-recorder">
      {!audioBlob ? (
        <div>
          {recording ? (
            <div>
              <p className="recording-indicator">● Recording... {timeLeft}s left</p>
              <button onClick={stopRecording} className="btn-stop">Stop</button>
            </div>
          ) : (
            <button onClick={startRecording} className="btn-record">🎙 Start Recording</button>
          )}
        </div>
      ) : (
        <div>
          <audio controls src={audioUrl} />
          <button onClick={discard} className="btn-discard">Discard & Re-record</button>
        </div>
      )}
    </div>
  );
}