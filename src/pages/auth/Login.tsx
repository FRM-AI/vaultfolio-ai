import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Lock, Mail } from 'lucide-react';
import AuthService from './Auth.service';
const Login = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showRegisterAlert, setShowRegisterAlert] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    AuthService.Login({ email, password })
      .then(() => {
        // Mock login - just navigate to home
        navigate('/');
      })
      .catch((error) => {
        console.error('Login failed:', error);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t.app.title}
          </CardTitle>
          <CardDescription className="text-base">
            {t.login.subtitle}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                {t.login.email}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t.login.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                {t.login.password}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t.login.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Terms of Service consent */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                  aria-label="accept terms"
                />
                <Label htmlFor="acceptTerms" className="text-sm font-medium">
                  Tôi đồng ý với Điều khoản Dịch vụ
                </Label>
              </div>
              <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-md border border-warning/20">
                <div className="space-y-2">
                  <p className="font-medium text-warning">⚠️ Thông báo quan trọng:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Khi chọn vào đây và đồng ý với các điều khoản thì bên phát hành sản phẩm không chịu trách nhiệm cho bất kỳ vấn đề phát sinh.</li>
                    <li>Kết quả phân tích chỉ mang tính chất TƯ VẤN từ dữ liệu lịch sử.</li>
                    <li>Cá nhân nhà đầu tư chịu trách nhiệm để đưa ra quyết định đầu tư thực tế.</li>
                    <li>Sản phẩm hiện chỉ là bản THỬ NGHIỆM có thể được cập nhật hoặc thay đổi.</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" size="lg" disabled={!acceptTerms}>
              {t.login.loginButton}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              {t.login.noAccount}{' '}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => setShowRegisterAlert(true)}
              >
                {t.login.registerLink}
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>

      <AlertDialog open={showRegisterAlert} onOpenChange={setShowRegisterAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đăng ký tài khoản</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed space-y-3">
              <p>
                Hiện không cung cấp tính năng đăng ký tài khoản. Xin hãy liên hệ Zalo/Tele: <strong className="text-foreground">0972115606</strong> để lấy tài khoản.
              </p>
              <div className="bg-muted p-3 rounded-md border">
                <p className="font-medium text-foreground mb-2">Hoặc sử dụng tài khoản test:</p>
                <div className="space-y-1 text-sm">
                  <p><strong className="text-foreground">Email:</strong> testuser15@example.com</p>
                  <p><strong className="text-foreground">Password:</strong> sGnec6I3H7L6</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Đã hiểu</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Login;
