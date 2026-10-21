import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState('')

  

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [audioUrl, setAudioUrl] = useState('')

  const [selectedDelay, setSelectedDelay] = useState(10)
const [countdown, setCountdown] = useState(0)
const [timerRunning, setTimerRunning] = useState(false)

const audioRef = useRef<HTMLAudioElement | null>(null)

function startTimer() {
  setError('')
  setCountdown(selectedDelay)
  setTimerRunning(true)
}

function cancelTimer() {
  setTimerRunning(false)
  setCountdown(0)
}

  useEffect(() => {
    if (!audioBlob) {
      setAudioUrl('')
      return
    }

    const url = URL.createObjectURL(audioBlob)
    setAudioUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [audioBlob])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      recorderRef.current?.stop()
    }
  }, [])


  useEffect(() => {
  if (!timerRunning) return

  if (countdown <= 0) {
    setTimerRunning(false)

    audioRef.current?.play().catch(() => {
      setError(
        'Automatische Wiedergabe blockiert. Bitte drücke Play.',
      )
    })

    return
  }

  const timeout = window.setTimeout(() => {
    setCountdown((current) => current - 1)
  }, 1000)

  return () => window.clearTimeout(timeout)
}, [timerRunning, countdown])


  async function startRecording() {
    setError('')
    setAudioBlob(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      streamRef.current = stream

      const mimeTypes = [
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/webm',
      ]

      const mimeType = mimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      )

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      const chunks: BlobPart[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: recorder.mimeType,
        })

        setAudioBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        setIsRecording(false)
      }

      recorder.onerror = () => {
        setError('Bei der Aufnahme ist ein Fehler aufgetreten.')
        setIsRecording(false)
      }

      recorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      setError(
        'Mikrofonzugriff fehlgeschlagen. Bitte prüfe die Berechtigung.',
      )
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }

  function discardRecording() {
    setAudioBlob(null)
    setError('')
  }

  return (
    <main className="app">
      <header className="header">
        <p className="eyebrow">AUDIO TOOL</p>
        <h1>Prank</h1>
        <p className="subtitle">
          Record your fart. Set a timer. Play.
        </p>
      </header>

      <section className="panel">
        <div className="status">
          <span
className={`status-dot ${isRecording ? 'active' : ''}`}          />
          {isRecording ? 'Recording...' : 'Ready'}
        </div>

        <button
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? 'STOP RECORDING' : 'START RECORDING'}
        </button>

        <p className="hint">
          {isRecording
            ? 'Tap stop when the recording is finished.'
            : 'Allow microphone access to begin.'}
        </p>

        {error && <p className="error">{error}</p>}
      </section>

      {audioUrl && (
        <section className="panel playback">
          <h2>Your recording</h2>

          <audio ref={audioRef} controls src={audioUrl}>
  Your browser does not support audio playback.
</audio>


<div className="timer-section">
  <h3>Delayed playback</h3>

  <div className="timer-options">
    {[10, 20, 60].map((seconds) => (
      <button
        key={seconds}
        className={`timer-option ${
          selectedDelay === seconds ? 'selected' : ''
        }`}
        disabled={timerRunning}
        onClick={() => setSelectedDelay(seconds)}
      >
        {seconds} sec
      </button>
    ))}
  </div>

  {timerRunning ? (
    <div className="countdown">
      <p>Playback in</p>
      <strong>{countdown}</strong>
      <p>seconds</p>

      <button
        className="secondary-button"
        onClick={cancelTimer}
      >
        Cancel timer
      </button>
    </div>
  ) : (
    <button
      className="record-button timer-start"
      onClick={startTimer}
    >
      START TIMER
    </button>
  )}
</div>



          <button className="secondary-button" onClick={discardRecording}>
            Discard recording
          </button>
        </section>
      )}

      <footer>
        Girls just love the smell of Theo's farts!
      </footer>
    </main>
  )
}

export default App