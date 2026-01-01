import React, { useState } from 'react';
import { ChevronRight, Compass, Bus, Calendar, MessageCircle } from 'lucide-react';
import useSwipe from '../hooks/useSwipe';
import haptics from '../services/haptics';

interface OnboardingProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    icon: Compass,
    title: 'Historias en Vivo',
    description: 'Descubre momentos únicos de la Guelaguetza compartidos por la comunidad. Sube tus propias historias y conecta con otros asistentes.',
    color: 'bg-oaxaca-pink',
    iconColor: 'text-white',
  },
  {
    icon: Bus,
    title: 'BinniBus',
    description: 'Encuentra las rutas de transporte hacia el Auditorio Guelaguetza. Mapa interactivo con paradas y tiempos estimados.',
    color: 'bg-oaxaca-sky',
    iconColor: 'text-white',
  },
  {
    icon: Calendar,
    title: 'Programa Oficial',
    description: 'Consulta el calendario completo de eventos, danzas y actividades. No te pierdas ningún momento especial.',
    color: 'bg-oaxaca-purple',
    iconColor: 'text-white',
  },
  {
    icon: MessageCircle,
    title: 'GuelaBot',
    description: 'Tu asistente virtual para resolver dudas sobre la Guelaguetza. Pregunta sobre comida, transporte, boletos y más.',
    color: 'bg-oaxaca-yellow',
    iconColor: 'text-oaxaca-purple',
  },
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToNext = () => {
    haptics.selection();
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const goToPrev = () => {
    haptics.selection();
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    haptics.success();
    localStorage.setItem('guelaguetza_onboarding_completed', 'true');
    onComplete();
  };

  const { handlers, deltaX, isSwiping } = useSwipe({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
    threshold: 50,
  });

  const slide = SLIDES[currentSlide];
  const isLastSlide = currentSlide === SLIDES.length - 1;

  // Calculate transform based on swipe
  const getTransform = () => {
    if (!isSwiping) return 'translateX(0)';
    const clampedDelta = Math.max(-100, Math.min(100, deltaX));
    return `translateX(${clampedDelta}px)`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col transition-colors"
      {...handlers}
    >
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleComplete}
          className="text-gray-400 dark:text-gray-500 text-sm font-medium hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Omitir
        </button>
      </div>

      {/* Content */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 transition-transform duration-300 ease-out"
        style={{ transform: getTransform() }}
      >
        {/* Icon */}
        <div className={`${slide.color} w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-lg animate-scale-in`}>
          <slide.icon className={slide.iconColor} size={48} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4 animate-fade-slide-in">
          {slide.title}
        </h1>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs leading-relaxed animate-fade-slide-in" style={{ animationDelay: '100ms' }}>
          {slide.description}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              haptics.tap();
              setCurrentSlide(index);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-oaxaca-pink w-6'
                : 'bg-gray-200 dark:bg-gray-700 w-2 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Action button */}
      <div className="px-6 pb-8">
        <button
          onClick={goToNext}
          className="w-full py-4 bg-oaxaca-pink text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-oaxaca-pink/90 active:scale-[0.98] transition-all shadow-lg"
        >
          {isLastSlide ? (
            'Comenzar'
          ) : (
            <>
              Siguiente
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>

      {/* Swipe hint on first slide */}
      {currentSlide === 0 && (
        <p className="text-center text-gray-400 dark:text-gray-500 text-xs pb-4 animate-pulse">
          Desliza para navegar
        </p>
      )}
    </div>
  );
};

export default Onboarding;
