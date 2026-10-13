import { useEffect, useRef, useState } from 'react'
import textileImage from './assets/hero.png'
import './App.css'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const previewUrlRef = useRef('')
  const fileInputRef = useRef(null)
  const [prediction, setPrediction] = useState(null)
  const [error, setError] = useState('')
  const [isPredicting, setIsPredicting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  function handleFileSelection(file) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }
    setPreviewUrl('')
    setSelectedFile(null)
    setPrediction(null)
    setError('')

    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Please choose a JPG, JPEG, or PNG image.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const imageUrl = URL.createObjectURL(file)
    previewUrlRef.current = imageUrl
    setPreviewUrl(imageUrl)
    setSelectedFile(file)
  }

  function handleFileChange(event) {
    handleFileSelection(event.target.files?.[0])
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    if (!isPredicting) handleFileSelection(event.dataTransfer.files?.[0])
  }

  async function handlePredict() {
    if (!selectedFile) {
      setError('Please select an image before predicting.')
      return
    }

    setError('')
    setPrediction(null)
    setIsPredicting(true)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error('Unable to analyze the image. Please try again.')
      }

      const confidence = Number(data?.confidence)
      if (!data?.fabric || !Number.isFinite(confidence)) {
        throw new Error('The server returned an unexpected prediction response.')
      }

      setPrediction({
        fabric: data.fabric,
        confidence,
      })
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? 'Unable to analyze the image. Please make sure the backend is running and try again.'
          : requestError.message || 'Unable to analyze the image. Please try again.',
      )
    } finally {
      setIsPredicting(false)
    }
  }

  function handleAnalyzeAnother() {
    handleFileSelection(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const confidenceValue = prediction
    ? Math.min(100, Math.max(0, prediction.confidence))
    : 0

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="FabricAI home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>Fabric<span className="brand-ai">AI</span></span>
        </a>
        <div className="header-status">
          <span className="status-dot" />
          AI FABRIC CLASSIFIER
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span /> SMART FABRIC RECOGNITION</p>
            <h1 id="hero-title">Identify your fabric<span>.</span></h1>
            <p className="hero-description">
              A closer look at the materials around us. Upload a fabric image
              and let AI reveal its type.
            </p>
            <a className="hero-link" href="#classifier">
              Start with an image <span aria-hidden="true">↓</span>
            </a>
          </div>

          <figure className="hero-image">
            <img src={textileImage} alt="Close-up detail of a woven fabric" />
            <figcaption>
              <span className="image-caption-mark" aria-hidden="true">F</span>
              <span><strong>Material, recognized.</strong><small>TEXTILE IMAGE ANALYSIS</small></span>
              <span className="image-caption-arrow" aria-hidden="true">↗</span>
            </figcaption>
          </figure>
          <span className="hero-index" aria-hidden="true">01 / 06</span>
        </section>

        <section className="classifier-section" id="classifier" aria-labelledby="classifier-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE CLASSIFIER</p>
              <h2 id="classifier-title">Start with a fabric image</h2>
            </div>
            <span className="step-label"><span>01</span> UPLOAD</span>
          </div>

          <div className="classifier-layout">
            <div className="upload-panel">
              <label
                className={`drop-zone${isDragging ? ' is-dragging' : ''}${selectedFile ? ' has-file' : ''}`}
                htmlFor="fabric-image"
                onDragEnter={(event) => {
                  event.preventDefault()
                  if (!isPredicting) setIsDragging(true)
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  id="fabric-image"
                  className="file-input"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  disabled={isPredicting}
                  aria-describedby="upload-formats"
                />
                {previewUrl ? (
                  <span className="preview-content">
                    <img src={previewUrl} alt={`Preview of ${selectedFile.name}`} />
                    <span className="preview-file">
                      <span className="file-check" aria-hidden="true">✓</span>
                      <span><strong>{selectedFile.name}</strong><small>Ready to analyze</small></span>
                      <span className="replace-label">Change image</span>
                    </span>
                  </span>
                ) : (
                  <span className="empty-upload">
                    <span className="upload-icon" aria-hidden="true">
                      <svg viewBox="0 0 32 32" fill="none">
                        <path d="M16 21V5m0 0-6 6m6-6 6 6M6 19v7h20v-7" />
                      </svg>
                    </span>
                    <strong>Drop your image here</strong>
                    <span className="upload-hint">or browse files from your device</span>
                    <span className="browse-button">Choose an image</span>
                  </span>
                )}
              </label>

              <div className="upload-footer">
                <span id="upload-formats">SUPPORTED FORMATS</span>
                <span>JPG&nbsp; / &nbsp;JPEG&nbsp; / &nbsp;PNG</span>
              </div>

              <button
                className="analyze-button"
                type="button"
                onClick={handlePredict}
                disabled={isPredicting}
              >
                {isPredicting ? (
                  <><span className="spinner" aria-hidden="true" /> Analyzing...</>
                ) : (
                  <>Analyze Fabric <span aria-hidden="true">↗</span></>
                )}
              </button>
              {isPredicting && <p className="loading-message" role="status">Analyzing fabric...</p>}
              {error && <p className="error-message" role="alert">{error}</p>}
            </div>

            <aside className="classifier-aside">
              <div className="aside-rule"><span>HOW IT WORKS</span><span>02—03</span></div>
              <ol className="steps-list">
                <li><span>01</span><div><strong>Choose a photo</strong><p>Use a clear, well-lit fabric image.</p></div></li>
                <li><span>02</span><div><strong>Run the classifier</strong><p>AI analyzes the visual texture.</p></div></li>
                <li><span>03</span><div><strong>See your result</strong><p>Review the predicted fabric and confidence.</p></div></li>
              </ol>
              <div className="aside-note">
                <span className="note-spark" aria-hidden="true">✳</span>
                <p>Six fabric types.<br /><strong>One simple scan.</strong></p>
              </div>
            </aside>
          </div>

          {prediction && (
            <section className="result-panel" aria-live="polite" aria-labelledby="result-title">
              <div className="result-topline">
                <p className="eyebrow"><span /> FABRIC DETECTED</p>
                <span className="result-tag">ANALYSIS COMPLETE</span>
              </div>
              <div className="result-main">
                <div className="result-name-wrap">
                  <h2 id="result-title">{prediction.fabric}</h2>
                  <p>Identified fabric type</p>
                </div>
                <div className="confidence-block">
                  <div className="confidence-label"><span>CONFIDENCE</span><strong>{prediction.confidence.toFixed(2)}%</strong></div>
                  <div
                    className="confidence-track"
                    role="progressbar"
                    aria-label="Prediction confidence"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={confidenceValue}
                  >
                    <span style={{ width: `${confidenceValue}%` }} />
                  </div>
                </div>
              </div>
              <button className="another-button" type="button" onClick={handleAnalyzeAnother}>
                <span aria-hidden="true">＋</span> Analyze Another Image
              </button>
            </section>
          )}
        </section>

        <section className="supported-section" aria-labelledby="supported-title">
          <div className="supported-heading">
            <div><p className="eyebrow">MODEL VOCABULARY</p><h2 id="supported-title">Six fabrics, one classifier</h2></div>
            <span>SUPPORTED FABRICS</span>
          </div>
          <ul className="fabric-list">
            {['Abaca', 'Cotton', 'Hessian', 'Linen', 'Silk', 'Wool'].map((fabric, index) => (
              <li key={fabric}><span>0{index + 1}</span>{fabric}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="site-footer">
        <span className="footer-brand">FabricAI</span>
        <span>SMART FABRIC RECOGNITION</span>
      </footer>
    </div>
  )
}

export default App
