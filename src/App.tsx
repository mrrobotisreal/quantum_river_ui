import React, { useState, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import QRCode from "qrcode";
import {
  Camera,
  Download,
  Upload,
  QrCode,
  Wifi,
  Mail,
  Phone,
  User,
  FileText,
  Settings,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { type GeneratedQR, type QROptions, type QRType } from "@/types/qr";
import { urlSchema } from "@/schemas/url-schema";
import { wifiSchema } from "@/schemas/wifi-schema";
import { contactSchema } from "@/schemas/contact-schema";
import { textSchema } from "@/schemas/text-schema";
import { emailSchema } from "@/schemas/email-schema";
import { smsSchema } from "@/schemas/sms-schema";
import TopNav from "./components/top-nav";

function App() {
  const [activeTab, setActiveTab] = useState<QRType>("url");
  const [qrOptions, setQROptions] = useState<QROptions>({
    size: 256,
    errorCorrectionLevel: "M",
    foregroundColor: "#000000",
    backgroundColor: "#ffffff",
    margin: 4,
  });

  const [generatedQRs, setGeneratedQRs] = useState<GeneratedQR[]>([]);
  const [currentQR, setCurrentQR] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const urlForm = useForm({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "" },
  });

  const wifiForm = useForm({
    resolver: zodResolver(wifiSchema),
    defaultValues: {
      ssid: "",
      password: "",
      security: "WPA" as const,
      hidden: false,
    },
  });

  const contactForm = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      organization: "",
      url: "",
    },
  });

  const textForm = useForm({
    resolver: zodResolver(textSchema),
    defaultValues: { text: "" },
  });

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", subject: "", body: "" },
  });

  const smsForm = useForm({
    resolver: zodResolver(smsSchema),
    defaultValues: { phone: "", message: "" },
  });

  const forms = {
    url: urlForm,
    wifi: wifiForm,
    contact: contactForm,
    text: textForm,
    email: emailForm,
    sms: smsForm,
  };

  // Generate QR code data based on type
  // TODO: Fix this with proper types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generateQRData = (type: QRType, data: any): string => {
    switch (type) {
      case "url": {
        // Auto-add https:// if no protocol is present
        let url = data.url;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = `https://${url}`;
        }
        return url;
      }
      case "wifi":
        return `WIFI:T:${data.security};S:${data.ssid};P:${
          data.password || ""
        };H:${data.hidden ? "true" : "false"};;`;
      case "contact":
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.firstName} ${
          data.lastName || ""
        }\nORG:${data.organization || ""}\nTEL:${data.phone || ""}\nEMAIL:${
          data.email || ""
        }\nURL:${data.url || ""}\nEND:VCARD`;
      case "text":
        return data.text;
      case "email":
        return `mailto:${data.email}?subject=${encodeURIComponent(
          data.subject || ""
        )}&body=${encodeURIComponent(data.body || "")}`;
      case "sms":
        return `sms:${data.phone}${
          data.message ? `?body=${encodeURIComponent(data.message)}` : ""
        }`;
      default:
        return "";
    }
  };

  const generateQR = async (qrData: string): Promise<string> => {
    try {
      const options = {
        width: qrOptions.size,
        margin: qrOptions.margin,
        color: {
          dark: qrOptions.foregroundColor,
          light: qrOptions.backgroundColor,
        },
        errorCorrectionLevel: qrOptions.errorCorrectionLevel,
      };

      let dataUrl = await QRCode.toDataURL(qrData, options);

      // If logo is present, overlay it
      if (logoDataUrl && canvasRef.current) {
        dataUrl = await overlayLogo(dataUrl);
      }

      return dataUrl;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw error;
    }
  };

  const overlayLogo = async (qrDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      canvas.width = qrOptions.size;
      canvas.height = qrOptions.size;

      const qrImage = new Image();
      qrImage.onload = () => {
        ctx.drawImage(qrImage, 0, 0, qrOptions.size, qrOptions.size);

        const logoImage = new Image();
        logoImage.onload = () => {
          const logoSize = qrOptions.size * 0.2;
          const x = (qrOptions.size - logoSize) / 2;
          const y = (qrOptions.size - logoSize) / 2;

          ctx.fillStyle = "white";
          ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);

          ctx.drawImage(logoImage, x, y, logoSize, logoSize);
          resolve(canvas.toDataURL());
        };
        logoImage.src = logoDataUrl;
      };
      qrImage.src = qrDataUrl;
    });
  };

  const handleGenerate = useCallback(
    async (type: QRType) => {
      const form = forms[type];
      const isValid = await form.trigger();

      if (!isValid) return;

      const formData = form.getValues();
      const qrData = generateQRData(type, formData);

      try {
        const dataUrl = await generateQR(qrData);
        setCurrentQR(dataUrl);

        const newQR: GeneratedQR = {
          id: Date.now().toString(),
          type,
          data: qrData,
          dataUrl,
          options: { ...qrOptions },
        };

        setGeneratedQRs((prev) => [newQR, ...prev.slice(0, 9)]);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      }
    },
    [qrOptions, logoDataUrl]
  );

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoDataUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadQR = (
    dataUrl: string,
    format: "png" | "svg" | "pdf" = "png"
  ) => {
    const link = document.createElement("a");
    link.download = `qr-code.${format}`;
    link.href = dataUrl;
    link.click();
  };

  const handleCSVUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());
    const batchQRs: GeneratedQR[] = [];

    for (const line of lines.slice(1)) {
      // Skip header
      const [type, ...dataParts] = line.split(",");
      const data = dataParts.join(",").trim();

      if (data) {
        try {
          const dataUrl = await generateQR(data);
          batchQRs.push({
            id: Date.now().toString() + Math.random(),
            type: type as QRType,
            data,
            dataUrl,
            options: { ...qrOptions },
          });
        } catch (error) {
          console.error("Failed to generate QR for:", data);
          console.error(error);
        }
      }
    }

    setGeneratedQRs((prev) => [...batchQRs, ...prev]);
  };

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error("Failed to start camera:", error);
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-[url('/images/background.webp')] bg-center bg-no-repeat bg-cover pb-4">
      <TopNav />
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Generator
                </CardTitle>
                <CardDescription>
                  Choose the type of QR code you want to generate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as QRType)}
                >
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger
                      value="url"
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      URL
                    </TabsTrigger>
                    <TabsTrigger
                      value="wifi"
                      className="flex items-center gap-1"
                    >
                      <Wifi className="h-4 w-4" />
                      WiFi
                    </TabsTrigger>
                    <TabsTrigger
                      value="contact"
                      className="flex items-center gap-1"
                    >
                      <User className="h-4 w-4" />
                      Contact
                    </TabsTrigger>
                    <TabsTrigger
                      value="text"
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger
                      value="email"
                      className="flex items-center gap-1"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger
                      value="sms"
                      className="flex items-center gap-1"
                    >
                      <Phone className="h-4 w-4" />
                      SMS
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label htmlFor="url">Website URL</Label>
                      <Controller
                        name="url"
                        control={urlForm.control}
                        render={({ field }) => (
                          <Input
                            id="url"
                            placeholder="https://example.com"
                            {...field}
                          />
                        )}
                      />
                      {urlForm.formState.errors.url && (
                        <p className="text-sm text-red-500">
                          {urlForm.formState.errors.url.message}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleGenerate("url")}
                      className="w-full"
                    >
                      Generate QR Code
                    </Button>
                  </TabsContent>

                  <TabsContent value="wifi" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ssid">Network Name (SSID)</Label>
                        <Controller
                          name="ssid"
                          control={wifiForm.control}
                          render={({ field }) => (
                            <Input
                              id="ssid"
                              placeholder="My WiFi Network"
                              {...field}
                            />
                          )}
                        />
                      </div>
                      <div>
                        <Label htmlFor="wifi-password">Password</Label>
                        <Controller
                          name="password"
                          control={wifiForm.control}
                          render={({ field }) => (
                            <Input
                              id="wifi-password"
                              type="password"
                              placeholder="Password"
                              {...field}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="security">Security Type</Label>
                        <Controller
                          name="security"
                          control={wifiForm.control}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              defaultValue="WPA"
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="WPA">WPA/WPA2</SelectItem>
                                <SelectItem value="WEP">WEP</SelectItem>
                                <SelectItem value="nopass">
                                  No Password
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Controller
                          name="hidden"
                          control={wifiForm.control}
                          render={({ field }) => (
                            <Switch
                              id="hidden"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label htmlFor="hidden">Hidden Network</Label>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleGenerate("wifi")}
                      className="w-full"
                    >
                      Generate QR Code
                    </Button>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Controller
                          name="firstName"
                          control={contactForm.control}
                          render={({ field }) => (
                            <Input
                              id="firstName"
                              placeholder="John"
                              {...field}
                            />
                          )}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Controller
                          name="lastName"
                          control={contactForm.control}
                          render={({ field }) => (
                            <Input id="lastName" placeholder="Doe" {...field} />
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-phone">Phone</Label>
                        <Controller
                          name="phone"
                          control={contactForm.control}
                          render={({ field }) => (
                            <Input
                              id="contact-phone"
                              placeholder="+1 234 567 8900"
                              {...field}
                            />
                          )}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-email">Email</Label>
                        <Controller
                          name="email"
                          control={contactForm.control}
                          render={({ field }) => (
                            <Input
                              id="contact-email"
                              type="email"
                              placeholder="john@example.com"
                              {...field}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="organization">Organization</Label>
                        <Controller
                          name="organization"
                          control={contactForm.control}
                          render={({ field }) => (
                            <Input
                              id="organization"
                              placeholder="Company Name"
                              {...field}
                            />
                          )}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-url">Website</Label>
                        <Controller
                          name="url"
                          control={contactForm.control}
                          render={({ field }) => (
                            <Input
                              id="contact-url"
                              placeholder="https://example.com"
                              {...field}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => handleGenerate("contact")}
                      className="w-full"
                    >
                      Generate QR Code
                    </Button>
                  </TabsContent>

                  <TabsContent value="text" className="space-y-4">
                    <div>
                      <Label htmlFor="text">Text Content</Label>
                      <Controller
                        name="text"
                        control={textForm.control}
                        render={({ field }) => (
                          <Textarea
                            id="text"
                            placeholder="Enter your text here..."
                            rows={4}
                            {...field}
                          />
                        )}
                      />
                    </div>
                    <Button
                      onClick={() => handleGenerate("text")}
                      className="w-full"
                    >
                      Generate QR Code
                    </Button>
                  </TabsContent>

                  <TabsContent value="email" className="space-y-4">
                    <div>
                      <Label htmlFor="email-address">Email Address</Label>
                      <Controller
                        name="email"
                        control={emailForm.control}
                        render={({ field }) => (
                          <Input
                            id="email-address"
                            type="email"
                            placeholder="recipient@example.com"
                            {...field}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Controller
                        name="subject"
                        control={emailForm.control}
                        render={({ field }) => (
                          <Input
                            id="subject"
                            placeholder="Email subject"
                            {...field}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label htmlFor="body">Message</Label>
                      <Controller
                        name="body"
                        control={emailForm.control}
                        render={({ field }) => (
                          <Textarea
                            id="body"
                            placeholder="Email message..."
                            rows={3}
                            {...field}
                          />
                        )}
                      />
                    </div>
                    <Button
                      onClick={() => handleGenerate("email")}
                      className="w-full"
                    >
                      Generate QR Code
                    </Button>
                  </TabsContent>

                  <TabsContent value="sms" className="space-y-4">
                    <div>
                      <Label htmlFor="sms-phone">Phone Number</Label>
                      <Controller
                        name="phone"
                        control={smsForm.control}
                        render={({ field }) => (
                          <Input
                            id="sms-phone"
                            placeholder="+1 234 567 8900"
                            {...field}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Controller
                        name="message"
                        control={smsForm.control}
                        render={({ field }) => (
                          <Textarea
                            id="message"
                            placeholder="SMS message..."
                            rows={3}
                            {...field}
                          />
                        )}
                      />
                    </div>
                    <Button
                      onClick={() => handleGenerate("sms")}
                      className="w-full"
                    >
                      Generate QR Code
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => csvInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Bulk Upload CSV
                    </Button>
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500">
                      Upload a CSV with columns: type, data
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customization Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Size: {qrOptions.size}px</Label>
                  <Slider
                    value={[qrOptions.size]}
                    onValueChange={([value]) =>
                      setQROptions((prev) => ({ ...prev, size: value }))
                    }
                    min={128}
                    max={512}
                    step={32}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Error Correction</Label>
                  <Select
                    value={qrOptions.errorCorrectionLevel}
                    onValueChange={(value) =>
                      setQROptions((prev) => ({
                        ...prev,
                        errorCorrectionLevel: value as "L" | "M" | "Q" | "H",
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Low (7%)</SelectItem>
                      <SelectItem value="M">Medium (15%)</SelectItem>
                      <SelectItem value="Q">Quartile (25%)</SelectItem>
                      <SelectItem value="H">High (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fg-color">Foreground Color</Label>
                    <Input
                      id="fg-color"
                      type="color"
                      value={qrOptions.foregroundColor}
                      onChange={(e) =>
                        setQROptions((prev) => ({
                          ...prev,
                          foregroundColor: e.target.value,
                        }))
                      }
                      className="mt-1 h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bg-color">Background Color</Label>
                    <Input
                      id="bg-color"
                      type="color"
                      value={qrOptions.backgroundColor}
                      onChange={(e) =>
                        setQROptions((prev) => ({
                          ...prev,
                          backgroundColor: e.target.value,
                        }))
                      }
                      className="mt-1 h-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Margin: {qrOptions.margin}</Label>
                  <Slider
                    value={[qrOptions.margin]}
                    onValueChange={([value]) =>
                      setQROptions((prev) => ({ ...prev, margin: value }))
                    }
                    min={0}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Logo Overlay</Label>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-1 flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Logo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {logoFile && (
                    <p className="text-sm text-gray-500 mt-1">
                      {logoFile.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Options Section */}
          <div className="space-y-4">
            {/* QR Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {currentQR ? (
                  <div className="space-y-6">
                    <img
                      src={currentQR}
                      alt="Generated QR Code"
                      className="mx-auto border rounded-lg shadow-sm"
                      style={{ width: qrOptions.size, height: qrOptions.size }}
                    />
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => downloadQR(currentQR, "png")}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        PNG
                      </Button>
                      <Button
                        onClick={() => downloadQR(currentQR, "svg")}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        SVG
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">QR code will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  QR Scanner (Coming Soon)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isScanning ? (
                  <Button
                    onClick={startScanning}
                    className="w-full flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Start Scanning
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg"
                    />
                    <Button
                      onClick={stopScanning}
                      variant="outline"
                      className="w-full"
                    >
                      Stop Scanning
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent QR Codes */}
        {generatedQRs.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Recent QR Codes
              </CardTitle>
              <CardDescription>
                Your last {generatedQRs.length} generated QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
                {generatedQRs.map((qr) => (
                  <div key={qr.id} className="text-center space-y-2">
                    <img
                      src={qr.dataUrl}
                      alt={`QR Code - ${qr.type}`}
                      className="w-full aspect-square border rounded cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setCurrentQR(qr.dataUrl)}
                    />
                    <p className="text-xs text-gray-500 capitalize">
                      {qr.type}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden canvas for logo overlay */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </main>
    </div>
  );
}

export default App;
