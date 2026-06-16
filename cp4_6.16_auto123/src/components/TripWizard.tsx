import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '../stores/tripStore'
import { getWeatherByCity, WeatherData } from '../utils/weatherMock'
import { generateLuggageList, getTemplateById, LuggageItem } from '../utils/templateEngine'

const Step1Destination = lazy(() => import('./wizard/Step1Destination'))
const Step2Template = lazy(() => import('./wizard/Step2Template'))
const Step3Review = lazy(() => import('./wizard/Step3Review'))

interface TripWizardProps {
  isOpen?: boolean
  onClose?: () => void
}

const SkeletonLoader: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="text-center mb-8">
      <div className="h-8 bg-[var(--card-border)] rounded w-48 mx-auto mb-2" />
      <div className="h-4 bg-[var(--card-border)] rounded w-64 mx-auto" />
    </div>
    <div className="space-y-4">
      <div className="h-12 bg-[var(--card-border)] rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 bg-[var(--card-border)] rounded-xl" />
        <div className="h-12 bg-[var(--card-border)] rounded-xl" />
      </div>
      <div className="h-14 bg-[var(--card-border)] rounded-xl" />
    </div>
  </div>
)

const ProgressIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = [1, 2, 3]
  
  return (
    <div className="flex flex-col items-center gap-4">
      {steps.map((step, idx) => (
        <React.Fragment key={step}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              step < currentStep
                ? 'bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-light)] text-white'
                : step === currentStep
                ? 'bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-light)] text-white shadow-lg shadow-[var(--accent-blue)]/40 scale-110'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-2 border-[var(--card-border)]'
            }`}
          >
            {step < currentStep ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              step
            )}
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-0.5 h-12 transition-colors duration-300 ${
                step < currentStep
                  ? 'bg-gradient-to-b from-[var(--accent-blue)] to-[var(--accent-light)]'
                  : 'bg-[var(--card-border)]'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

const TripWizard: React.FC<TripWizardProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const createTrip = useTripStore((state) => state.createTrip)
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip)

  const isControlled = isOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(!isControlled)
  
  const actualIsOpen = isControlled ? isOpen : internalOpen

  const [currentStep, setCurrentStep] = useState(1)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [luggageItems, setLuggageItems] = useState<LuggageItem[]>([])

  const templateName = useMemo(() => {
    const template = getTemplateById(selectedTemplateId)
    return template?.name || ''
  }, [selectedTemplateId])

  useEffect(() => {
    if (actualIsOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [actualIsOpen])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      if (onClose) {
        onClose()
      } else if (!isControlled) {
        setInternalOpen(false)
        navigate('/')
      }
      setCurrentStep(1)
      setDestination('')
      setStartDate('')
      setEndDate('')
      setSelectedTemplateId('')
      setWeather(null)
      setLuggageItems([])
    }, 200)
  }, [onClose, isControlled, navigate])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  const handleCalendarImport = useCallback(() => {
    const mockEvents = [
      { destination: '三亚', startDate: '2026-07-15', endDate: '2026-07-20' },
      { destination: '北京', startDate: '2026-08-01', endDate: '2026-08-05' }
    ]
    const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)]
    setDestination(randomEvent.destination)
    setStartDate(randomEvent.startDate)
    setEndDate(randomEvent.endDate)
  }, [])

  const calculateTripDays = useCallback((start: string, end: string) => {
    const startDateObj = new Date(start)
    const endDateObj = new Date(end)
    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }, [])

  const handleNext = useCallback(() => {
    if (isAnimating) return

    if (currentStep === 1) {
      if (!destination.trim() || !startDate || !endDate) return
      if (new Date(startDate) > new Date(endDate)) return

      const weatherData = getWeatherByCity(destination)
      setWeather(weatherData)
    }

    if (currentStep === 2) {
      if (!selectedTemplateId) return

      const days = calculateTripDays(startDate, endDate)
      const items = generateLuggageList(selectedTemplateId, weather!.type, days)
      setLuggageItems(items)
    }

    if (currentStep === 3) {
      const template = getTemplateById(selectedTemplateId)!
      const newTrip = {
        name: `${destination}之旅`,
        destination,
        startDate,
        endDate,
        templateId: selectedTemplateId,
        templateName: template.name,
        weather,
        luggageItems
      }
      createTrip(newTrip).then((trip) => {
        setCurrentTrip(trip.id)
        handleClose()
        navigate(`/trips/${trip.id}`)
      })
      return
    }

    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1)
      setIsAnimating(false)
    }, 100)
  }, [currentStep, destination, startDate, endDate, selectedTemplateId, weather, luggageItems, isAnimating, calculateTripDays, createTrip, setCurrentTrip, handleClose, navigate])

  const handlePrev = useCallback(() => {
    if (isAnimating || currentStep === 1) return

    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1)
      setIsAnimating(false)
    }, 100)
  }, [currentStep, isAnimating])

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return (
          destination.trim() !== '' &&
          startDate !== '' &&
          endDate !== '' &&
          new Date(startDate) <= new Date(endDate)
        )
      case 2:
        return selectedTemplateId !== ''
      case 3:
        return true
      default:
        return false
    }
  }, [currentStep, destination, startDate, endDate, selectedTemplateId])

  const renderStepContent = useCallback(() => {
    const stepProps = {
      1: {
        destination,
        startDate,
        endDate,
        onDestinationChange: setDestination,
        onStartDateChange: setStartDate,
        onEndDateChange: setEndDate,
        onCalendarImport: handleCalendarImport
      },
      2: {
        selectedTemplateId,
        onTemplateSelect: setSelectedTemplateId
      },
      3: {
        destination,
        startDate,
        endDate,
        weather,
        luggageItems,
        templateName
      }
    }

    const StepComponent = currentStep === 1 ? Step1Destination : currentStep === 2 ? Step2Template : Step3Review

    return (
      <Suspense fallback={<SkeletonLoader />}>
        <div
          className={`transition-opacity duration-100 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        >
          <StepComponent {...stepProps[currentStep as keyof typeof stepProps] as any} />
        </div>
      </Suspense>
    )
  }, [currentStep, destination, startDate, endDate, selectedTemplateId, weather, luggageItems, templateName, handleCalendarImport, isAnimating])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    if (actualIsOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [actualIsOpen, handleClose])

  if (!actualIsOpen && !isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div
        className={`relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex">
          <div className="w-24 py-8 pl-8 pr-4 bg-gradient-to-b from-[var(--bg-primary)] to-white border-r border-[var(--card-border)]">
            <ProgressIndicator currentStep={currentStep} />
          </div>

          <div className="flex-1 py-8 px-8">
            <div className="min-h-[480px]">
              {renderStepContent()}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[var(--card-border)]">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
              >
                取消
              </button>

              <div className="flex gap-3">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrev}
                    disabled={isAnimating}
                    className="px-6 py-2.5 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl font-semibold hover:bg-[var(--card-border)] transition-all duration-200 disabled:opacity-50"
                  >
                    上一步
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={!canProceed || isAnimating}
                  className={`px-8 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                    canProceed && !isAnimating
                      ? 'bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-light)] text-white shadow-lg shadow-[var(--accent-blue)]/30 hover:shadow-xl hover:shadow-[var(--accent-blue)]/40 hover:-translate-y-0.5'
                      : 'bg-[var(--card-border)] text-[var(--text-secondary)] cursor-not-allowed'
                  }`}
                >
                  {currentStep === 3 ? '创建行李清单' : '下一步'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripWizard
export { default as Step1Destination } from './wizard/Step1Destination'
export { default as Step2Template } from './wizard/Step2Template'
export { default as Step3Review } from './wizard/Step3Review'
