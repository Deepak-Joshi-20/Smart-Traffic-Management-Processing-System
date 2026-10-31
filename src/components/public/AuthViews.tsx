import React, { useState } from 'react';
import {
  Radio,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Mail,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { PublicRoute, UserRole, AuthUser } from '../../types';

interface AuthViewsProps {
  currentPublicRoute: PublicRoute;
  onNavigatePublic: (route: PublicRoute) => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthViews: React.FC<AuthViewsProps> = ({
  currentPublicRoute,
  onNavigatePublic,
  onLoginSuccess,
}) => {
  // Login State
  const [loginEmail, setLoginEmail] = useState('operator@urbanpulse.gov');
  const [loginPassword, setLoginPassword] = useState('traffic@2026');
  const [loginRole, setLoginRole] = useState<UserRole>('Traffic Control Operator');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('Traffic Control Operator');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both your agency email and password.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess({
        id: `usr-${Date.now()}`,
        name: loginEmail.split('@')[0].toUpperCase(),
        email: loginEmail,
        role: loginRole,
        agencySector: 'Municipal Traffic Operations Sector 04',
        badgeId: `OP-${Math.floor(1000 + Math.random() * 9000)}`,
      });
    }, 450);
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess({
        id: `demo-${role === 'System Administrator' ? 'admin' : 'operator'}`,
        name: role === 'System Administrator' ? 'Chief Systems Officer' : 'Senior Traffic Controller',
        email: role === 'System Administrator' ? 'admin@urbanpulse.gov' : 'operator@urbanpulse.gov',
        role,
        agencySector: 'Municipal Central Command Center',
        badgeId: role === 'System Administrator' ? 'ADMIN-01' : 'TCO-42',
      });
    }, 300);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setSignupError('All fields are required.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupError('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setSignupError('Please accept the Municipal Data Use Terms.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess({
        id: `usr-${Date.now()}`,
        name: signupName,
        email: signupEmail,
        role: signupRole,
        agencySector: 'Municipal Traffic Operations Sector 01',
        badgeId: `REG-${Math.floor(1000 + Math.random() * 9000)}`,
      });
    }, 450);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSuccess(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0F12] text-[#F1F5F2] flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Back to Home Button */}
      <button
        onClick={() => onNavigatePublic('home')}
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-medium text-[#91A19B] hover:text-[#F1F5F2] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Urban Pulse Overview</span>
      </button>

      {/* Main Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#151F24] border border-[#29383A] flex items-center justify-center text-[#B7F34A] mx-auto mb-3 shadow-lg">
            <Radio className="w-6 h-6 text-[#B7F34A]" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#F1F5F2]">URBAN PULSE</h1>
            <span className="text-[10px] font-mono font-medium text-[#B7F34A] bg-[#B7F34A]/10 px-2 py-0.5 rounded border border-[#B7F34A]/20">
              NEON GRID
            </span>
          </div>
          <p className="text-xs text-[#91A19B] mt-1">Smart Traffic Intelligence Platform</p>
        </div>

        {/* LOGIN FORM */}
        {currentPublicRoute === 'login' && (
          <div className="p-8 rounded-2xl bg-[#151F24] border border-[#29383A] shadow-2xl">
            <h2 className="text-lg font-bold text-[#F1F5F2] mb-1">Operator Sign In</h2>
            <p className="text-xs text-[#91A19B] mb-6">
              Enter your municipal credentials to access the traffic operations dashboard.
            </p>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-[#F06464]/10 border border-[#F06464]/30 flex items-center gap-2.5 text-xs text-[#F06464]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#91A19B] mb-1.5">
                  Agency Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64736D] absolute left-3 top-3" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="operator@urbanpulse.gov"
                    className="w-full bg-[#10171B] border border-[#29383A] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#91A19B] mb-1.5">
                  Console Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64736D] absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#10171B] border border-[#29383A] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A] transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#64736D] hover:text-[#F1F5F2] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-medium text-[#91A19B] mb-1.5">
                  Operational Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginRole('Traffic Control Operator')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      loginRole === 'Traffic Control Operator'
                        ? 'bg-[#1B292E] border-[#B7F34A] text-[#F1F5F2]'
                        : 'bg-[#10171B] border-[#29383A] text-[#91A19B]'
                    }`}
                  >
                    Control Operator
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginRole('System Administrator')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      loginRole === 'System Administrator'
                        ? 'bg-[#1B292E] border-[#B7F34A] text-[#F1F5F2]'
                        : 'bg-[#10171B] border-[#29383A] text-[#91A19B]'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-[#91A19B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#B7F34A] rounded"
                  />
                  <span>Remember Session</span>
                </label>
                <button
                  type="button"
                  onClick={() => onNavigatePublic('forgot-password')}
                  className="text-xs text-[#70D6B4] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full neon-btn-primary py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{isSubmitting ? 'Authenticating Console...' : 'Enter Operations Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-[#29383A] space-y-2">
              <span className="text-[10px] font-mono text-[#64736D] uppercase block text-center">
                Instant Demo Access
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('Traffic Control Operator')}
                  className="py-2 px-2.5 rounded-lg bg-[#1B292E] border border-[#29383A] hover:border-[#B7F34A]/50 text-[11px] text-[#91A19B] hover:text-[#F1F5F2] transition-colors cursor-pointer text-center"
                >
                  Operator Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('System Administrator')}
                  className="py-2 px-2.5 rounded-lg bg-[#1B292E] border border-[#29383A] hover:border-[#70D6B4]/50 text-[11px] text-[#91A19B] hover:text-[#F1F5F2] transition-colors cursor-pointer text-center"
                >
                  Admin Demo
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-[#91A19B]">
              Need a municipal account?{' '}
              <button
                onClick={() => onNavigatePublic('signup')}
                className="text-[#B7F34A] font-semibold hover:underline cursor-pointer"
              >
                Request registration
              </button>
            </div>
          </div>
        )}

        {/* SIGN UP FORM */}
        {currentPublicRoute === 'signup' && (
          <div className="p-8 rounded-2xl bg-[#151F24] border border-[#29383A] shadow-2xl">
            <h2 className="text-lg font-bold text-[#F1F5F2] mb-1">Create Agency Account</h2>
            <p className="text-xs text-[#91A19B] mb-6">
              Register an operator profile to access Urban Pulse telemetry and signal tools.
            </p>

            {signupError && (
              <div className="mb-4 p-3 rounded-xl bg-[#F06464]/10 border border-[#F06464]/30 flex items-center gap-2.5 text-xs text-[#F06464]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{signupError}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#91A19B] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#64736D] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Chief Controller Sarah Jenkins"
                    className="w-full bg-[#10171B] border border-[#29383A] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#91A19B] mb-1.5">
                  Official Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64736D] absolute left-3 top-3" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="s.jenkins@urbanpulse.gov"
                    className="w-full bg-[#10171B] border border-[#29383A] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A] transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#91A19B] mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#10171B] border border-[#29383A] rounded-xl px-3 py-2.5 text-xs text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#91A19B] mb-1.5">
                    Confirm
                  </label>
                  <input
                    type="password"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#10171B] border border-[#29383A] rounded-xl px-3 py-2.5 text-xs text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-start gap-2 text-xs text-[#91A19B] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="accent-[#B7F34A] rounded mt-0.5"
                  />
                  <span>
                    I confirm this profile is intended for municipal traffic monitoring and algorithm evaluation.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full neon-btn-primary py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{isSubmitting ? 'Creating Profile...' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#91A19B]">
              Already have an account?{' '}
              <button
                onClick={() => onNavigatePublic('login')}
                className="text-[#B7F34A] font-semibold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {currentPublicRoute === 'forgot-password' && (
          <div className="p-8 rounded-2xl bg-[#151F24] border border-[#29383A] shadow-2xl">
            <h2 className="text-lg font-bold text-[#F1F5F2] mb-1">Reset Password</h2>
            <p className="text-xs text-[#91A19B] mb-6">
              Enter your official email to receive a password recovery verification link.
            </p>

            {forgotSuccess ? (
              <div className="p-4 rounded-xl bg-[#71D49A]/10 border border-[#71D49A]/30 text-xs text-[#71D49A] space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Password Reset Link Dispatched</span>
                </div>
                <p className="text-[11px] text-[#91A19B]">
                  Check your municipal inbox for instructions to reset your Urban Pulse console password.
                </p>
                <button
                  onClick={() => onNavigatePublic('login')}
                  className="w-full neon-btn-primary py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#91A19B] mb-1.5">
                    Agency Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#64736D] absolute left-3 top-3" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="operator@urbanpulse.gov"
                      className="w-full bg-[#10171B] border border-[#29383A] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A] transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full neon-btn-primary py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Send Recovery Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigatePublic('login')}
                    className="text-xs text-[#91A19B] hover:text-[#F1F5F2] cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
