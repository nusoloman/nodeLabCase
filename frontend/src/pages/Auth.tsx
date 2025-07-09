import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';
import { useRegister } from '../hooks/useRegister';
import { useForm, type SubmitHandler } from 'react-hook-form';

interface AuthFormValues {
  username: string;
  email: string;
  password: string;
}

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const { login: doLogin, loading } = useLogin();
  const { login: setTokens } = useAuth();
  const { register: doRegister, loading: registerLoading } = useRegister();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormValues>({
    mode: 'onChange',
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<AuthFormValues> = async (values) => {
    if (isLogin) {
      const data = await doLogin(values.email, values.password);
      if (data) setTokens(data.accessToken, data.refreshToken);
    } else {
      const result = await doRegister(
        values.username,
        values.email,
        values.password
      );
      if (result && result.success) {
        navigate('/login');
        reset();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
            </h1>
            <p className="opacity-80">
              {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun'}
            </p>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              <div className="space-y-4">
                {!isLogin && (
                  <Input
                    id="username"
                    label="Kullanıcı Adı"
                    type="text"
                    placeholder="kullaniciadi"
                    icon={<User />}
                    {...register('username', {
                      required: !isLogin ? 'Kullanıcı adı zorunlu' : false,
                      minLength: { value: 3, message: 'En az 3 karakter' },
                      maxLength: { value: 20, message: 'En fazla 20 karakter' },
                    })}
                    error={errors.username?.message as string}
                  />
                )}

                <Input
                  id="email"
                  label="Email Adresi"
                  type="email"
                  placeholder="you@example.com"
                  icon={<Mail />}
                  {...register('email', {
                    required: 'Email zorunlu',
                    pattern: {
                      value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                      message: 'Geçerli bir email girin',
                    },
                  })}
                  error={errors.email?.message as string}
                />

                <Input
                  id="password"
                  label="Şifre"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={<Lock />}
                  rightIcon={showPassword ? <EyeOff /> : <Eye />}
                  onRightIconClick={() => setShowPassword(!showPassword)}
                  {...register('password', {
                    required: 'Şifre zorunlu',
                    minLength: { value: 6, message: 'En az 6 karakter' },
                  })}
                  error={errors.password?.message as string}
                />
              </div>

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm text-gray-400 cursor-pointer">
                    <input
                      id="remember"
                      name="remember"
                      type="checkbox"
                      className="mr-2 rounded bg-gray-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    Beni hatırla
                  </label>
                  <Link
                    to="#"
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Şifremi unuttum?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                loading={isLogin ? loading : registerLoading}
                className="w-full"
                size="lg"
              >
                {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
              </Button>

              <div className="pt-4 text-center text-sm text-gray-400">
                {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}{' '}
                <Link
                  to={isLogin ? '/register' : '/login'}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
