'use client';

import { useSettings, type Currency, type Language } from '@/context/settings-context';
import { useTranslation } from '@/context/translation-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
  const { language, setLanguage, currency, setCurrency } = useSettings();
  const { t } = useTranslation();

  return (
     <div className="flex h-full min-h-0 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">{t('back')}</span>
                </Link>
            </Button>
            <h1 className="text-xl font-semibold">{t('settings')}</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
            <Card className="mx-auto max-w-2xl">
              <CardHeader>
                <CardTitle>{t('application_settings')}</CardTitle>
                <CardDescription>{t('settings_description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-base">{t('language')}</Label>
                  <RadioGroup
                    value={language}
                    onValueChange={(value: string) => setLanguage(value as Language)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tr" id="tr" />
                      <Label htmlFor="tr">{t('turkish')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="en" id="en" />
                      <Label htmlFor="en">{t('english')}</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-4">
                  <Label className="text-base">{t('currency')}</Label>
                  <RadioGroup
                    value={currency}
                    onValueChange={(value: string) => setCurrency(value as Currency)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TRY" id="try" />
                      <Label htmlFor="try">{t('turkish_lira')} (₺)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="USD" id="usd" />
                      <Label htmlFor="usd">{t('us_dollar')} ($)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="EUR" id="eur" />
                      <Label htmlFor="eur">{t('euro')} (€)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
        </main>
    </div>
  );
}
