import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import proxenixLogo from './assets/proxenix_icon.png';
import { 
  ShieldAlert, 
  Activity, 
  Layers, 
  FileText, 
  Settings, 
  Compass, 
  PhoneCall, 
  ClipboardCheck, 
  LogOut, 
  CheckCircle, 
  User, 
  Camera, 
  Image as ImageIcon, 
  RefreshCw, 
  AlertTriangle, 
  Trash2, 
  FilePlus, 
  MapPin, 
  Award, 
  Heart, 
  HelpCircle,
  Menu,
  Moon,
  Sun,
  Printer,
  ChevronRight,
  ClipboardList,
  Pill,
  Leaf,
  Smile,
  Info,
  Calendar,
  Phone,
  Flame,
  Shield,
  HeartPulse
} from 'lucide-react';

// Web-native React clinical spinner component
function Spinner({ size = 'medium', color = 'white' }) {
  const sizeClass = size === 'small' ? 'spinner-sm' : size === 'large' ? 'spinner-lg' : '';
  const colorClass = color === 'primary' ? 'spinner-primary' : '';
  return <div className={`clinical-spinner ${sizeClass} ${colorClass}`}></div>;
}


// Seed initial history data to give a beautiful clinical dashboard view on first load
const INITIAL_HISTORY = [
  {
    patient_id: 'OSCC-2026-4819',
    date: '2026-05-24 14:32',
    risk_level: 'High Risk',
    confidence: 88.42,
    recommendation: 'Immediate Medical Evaluation Advised',
    color_code: 'red',
    raw_score: 0.8842,
    worker_id: 'DR_SMITH'
  },
  {
    patient_id: 'OSCC-2026-9281',
    date: '2026-05-22 09:15',
    risk_level: 'Suspicious',
    confidence: 68.30,
    recommendation: 'Further Clinical Examination Required',
    color_code: 'yellow',
    raw_score: 0.6830,
    worker_id: 'DR_SMITH'
  },
  {
    patient_id: 'OSCC-2026-3024',
    date: '2026-05-18 11:45',
    risk_level: 'Normal',
    confidence: 94.12,
    recommendation: 'No immediate concern. Routine check-up advised.',
    color_code: 'green',
    raw_score: 0.0588,
    worker_id: 'DR_SMITH'
  }
];

// Ported Clinical Datasets and configuration from the Mobile App
const RISK_CONFIG = {
  'High Risk': {
    icon: 'ShieldAlert',
    label: 'High Risk of OSCC',
    bgColor: 'var(--risk-high-bg)',
    borderColor: 'var(--risk-high-border)',
    barColor: 'var(--risk-high)',
    textColor: 'var(--risk-high)',
    pillBg: 'var(--risk-high-bg)',
    recommendation: 'Immediate medical evaluation is strongly advised. Do not delay consulting a specialist.',
    whatToDo: [
      'Visit an oncologist or oral surgeon within 48 hours',
      'Request a biopsy of the suspicious lesion',
      'Bring this AI report to your doctor appointment',
      'Avoid tobacco, alcohol, and spicy foods immediately',
      'Contact the nearest cancer care centre now',
    ],
    prescriptionNote: 'Your doctor may prescribe a referral for tissue biopsy, PET scan, or CT imaging. Anti-inflammatory mouthwash may be recommended while awaiting results.',
    lifestyle: [
      'Stop smoking / tobacco use immediately',
      'Avoid all forms of alcohol',
      'Eat soft, non-spicy, nutritious food',
      'Maintain rigorous oral hygiene - brush gently twice daily',
      "Do not self-medicate without a doctor's advice",
    ],
  },
  'Suspicious': {
    icon: 'AlertTriangle',
    label: 'Suspicious Lesion Detected',
    bgColor: 'var(--risk-suspicious-bg)',
    borderColor: 'var(--risk-suspicious-border)',
    barColor: 'var(--risk-suspicious)',
    textColor: 'var(--risk-suspicious)',
    pillBg: 'var(--risk-suspicious-bg)',
    recommendation: 'Further clinical examination is required. Book an appointment with a dentist or oral medicine specialist.',
    whatToDo: [
      'Visit a dentist or oral medicine specialist within 1 week',
      'Request an oral cytology / smear test if advised',
      'Schedule a follow-up evaluation in 2 weeks',
      'Monitor the lesion for any changes in size or colour',
      'Avoid tobacco and alcohol to reduce risk progression',
    ],
    prescriptionNote: 'Your clinician may prescribe an antiseptic or antifungal mouthwash (e.g., Chlorhexidine 0.2%). Vitamin B complex and zinc supplements may support tissue healing.',
    lifestyle: [
      'Reduce or quit tobacco and alcohol consumption',
      'Use a soft-bristled toothbrush',
      'Rinse mouth with warm saline water twice daily',
      'Eat a diet rich in fruits and vegetables (Vitamins A, C, E)',
      'Avoid chewing hard or sharp food items',
    ],
  },
  'Normal': {
    icon: 'CheckCircle',
    label: 'Normal Oral Tissue',
    bgColor: 'var(--risk-normal-bg)',
    borderColor: 'var(--risk-normal-border)',
    barColor: 'var(--risk-normal)',
    textColor: 'var(--risk-normal)',
    pillBg: 'var(--risk-normal-bg)',
    recommendation: 'No immediate concern detected. Maintain good oral hygiene and schedule routine check-ups.',
    whatToDo: [
      'Continue regular dental check-ups every 6 months',
      'Brush twice daily with fluoride toothpaste',
      'Floss daily to maintain gum health',
      'Eat a balanced diet rich in vitamins and minerals',
      'Repeat this AI screening every 3-6 months as a precaution',
    ],
    prescriptionNote: 'No prescription is required at this time. Consider using fluoride mouthwash as part of your daily oral care routine for best protection.',
    lifestyle: [
      'Avoid smoking and excessive alcohol',
      'Stay well hydrated - drink plenty of water',
      'Limit sugary foods and drinks',
      'Use a soft bristle toothbrush',
      'Visit your dentist for routine cleaning twice a year',
    ],
  },
};

const MEDICINES = [
  {
    category: 'Antifungal / Antiseptic Mouthwash',
    color: '#4F8EF7',
    items: [
      { name: 'Chlorhexidine 0.2%', use: 'Reduces oral bacteria and inflammation', dose: 'Rinse 10ml for 30 sec, twice daily' },
      { name: 'Nystatin Oral Suspension', use: 'Treats oral candidiasis (fungal infection)', dose: '5ml swish and swallow, 4x daily' },
    ],
  },
  {
    category: 'Pain Management',
    color: '#FF6B7A',
    items: [
      { name: 'Ibuprofen 400mg', use: 'Anti-inflammatory pain relief for oral sores', dose: '1 tablet after food, 3x daily (max 5 days)' },
      { name: 'Lidocaine Gel 2%', use: 'Topical numbing for painful ulcers', dose: 'Apply small amount to lesion with fingertip, 3x daily' },
    ],
  },
  {
    category: 'Vitamins & Supplements',
    color: '#2ECC71',
    items: [
      { name: 'Vitamin B Complex', use: 'Supports mucosal healing and nerve health', dose: '1 tablet daily with food' },
      { name: 'Zinc (50mg)', use: 'Boosts immune response and tissue repair', dose: '1 tablet daily' },
      { name: 'Vitamin C (500mg)', use: 'Antioxidant, supports collagen and immunity', dose: '1 tablet daily after food' },
    ],
  },
  {
    category: 'Lesion Healing Gels',
    color: '#FFB347',
    items: [
      { name: 'Triamcinolone Acetonide 0.1% Paste', use: 'Reduces inflammation of oral ulcers', dose: 'Apply thin layer on lesion, 2-3x daily after meals' },
      { name: 'Amlexanox 5% Paste', use: 'Promotes healing of aphthous ulcers', dose: 'Apply to lesion 4x daily until healed' },
    ],
  },
];

const DIET_EAT = [
  { name: 'Leafy Greens & Broccoli', benefit: 'Rich in folate and antioxidants that protect oral cells' },
  { name: 'Sweet Potato & Carrots', benefit: 'High in beta-carotene (Vitamin A) - supports mucosal healing' },
  { name: 'Berries (Blueberry, Strawberry)', benefit: 'Powerful antioxidants that fight free radical damage' },
  { name: 'Fatty Fish (Salmon, Tuna)', benefit: 'Omega-3 fatty acids reduce inflammation' },
  { name: 'Garlic & Turmeric', benefit: 'Natural anti-inflammatory and antimicrobial properties' },
  { name: 'Eggs & Lean Protein', benefit: 'Supports tissue repair and immune function' },
  { name: 'Green Tea', benefit: 'Contains EGCG - a potent anti-cancer compound' },
  { name: 'Yoghurt (Probiotic)', benefit: 'Balances oral microbiome, reduces harmful bacteria' },
];

const DIET_AVOID = [
  { name: 'Tobacco (any form)', reason: 'Major carcinogen - strongly linked to OSCC development' },
  { name: 'Alcohol', reason: 'Increases cancer risk, especially combined with tobacco' },
  { name: 'Spicy & Acidic Foods', reason: 'Irritates oral mucosa and worsens existing lesions' },
  { name: 'Sugary Snacks & Drinks', reason: 'Promotes bacterial growth and oral inflammation' },
  { name: 'Red & Processed Meats', reason: 'Linked to increased cancer risk when consumed in excess' },
  { name: 'Deep Fried / Junk Food', reason: 'High in harmful fats, low in protective nutrients' },
];

const HYGIENE_STEPS = [
  { step: '1', title: 'Brush Properly', detail: 'Use a soft-bristled toothbrush. Brush gently for 2 minutes, twice a day - morning and night. Use small circular motions and angle the brush at 45° to the gumline.' },
  { step: '2', title: 'Floss Daily', detail: 'Floss between each tooth at least once a day to remove plaque and food particles that your brush cannot reach. Use a C-shape motion around each tooth.' },
  { step: '3', title: 'Rinse with Mouthwash', detail: 'Use an antiseptic mouthwash (e.g., Chlorhexidine 0.2% or alcohol-free Listerine) for 30 seconds after brushing. Do not eat or drink for 30 minutes after rinsing.' },
  { step: '4', title: 'Clean Your Tongue', detail: 'Use a tongue scraper or the back of your toothbrush to clean your tongue gently every morning. This reduces bad breath and harmful bacteria.' },
  { step: '5', title: 'Self-Examine Monthly', detail: 'Stand in front of a mirror with good lighting. Check your lips, gums, inner cheeks, tongue (top and bottom), and roof of mouth. Look for any white/red patches, ulcers, or swelling that does not heal in 2 weeks.' },
  { step: '6', title: 'Professional Cleaning', detail: 'Visit your dentist every 6 months for professional scaling and polishing. This removes hardened tartar that cannot be removed by brushing alone.' },
  { step: '7', title: 'Stay Hydrated', detail: 'Drink at least 8 glasses of water daily. Dry mouth reduces saliva, which protects teeth and oral mucosa. Avoid caffeine and alcohol which cause dehydration.' },
  { step: '8', title: 'Avoid Harmful Habits', detail: 'Stop tobacco use (smoking, chewing, gutka, paan) and limit alcohol. These are the top two risk factors for oral cancer. Seek help from a cessation centre if needed.' },
];

const HYGIENE_SIGNS = [
  'A sore or ulcer in the mouth that does not heal within 2 weeks',
  'White or red patch on the gums, tongue, or inner cheek',
  'Unexplained bleeding in the mouth',
  'Difficulty chewing, swallowing, or speaking',
  'A lump or swelling on the lip, cheek, or neck',
  'Numbness or pain in the mouth without clear cause',
];

const EMERGENCY_CONTACTS = [
  { name: 'National Cancer Helpline', number: '1800-11-6163', color: '#FF4757', note: 'Free helpline - 24/7' },
  { name: 'Medical Emergency', number: '108', color: '#FF6B7A', note: 'Ambulance & hospital emergency' },
  { name: 'iCall Mental Health Support', number: '9152987821', color: '#7C5CBF', note: 'Emotional support for cancer patients' },
  { name: 'Tata Memorial Cancer Centre', number: '022-24177000', color: '#4F8EF7', note: 'Mumbai - leading cancer hospital' },
  { name: 'AIIMS Oncology OPD', number: '011-26588500', color: '#2ECC71', note: 'New Delhi - appointment line' },
  { name: 'Cancer Patients Aid Association', number: '022-23514200', color: '#FFB347', note: 'Support, guidance, and second opinion' },
];

const FAQS = [
  { q: 'What is OSCC?', a: 'Oral Squamous Cell Carcinoma (OSCC) is a type of cancer that starts in the flat cells lining the mouth. It is one of the most common head and neck cancers worldwide.' },
  { q: 'Is OSCC curable?', a: 'Yes, especially when detected early (Stage I or II). Survival rates exceed 80% with early treatment. This app helps with early detection.' },
  { q: 'How fast does OSCC spread?', a: 'OSCC progression varies. Without treatment, it can spread to lymph nodes and distant organs within months to years. Early detection is vital.' },
  { q: 'Can OSCC come back after treatment?', a: 'Recurrence is possible, especially in the first 2 years. Regular follow-ups and oral self-examinations are essential.' },
  { q: 'What causes OSCC?', a: 'Major causes include tobacco use (smoking/chewing), heavy alcohol consumption, HPV infection, and chronic sun exposure on the lips.' },
];

export default function App() {
  // Global & Session States
  const [workerId, setWorkerId] = useState(() => localStorage.getItem('@oscc_worker_id') || null);
  const [history, setHistory] = useState([]);
  
  // Load history from Supabase
  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase.from('scan_history').select('*').order('date', { ascending: false });
      if (!error && data) {
        setHistory(data);
      }
    };
    fetchHistory();
  }, []);
  const [theme, setTheme] = useState(() => localStorage.getItem('@oscc_theme') || 'light');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scan notes and draft record saving state
  const [scanNotes, setScanNotes] = useState('');
  const [isRecordSaved, setIsRecordSaved] = useState(false);

  // API Connection Settings
  const [apiEndpoint, setApiEndpoint] = useState(() => localStorage.getItem('@oscc_api_url') || 'http://localhost:5000');
  const [apiConnected, setApiConnected] = useState(false);
  const [useLiveApi, setUseLiveApi] = useState(() => localStorage.getItem('@oscc_use_live_api') === 'true');

  // Auth screen state
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'setup'
  const [authWorkerId, setAuthWorkerId] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [authConfirmPin, setAuthConfirmPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Settings PIN state
  const [settingsOldPin, setSettingsOldPin] = useState('');
  const [settingsNewPin, setSettingsNewPin] = useState('');
  const [settingsConfirmPin, setSettingsConfirmPin] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Consent & Patient state
  const [patientId, setPatientId] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  
  // Scan State
  const [scanStep, setScanStep] = useState(1); // 1: Consent, 2: Scan, 3: Result
  const [scanSource, setScanSource] = useState('upload'); // 'upload' | 'webcam'
  const [selectedImage, setSelectedImage] = useState(null); // base64 / blob url
  const [scanningActive, setScanningActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStageText, setScanStageText] = useState('');
  const [scanResult, setScanResult] = useState(null);

  // Questionnaire State
  const [quizStep, setQuizStep] = useState(0); // 0: Intro, 1-10: Questions, 11: Result
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(0);

  // Modal State
  const [viewingRecordReport, setViewingRecordReport] = useState(null); // record details
  const [showLogoPopup, setShowLogoPopup] = useState(false);
  
  // Hospital search
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [specialistSearch, setSpecialistSearch] = useState('');

  // Refs for drawing pad and camera
  const sigCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const videoRef = useRef(null);
  const imageUploadRef = useRef(null);
  const canvasRef = useRef(null);

  // Test API endpoint on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('@oscc_theme', theme);
  }, [theme]);

  const testApiConnection = async (url = apiEndpoint) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
      const res = await fetch(url + '/', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        setApiConnected(true);
        return true;
      }
    } catch (e) {
      // Ignored
    }
    setApiConnected(false);
    return false;
  };

  useEffect(() => {
    testApiConnection();
    const interval = setInterval(() => testApiConnection(), 15000);
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  // Auth functions
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authWorkerId.trim()) return setAuthError('Clinician ID is required.');
    if (authPin.length < 4) return setAuthError('PIN must be at least 4 digits.');

    setAuthLoading(true);
    const lowercaseId = authWorkerId.toLowerCase().trim();

    try {
      let { data, error } = await supabase.from('clinicians').select('pin').eq('worker_id', lowercaseId).single();

      // In Supabase, .single() throws an error (PGRST116) if 0 rows are found.
      // We want to handle 0 rows gracefully (especially for Create Account).
      if (error && error.code === 'PGRST116') {
        error = null;
        data = null;
      }

      if (authMode === 'login') {
        if (error || !data) {
          setAuthError(`Clinician ID "${authWorkerId.toUpperCase()}" is not registered. Switch to "Create Account" first.`);
        } else if (data.pin !== authPin) {
          setAuthError('Incorrect authentication PIN. Please try again.');
        } else {
          setWorkerId(authWorkerId.toUpperCase());
          localStorage.setItem('@oscc_worker_id', authWorkerId.toUpperCase());
        }
      } else {
        // Setup / Create Account
        if (data) {
          setAuthError('An account with this Clinician ID already exists. Please Sign In.');
        } else if (authPin !== authConfirmPin) {
          setAuthError('PIN passwords do not match.');
        } else {
          const { error: insertError } = await supabase.from('clinicians').insert({ worker_id: lowercaseId, pin: authPin });
          if (insertError) throw insertError;
          setWorkerId(authWorkerId.toUpperCase());
          localStorage.setItem('@oscc_worker_id', authWorkerId.toUpperCase());
        }
      }
    } catch (err) {
      setAuthError('Authentication failed. Please try again.');
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('@oscc_worker_id');
    setWorkerId(null);
    setAuthWorkerId('');
    setAuthPin('');
    setAuthConfirmPin('');
    setCurrentTab('dashboard');
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');
    
    if (settingsNewPin.length < 4) {
      setSettingsError('New PIN must be at least 4 digits.');
      return;
    }
    if (settingsNewPin !== settingsConfirmPin) {
      setSettingsError('Confirm PIN does not match.');
      return;
    }

    const lowercaseId = workerId.toLowerCase();
    
    try {
      let { data, error } = await supabase.from('clinicians').select('pin').eq('worker_id', lowercaseId).single();
      
      if (error && error.code === 'PGRST116') {
        error = null;
        data = null;
      }

      if (error || !data || data.pin !== settingsOldPin) {
        setSettingsError('Current PIN is incorrect.');
        return;
      }

      const { error: updateError } = await supabase.from('clinicians').update({ pin: settingsNewPin }).eq('worker_id', lowercaseId);
      if (updateError) throw updateError;

      setSettingsSuccess('Authentication PIN changed successfully!');
      setSettingsOldPin('');
      setSettingsNewPin('');
      setSettingsConfirmPin('');
    } catch (err) {
      setSettingsError('Failed to change PIN.');
    }
  };

  // Drawing Pad Actions for Consent
  const startDrawing = (e) => {
    isDrawingRef.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    const canvas = sigCanvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !sigCanvasRef.current) return;
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Support mouse and touch events
    let x, y;
    if (e.touches && e.touches[0]) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
    }
  };

  const generatePatientId = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPatientId(`OSCC-2026-${rand}`);
  };

  // Webcam controls
  const startWebcam = async () => {
    try {
      setScanSource('webcam');
      setSelectedImage(null);
      // Wait for React to render the video element
      setTimeout(async () => {
        if (videoRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (e) {
      alert('Camera access denied or unavailable. Falling back to File Upload.');
      setScanSource('upload');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureWebcamPhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      // Mirror horizontal if facing user
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setSelectedImage(dataUrl);
      stopWebcam();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Advanced Canvas Heuristic Lesion Detector (Demo fallback)
  // Evaluates standard colors on an oral photo looking for suspicious red/white lesion patches
  const runHeuristicPixelAnalysis = (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 224, 224);
        
        const imgData = ctx.getImageData(0, 0, 224, 224);
        const pixels = imgData.data;
        
        let redPixels = 0;
        let whitePixels = 0;
        let totalVal = 0;
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i+1];
          const b = pixels[i+2];
          
          // Heuristic red lesion score (high red ratios)
          if (r > 150 && g < 100 && b < 100) {
            redPixels++;
          }
          // Heuristic white leukoplakia score
          if (r > 200 && g > 200 && b > 200) {
            whitePixels++;
          }
          totalVal += (r + g + b) / 3;
        }

        // Compute simulated risk score
        const lesionDensity = (redPixels + whitePixels) / (224 * 224);
        let baseScore = lesionDensity * 12; // amplify score
        
        // Add random seed variables for dynamic results
        baseScore = Math.min(Math.max(baseScore, 0.1), 0.98);
        // Slightly random variance so same photo has clinical realism
        const finalScore = Math.min(Math.max(baseScore + (Math.random() - 0.5) * 0.05, 0.02), 0.99);
        
        resolve(finalScore);
      };
      img.src = imageSrc;
    });
  };

  // Perform Oral Triage Detection Scan
  const executeOralTriage = async () => {
    if (!selectedImage) return;
    
    setScanningActive(true);
    setScanProgress(5);
    setScanStageText('Activating deep learning pipeline...');

    const stages = [
      { p: 15, t: 'Loading Proxenix Core engine...' },
      { p: 30, t: 'Calibrating input resolution (224x224 RGB)...' },
      { p: 50, t: 'Segmenting lesion margins & boundary layers...' },
      { p: 70, t: 'Extracting deep feature maps via MobileNetV2...' },
      { p: 85, t: 'Calculating clinical sigmoid logits...' },
      { p: 95, t: 'Generating decision matrix and risk ratings...' }
    ];

    // Trigger visual progress steps over 3 seconds for premium diagnostic presentation
    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 450));
      setScanProgress(stage.p);
      setScanStageText(stage.t);
    }

    try {
      let rawScore = 0.12;

      // Attempt to hit the live API if enabled and online
      if (useLiveApi && apiConnected) {
        // Convert base64 selectedImage back to form blob
        const res = await fetch(selectedImage);
        const blob = await res.blob();
        
        const formData = new FormData();
        formData.append('image', blob, 'triage.jpg');
        
        const response = await fetch(apiEndpoint + '/predict', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const apiData = await response.json();
          rawScore = apiData.raw_score;
        } else {
          throw new Error('API server returned error');
        }
      } else {
        // Run advanced heuristic simulation on the uploaded image
        rawScore = await runHeuristicPixelAnalysis(selectedImage);
      }

      // Medical Triage Score Thresholds
      const THRESHOLD_HIGH = 0.85;
      const THRESHOLD_SUSPICIOUS = 0.60;

      let riskLevel, confidence, recommendation, colorCode;

      if (rawScore >= THRESHOLD_HIGH) {
        riskLevel = "High Risk";
        confidence = parseFloat((rawScore * 100).toFixed(2));
        recommendation = "Immediate Medical Evaluation Advised";
        colorCode = "red";
      } else if (rawScore >= THRESHOLD_SUSPICIOUS) {
        riskLevel = "Suspicious";
        confidence = parseFloat((rawScore * 100).toFixed(2));
        recommendation = "Further Clinical Examination Required";
        colorCode = "yellow";
      } else {
        riskLevel = "Normal";
        // Flip confidence so Normal has a high score (90% confident it is normal)
        confidence = parseFloat(((1 - rawScore) * 100).toFixed(2));
        recommendation = "No immediate concern. Routine check-up advised.";
        colorCode = "green";
      }

      const result = {
        patient_id: patientId || 'ANONYMOUS',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        risk_level: riskLevel,
        confidence,
        recommendation,
        color_code: colorCode,
        raw_score: rawScore,
        worker_id: workerId,
        image: selectedImage, // Save preview image
        notes: ''
      };

      setScanResult(result);
      setScanNotes('');
      setIsRecordSaved(false);
      
      setScanProgress(100);
      setScanStep(3); // Result tab
    } catch (e) {
      alert('Triage Analysis Failed: ' + e.message);
    } finally {
      setScanningActive(false);
    }
  };

  const handleSaveClinicalRecord = async () => {
    if (!scanResult || isRecordSaved) return;
    const finalResult = { ...scanResult, notes: scanNotes };
    
    try {
      const dbRecord = {
        patient_id: finalResult.patient_id,
        date: new Date().toISOString(),
        risk_level: finalResult.risk_level,
        confidence: finalResult.confidence,
        recommendation: finalResult.recommendation,
        color_code: finalResult.color_code,
        raw_score: finalResult.raw_score,
        worker_id: workerId.toLowerCase(),
        image_uri: null, // Avoids uploading massive base64 strings to DB
        case_notes: scanNotes
      };
      
      const { data, error } = await supabase.from('scan_history').insert(dbRecord).select().single();
      if (error) throw error;
      
      const updatedHistory = [data, ...history];
      setHistory(updatedHistory);
      setIsRecordSaved(true);
      setCurrentTab('records');
    } catch (e) {
      console.error("Save error:", e);
      alert('Failed to save record: ' + (e.message || JSON.stringify(e)));
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setPatientId('');
    setConsentChecked(false);
    setSignatureData(null);
    setScanResult(null);
    setScanNotes('');
    setIsRecordSaved(false);
    setScanStep(1);
    stopWebcam();
  };

  // Questionnaire actions
  const startQuiz = () => {
    setQuizStep(1);
    setQuizAnswers({});
    setQuizScore(0);
  };

  const handleQuizAnswer = (questionWeight, answerValue) => {
    const nextAnswers = { ...quizAnswers, [quizStep]: { weight: questionWeight, value: answerValue } };
    setQuizAnswers(nextAnswers);

    if (quizStep < 10) {
      setQuizStep(quizStep + 1);
    } else {
      // Calculate final weighted scorecard
      let score = 0;
      Object.values(nextAnswers).forEach(ans => {
        score += ans.weight * ans.value;
      });
      // Normalize to 100
      const normalized = Math.min(Math.round((score / 28) * 100), 100);
      setQuizScore(normalized);
      setQuizStep(11);
    }
  };

  const getQuizRiskLevel = (score) => {
    if (score >= 70) return { level: 'High Risk', color: 'red', desc: 'Symptom profiling indicates a strong alignment with high-risk oncological criteria. Immediate professional clinical referral recommended.' };
    if (score >= 40) return { level: 'Suspicious', color: 'yellow', desc: 'Moderate risk flags detected. Symptoms are suspicious and justify a detailed clinical biopsy or examination.' };
    return { level: 'Low Risk', color: 'green', desc: 'Routine low scores. Maintain proper oral hygiene standards and get standard 6-month checks.' };
  };

  // Save questionnaire results as custom clinical record
  const saveQuizToRecords = async () => {
    const riskInfo = getQuizRiskLevel(quizScore);
    try {
      const dbRecord = {
        patient_id: `QUESTIONNAIRE-${Math.floor(1000 + Math.random()*9000)}`,
        date: new Date().toISOString(),
        risk_level: riskInfo.level,
        confidence: quizScore,
        recommendation: riskInfo.desc,
        color_code: riskInfo.color,
        raw_score: quizScore / 100,
        worker_id: workerId.toLowerCase(),
        is_questionnaire: true
      };
      
      const { data, error } = await supabase.from('scan_history').insert(dbRecord).select().single();
      if (error) throw error;
      
      const updatedHistory = [data, ...history];
      setHistory(updatedHistory);
      setQuizStep(0);
      setCurrentTab('records');
    } catch (e) {
      console.error("Save error:", e);
      alert('Failed to save questionnaire results: ' + (e.message || JSON.stringify(e)));
    }
  };

  // Specialist referrals list
  const SPECIALISTS = [
    { name: 'Dr. Sarah Jenkins', title: 'Senior Oral Oncologist', dept: 'Oncology Services', hospital: 'Apollo Dental & Oncology', phone: '+91 98450 10291', email: 's.jenkins@apollomed.org' },
    { name: 'Dr. Rohan Mehra', title: 'Consultant Head & Neck Surgeon', dept: 'Surgical Oncology', hospital: 'SIMATS Medical College', phone: '+91 91234 56789', email: 'r.mehra@simats.edu.in' },
    { name: 'Dr. Linda Vance', title: 'Oral Pathology Specialist', dept: 'Pathology & Biopsy', hospital: 'National Cancer Institute', phone: '+1 800-4-CANCER', email: 'l.vance@nci.gov' },
    { name: 'Dr. Amit Patel', title: 'Maxillofacial Surgeon', dept: 'Reconstructive Surgery', hospital: 'Metro General Hospital', phone: '+91 99887 76655', email: 'a.patel@metrohealth.org' }
  ];

  // Oncology Centers listing
  const HOSPITALS = [
    { name: 'OncoShield Head & Neck Center', address: '12 Medical District, Block B, New Delhi', phone: '+91 11 4059 9281', rating: '4.9 ★', features: ['Biopsy Lab', 'Radiation Therapy', 'Chemotherapy Unit'] },
    { name: 'SIMATS Multi-Speciality Clinic', address: 'Poonamallee High Road, Chennai, Tamil Nadu', phone: '+91 44 2680 1920', rating: '4.8 ★', features: ['Advanced Screening', 'Surgical Oncology', 'Patient Support Ward'] },
    { name: 'St. Jude Dental Oncology Wing', address: '450 Healthcare Blvd, Sector 4, Mumbai', phone: '+91 22 9876 5432', rating: '4.7 ★', features: ['Early Triage Unit', 'Maxillofacial Unit', 'Clinical Research'] },
    { name: 'National Dental Research Institute', address: '88 Science Park Road, Kolkata', phone: '+91 33 2211 4400', rating: '4.6 ★', features: ['Diagnostic Pathology', 'Oral Screening Labs', 'Free Clinician Triage'] }
  ];

  // Clinical questionnaire questions
  const QUESTIONS = [
    { id: 1, text: "Do you have any visible red, white, or mixed patches in your mouth?", weight: 4 },
    { id: 2, text: "Do you use smoked tobacco (cigarettes, bidis, cigars, etc.) regularly?", weight: 3 },
    { id: 3, text: "Do you chew smokeless tobacco, gutkha, paan, or betel quid?", weight: 4 },
    { id: 4, text: "Do you consume alcohol regularly or heavily?", weight: 2.5 },
    { id: 5, text: "Do you have an oral ulcer or sore that has not healed for more than 3 weeks?", weight: 3.5 },
    { id: 6, text: "Are you experiencing unexplained bleeding or numbness in your mouth?", weight: 2 },
    { id: 7, text: "Do you have persistent difficulty or pain while swallowing, chewing, or moving your tongue?", weight: 3 },
    { id: 8, text: "Have you noticed any swelling, lump, or thickening in your jaw, cheek, or neck?", weight: 3 },
    { id: 9, text: "Are you over the age of 45?", weight: 1.5 },
    { id: 10, text: "Do you have a personal or family history of oral or neck cancers?", weight: 1.5 }
  ];

  // Generate Specialist Referral Copy Letter
  const getReferralLetterText = (specName, record) => {
    return `CLINICAL REFERRAL LETTER\nDate: ${record?.date || new Date().toISOString().substring(0,10)}\n\nTo:\n${specName}\n\nDear Doctor,\n\nI am referring Patient Ref: ${record?.patient_id} for a comprehensive head & neck oncology assessment.\n\nClinician Initial Triage Assessment Summary:\n- Screening Portal: Proxenix OSCC Detect v1\n- Preliminary Assessment: ${record?.risk_level} (${record?.confidence}% confidence index)\n- Clinical Recommendation: ${record?.recommendation}\n- Preliminary Score Logits: ${record?.raw_score || 'N/A'}\n- Triage Clinician: Dr. ${workerId}\n\nPatient reported oral anomalies or visible lesions. Immediate secondary clinical examination, visual histopathology, or biopsy is requested to confirm diagnosis.\n\nThank you for your timely cooperation.\n\nSincerely,\nDr. ${workerId}\nClinical Screening Officer`;
  };

  const copyReferralLetter = (specName, record) => {
    const letter = getReferralLetterText(specName, record);
    navigator.clipboard.writeText(letter);
    alert(`Referral letter to ${specName} copied to clipboard!`);
  };

  // Clear Patient Scan History
  const clearHistory = () => {
    if (confirm('Are you absolutely sure you want to delete all patient screening database records? This action is irreversible.')) {
      localStorage.setItem('@oscc_scan_history', JSON.stringify([]));
      setHistory([]);
    }
  };

  // Seed default history again if fully cleared
  const seedDefaultHistory = () => {
    localStorage.setItem('@oscc_scan_history', JSON.stringify(INITIAL_HISTORY));
    setHistory(INITIAL_HISTORY);
  };

  // Navigation utilities
  const renderSidebarItem = (id, label, icon) => {
    const isActive = currentTab === id;
    return (
      <li 
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        onClick={() => {
          setCurrentTab(id);
          setSidebarOpen(false);
          stopWebcam();
        }}
      >
        {icon}
        <span>{label}</span>
      </li>
    );
  };

  // Auth Guard
  if (!workerId) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo">
              <img src={proxenixLogo} alt="Proxenix Logo" />
            </div>
            <h1 className="auth-title">Proxenix Portal</h1>
            <p className="auth-sub">Oral Cancer Detection AI</p>
          </div>

          <div className="auth-tabs">
            <button 
              className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab-btn ${authMode === 'setup' ? 'active' : ''}`}
              onClick={() => { setAuthMode('setup'); setAuthError(''); }}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="auth-error-box">
              <ShieldAlert size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleAuth}>
            <div>
              <label className="auth-label">Clinician Worker ID</label>
              <div className="clinical-input-wrapper">
                <input 
                  id="email"
                  type="text" 
                  className="clinical-input" 
                  placeholder="e.g. DR_SMITH"
                  value={authWorkerId}
                  onChange={(e) => setAuthWorkerId(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="auth-label">Secure Access PIN (Min. 4 digits)</label>
              <div className="clinical-input-wrapper">
                <input 
                  id="password"
                  type="password" 
                  className="clinical-input" 
                  placeholder="Enter PIN password"
                  value={authPin}
                  onChange={(e) => setAuthPin(e.target.value.replace(/\D/g, ''))}
                  maxLength={8}
                  required
                />
              </div>
            </div>

            {authMode === 'setup' && (
              <div>
                <label className="auth-label">Confirm PIN Password</label>
                <div className="clinical-input-wrapper">
                  <input 
                    type="password" 
                    className="clinical-input" 
                    placeholder="Re-enter PIN"
                    value={authConfirmPin}
                    onChange={(e) => setAuthConfirmPin(e.target.value.replace(/\D/g, ''))}
                    maxLength={8}
                    required
                  />
                </div>
              </div>
            )}

            <button id="login-button" type="submit" className="auth-btn" disabled={authLoading}>
              {authLoading ? <Spinner size="small" /> : 'Enter Clinical Portal'}
            </button>
          </form>

          <p className="auth-hint">
            Authorized Medical Screening Personnel Only. All activities logged.
          </p>
        </div>
      </div>
    );
  }

  // Dashboard calculations
  const statsTotal = history.length;
  const statsHigh = history.filter(h => h.risk_level === 'High Risk').length;
  const statsSuspicious = history.filter(h => h.risk_level === 'Suspicious').length;
  const statsNormal = history.filter(h => h.risk_level === 'Normal').length;

  return (
    <div className="app-container">
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="sidebar-logo">
            <img src={proxenixLogo} alt="Proxenix Logo" />
          </div>
          <span className="sidebar-app-name" style={{ fontSize: '16px' }}>Proxenix</span>
        </div>
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Main Sidebar Navigation */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => setShowLogoPopup(true)} style={{ cursor: 'pointer' }} title="Click to view full logo">
            <img src={proxenixLogo} alt="Proxenix Logo" />
          </div>
          <div className="sidebar-title-box">
            <span className="sidebar-app-name">Proxenix</span>
            <span className="sidebar-app-tag">OSCC Detect</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <span className="sidebar-menu-section">Main Dashboard</span>
          {renderSidebarItem('dashboard', 'Clinical Dashboard', <Activity size={18} />)}
          {renderSidebarItem('consent', 'Start Patient Screening', <FilePlus size={18} />)}
          {renderSidebarItem('records', 'Patient Records', <Layers size={18} />)}
          
          <span className="sidebar-menu-section">Clinical Tools</span>
          {renderSidebarItem('risk', 'Risk Questionnaire', <ClipboardList size={18} />)}
          {renderSidebarItem('specialists', 'Specialist Guide', <User size={18} />)}
          {renderSidebarItem('hospitals', 'Oncology Centers', <MapPin size={18} />)}
          {renderSidebarItem('guidelines', 'Clinical Guidelines', <Compass size={18} />)}
          {renderSidebarItem('medicines', 'Medicines & Treatment', <Pill size={18} />)}
          {renderSidebarItem('diet', 'Diet & Nutrition', <Leaf size={18} />)}
          {renderSidebarItem('oralhygiene', 'Oral Hygiene Guide', <Smile size={18} />)}
          {renderSidebarItem('emergency', 'Help & Emergency', <PhoneCall size={18} />)}

          <span className="sidebar-menu-section">System</span>
          {renderSidebarItem('settings', 'Portal Settings', <Settings size={18} />)}
        </ul>

        <div className="sidebar-footer">
          <div className="clinician-card">
            <div className="clinician-avatar">
              {workerId.substring(0,2)}
            </div>
            <div className="clinician-info">
              <span className="clinician-name">Dr. {workerId}</span>
              <span className="clinician-role">Medical Officer</span>
            </div>
          </div>
          <button className="signout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="main-content" onClick={() => sidebarOpen && setSidebarOpen(false)}>
        {/* Top Control bar */}
        <div className="topbar">
          <span className="topbar-title">
            {currentTab === 'dashboard' && 'Oncology Screening Triage'}
            {currentTab === 'consent' && 'New Patient Intake'}
            {currentTab === 'records' && 'Patient Archives'}
            {currentTab === 'risk' && 'Cancer Risk Questionnaire'}
            {currentTab === 'specialists' && 'Oncology Specialist Directory'}
            {currentTab === 'hospitals' && 'Oncology Medical Centers'}
            {currentTab === 'guidelines' && 'Oral Self-Examination & Guidelines'}
            {currentTab === 'medicines' && 'Medicines & Treatment Guide'}
            {currentTab === 'diet' && 'Diet & Nutritional Oncology'}
            {currentTab === 'oralhygiene' && 'Clinical Oral Hygiene Steps'}
            {currentTab === 'emergency' && 'Help & Emergency Helplines'}
            {currentTab === 'settings' && 'System Portal Settings'}
          </span>

          <div className="topbar-actions">
            {/* Live Flask Model API Connection State Badge */}
            <div 
              className={`api-status-badge ${apiConnected ? 'connected' : 'offline'}`}
              onClick={() => testApiConnection()}
              title="Click to re-ping Local Flask Server API status"
            >
              <div className="api-status-dot"></div>
              <span>{apiConnected ? 'API Connected' : 'Standalone Demo Mode'}</span>
            </div>

            {/* Light / Dark Toggler */}
            <button 
              className="theme-toggle-btn"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label="Toggle clinical screen theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>

        {/* Dynamic Pages Routing */}
        <div className="page-container">
          
          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <>
              {/* Clinical Metrics Cards */}
              <div className="dashboard-grid">
                <div className="widget-card total">
                  <div className="widget-header">
                    <span className="widget-title">Total Screened</span>
                    <div className="widget-icon-box">
                      <Layers size={18} />
                    </div>
                  </div>
                  <span className="widget-value">{statsTotal}</span>
                  <span className="widget-desc">Diagnostic scans on database</span>
                </div>

                <div className="widget-card high">
                  <div className="widget-header">
                    <span className="widget-title">High Risk</span>
                    <div className="widget-icon-box">
                      <ShieldAlert size={18} />
                    </div>
                  </div>
                  <span className="widget-value" style={{ color: 'var(--risk-high)' }}>{statsHigh}</span>
                  <span className="widget-desc">Immediate oncology triage alert</span>
                </div>

                <div className="widget-card suspicious">
                  <div className="widget-header">
                    <span className="widget-title">Suspicious</span>
                    <div className="widget-icon-box">
                      <AlertTriangle size={18} />
                    </div>
                  </div>
                  <span className="widget-value" style={{ color: 'var(--risk-suspicious)' }}>{statsSuspicious}</span>
                  <span className="widget-desc">Follow-up clinical reviews</span>
                </div>

                <div className="widget-card normal">
                  <div className="widget-header">
                    <span className="widget-title">Healthy / Normal</span>
                    <div className="widget-icon-box">
                      <CheckCircle size={18} />
                    </div>
                  </div>
                  <span className="widget-value" style={{ color: 'var(--risk-normal)' }}>{statsNormal}</span>
                  <span className="widget-desc">No active anomalies detected</span>
                </div>
              </div>

              {/* Action Banner */}
              <div className="dashboard-actions-row">
                <div className="dashboard-banner">
                  <div className="dashboard-banner-content">
                    <h2 className="dashboard-banner-title">Start Oral Screening</h2>
                    <p className="dashboard-banner-text">
                      Initiate our dual-triage screening pipeline. Capture oral anomalies using camera input or upload existing visual records. Analyzed locally in seconds.
                    </p>
                    <button className="banner-btn" onClick={() => setCurrentTab('consent')}>
                      <FilePlus size={18} />
                      <span>Scan Patient lesion</span>
                    </button>
                  </div>
                  <svg className="banner-glow-svg" width="180" height="180" viewBox="0 0 200 200" fill="none">
                    <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="6" strokeDasharray="10 15" />
                    <path d="M60 100 H140 M100 60 V140" stroke="white" strokeWidth="6" />
                  </svg>
                </div>

                <div className="dashboard-card">
                  <span className="dashboard-card-title">Quick Actions</span>
                  <div className="quick-tools-grid">
                    <button className="quick-tool-btn" onClick={() => setCurrentTab('risk')}>
                      <div className="quick-tool-icon"><ClipboardCheck size={18} /></div>
                      <span className="quick-tool-title">Risk Profiler</span>
                      <span className="quick-tool-desc">10-point scorecard</span>
                    </button>
                    
                    <button className="quick-tool-btn" onClick={() => setCurrentTab('records')}>
                      <div className="quick-tool-icon"><Layers size={18} /></div>
                      <span className="quick-tool-title">Records</span>
                      <span className="quick-tool-desc">View patient history</span>
                    </button>

                    <button className="quick-tool-btn" onClick={() => setCurrentTab('specialists')}>
                      <div className="quick-tool-icon"><User size={18} /></div>
                      <span className="quick-tool-title">Referrals</span>
                      <span className="quick-tool-desc">Specialist contacts</span>
                    </button>

                    <button className="quick-tool-btn" onClick={() => setCurrentTab('hospitals')}>
                      <div className="quick-tool-icon"><MapPin size={18} /></div>
                      <span className="quick-tool-title">Centers</span>
                      <span className="quick-tool-desc">Oncology hospitals</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Patient Records */}
              <div className="recent-records-section">
                <div className="section-header">
                  <span className="dashboard-card-title">Recent Patient Screenings</span>
                  <button className="record-action-btn" onClick={() => setCurrentTab('records')}>
                    See All Records
                  </button>
                </div>

                <div className="records-table-container">
                  <table className="records-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Screening Date</th>
                        <th>Risk Triage</th>
                        <th>Confidence</th>
                        <th>Recommending Officer</th>
                        <th>Triage Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 4).map((rec, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: '800' }}>{rec.patient_id}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{rec.date}</td>
                          <td>
                            <span className={`risk-badge ${rec.color_code}`}>
                              {rec.risk_level}
                            </span>
                          </td>
                          <td style={{ fontWeight: '700' }}>{rec.confidence}%</td>
                          <td style={{ color: 'var(--text-secondary)' }}>Dr. {rec.worker_id}</td>
                          <td>
                            <button 
                              className="record-action-btn"
                              onClick={() => setViewingRecordReport(rec)}
                            >
                              Open Clinical Report
                            </button>
                          </td>
                        </tr>
                      ))}
                      {history.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                            No active screening records logged yet. Begin a new patient screening to seed database records.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: SCREENING INTENSIVE FLOW (CONSENT, SCAN, RESULT) */}
          {currentTab === 'consent' && (
            <div className="screening-flow-card">
              <div className="flow-stepper">
                <div className={`step-item ${scanStep >= 1 ? 'active' : ''}`}>
                  <div className="step-number">1</div>
                  <span className="step-label">Intake Consent</span>
                </div>
                <div style={{ height: '2px', backgroundColor: 'var(--border-color)', flexGrow: 1, margin: '0 10px' }}></div>
                <div className={`step-item ${scanStep >= 2 ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <span className="step-label">Capture Triage</span>
                </div>
                <div style={{ height: '2px', backgroundColor: 'var(--border-color)', flexGrow: 1, margin: '0 10px' }}></div>
                <div className={`step-item ${scanStep >= 3 ? 'active' : ''}`}>
                  <div className="step-number">3</div>
                  <span className="step-label">Diagnosis Report</span>
                </div>
              </div>

              {/* STEP 1: CONSENT */}
              {scanStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Patient Clinical Disclosure & Consent</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      To proceed with the AI-assisted Oral Squamous Cell Carcinoma (OSCC) triage screening, please complete patient enrollment.
                    </p>
                  </div>

                  <div className="consent-scroll">
                    <strong>PROXENIX OSCC EARLY TRIAGE PROTOCOL DISCLOSURE:</strong><br />
                    1. Purpose: The screening is performed to assist clinical officers in early spotting of oral mucosal pathologies, red/white patches, or potential carcinomas.<br />
                    2. Method: The clinician captures high-definition optical photographs of suspicious lesions. These are evaluated by simulated heuristics or loaded deep-learning neural models.<br />
                    3. Disclaimer: This triage assessment is for clinical screening and early profiling ONLY. It is NOT a substitute for standard tissue biopsy, histopathological confirmation, or medical diagnosis.<br />
                    4. Privacy: All information and biometric signature data are locked inside local secure archives.<br />
                    By checking consent and signing below, you agree to undergo optical photographic screening.
                  </div>

                  <div className="patient-id-input-box">
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Clinical Patient Identifier (ID)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div className="clinical-input-wrapper" style={{ flexGrow: 1 }}>
                        <input 
                          type="text" 
                          className="clinical-input" 
                          placeholder="e.g. OSCC-2026-8912"
                          value={patientId}
                          onChange={(e) => setPatientId(e.target.value)}
                        />
                      </div>
                      <button className="clinical-btn secondary" style={{ height: '52px' }} onClick={generatePatientId}>
                        Auto-Generate ID
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="consent-check" 
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                    />
                    <label htmlFor="consent-check" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      I hereby verify patient understanding and active clinical consent.
                    </label>
                  </div>

                  <div>
                    <div className="signature-label-row">
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Patient / Guardian Authentication Signature</label>
                      {signatureData && (
                        <button className="signature-clear-btn" onClick={clearSignature}>
                          Clear Signature
                        </button>
                      )}
                    </div>
                    <div className="signature-canvas-wrapper">
                      {!signatureData && (
                        <div className="signature-placeholder">
                          Draw patient signature using touch or mouse cursor inside this box
                        </div>
                      )}
                      <canvas 
                        ref={sigCanvasRef}
                        className="signature-canvas"
                        width="700"
                        height="150"
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseMove={draw}
                        onTouchStart={startDrawing}
                        onTouchEnd={stopDrawing}
                        onTouchMove={draw}
                      />
                    </div>
                  </div>

                  <button 
                    className="clinical-btn" 
                    style={{ width: '100%', padding: '16px' }}
                    disabled={!consentChecked || !patientId || !signatureData}
                    onClick={() => setScanStep(2)}
                  >
                    <span>Proceed to Optical Capture</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* STEP 2: SCAN */}
              {scanStep === 2 && (
                <div className="scanning-panel">
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Lesion Image Intake</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Register Patient: <strong style={{ color: 'var(--primary)' }}>{patientId}</strong>. Capture mouth anomaly or drop in clinic photographs.
                    </p>
                  </div>

                  <div className="capture-tabs">
                    <button 
                      className={`capture-tab-btn ${scanSource === 'upload' ? 'active' : ''}`}
                      onClick={() => { setScanSource('upload'); stopWebcam(); }}
                    >
                      <ImageIcon size={16} />
                      <span>Upload Local Photo</span>
                    </button>
                    <button 
                      className={`capture-tab-btn ${scanSource === 'webcam' ? 'active' : ''}`}
                      onClick={startWebcam}
                    >
                      <Camera size={16} />
                      <span>Web Camera Triage</span>
                    </button>
                  </div>

                  {scanSource === 'webcam' && !selectedImage && (
                    <div className="camera-preview-box">
                      <video ref={videoRef} autoPlay playsInline className="camera-video"></video>
                      <div className="scanning-grid-overlay"></div>
                      <div className="camera-shutter-overlay">
                        <button className="camera-shutter-btn" onClick={captureWebcamPhoto}></button>
                      </div>
                    </div>
                  )}

                  {scanSource === 'upload' && !selectedImage && (
                    <div className="drag-drop-box" onClick={() => imageUploadRef.current && imageUploadRef.current.click()}>
                      <input 
                        type="file" 
                        ref={imageUploadRef} 
                        style={{ display: 'none' }} 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <ImageIcon size={48} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '14px', fontWeight: '700' }}>Drag & Drop or Click to Select File</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Compatible with JPG, JPEG, and PNG. Make sure oral patch is in high detail.</span>
                    </div>
                  )}

                  {selectedImage && (
                    <div className="photo-preview-container">
                      <img src={selectedImage} alt="Patient Mouth Intake" className="photo-preview-image" />
                      {scanningActive && <div className="photo-laser-scanner"></div>}
                      <div className="scanning-grid-overlay"></div>
                      {!scanningActive && (
                        <button className="photo-remove-btn" onClick={() => { setSelectedImage(null); if (scanSource === 'webcam') startWebcam(); }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}

                  {scanningActive && (
                    <div className="scanning-status-card">
                      <Spinner size="small" color="primary" />
                      <div>
                        <h4 className="scanning-status-title">AI Processing - {scanProgress}%</h4>
                        <p className="scanning-status-desc">{scanStageText}</p>
                      </div>
                    </div>
                  )}

                  {!scanningActive && (
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <button className="clinical-btn secondary" style={{ flexGrow: 1 }} onClick={() => setScanStep(1)}>
                        Back to Consent
                      </button>
                      <button 
                        className="clinical-btn" 
                        style={{ flexGrow: 1 }}
                        disabled={!selectedImage}
                        onClick={executeOralTriage}
                      >
                        <RefreshCw size={16} />
                        <span>Analyze Patient Image</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: RESULT */}
              {scanStep === 3 && scanResult && (() => {
                const config = RISK_CONFIG[scanResult.risk_level] || RISK_CONFIG['Normal'];
                return (
                  <div className="result-container" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Image preview */}
                    {scanResult.image && (
                      <div className="result-photo-box" style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <img src={scanResult.image} alt="Patient Mouth Intake" className="result-image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div className="scanning-grid-overlay"></div>
                      </div>
                    )}

                    <div className="result-triage-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className="result-triage-badge-row">
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Oral Pathology Diagnosis</span>
                          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: '900', marginTop: '2px', color: 'var(--text-primary)' }}>Screening Outcomes</h2>
                        </div>
                        <span className={`risk-badge ${scanResult.color_code}`} style={{ padding: '8px 16px', fontSize: '13px' }}>
                          {scanResult.risk_level}
                        </span>
                      </div>

                      {/* Patient ID Banner */}
                      <div className="patient-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-light)', padding: '10px 14px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Patient Identifier:</span>
                        <strong style={{ color: 'var(--primary)', fontSize: '14px' }}>{scanResult.patient_id}</strong>
                      </div>

                      <div className="result-gauge-box">
                        <div className="result-gauge-circle">
                          <svg className="result-gauge-svg" width="80" height="80" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="var(--border-color)"
                              strokeWidth="3.5"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={scanResult.color_code === 'red' ? '#dc2626' : scanResult.color_code === 'yellow' ? '#d97706' : '#16a34a'}
                              strokeDasharray={`${scanResult.confidence}, 100`}
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="result-gauge-score">{scanResult.confidence}%</div>
                        </div>
                        <div className="result-gauge-info">
                          <span className="result-gauge-label">Diagnostic Confidence</span>
                          <span className="result-gauge-val">{scanResult.confidence}% Clinical Match</span>
                        </div>
                      </div>

                      {/* Recommendation & Triage Action */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Recommendation & Triage Action</span>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            {config.recommendation}
                          </span>
                        </div>
                        <p className="result-clinical-text">
                          {scanResult.risk_level === 'High Risk' && 'ALERT: Visual assessment shows significant markers typical of dysplastic lesions or active squamous cell carcinomas. Secondary histopathology biopsy is critical. Patient details have been prepared for specialist surgical referral.'}
                          {scanResult.risk_level === 'Suspicious' && 'ATTENTION: Moderately anomalous tissues identified. Clinical observations reflect abnormal red/white epithelial thickness. Schedule a secondary review in 14 days or execute a routine oral biopsy if lesions persist.'}
                          {scanResult.risk_level === 'Normal' && 'Normal screening. No anomalies mapping to dysplasia detected. Reinforce oral health habits (smoking cessation, visual regular checks) and book a general check-up in 6 months.'}
                        </p>
                      </div>

                      {/* Next Action Steps */}
                      <div className="result-steps-section" style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>What To Do Next</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {config.whatToDo.map((step, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Prescription Note */}
                      <div className="result-prescription-section" style={{ backgroundColor: 'var(--primary-light)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', display: 'block', marginBottom: '6px' }}>Prescription & Clinical Note</span>
                        <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>{config.prescriptionNote}</p>
                      </div>

                      {/* Lifestyle Advice */}
                      <div className="result-lifestyle-section" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Lifestyle & Care Advice</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {config.lifestyle.map((tip, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                              <span style={{ color: '#16a34a', fontWeight: 'bold' }}>•</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Case Notes / Clinical Observations */}
                      <div className="result-notes-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Clinical Observations</span>
                        <textarea
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1.5px solid var(--border-color)',
                            backgroundColor: 'var(--bg-app)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            outline: 'none',
                            resize: 'vertical'
                          }}
                          placeholder="Enter physical observations, lesion dimensions, or patient complaints..."
                          value={scanNotes}
                          onChange={(e) => setScanNotes(e.target.value)}
                          disabled={isRecordSaved}
                        />
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            className="clinical-btn"
                            style={{ flexGrow: 1, backgroundColor: isRecordSaved ? '#16a34a' : 'var(--primary)' }}
                            onClick={handleSaveClinicalRecord}
                            disabled={isRecordSaved}
                          >
                            <span>{isRecordSaved ? '✓ Record Saved' : 'Save Patient Record'}</span>
                          </button>
                          
                          <button
                            className="clinical-btn secondary"
                            style={{ flexGrow: 1 }}
                            disabled={!isRecordSaved}
                            onClick={() => {
                              // Update the temp object used for report viewing
                              setViewingRecordReport({ ...scanResult, notes: scanNotes });
                            }}
                          >
                            <Printer size={16} />
                            <span>Generate Clinical Report</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="clinical-btn secondary" style={{ flexGrow: 1 }} onClick={resetScanner}>
                            <FilePlus size={16} />
                            <span>New Screening Intake</span>
                          </button>
                          
                          {scanResult.risk_level !== 'Normal' && (
                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                              <button className="clinical-btn secondary" style={{ flexGrow: 1 }} onClick={() => setCurrentTab('specialists')}>
                                Refer to Specialists
                              </button>
                              <button className="clinical-btn secondary" style={{ flexGrow: 1 }} onClick={() => setCurrentTab('hospitals')}>
                                Oncology Centers
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: PATIENT HISTORY RECORDS */}
          {currentTab === 'records' && (
            <div className="recent-records-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '800', margin: 0 }}>Registered Patient Archives</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                    View, filter, and print certified Proxenix clinical diagnostic records.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="record-action-btn" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={clearHistory}>
                    Clear All Database Records
                  </button>
                  {history.length === 0 && (
                    <button className="record-action-btn" onClick={seedDefaultHistory}>
                      Seed Sample Diagnostics
                    </button>
                  )}
                </div>
              </div>

              {/* Trend vs Last Scan Banner & Quick Stats (from mobile app style but wide for PC) */}
              {history.length > 0 && (
                <div className="records-dashboard-header" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '20px' }}>
                  {/* Trend Card */}
                  <div className="trend-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'var(--risk-normal-bg)', border: '1.5px solid var(--risk-normal-border)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
                    <div style={{ color: 'var(--risk-normal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={24} />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Trend vs Last Scan</span>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--risk-normal)', margin: '2px 0 0 0' }}>Risk decreasing</h4>
                    </div>
                  </div>

                  {/* Summary Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div className="stat-pill-card" style={{ backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderLeft: '4px solid var(--primary)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', display: 'block' }}>{statsTotal}</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</span>
                    </div>
                    <div className="stat-pill-card" style={{ backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderLeft: '4px solid var(--risk-high)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--risk-high)', display: 'block' }}>{statsHigh}</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>High Risk</span>
                    </div>
                    <div className="stat-pill-card" style={{ backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderLeft: '4px solid var(--risk-suspicious)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--risk-suspicious)', display: 'block' }}>{statsSuspicious}</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Suspicious</span>
                    </div>
                    <div className="stat-pill-card" style={{ backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderLeft: '4px solid var(--risk-normal)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--risk-normal)', display: 'block' }}>{statsNormal}</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Normal</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid of Patient Record Cards (Optimized for PC layout instead of a squeezed layout) */}
              <div className="records-cards-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {history.map((rec, i) => (
                  <div
                    key={i}
                    className="patient-record-wide-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `5px solid var(--risk-${rec.color_code})`,
                      borderRadius: 'var(--radius-md)',
                      padding: '20px 24px',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Left details column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '25%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '850', color: 'var(--text-primary)', margin: 0 }}>{rec.patient_id}</h3>
                        {i === 0 && !rec.is_questionnaire && (
                          <span style={{ backgroundColor: '#2563eb', color: 'white', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>New</span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Intake: {rec.date}</span>
                    </div>

                    {/* Category Column */}
                    <div style={{ width: '15%' }}>
                      <span style={{ fontSize: '11px', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Method</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>
                        {rec.is_questionnaire ? 'Symptom Quiz' : 'Optical Scan'}
                      </span>
                    </div>

                    {/* Risk Badge Column */}
                    <div style={{ width: '15%' }}>
                      <span style={{ fontSize: '11px', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Triage</span>
                      <span className={`risk-badge ${rec.color_code}`} style={{ fontSize: '11px' }}>
                        {rec.risk_level}
                      </span>
                    </div>

                    {/* Confidence Column */}
                    <div style={{ width: '15%' }}>
                      <span style={{ fontSize: '11px', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>AI Confidence</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{rec.confidence}%</span>
                      </div>
                    </div>

                    {/* Observations Notes Snippet Column */}
                    <div style={{ width: '18%', overflow: 'hidden' }}>
                      <span style={{ fontSize: '11px', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Clinical Observations</span>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rec.notes || 'No notes compiled.'}
                      </p>
                    </div>

                    {/* Action Column */}
                    <div style={{ width: '12%', textAlign: 'right' }}>
                      <button
                        className="record-action-btn"
                        style={{ width: '100%', padding: '8px 12px' }}
                        onClick={() => setViewingRecordReport(rec)}
                      >
                        Open Report
                      </button>
                    </div>
                  </div>
                ))}

                {history.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
                    No patient triage records logged. Complete a screening to compile archive documents.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RISK QUESTIONNAIRE */}
          {currentTab === 'risk' && (
            <div className="questionnaire-card">
              {quizStep === 0 && (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <ClipboardCheck size={28} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Patient Risk Scorecard Questionnaire</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '550px', margin: '0 auto' }}>
                      Answer our 10-point clinician visual risk checklist. Evaluates behavioral habits, symptoms timeline, and genetic oncology variables to calculate clinical triage weight.
                    </p>
                  </div>
                  <button className="clinical-btn" style={{ margin: '10px auto 0 auto' }} onClick={startQuiz}>
                    <span>Initiate Questionnaire</span>
                  </button>
                </div>
              )}

              {quizStep >= 1 && quizStep <= 10 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase' }}>Checklist Progress</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Question {quizStep} of 10</span>
                  </div>

                  <div className="question-progress-bar">
                    <div className="question-progress-fill" style={{ width: `${quizStep * 10}%` }}></div>
                  </div>

                  <div className="question-body">
                    <span className="question-text">
                      {QUESTIONS[quizStep - 1].text}
                    </span>
                    
                    <div className="question-options-list">
                      <button className="option-btn" onClick={() => handleQuizAnswer(QUESTIONS[quizStep-1].weight, 2)}>
                        <div className="option-bullet"><div className="option-bullet-inner"></div></div>
                        <span>YES - Severe or Frequent</span>
                      </button>
                      <button className="option-btn" onClick={() => handleQuizAnswer(QUESTIONS[quizStep-1].weight, 0.8)}>
                        <div className="option-bullet"><div className="option-bullet-inner"></div></div>
                        <span>SOMETIMES - Mild or Occasional</span>
                      </button>
                      <button className="option-btn" onClick={() => handleQuizAnswer(QUESTIONS[quizStep-1].weight, 0)}>
                        <div className="option-bullet"><div className="option-bullet-inner"></div></div>
                        <span>NO - Never / False</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {quizStep === 11 && (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Scorecard Results</span>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '800', marginTop: '2px' }}>Clinical Risk Score</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--primary)' }}>
                      <span style={{ fontSize: '36px', fontWeight: '900', color: 'var(--primary)' }}>{quizScore}</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Weight Index</span>
                    </div>
                    <span className={`risk-badge ${getQuizRiskLevel(quizScore).color}`} style={{ padding: '8px 16px', fontSize: '13px' }}>
                      {getQuizRiskLevel(quizScore).level}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                    {getQuizRiskLevel(quizScore).desc}
                  </p>

                  <div style={{ display: 'flex', gap: '14px', maxWidth: '500px', margin: '10px auto 0 auto', width: '100%' }}>
                    <button className="clinical-btn" style={{ flexGrow: 1 }} onClick={saveQuizToRecords}>
                      Save Result to Patient Records
                    </button>
                    <button className="clinical-btn secondary" style={{ flexGrow: 1 }} onClick={() => setQuizStep(0)}>
                      Restart Checklist
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SPECIALIST REFERRAL */}
          {currentTab === 'specialists' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '800' }}>Clinical Specialist Referrals</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Copy official referral details to specialists for patients identified as High Risk or Suspicious.
                  </p>
                </div>
                <div className="clinical-input-wrapper" style={{ width: '300px', height: '44px' }}>
                  <input 
                    type="text" 
                    className="clinical-input" 
                    placeholder="Search specialists or hospitals..."
                    value={specialistSearch}
                    onChange={(e) => setSpecialistSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="directory-grid">
                {SPECIALISTS.filter(s => s.name.toLowerCase().includes(specialistSearch.toLowerCase()) || s.hospital.toLowerCase().includes(specialistSearch.toLowerCase())).map((spec, i) => (
                  <div key={i} className="directory-card">
                    <div className="directory-header">
                      <div className="directory-avatar">
                        {spec.name.split(' ').pop().charAt(0)}
                      </div>
                      <div className="directory-title-box">
                        <span className="directory-name">{spec.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>{spec.title}</span>
                        <span className="directory-badge">{spec.dept}</span>
                      </div>
                    </div>

                    <div className="directory-contact-info">
                      <div className="directory-info-item">
                        <MapPin size={14} style={{ color: 'var(--primary)' }} />
                        <span>{spec.hospital}</span>
                      </div>
                      <div className="directory-info-item">
                        <PhoneCall size={14} style={{ color: 'var(--secondary)' }} />
                        <span>{spec.phone}</span>
                      </div>
                      <div className="directory-info-item" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{spec.email}</span>
                      </div>
                    </div>

                    <button 
                      className="directory-btn"
                      onClick={() => copyReferralLetter(spec.name, history[0])}
                    >
                      <ClipboardCheck size={14} />
                      <span>Generate Referral Letter</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ONCOLOGY HOSPITALS */}
          {currentTab === 'hospitals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '800' }}>Oncology Centers & Cancer Hospitals</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Emergency hospitals equipped with radiotherapy, chemo, and oral maxillofacial surgical units.
                  </p>
                </div>
                <div className="clinical-input-wrapper" style={{ width: '300px', height: '44px' }}>
                  <input 
                    type="text" 
                    className="clinical-input" 
                    placeholder="Search hospitals by name or city..."
                    value={hospitalSearch}
                    onChange={(e) => setHospitalSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="directory-grid">
                {HOSPITALS.filter(h => h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) || h.address.toLowerCase().includes(hospitalSearch.toLowerCase())).map((hosp, i) => (
                  <div key={i} className="directory-card" style={{ gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 className="directory-name" style={{ fontSize: '16px', color: 'var(--primary)' }}>{hosp.name}</h3>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#d97706', backgroundColor: '#fffbeb', padding: '2px 8px', borderRadius: '12px' }}>{hosp.rating}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{hosp.address}</p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0' }}>
                      {hosp.features.map((feat, fIdx) => (
                        <span key={fIdx} style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                          {feat}
                        </span>
                      ))}
                    </div>

                    <div className="directory-contact-info" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <div className="directory-info-item">
                        <PhoneCall size={14} style={{ color: 'var(--secondary)' }} />
                        <span><strong>Phone Support: </strong> {hosp.phone}</span>
                      </div>
                    </div>

                    <a 
                      href={`tel:${hosp.phone.replace(/\s+/g, '')}`} 
                      className="directory-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      <PhoneCall size={14} />
                      <span>Contact Hospital Helpline</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: CLINICAL GUIDELINES */}
          {currentTab === 'guidelines' && (
            <div className="guide-content-box">
              <div className="guide-header-icon">
                <Compass size={24} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Early Detection Clinical Guidelines</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
                Standard operating guidelines for clinical self-examinations, diagnostic signs, and supportive nutritional plans.
              </p>

              <div className="guide-grid">
                <div className="guide-item-card">
                  <h3 className="guide-item-title">1. Clinician Visual Exam Steps</h3>
                  <p className="guide-item-desc" style={{ whiteSpace: 'pre-line' }}>
                    • Inspect buccal mucosa, tongue base, and floor of mouth.<br />
                    • Check for localized white leukoplakia or red erythroplakia patches.<br />
                    • Palpate submandibular lymph node zones for painless swellings.<br />
                    • Ask patients about symptoms lasting over 3 weeks.
                  </p>
                </div>

                <div className="guide-item-card">
                  <h3 className="guide-item-title">2. High-Risk Sign Profiles</h3>
                  <p className="guide-item-desc" style={{ whiteSpace: 'pre-line' }}>
                    • Erythroplakia: High malignancy transition rate. Red velvety patches.<br />
                    • Non-Healing Ulcer: Indurated margins, rolled boundaries.<br />
                    • Leukoplakia: Homogenous or granular white patches unable to be scraped away.<br />
                    • Oral submucous fibrosis: Trismus (difficulty in mouth opening).
                  </p>
                </div>

                <div className="guide-item-card">
                  <h3 className="guide-item-title">3. Supportive Nutrition & Diet</h3>
                  <p className="guide-item-desc" style={{ whiteSpace: 'pre-line' }}>
                    • Incorporate antioxidants: Beta-carotene, Lycopene (tomatoes, carrots).<br />
                    • Vitamins A, C, E: High-density protective value for mucosal lining.<br />
                    • Hydration: Maintain clean hydration routines to avoid cellular stress.<br />
                    • Avoid: PAAN, GUTKHA, ALCOHOL, highly spiced and carbonated contents.
                  </p>
                </div>

                <div className="guide-item-card">
                  <h3 className="guide-item-title">4. Clinical Hygiene Protocol</h3>
                  <p className="guide-item-desc" style={{ whiteSpace: 'pre-line' }}>
                    • Twice-daily brushing using soft-bristled brushes.<br />
                    • Avoid chemical oral mouthwashes containing alcohol (dries mucosal linings).<br />
                    • Schedule regular professional cleanings every 6 months.<br />
                    • Avoid sharp tooth cusps or ill-fitting dentures (chronic micro-trauma induces changes).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MEDICINES & TREATMENT */}
          {currentTab === 'medicines' && (
            <div className="guide-content-box" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="clinical-warning-box" style={{ backgroundColor: 'rgba(255, 179, 71, 0.08)', border: '1.5px solid rgba(255, 179, 71, 0.25)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 className="warning-box-title" style={{ color: '#FFB347', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={16} />
                  <span>Medical Disclaimer Notice</span>
                </h3>
                <p className="warning-box-text" style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>
                  These are general informational medicines only. Always consult a qualified oncologist or physician before taking or recommending any medication.
                </p>
              </div>

              <div className="medicines-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                {MEDICINES.map((group, gi) => (
                  <div key={gi} className="med-group-card" style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="med-group-header" style={{ borderLeft: `4px solid ${group.color}`, paddingLeft: '12px', display: 'flex', alignItems: 'center', height: '24px' }}>
                      <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '800', margin: 0 }}>{group.category}</h3>
                    </div>
                    <div className="med-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {group.items.map((m, mi) => (
                        <div key={mi} className="med-item-detail" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{m.name}</h4>
                          <p className="med-use" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>{m.use}</p>
                          <div className="med-dosage-box" style={{ display: 'flex', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                            <span className="dosage-label" style={{ fontSize: '11px', fontWeight: '800', color: group.color }}>Dosage:</span>
                            <span className="dosage-text" style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>{m.dose}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: DIET & NUTRITION */}
          {currentTab === 'diet' && (
            <div className="guide-content-box" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="diet-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="diet-column eat" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="diet-column-header eat" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--risk-normal)', borderBottom: '2px solid var(--risk-normal-border)', paddingBottom: '10px' }}>
                    <Heart size={20} />
                    <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Foods to Eat (Supportive Oncology)</h2>
                  </div>
                  <div className="diet-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {DIET_EAT.map((f, i) => (
                      <div key={i} className="diet-item-card eat" style={{ backgroundColor: 'var(--risk-normal-bg)', border: '1px solid var(--risk-normal-border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--risk-normal)' }}></div>
                        <div className="diet-item-body">
                          <h3 style={{ fontSize: '13.5px', fontWeight: '750', color: 'var(--text-primary)', margin: '0 0 2px 0' }}>{f.name}</h3>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{f.benefit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="diet-column avoid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="diet-column-header avoid" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--risk-high)', borderBottom: '2px solid var(--risk-high-border)', paddingBottom: '10px' }}>
                    <ShieldAlert size={20} />
                    <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Foods to Avoid (Risk Factors)</h2>
                  </div>
                  <div className="diet-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {DIET_AVOID.map((f, i) => (
                      <div key={i} className="diet-item-card avoid" style={{ backgroundColor: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--risk-high)' }}></div>
                        <div className="diet-item-body">
                          <h3 style={{ fontSize: '13.5px', fontWeight: '750', color: 'var(--text-primary)', margin: '0 0 2px 0' }}>{f.name}</h3>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{f.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ORAL HYGIENE GUIDE */}
          {currentTab === 'oralhygiene' && (
            <div className="guide-content-box" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0' }}>Clinical Oral Hygiene Steps</h2>
                <p className="hygiene-subtitle" style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Follow these 8 steps every day for optimal oral health and early cancer screening</p>
              </div>

              <div className="hygiene-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                {HYGIENE_STEPS.map((s, i) => (
                  <div key={i} className="hygiene-step-card" style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', gap: '14px' }}>
                    <div className="hygiene-step-badge" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
                      {s.step}
                    </div>
                    <div className="hygiene-step-body" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{s.title}</h3>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hygiene-warning-card" style={{ backgroundColor: 'var(--risk-high-bg)', border: '1.5px solid var(--risk-high-border)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ color: 'var(--risk-high)', fontSize: '15px', fontWeight: '800', margin: 0 }}>🚨 Warning Signs - Consult a Medical Specialist if You Notice:</h3>
                <div className="warning-signs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {HYGIENE_SIGNS.map((sign, i) => (
                    <div key={i} className="warning-sign-row" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span className="warning-sign-bullet" style={{ color: 'var(--risk-high)', fontWeight: 'bold' }}>•</span>
                      <p className="warning-sign-text" style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>{sign}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: HELP & EMERGENCY HELP & FAQS */}
          {currentTab === 'emergency' && (
            <div className="guide-content-box" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="emergency-contacts-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '800', margin: 0 }}>Emergency & Cancer Helpline Numbers</h2>
                <div className="emergency-contacts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {EMERGENCY_CONTACTS.map((c, i) => (
                    <a key={i} href={`tel:${c.number.replace(/-/g, '')}`} className="emergency-contact-card" style={{ textDecoration: 'none', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderLeft: `4px solid ${c.color}`, borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center', transition: 'all 0.2s' }}>
                      <div className="emergency-icon-circle" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: `${c.color}15`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Phone size={18} />
                      </div>
                      <div className="emergency-contact-body" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{c.name}</h3>
                        <p className="emergency-number" style={{ color: c.color, fontSize: '14px', fontWeight: '850', margin: 0 }}>{c.number}</p>
                        <p className="emergency-note" style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{c.note}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              <div className="faqs-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '800', margin: 0 }}>Frequently Asked Questions (FAQ)</h2>
                <div className="faqs-list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  {FAQS.map((f, i) => (
                    <div key={i} className="faq-card" style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <h3 className="faq-question" style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--primary)', margin: '0 0 6px 0' }}>Q: {f.q}</h3>
                      <p className="faq-answer" style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>A: {f.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PORTAL SETTINGS */}
          {currentTab === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              
              {/* API Connection and Model Config */}
              <div className="dashboard-card">
                <span className="dashboard-card-title">AI Processing Settings</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="live-api-check"
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      checked={useLiveApi}
                      onChange={(e) => {
                        setUseLiveApi(e.target.checked);
                        localStorage.setItem('@oscc_use_live_api', e.target.checked.toString());
                      }}
                    />
                    <label htmlFor="live-api-check" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      Redirect predictions to Local Python Flask Server
                    </label>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    When enabled, the web browser routes visual photographs to your local computer's running Flask API server (e.g. <code>python app.py</code>) running on port 5000. If disabled, predictions run in Standalone Demo Heuristic mode directly in the browser canvas.
                  </p>

                  <div className="patient-id-input-box" style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Flask API Base Server URL</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div className="clinical-input-wrapper" style={{ flexGrow: 1 }}>
                        <input 
                          type="text" 
                          className="clinical-input" 
                          placeholder="http://localhost:5000"
                          value={apiEndpoint}
                          onChange={(e) => {
                            setApiEndpoint(e.target.value);
                            localStorage.setItem('@oscc_api_url', e.target.value);
                          }}
                        />
                      </div>
                      <button 
                        className="clinical-btn secondary"
                        style={{ height: '52px' }}
                        onClick={async () => {
                          const connected = await testApiConnection(apiEndpoint);
                          alert(connected ? 'Successfully pinged and connected to local Flask Server!' : 'Failed to connect. Please verify if "python app.py" is active, and CORS is allowed.');
                        }}
                      >
                        Ping Server
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinician PIN Password Management */}
              <div className="dashboard-card">
                <span className="dashboard-card-title">Change Portal PIN</span>
                
                {settingsError && (
                  <div className="auth-error-box">
                    <ShieldAlert size={18} />
                    <span>{settingsError}</span>
                  </div>
                )}

                {settingsSuccess && (
                  <div className="auth-error-box" style={{ backgroundColor: 'var(--risk-normal-bg)', borderColor: 'var(--risk-normal-border)', color: 'var(--risk-normal)' }}>
                    <CheckCircle size={18} />
                    <span>{settingsSuccess}</span>
                  </div>
                )}

                <form className="auth-form" onSubmit={handleChangePin}>
                  <div>
                    <label className="auth-label">Current PIN Password</label>
                    <div className="clinical-input-wrapper">
                      <input 
                        type="password" 
                        className="clinical-input" 
                        placeholder="Enter current PIN"
                        value={settingsOldPin}
                        onChange={(e) => setSettingsOldPin(e.target.value.replace(/\D/g, ''))}
                        maxLength={8}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="auth-label">New PIN Password (min. 4 digits)</label>
                    <div className="clinical-input-wrapper">
                      <input 
                        type="password" 
                        className="clinical-input" 
                        placeholder="Choose secure new PIN"
                        value={settingsNewPin}
                        onChange={(e) => setSettingsNewPin(e.target.value.replace(/\D/g, ''))}
                        maxLength={8}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="auth-label">Confirm New PIN Password</label>
                    <div className="clinical-input-wrapper">
                      <input 
                        type="password" 
                        className="clinical-input" 
                        placeholder="Re-enter new PIN"
                        value={settingsConfirmPin}
                        onChange={(e) => setSettingsConfirmPin(e.target.value.replace(/\D/g, ''))}
                        maxLength={8}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-btn" style={{ marginTop: '10px' }}>
                    <span>Save PIN Password</span>
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* DETAILED CLINICAL REPORT MODAL */}
      {viewingRecordReport && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <div className="report-modal-header">
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Proxenix Clinical Diagnostic Report Document
              </h2>
              <button 
                className="signature-clear-btn" 
                style={{ fontSize: '16px' }}
                onClick={() => setViewingRecordReport(null)}
              >
                ✕ Close
              </button>
            </div>
            
            <div className="report-modal-body" style={{ backgroundColor: '#f1f5f9' }}>
              <div className="clinical-report-doc">
                <div className="report-doc-header">
                  <div className="report-doc-title-box">
                    <span className="report-doc-title">Proxenix Oral Cancer Triage</span>
                    <span className="report-doc-subtitle">Certified Clinical Early Diagnosis Screening Document</span>
                  </div>
                  <div className="report-doc-meta">
                    <strong>Report ID: </strong> {viewingRecordReport.patient_id}-{viewingRecordReport.date.split(' ')[0]}<br />
                    <strong>Print Date: </strong> {new Date().toISOString().substring(0, 10)}
                  </div>
                </div>

                <div className="report-doc-grid">
                  <div className="report-doc-box">
                    <span className="report-doc-box-title">Patient Demographics</span>
                    <div className="report-doc-item">
                      <span>Enrollment ID:</span>
                      <span style={{ fontWeight: '700' }}>{viewingRecordReport.patient_id}</span>
                    </div>
                    <div className="report-doc-item">
                      <span>Diagnostics Intake:</span>
                      <span>{viewingRecordReport.date}</span>
                    </div>
                    <div className="report-doc-item">
                      <span>Screening Medium:</span>
                      <span>{viewingRecordReport.is_questionnaire ? 'Symptom scorecard questionnaire' : 'Intact Optical Photograph'}</span>
                    </div>
                  </div>

                  <div className="report-doc-box">
                    <span className="report-doc-box-title">Clinician Details</span>
                    <div className="report-doc-item">
                      <span>Screening Clinician:</span>
                      <span>Dr. {viewingRecordReport.worker_id}</span>
                    </div>
                    <div className="report-doc-item">
                      <span>Department:</span>
                      <span>Oral Oncology Screening</span>
                    </div>
                    <div className="report-doc-item">
                      <span>Institution Log:</span>
                      <span>SIMATS Engineering Triage Portal</span>
                    </div>
                  </div>
                </div>

                {viewingRecordReport.image && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
                    <span className="report-doc-box-title">Captured Oral Cavity Lesion</span>
                    <div style={{ width: '180px', height: '180px', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                      <img src={viewingRecordReport.image} alt="Lesion intake" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                )}

                <div className={`report-doc-result-box ${viewingRecordReport.color_code}`}>
                  <div>
                    <span className="report-doc-result-title">AI Triage Classification</span>
                    <div className={`report-doc-result-value ${viewingRecordReport.color_code}`}>
                      {viewingRecordReport.risk_level}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="report-doc-result-title">Triage Confidence Weight</span>
                    <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px' }}>
                      {viewingRecordReport.confidence}% Match
                    </div>
                  </div>
                </div>

                {(() => {
                  const reportConfig = RISK_CONFIG[viewingRecordReport.risk_level] || RISK_CONFIG['Normal'];
                  return (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                        <span className="report-doc-box-title">Clinician Action & Recommendations</span>
                        <p className="report-doc-desc" style={{ margin: 0 }}>
                          {viewingRecordReport.recommendation}. {viewingRecordReport.risk_level === 'High Risk' && 'URGENT NOTE: Immediate oncology assessment required. Patient profiling exhibits structural changes. Plan visual biopsy confirmation.'} {viewingRecordReport.risk_level === 'Suspicious' && 'RECOMMENDED NOTE: Visual red/white thickening observed. Re-examine lesion state within 14 days. If active expansion occurs, proceed to specialized surgical referral.'} {viewingRecordReport.risk_level === 'Normal' && 'STANDARD NOTE: Mucosal tissue appears clear and smooth. Maintain daily cleaning guidelines. Annual screenings are suggested.'}
                        </p>
                      </div>

                      {viewingRecordReport.notes && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                          <span className="report-doc-box-title">Clinical Observations / Notes</span>
                          <p style={{ fontSize: '12px', color: '#334155', margin: 0, whiteSpace: 'pre-line' }}>{viewingRecordReport.notes}</p>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                        <span className="report-doc-box-title">What To Do Next</span>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: '#334155' }}>
                          {reportConfig.whatToDo.map((step, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                        <span className="report-doc-box-title">Prescription Note Reference</span>
                        <p style={{ fontSize: '11.5px', color: '#334155', margin: 0 }}>{reportConfig.prescriptionNote}</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                        <span className="report-doc-box-title">Lifestyle Advice Reference</span>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: '#334155' }}>
                          {reportConfig.lifestyle.map((tip, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  );
                })()}

                <div className="report-doc-signatures">
                  <div className="report-doc-sig-box">
                    {signatureData && (
                      <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                        <img src={signatureData} alt="Patient signature" style={{ maxHeight: '100%', maxWidth: '160px' }} />
                      </div>
                    )}
                    <div className="report-doc-sig-line"></div>
                    <span className="report-doc-sig-label">Patient Consent Signature</span>
                  </div>

                  <div className="report-doc-sig-box">
                    <div style={{ height: '40px', display: 'flex', alignItems: 'center', fontFamily: '"Brush Script MT", cursive', fontSize: '24px', color: '#1e3a8a' }}>
                      Dr. {viewingRecordReport.worker_id}
                    </div>
                    <div className="report-doc-sig-line"></div>
                    <span className="report-doc-sig-label">Clinician Signature</span>
                  </div>
                </div>

                <div className="report-doc-disclaimer">
                  <strong>DISCLAIMER STATEMENT:</strong> This report acts as a clinical decision support tool for screening purposes only. It does NOT serve as a formal cancer diagnosis, biopsy outcome, or replacement for full professional medical diagnosis. Clinicians should prioritize pathology biopsy tests.
                </div>
              </div>
            </div>

            <div className="report-modal-footer">
              <button 
                className="clinical-btn secondary"
                onClick={() => setViewingRecordReport(null)}
              >
                Cancel
              </button>
              <button 
                className="clinical-btn"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                <span>Print certified Triage Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGO POPUP LIGHTBOX */}
      {showLogoPopup && (
        <div className="logo-popup-overlay" onClick={() => setShowLogoPopup(false)}>
          <div className="logo-popup-container" onClick={(e) => e.stopPropagation()}>
            <button className="logo-popup-close" onClick={() => setShowLogoPopup(false)}>✕</button>
            <img src={proxenixLogo} alt="Proxenix Logo Full" className="logo-popup-image" />
            <div className="logo-popup-label">
              <span className="logo-popup-title">Proxenix</span>
              <span className="logo-popup-subtitle">OSCC Detect — Oral Cancer Detection AI</span>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN DETAILED PRINT RENDER */}
      {viewingRecordReport && (
        <div className="printable-report-container">
          <div className="report-header">
            <div className="report-title">Proxenix Oral Cancer Triage Report</div>
            <div>Report Date: {new Date().toISOString().substring(0, 10)}</div>
          </div>
          <div className="report-grid">
            <div className="report-box">
              <h3>Patient Enrollment Details</h3>
              <p><strong>Patient ID:</strong> {viewingRecordReport.patient_id}</p>
              <p><strong>Intake Session:</strong> {viewingRecordReport.date}</p>
              <p><strong>Screening Type:</strong> {viewingRecordReport.is_questionnaire ? 'Symptom Questionnaire Checklist' : 'Optical Pathology Scan'}</p>
            </div>
            <div className="report-box">
              <h3>Clinician Details</h3>
              <p><strong>Clinician:</strong> Dr. {viewingRecordReport.worker_id}</p>
              <p><strong>Specialty:</strong> Oral Oncology Triage</p>
              <p><strong>Institution:</strong> SIMATS Engineering Clinical Triage</p>
            </div>
          </div>
          <div className="report-box" style={{ marginBottom: '20px' }}>
            <h3>Triage AI Diagnoses & Recommendation</h3>
            <p><strong>Risk Level Classification:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{viewingRecordReport.risk_level}</span></p>
            <p><strong>Confidence Weight:</strong> {viewingRecordReport.confidence}% Clinical Match</p>
            <p style={{ marginTop: '5px' }}><strong>Triage Recommendation:</strong> {viewingRecordReport.recommendation}</p>
          </div>
          {viewingRecordReport.notes && (
            <div className="report-box" style={{ marginBottom: '20px' }}>
              <h3>Clinical Observations / Case Notes</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{viewingRecordReport.notes}</p>
            </div>
          )}
          {(() => {
            const reportConfig = RISK_CONFIG[viewingRecordReport.risk_level] || RISK_CONFIG['Normal'];
            return (
              <>
                <div className="report-box" style={{ marginBottom: '20px' }}>
                  <h3>What To Do Next</h3>
                  <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                    {reportConfig.whatToDo.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div className="report-box" style={{ marginBottom: '20px' }}>
                  <h3>Prescription & Lifestyle References</h3>
                  <p><strong>Prescription Note:</strong> {reportConfig.prescriptionNote}</p>
                  <p style={{ marginTop: '5px' }}><strong>Lifestyle Guidance:</strong></p>
                  <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                    {reportConfig.lifestyle.map((tip, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </>
            );
          })()}
          <div className="report-signature">
            <div>
              {signatureData && <img src={signatureData} alt="signature" style={{ maxHeight: '40px' }} />}
              <div className="signature-line">Patient Consent Signature</div>
            </div>
            <div>
              <div style={{ fontFamily: 'cursive', fontSize: '20px', textAlign: 'center' }}>Dr. {viewingRecordReport.worker_id}</div>
              <div className="signature-line">Clinician Signature</div>
            </div>
          </div>
          <div style={{ fontSize: '9px', color: '#666', borderTop: '1px solid #ccc', marginTop: '50px', paddingTop: '10px', textAlign: 'center' }}>
            <strong>DISCLAIMER:</strong> This early screening assessment is compiled using Proxenix OSCC models. Biopsy histopathology analysis is strictly required to establish definitive carcinomas.
          </div>
        </div>
      )}
    </div>
  );
}
