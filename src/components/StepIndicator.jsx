import { Check } from 'lucide-react'
import './StepIndicator.css'

const steps = ['Topic', 'Style', 'Hook', 'Review', 'Editor']

export default function StepIndicator({ current }) {
  return (
    <div className="step-indicator">
      {steps.map((label, i) => (
        <div key={label} className={`step ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}>
          <div className="step-circle">
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          <span className="step-label">{label}</span>
          {i < steps.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  )
}
