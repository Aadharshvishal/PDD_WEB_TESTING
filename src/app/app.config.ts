import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  LucideAngularModule, LayoutDashboard, FilePlus2, Users, ClipboardCheck, Stethoscope,
  Building2, Compass, Settings, ShieldAlert, AlertTriangle, CheckCircle2, Layers, Sun, Moon,
  Menu, X, LogOut, MapPin, PhoneCall, FileText, Search, Trash2, Image, Camera, Upload,
  Circle, ChevronRight, Printer, Copy, Check, RotateCcw, Save, Eraser, User, Wifi, WifiOff,
  ClipboardList, ArrowRight, ArrowLeft, Star
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    importProvidersFrom(
      LucideAngularModule.pick({
        LayoutDashboard, FilePlus2, Users, ClipboardCheck, Stethoscope,
        Building2, Compass, Settings, ShieldAlert, AlertTriangle, CheckCircle2, Layers, Sun, Moon,
        Menu, X, LogOut, MapPin, PhoneCall, FileText, Search, Trash2, Image, Camera, Upload,
        Circle, ChevronRight, Printer, Copy, Check, RotateCcw, Save, Eraser, User, Wifi, WifiOff,
        ClipboardList, ArrowRight, ArrowLeft, Star
      })
    )
  ]
};
