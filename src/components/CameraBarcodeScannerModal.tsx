"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Product } from "@/types/pos";
import { playScannerBeep } from "@/lib/scanner-sound";
import ProductImage from "@/components/ProductImage";
import {
  AlertTriangle,
  Barcode,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

// Type definition for the browser BarcodeDetector API
interface DetectedBarcode {
  rawValue: string;
  format: string;
}

interface BarcodeDetectorInstance {
  detect: (
    source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap
  ) => Promise<DetectedBarcode[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): BarcodeDetectorInstance;
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => {
    ok: boolean;
    message?: string;
  };
  title?: string;
  subtitle?: string;
  continuousModeDefault?: boolean;
  sampleProducts?: Product[];
}

export default function CameraBarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
  title = "สแกนบาร์โค้ดผ่านกล้อง (Camera Barcode Scanner)",
  subtitle = "นำบาร์โค้ดสินค้ามาส่องในกรอบสแกน ระบบจะอ่านรหัสอัตโนมัติ",
  continuousModeDefault = true,
  sampleProducts = [],
}: CameraBarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number }>({
    code: "",
    time: 0,
  });

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDetectorSupported, setIsDetectorSupported] = useState<boolean>(true);
  const [continuousMode, setContinuousMode] = useState<boolean>(
    continuousModeDefault
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastFeedback, setLastFeedback] = useState<{
    type: "success" | "error";
    code: string;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleCodeResult = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;

      const now = Date.now();
      // Debounce identical barcode within 1.6 seconds in continuous mode
      if (
        lastScannedRef.current.code === code &&
        now - lastScannedRef.current.time < 1600
      ) {
        return;
      }
      lastScannedRef.current = { code, time: now };

      const res = onDetected(code);
      if (soundEnabled) {
        playScannerBeep(res.ok ? "success" : "error");
      }

      setLastFeedback({
        type: res.ok ? "success" : "error",
        code,
        message:
          res.message ||
          (res.ok
            ? `สแกนบาร์โค้ด ${code} สำเร็จ`
            : `ไม่พบรหัสบาร์โค้ด ${code}`),
      });

      if (res.ok && !continuousMode) {
        setTimeout(() => {
          onClose();
        }, 400);
      }
    },
    [onDetected, soundEnabled, continuousMode, onClose]
  );

  // Start camera stream and detection loop
  const startCamera = useCallback(
    async (deviceId?: string) => {
      stopCamera();
      setCameraError(null);

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          "เบราว์เซอร์ของคุณไม่รองรับการเปิดกล้อง หรือไม่ได้เชื่อมต่อผ่าน HTTPS / localhost"
        );
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Enumerate video devices after permission granted
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);

        if (!window.BarcodeDetector) {
          setIsDetectorSupported(false);
          return;
        }

        setIsDetectorSupported(true);
        const detector = new window.BarcodeDetector({
          formats: [
            "ean_13",
            "ean_8",
            "code_128",
            "code_39",
            "upc_a",
            "upc_e",
            "qr_code",
          ],
        });

        const scanFrame = async () => {
          if (
            videoRef.current &&
            videoRef.current.readyState >= 2 &&
            streamRef.current
          ) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                handleCodeResult(barcodes[0].rawValue);
              }
            } catch {
              // Ignore single-frame detection errors
            }
          }
          if (streamRef.current) {
            rafRef.current = requestAnimationFrame(scanFrame);
          }
        };

        rafRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        console.error("Camera access error:", err);
        setCameraError(
          "ไม่สามารถเปิดกล้องได้ (กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์ หรือใช้การอัปโหลดภาพบาร์โค้ด / ปุ่มจำลองสแกนด้านล่าง)"
        );
      }
    },
    [stopCamera, handleCodeResult]
  );

  useEffect(() => {
    if (isOpen) {
      setLastFeedback(null);
      startCamera(selectedDeviceId || undefined);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, selectedDeviceId, startCamera, stopCamera]);

  // Scan barcode from an uploaded image file
  const handleImageScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.BarcodeDetector) {
      setLastFeedback({
        type: "error",
        code: "-",
        message:
          "เบราว์เซอร์นี้ไม่รองรับ BarcodeDetector API กรุณาใช้ Chrome หรือ Edge",
      });
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const detector = new window.BarcodeDetector({
        formats: [
          "ean_13",
          "ean_8",
          "code_128",
          "code_39",
          "upc_a",
          "upc_e",
          "qr_code",
        ],
      });
      const results = await detector.detect(bitmap);
      if (results.length > 0 && results[0].rawValue) {
        handleCodeResult(results[0].rawValue);
      } else {
        if (soundEnabled) playScannerBeep("error");
        setLastFeedback({
          type: "error",
          code: "-",
          message: "ไม่พบรูปแท่งบาร์โค้ดที่ชัดเจนในไฟล์ภาพนี้",
        });
      }
    } catch {
      setLastFeedback({
        type: "error",
        code: "-",
        message: "เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ",
      });
    } finally {
      e.target.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
              title={
                soundEnabled ? "เปิดเสียงติ๊ดเมื่อสแกน" : "ปิดเสียงสแกน"
              }
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-500" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 overflow-y-auto p-5 text-xs">
          {/* Controls Strip: Camera Device Picker + Continuous Toggle + Image Upload */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {devices.length > 1 && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                >
                  {devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `กล้อง #${i + 1}`}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => startCamera(selectedDeviceId || undefined)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>รีเฟรชกล้อง</span>
              </button>

              <input
                ref={mobileCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageScan}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => mobileCameraInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 font-bold text-white shadow-sm hover:bg-emerald-700"
                title="เปิดแอปกล้องถ่ายรูปบาร์โค้ดโดยตรง (ใช้งานได้แม้เชื่อมต่อมือถือผ่าน HTTP Wi-Fi)"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>ถ่ายรูปบาร์โค้ด</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageScan}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>เลือกรูป</span>
              </button>
            </div>

            <label className="flex cursor-pointer items-center gap-1.5 font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={continuousMode}
                onChange={(e) => setContinuousMode(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>สแกนต่อเนื่องหลายชิ้น</span>
            </label>
          </div>

          {/* Camera Viewport */}
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-950 shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {/* Laser Reticle Overlay */}
            {!cameraError && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative h-40 w-64 rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
                  {/* Animated Red Laser Line */}
                  <div className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                </div>
                <span className="mt-3 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  วางแท่งบาร์โค้ดให้อยู่ในกรอบสีเขียว
                </span>
              </div>
            )}

            {/* Camera Error Overlay */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 p-6 text-center text-white">
                <AlertTriangle className="mb-2 h-8 w-8 text-amber-400" />
                <p className="max-w-md text-xs font-medium leading-relaxed text-slate-200">
                  {cameraError}
                </p>
                <button
                  type="button"
                  onClick={() => mobileCameraInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
                >
                  <Camera className="h-4 w-4" />
                  <span>กดถ่ายรูปบาร์โค้ดด้วยกล้องมือถือ</span>
                </button>
              </div>
            )}
          </div>

          {!isDetectorSupported && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
              หมายเหตุ: เบราว์เซอร์นี้ยังไม่เปิดใช้งาน{" "}
              <code>BarcodeDetector API</code> แนะนำให้เปิดบน Google Chrome,
              Microsoft Edge หรือใช้เครื่องยิงบาร์โค้ด USB / ปุ่มจำลองสแกนด้านล่าง
            </div>
          )}

          {/* Last Scanned Feedback Banner */}
          {lastFeedback && (
            <div
              className={`flex items-center justify-between rounded-xl px-4 py-3 font-semibold ${
                lastFeedback.type === "success"
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-rose-100 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {lastFeedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span>{lastFeedback.message}</span>
              </div>
              <span className="font-mono text-[11px] opacity-75">
                {lastFeedback.code}
              </span>
            </div>
          )}

          {/* Quick Virtual Barcode Cards for Instant Testing */}
          {sampleProducts.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Barcode className="h-4 w-4 text-emerald-600" />
                  <span>
                    ทดสอบส่องบาร์โค้ดสินค้าในร้าน (คลิกเพื่อจำลองกล้องอ่านบาร์โค้ด)
                  </span>
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sampleProducts.slice(0, 8).map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleCodeResult(prod.barcode)}
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50/40"
                  >
                    <ProductImage
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="h-9 w-9 shrink-0 rounded-lg"
                    />
                    <div>
                      <p className="max-w-[120px] truncate text-[11px] font-bold text-slate-800">
                        {prod.name}
                      </p>
                      <p className="font-mono text-[10px] text-emerald-700">
                        {prod.barcode}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            เสร็จสิ้น / ปิดกล้อง
          </button>
        </div>
      </div>
    </div>
  );
}
