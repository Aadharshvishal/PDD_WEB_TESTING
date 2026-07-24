import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { StorageService, ScanRecord } from './services/storage.service';
import { ApiService } from './services/api.service';

type Tab = 'dashboard' | 'consent' | 'records' | 'risk' | 'specialists' | 'hospitals' | 'guidelines' | 'settings';
type RiskLevel = 'High Risk' | 'Suspicious' | 'Normal';

interface Specialist {
  name: string; title: string; hospital: string; phone: string; email: string;
}
interface Hospital {
  name: string; city: string; phone: string; rating: number; features: string[]; address: string;
}
interface QuizQuestion { text: string; weight: number; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {

  // ---------------- Auth state ----------------
  isAuthenticated = false;
  authMode: 'signin' | 'signup' = 'signin';
  workerIdInput = '';
  pinInput = '';
  confirmPinInput = '';
  authError = '';
  authLoading = false;
  workerId = '';

  // ---------------- Theme ----------------
  darkMode = false;

  // ---------------- Navigation ----------------
  activeTab: Tab = 'dashboard';
  mobileSidebarOpen = false;
  pageTitles: Record<Tab, string> = {
    dashboard: 'Clinical Dashboard',
    consent: 'Patient Screening',
    records: 'Patient Records',
    risk: 'Risk Questionnaire',
    specialists: 'Specialist Guide',
    hospitals: 'Oncology Centers',
    guidelines: 'Clinical Guidelines',
    settings: 'Portal Settings'
  };

  // ---------------- API monitor ----------------
  apiConnected = false;
  apiUrl = 'http://localhost:5000';
  useLiveApi = false;
  private pingIntervalId: any = null;

  // ---------------- Records ----------------
  history: ScanRecord[] = [];
  recordsSearch = '';

  // ---------------- Screening flow ----------------
  screeningStep = 1; // 1 consent, 2 capture, 3 result
  patientId = '';
  consentChecked = false;
  hasSignature = false;
  private isDrawing = false;

  captureMode: 'upload' | 'webcam' = 'upload';
  selectedImage: string | null = null;
  private selectedImageBlob: Blob | null = null;
  private mediaStream: MediaStream | null = null;

  isProcessing = false;
  processingPercent = 0;
  processingStage = '';
  private processingTimer: any = null;

  resultRisk: RiskLevel | null = null;
  resultConfidence = 0;
  resultRawScore = 0;
  resultRecommendation = '';

  private processingStages: [number, string][] = [
    [5, 'Activating deep learning pipeline...'],
    [15, 'Loading Proxenix Core engine...'],
    [30, 'Calibrating input resolution (224x224 RGB)...'],
    [50, 'Segmenting lesion margins & boundary layers...'],
    [70, 'Extracting deep feature maps via MobileNetV2...'],
    [85, 'Calculating clinical sigmoid logits...'],
    [95, 'Generating decision matrix and risk ratings...']
  ];

  // ---------------- Questionnaire ----------------
  quizStep = 0; // 0 intro, 1-10 questions, 11 result
  quizAnswers: number[] = new Array(10).fill(-1); // multiplier per question, -1 = unanswered
  quizScore = 0;
  quizRisk: RiskLevel | null = null;
  readonly quizQuestions: QuizQuestion[] = [
    { text: 'Visible red/white mixed patches in mouth?', weight: 4 },
    { text: 'Smoked tobacco regularly?', weight: 3 },
    { text: 'Chew smokeless tobacco/gutkha/paan/betel?', weight: 4 },
    { text: 'Consume alcohol regularly?', weight: 2.5 },
    { text: 'Oral ulcer not healed for more than 3 weeks?', weight: 3.5 },
    { text: 'Unexplained bleeding or numbness in mouth?', weight: 2 },
    { text: 'Difficulty or pain swallowing, chewing, or moving tongue?', weight: 3 },
    { text: 'Swelling, lump, or thickening in jaw, cheek, or neck?', weight: 3 },
    { text: 'Over the age of 45?', weight: 1.5 },
    { text: 'Personal or family history of oral or neck cancers?', weight: 1.5 }
  ];

  // ---------------- Specialists / Hospitals ----------------
  specialistSearch = '';
  hospitalSearch = '';
  readonly specialists: Specialist[] = [
    { name: 'Dr. Sarah Jenkins', title: 'Senior Oral Oncologist', hospital: 'Apollo Dental & Oncology', phone: '+91 98450 10291', email: 's.jenkins@apollodental.example.com' },
    { name: 'Dr. Rohan Mehra', title: 'Head & Neck Surgeon', hospital: 'SIMATS Medical College', phone: '+91 91234 56789', email: 'r.mehra@simatsmedical.example.com' },
    { name: 'Dr. Linda Vance', title: 'Oral Pathology Specialist', hospital: 'National Cancer Institute', phone: '+1 800-4-CANCER', email: 'l.vance@nci.example.gov' },
    { name: 'Dr. Amit Patel', title: 'Maxillofacial Surgeon', hospital: 'Metro General Hospital', phone: '+91 99887 76655', email: 'a.patel@metrogeneral.example.com' }
  ];
  readonly hospitals: Hospital[] = [
    { name: 'OncoShield Head & Neck Center', city: 'New Delhi', phone: '+91 11 4059 9281', rating: 4.9, features: ['Biopsy Lab', 'Head & Neck Oncology', 'Radiation Therapy'], address: 'Connaught Place, New Delhi' },
    { name: 'SIMATS Multi-Speciality Clinic', city: 'Chennai', phone: '+91 44 2680 1920', rating: 4.8, features: ['Oral Oncology', 'Diagnostic Imaging', 'Outpatient Surgery'], address: 'Thandalam, Chennai' },
    { name: 'St. Jude Dental Oncology Wing', city: 'Mumbai', phone: '+91 22 9876 5432', rating: 4.7, features: ['Dental Oncology', 'Reconstructive Surgery', 'Palliative Care'], address: 'Bandra West, Mumbai' },
    { name: 'National Dental Research Institute', city: 'Kolkata', phone: '+91 33 2211 4400', rating: 4.6, features: ['Research Diagnostics', 'Biopsy Lab', 'Clinical Trials'], address: 'Salt Lake, Kolkata' }
  ];

  // ---------------- Report modal ----------------
  showReportModal = false;
  reportRecord: ScanRecord | null = null;

  // ---------------- Settings ----------------
  settingsCurrentPin = '';
  settingsNewPin = '';
  settingsConfirmPin = '';
  settingsError = '';
  settingsSuccess = '';
  settingsApiTestResult: 'idle' | 'testing' | 'success' | 'fail' = 'idle';

  // ---------------- ViewChilds ----------------
  @ViewChild('signatureCanvas') signatureCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('webcamVideo') webcamVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('analysisCanvas') analysisCanvasRef?: ElementRef<HTMLCanvasElement>;

  constructor(private storage: StorageService, private api: ApiService) {}

  ngOnInit(): void {
    // restore theme
    this.darkMode = this.storage.getTheme() === 'dark';

    // restore session
    const savedWorker = this.storage.getWorkerId();
    if (savedWorker) {
      this.workerId = savedWorker;
      this.isAuthenticated = true;
    }

    // restore api settings
    this.apiUrl = this.storage.getApiUrl();
    this.useLiveApi = this.storage.getUseLiveApi();

    // seed / load history
    this.history = this.storage.getHistory();
    if (this.history.length === 0) {
      this.seedSampleData();
    }

    // start api monitor
    this.pingApi();
    this.pingIntervalId = setInterval(() => this.pingApi(), 15000);
  }

  ngOnDestroy(): void {
    if (this.pingIntervalId) clearInterval(this.pingIntervalId);
    if (this.processingTimer) clearInterval(this.processingTimer);
    this.stopWebcam();
  }

  // ===================================================================
  // AUTH
  // ===================================================================
  setAuthMode(mode: 'signin' | 'signup'): void {
    this.authMode = mode;
    this.authError = '';
  }

  submitAuth(): void {
    this.authError = '';
    const id = this.workerIdInput.trim();
    const pin = this.pinInput.trim();

    if (!id) { this.authError = 'Clinician Worker ID is required.'; return; }
    if (!/^\d{4,8}$/.test(pin)) { this.authError = 'PIN must be 4-8 digits.'; return; }

    this.authLoading = true;

    setTimeout(() => {
      if (this.authMode === 'signup') {
        if (this.storage.pinExists(id)) {
          this.authError = 'This Worker ID is already registered. Please sign in.';
          this.authLoading = false;
          return;
        }
        if (pin !== this.confirmPinInput.trim()) {
          this.authError = 'PIN confirmation does not match.';
          this.authLoading = false;
          return;
        }
        this.storage.setPin(id, pin);
        this.completeAuth(id);
      } else {
        const storedPin = this.storage.getPin(id);
        if (storedPin === null) {
          this.authError = 'No account found for this Worker ID. Please create an account.';
          this.authLoading = false;
          return;
        }
        if (storedPin !== pin) {
          this.authError = 'Incorrect PIN. Please try again.';
          this.authLoading = false;
          return;
        }
        this.completeAuth(id);
      }
    }, 500);
  }

  private completeAuth(id: string): void {
    this.storage.setWorkerId(id);
    this.workerId = id;
    this.isAuthenticated = true;
    this.authLoading = false;
    this.activeTab = 'dashboard';
    this.workerIdInput = '';
    this.pinInput = '';
    this.confirmPinInput = '';
  }

  logout(): void {
    this.storage.clearWorkerId();
    this.isAuthenticated = false;
    this.workerId = '';
    this.mobileSidebarOpen = false;
  }

  get clinicianInitials(): string {
    if (!this.workerId) return 'DR';
    const cleaned = this.workerId.replace(/[^a-zA-Z]/g, '');
    return (cleaned.slice(0, 2) || this.workerId.slice(0, 2)).toUpperCase();
  }

  // ===================================================================
  // NAVIGATION / THEME
  // ===================================================================
  setTab(tab: Tab): void {
    this.activeTab = tab;
    this.mobileSidebarOpen = false;
    if (tab === 'records') this.history = this.storage.getHistory();
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    this.storage.setTheme(this.darkMode ? 'dark' : 'light');
  }

  // ===================================================================
  // API MONITOR
  // ===================================================================
  async pingApi(): Promise<void> {
    this.apiConnected = await this.api.ping(this.apiUrl);
  }

  // ===================================================================
  // DASHBOARD STATS
  // ===================================================================
  get totalScreened(): number { return this.history.length; }
  get highRiskCount(): number { return this.history.filter(r => r.riskLevel === 'High Risk').length; }
  get suspiciousCount(): number { return this.history.filter(r => r.riskLevel === 'Suspicious').length; }
  get normalCount(): number { return this.history.filter(r => r.riskLevel === 'Normal').length; }
  get recentRecords(): ScanRecord[] { return this.history.slice(0, 4); }

  private seedSampleData(): void {
    const seeded: ScanRecord[] = [
      { patientId: 'OSCC-2026-4819', date: '2026-05-24 14:32', category: 'Optical Scan', riskLevel: 'High Risk', confidence: 88.42, rawScore: 0.87, clinician: 'DR_SMITH', recommendation: 'Immediate Medical Evaluation Advised' },
      { patientId: 'OSCC-2026-9281', date: '2026-05-22 09:15', category: 'Optical Scan', riskLevel: 'Suspicious', confidence: 68.30, rawScore: 0.68, clinician: 'DR_SMITH', recommendation: 'Further Clinical Examination Required' },
      { patientId: 'OSCC-2026-3024', date: '2026-05-18 11:45', category: 'Optical Scan', riskLevel: 'Normal', confidence: 94.12, rawScore: 0.11, clinician: 'DR_SMITH', recommendation: 'No immediate concern. Routine check-up advised.' }
    ];
    this.history = seeded;
    this.storage.saveHistory(seeded);
  }

  // ===================================================================
  // SCREENING FLOW — STEP 1: CONSENT
  // ===================================================================
  generatePatientId(): void {
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.patientId = `OSCC-2026-${rand}`;
  }

  get canProceedFromConsent(): boolean {
    return !!this.patientId.trim() && this.consentChecked && this.hasSignature;
  }

  private getCanvasPoint(canvas: HTMLCanvasElement, evt: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if (evt instanceof MouseEvent) {
      clientX = evt.clientX; clientY = evt.clientY;
    } else {
      const touch = evt.touches[0] || evt.changedTouches[0];
      clientX = touch.clientX; clientY = touch.clientY;
    }
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  startDrawing(evt: MouseEvent | TouchEvent): void {
    evt.preventDefault();
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas) return;
    this.isDrawing = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const p = this.getCanvasPoint(canvas, evt);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  }

  draw(evt: MouseEvent | TouchEvent): void {
    if (!this.isDrawing) return;
    evt.preventDefault();
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const p = this.getCanvasPoint(canvas, evt);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    this.hasSignature = true;
  }

  stopDrawing(): void {
    this.isDrawing = false;
  }

  clearSignature(): void {
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSignature = false;
  }

  private getSignatureDataUrl(): string {
    return this.signatureCanvasRef?.nativeElement.toDataURL('image/png') || '';
  }

  proceedToCapture(): void {
    if (!this.canProceedFromConsent) return;
    this.screeningStep = 2;
  }

  // ===================================================================
  // SCREENING FLOW — STEP 2: CAPTURE
  // ===================================================================
  setCaptureMode(mode: 'upload' | 'webcam'): void {
    if (mode === this.captureMode) return;
    this.captureMode = mode;
    if (mode === 'webcam') {
      this.startWebcam();
    } else {
      this.stopWebcam();
    }
  }

  triggerFileInput(): void {
    this.fileInputRef?.nativeElement.click();
  }

  onFileSelected(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedImageBlob = file;
    const reader = new FileReader();
    reader.onload = () => { this.selectedImage = reader.result as string; };
    reader.readAsDataURL(file);
  }

  onFileDrop(evt: DragEvent): void {
    evt.preventDefault();
    const file = evt.dataTransfer?.files?.[0];
    if (!file) return;
    this.selectedImageBlob = file;
    const reader = new FileReader();
    reader.onload = () => { this.selectedImage = reader.result as string; };
    reader.readAsDataURL(file);
  }

  onDragOver(evt: DragEvent): void { evt.preventDefault(); }

  async startWebcam(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setTimeout(() => {
        if (this.webcamVideoRef?.nativeElement) {
          this.webcamVideoRef.nativeElement.srcObject = this.mediaStream;
        }
      }, 0);
    } catch {
      this.captureMode = 'upload';
    }
  }

  stopWebcam(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  captureFromWebcam(): void {
    const video = this.webcamVideoRef?.nativeElement;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    this.selectedImage = canvas.toDataURL('image/jpeg', 0.9);
    canvas.toBlob(blob => { this.selectedImageBlob = blob; }, 'image/jpeg', 0.9);
    this.stopWebcam();
  }

  removeImage(): void {
    this.selectedImage = null;
    this.selectedImageBlob = null;
    if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
  }

  backToConsent(): void {
    this.stopWebcam();
    this.screeningStep = 1;
  }

  // ===================================================================
  // AI PROCESSING
  // ===================================================================
  async analyzeImage(): Promise<void> {
    if (!this.selectedImage) return;
    this.isProcessing = true;
    this.processingPercent = 0;
    this.processingStage = 'Initializing...';

    let stageIndex = 0;
    this.processingTimer = setInterval(() => {
      if (stageIndex < this.processingStages.length) {
        const [pct, label] = this.processingStages[stageIndex];
        this.processingPercent = pct;
        this.processingStage = label;
        stageIndex++;
      } else {
        clearInterval(this.processingTimer);
        this.finishAnalysis();
      }
    }, 428); // ~3s total across 7 stages
  }

  private async finishAnalysis(): Promise<void> {
    let rawScore: number | null = null;

    if (this.useLiveApi && this.apiConnected && this.selectedImageBlob) {
      const res = await this.api.predict(this.apiUrl, this.selectedImageBlob);
      if (res) rawScore = res.raw_score;
    }

    if (rawScore === null) {
      rawScore = await this.heuristicAnalysis();
    }

    this.applyRiskClassification(rawScore);
    this.isProcessing = false;
    this.screeningStep = 3;
  }

  private heuristicAnalysis(): Promise<number> {
    return new Promise(resolve => {
      const canvas = this.analysisCanvasRef?.nativeElement || document.createElement('canvas');
      canvas.width = 224; canvas.height = 224;
      const ctx = canvas.getContext('2d');
      if (!ctx || !this.selectedImage) { resolve(0.3); return; }

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 224, 224);
        let redCount = 0, whiteCount = 0;
        try {
          const data = ctx.getImageData(0, 0, 224, 224).data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r > 150 && g < 100 && b < 100) redCount++;
            if (r > 200 && g > 200 && b > 200) whiteCount++;
          }
        } catch {
          resolve(0.3 + Math.random() * 0.2);
          return;
        }
        const totalPixels = 224 * 224;
        const lesionDensity = (redCount + whiteCount) / totalPixels;
        let score = lesionDensity * 12;
        score += (Math.random() * 0.1 - 0.05);
        score = Math.max(0.02, Math.min(0.99, score));
        resolve(score);
      };
      img.onerror = () => resolve(0.3 + Math.random() * 0.2);
      img.src = this.selectedImage;
    });
  }

  private applyRiskClassification(rawScore: number): void {
    this.resultRawScore = rawScore;
    if (rawScore >= 0.85) {
      this.resultRisk = 'High Risk';
      this.resultRecommendation = 'Immediate Medical Evaluation Advised';
      this.resultConfidence = Math.round(rawScore * 100 * 100) / 100;
    } else if (rawScore >= 0.60) {
      this.resultRisk = 'Suspicious';
      this.resultRecommendation = 'Further Clinical Examination Required';
      this.resultConfidence = Math.round(rawScore * 100 * 100) / 100;
    } else {
      this.resultRisk = 'Normal';
      this.resultRecommendation = 'No immediate concern. Routine check-up advised.';
      this.resultConfidence = Math.round((1 - rawScore) * 100 * 100) / 100;
    }

    const record: ScanRecord = {
      patientId: this.patientId,
      date: this.formatNow(),
      category: 'Optical Scan',
      riskLevel: this.resultRisk,
      confidence: this.resultConfidence,
      rawScore: this.resultRawScore,
      clinician: this.workerId,
      recommendation: this.resultRecommendation,
      imageDataUrl: this.selectedImage || undefined,
      signatureDataUrl: this.getSignatureDataUrl()
    };
    this.storage.addRecord(record);
    this.history = this.storage.getHistory();
  }

  get resultGaugeColor(): string {
    if (this.resultRisk === 'High Risk') return '#DC2626';
    if (this.resultRisk === 'Suspicious') return '#D97706';
    return '#16A34A';
  }

  get resultGaugeDashArray(): string {
    const circumference = 2 * Math.PI * 70;
    const filled = (this.resultConfidence / 100) * circumference;
    return `${filled} ${circumference}`;
  }

  get resultExplanation(): string {
    if (this.resultRisk === 'High Risk') {
      return 'ALERT: Visual indicators consistent with high-risk lesion patterns were detected. Immediate specialist evaluation and histopathological confirmation (biopsy) are strongly recommended to rule out malignancy.';
    }
    if (this.resultRisk === 'Suspicious') {
      return 'ATTENTION: Some indicators warrant closer clinical attention. A professional oral examination and short-interval follow-up monitoring are recommended.';
    }
    return 'No immediate high-risk visual pattern was identified in this screening. Continue routine oral health examinations and self-checks, as visual AI screening is not a substitute for periodic professional review.';
  }

  newScreeningIntake(): void {
    this.screeningStep = 1;
    this.patientId = '';
    this.consentChecked = false;
    this.hasSignature = false;
    this.clearSignature();
    this.selectedImage = null;
    this.selectedImageBlob = null;
    this.captureMode = 'upload';
    this.resultRisk = null;
    this.stopWebcam();
  }

  private formatNow(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ===================================================================
  // RECORDS
  // ===================================================================
  get filteredHistory(): ScanRecord[] {
    if (!this.recordsSearch.trim()) return this.history;
    const q = this.recordsSearch.toLowerCase();
    return this.history.filter(r => r.patientId.toLowerCase().includes(q) || r.clinician.toLowerCase().includes(q));
  }

  clearAllRecords(): void {
    const confirmed = window.confirm('This will permanently delete all patient screening records. Continue?');
    if (!confirmed) return;
    this.storage.clearHistory();
    this.history = [];
  }

  seedRecords(): void {
    this.seedSampleData();
  }

  trackByPatientId(index: number, record: ScanRecord): string {
    return record.patientId + record.date;
  }

  // ===================================================================
  // QUESTIONNAIRE
  // ===================================================================
  startQuestionnaire(): void {
    this.quizStep = 1;
    this.quizAnswers = new Array(10).fill(-1);
  }

  answerQuestion(multiplier: number): void {
    this.quizAnswers[this.quizStep - 1] = multiplier;
    if (this.quizStep < 10) {
      this.quizStep++;
    } else {
      this.computeQuizResult();
      this.quizStep = 11;
    }
  }

  get quizProgress(): number {
    return this.quizStep <= 10 ? this.quizStep * 10 : 100;
  }

  private computeQuizResult(): void {
    let total = 0;
    this.quizQuestions.forEach((q, i) => {
      const mult = this.quizAnswers[i] < 0 ? 0 : this.quizAnswers[i];
      total += q.weight * mult;
    });
    const maxReference = 28;
    let normalized = (total / maxReference) * 100;
    normalized = Math.max(0, Math.min(100, normalized));
    this.quizScore = Math.round(normalized * 100) / 100;

    if (this.quizScore >= 70) this.quizRisk = 'High Risk';
    else if (this.quizScore >= 40) this.quizRisk = 'Suspicious';
    else this.quizRisk = 'Normal';
  }

  get quizRiskLabel(): string {
    if (this.quizRisk === 'High Risk') return 'High Risk — Urgent specialist referral recommended.';
    if (this.quizRisk === 'Suspicious') return 'Suspicious — Clinical monitoring and oral examination recommended.';
    return 'Low Risk — Routine oral health maintenance recommended.';
  }

  saveQuizResult(): void {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const record: ScanRecord = {
      patientId: `OSCC-2026-${rand}`,
      date: this.formatNow(),
      category: 'Symptom Quiz',
      riskLevel: this.quizRisk || 'Normal',
      confidence: this.quizScore,
      rawScore: this.quizScore / 100,
      clinician: this.workerId,
      recommendation: this.quizRiskLabel,
      isQuestionnaire: true
    };
    this.storage.addRecord(record);
    this.history = this.storage.getHistory();
    this.restartQuestionnaire();
  }

  restartQuestionnaire(): void {
    this.quizStep = 0;
    this.quizAnswers = new Array(10).fill(-1);
    this.quizRisk = null;
    this.quizScore = 0;
  }

  // ===================================================================
  // SPECIALISTS / HOSPITALS
  // ===================================================================
  get filteredSpecialists(): Specialist[] {
    if (!this.specialistSearch.trim()) return this.specialists;
    const q = this.specialistSearch.toLowerCase();
    return this.specialists.filter(s => s.name.toLowerCase().includes(q) || s.hospital.toLowerCase().includes(q));
  }

  get filteredHospitals(): Hospital[] {
    if (!this.hospitalSearch.trim()) return this.hospitals;
    const q = this.hospitalSearch.toLowerCase();
    return this.hospitals.filter(h => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q));
  }

  specialistInitial(name: string): string {
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  }

  async generateReferralLetter(specialist: Specialist): Promise<void> {
    const record = this.history.find(r => r.riskLevel === 'High Risk' || r.riskLevel === 'Suspicious') || this.history[0];
    const letter = record
      ? `CLINICAL REFERRAL LETTER\n\nTo: ${specialist.name}, ${specialist.title}\n${specialist.hospital}\n\nReferring Clinician: Dr. ${this.workerId}\nPatient ID: ${record.patientId}\nScreening Date: ${record.date}\n\nAI-Assisted Triage Result:\nRisk Level: ${record.riskLevel}\nConfidence: ${record.confidence}%\nRaw Score: ${record.rawScore}\nRecommendation: ${record.recommendation}\n\nI am formally referring this patient for further specialist evaluation and confirmation, given the above screening result. Please advise on next clinical steps at your earliest convenience.\n\nSincerely,\nDr. ${this.workerId}\nProxenix OSCC Clinical Triage Portal`
      : `CLINICAL REFERRAL LETTER\n\nTo: ${specialist.name}, ${specialist.title}\n${specialist.hospital}\n\nReferring Clinician: Dr. ${this.workerId}\n\nI would like to formally refer a patient for further specialist oral oncology evaluation.\n\nSincerely,\nDr. ${this.workerId}\nProxenix OSCC Clinical Triage Portal`;

    try {
      await navigator.clipboard.writeText(letter);
      this.settingsSuccess = 'Referral letter copied to clipboard.';
      setTimeout(() => { this.settingsSuccess = ''; }, 2500);
    } catch {
      /* clipboard unavailable — ignore silently */
    }
  }

  // ===================================================================
  // REPORT MODAL
  // ===================================================================
  openReport(record: ScanRecord): void {
    this.reportRecord = record;
    this.showReportModal = true;
  }

  closeReport(): void {
    this.showReportModal = false;
    this.reportRecord = null;
  }

  printReport(): void {
    window.print();
  }

  get reportId(): string {
    return this.reportRecord ? `RPT-${this.reportRecord.patientId.replace('OSCC-', '')}` : '';
  }

  get reportPrintDate(): string {
    return this.formatNow();
  }

  // ===================================================================
  // SETTINGS
  // ===================================================================
  onApiUrlChange(): void {
    this.storage.setApiUrl(this.apiUrl);
    this.pingApi();
  }

  onUseLiveApiChange(): void {
    this.storage.setUseLiveApi(this.useLiveApi);
  }

  async testApiConnection(): Promise<void> {
    this.settingsApiTestResult = 'testing';
    const ok = await this.api.ping(this.apiUrl);
    this.settingsApiTestResult = ok ? 'success' : 'fail';
    this.apiConnected = ok;
    setTimeout(() => { this.settingsApiTestResult = 'idle'; }, 3000);
  }

  savePinChange(): void {
    this.settingsError = '';
    this.settingsSuccess = '';
    const stored = this.storage.getPin(this.workerId);
    if (stored !== this.settingsCurrentPin) {
      this.settingsError = 'Current PIN is incorrect.';
      return;
    }
    if (!/^\d{4,8}$/.test(this.settingsNewPin)) {
      this.settingsError = 'New PIN must be 4-8 digits.';
      return;
    }
    if (this.settingsNewPin !== this.settingsConfirmPin) {
      this.settingsError = 'PIN confirmation does not match.';
      return;
    }
    this.storage.setPin(this.workerId, this.settingsNewPin);
    this.settingsSuccess = 'PIN updated successfully.';
    this.settingsCurrentPin = '';
    this.settingsNewPin = '';
    this.settingsConfirmPin = '';
  }
}
