import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, User, MapPin, Camera, X, Loader2, ArrowRight, ArrowLeft, Check, Scan } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ViewState } from '../types';

interface RegisterViewProps {
  setView: (view: ViewState) => void;
}

const REGIONS = [
  'Valles Centrales',
  'Sierra Norte',
  'Sierra Sur',
  'Mixteca',
  'Costa',
  'Istmo',
  'Papaloapan',
  'Cañada',
  'Fuera de Oaxaca',
];

const RegisterView: React.FC<RegisterViewProps> = ({ setView }) => {
  const { register } = useAuth();
  const [step, setStep] = useState(1); // 1: Info, 2: Face ID
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    region: '',
  });
  const [faceData, setFaceData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Camera setup
  useEffect(() => {
    if (!showCamera) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('No se pudo acceder a la cámara');
        setShowCamera(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [showCamera]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.nombre.trim()) {
      setError('Ingresa tu nombre');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Ingresa un correo válido');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      setError('');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror the image
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setFaceData(imageData);
    setPhotoTaken(true);
    setShowCamera(false);

    // Stop camera
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  const retakePhoto = () => {
    setFaceData(null);
    setPhotoTaken(false);
    setShowCamera(true);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');

    const success = await register({
      email: formData.email,
      password: formData.password,
      nombre: formData.nombre,
      apellido: formData.apellido,
      region: formData.region,
      faceData: faceData || undefined,
    });

    if (success) {
      setView(ViewState.HOME);
    } else {
      setError('Error al crear cuenta. El correo puede estar en uso.');
    }
    setIsLoading(false);
  };

  const skipFaceId = async () => {
    await handleRegister();
  };

  // Step 2: Face ID Setup
  if (step === 2) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="bg-oaxaca-purple p-4 flex items-center gap-4">
          <button onClick={() => setStep(1)} className="text-white p-2 rounded-full hover:bg-white/10">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-white font-bold text-lg">Configura Face ID</h2>
            <p className="text-white/70 text-sm">Paso 2 de 2 - Opcional</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
          {showCamera ? (
            // Camera View
            <>
              <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-oaxaca-purple mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-56 border-4 border-white/50 rounded-[50%]" />
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />

              <p className="text-gray-600 text-sm text-center mb-6">
                Coloca tu rostro dentro del círculo
              </p>

              <button
                onClick={capturePhoto}
                className="bg-oaxaca-pink text-white px-8 py-4 rounded-full font-bold flex items-center gap-2"
              >
                <Camera size={20} />
                Tomar Foto
              </button>
            </>
          ) : photoTaken && faceData ? (
            // Photo Taken
            <>
              <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-green-500 mb-6">
                <img src={faceData} alt="Tu foto" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-green-500 p-2 rounded-full">
                  <Check className="text-white" size={20} />
                </div>
              </div>

              <p className="text-green-600 font-medium mb-6">¡Foto capturada!</p>

              <div className="flex gap-3 w-full max-w-xs">
                <button
                  onClick={retakePhoto}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700"
                >
                  Repetir
                </button>
                <button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-oaxaca-pink text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Continuar'}
                </button>
              </div>
            </>
          ) : (
            // Initial State
            <>
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Scan className="w-16 h-16 text-gray-400" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Face ID</h3>
              <p className="text-gray-500 text-center text-sm mb-8 max-w-xs">
                Configura Face ID para iniciar sesión más rápido solo con tu rostro
              </p>

              <button
                onClick={() => setShowCamera(true)}
                className="w-full max-w-xs bg-gray-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 mb-4"
              >
                <Camera size={20} />
                Configurar Face ID
              </button>

              <button
                onClick={skipFaceId}
                disabled={isLoading}
                className="text-gray-400 text-sm hover:text-gray-600"
              >
                {isLoading ? 'Creando cuenta...' : 'Omitir por ahora'}
              </button>
            </>
          )}

          {error && (
            <p className="text-red-500 text-sm mt-4">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Basic Info
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-oaxaca-purple p-4 flex items-center gap-4">
        <button onClick={() => setView(ViewState.LOGIN)} className="text-white p-2 rounded-full hover:bg-white/10">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-white font-bold text-lg">Crear Cuenta</h2>
          <p className="text-white/70 text-sm">Paso 1 de 2 - Información</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Tu nombre"
                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:ring-2 focus:ring-oaxaca-pink outline-none"
              />
            </div>
          </div>

          {/* Apellido */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Apellido</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                placeholder="Tu apellido (opcional)"
                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:ring-2 focus:ring-oaxaca-pink outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Correo electrónico *</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@correo.com"
                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:ring-2 focus:ring-oaxaca-pink outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Contraseña *</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:ring-2 focus:ring-oaxaca-pink outline-none"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Confirmar contraseña *</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Repite tu contraseña"
                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:ring-2 focus:ring-oaxaca-pink outline-none"
              />
            </div>
          </div>

          {/* Region */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Región de origen</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:ring-2 focus:ring-oaxaca-pink outline-none appearance-none"
              >
                <option value="">Selecciona tu región (opcional)</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-white border-t border-gray-100">
        <button
          onClick={handleNextStep}
          className="w-full bg-oaxaca-pink text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          Siguiente
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default RegisterView;
